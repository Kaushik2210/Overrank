-- Row Level Security on every table, plus the RPCs that are the only way points change.

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
$$;

alter table public.teams enable row level security;
alter table public.students enable row level security;
alter table public.profiles enable row level security;
alter table public.point_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_teams enable row level security;
alter table public.point_transactions enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;
alter table public.rank_events enable row level security;

-- Public reference data: anyone may read, only staff may change.
create policy teams_read on public.teams for select using (true);
create policy teams_write on public.teams for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy categories_read on public.point_categories for select using (true);
create policy categories_write on public.point_categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy events_read on public.events for select using (true);
create policy events_write on public.events for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy event_teams_read on public.event_teams for select using (true);
create policy event_teams_write on public.event_teams for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy achievements_read on public.achievements for select using (true);
create policy achievements_write on public.achievements for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy settings_read on public.settings for select using (true);
create policy settings_write on public.settings for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy rank_events_read on public.rank_events for select using (true);

-- Everything else is faculty only. Public pages are served by the server, which reads with the service role.
create policy students_staff on public.students for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy student_ach_staff on public.student_achievements for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy tx_read_staff on public.point_transactions for select to authenticated using (public.is_staff());
create policy audit_read on public.audit_logs for select to authenticated using (public.is_staff());

-- Profiles: read your own (faculty read all). Nobody can write from a client, so roles cannot be escalated.
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());

-- Views: the public leaderboard is readable by anyone; per-student totals are faculty only.
grant select on public.team_points to anon, authenticated;
revoke all on public.student_points from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs. Execute is granted to the service role only; the app calls them from server actions
-- after checking the session, and each one re-checks the actor's role against profiles.
-- ---------------------------------------------------------------------------

create or replace function public.write_audit(p_actor uuid, p_actor_name text, p_action text, p_target text, p_detail text) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, actor_name, action, target, detail) values (p_actor, p_actor_name, p_action, p_target, p_detail)
$$;

create or replace function public.unlock_achievements(p_student text) returns setof public.achievements
language plpgsql security definer set search_path = public as $$
declare a public.achievements; total integer; cat_total integer;
begin
  select coalesce(sum(amount), 0) into total from public.point_transactions where student_id = p_student and status <> 'pending';
  for a in
    select x.* from public.achievements x
    where x.rule ->> 'kind' in ('points', 'category')
      and not exists (select 1 from public.student_achievements sa where sa.achievement_id = x.id and sa.student_id = p_student)
  loop
    if a.rule ->> 'kind' = 'points' then
      continue when total < (a.rule ->> 'threshold')::integer;
    else
      select coalesce(sum(amount), 0) into cat_total from public.point_transactions
        where student_id = p_student and status <> 'pending' and category_id = (a.rule ->> 'categoryId')::uuid;
      continue when cat_total < (a.rule ->> 'threshold')::integer;
    end if;
    insert into public.student_achievements (achievement_id, student_id) values (a.id, p_student) on conflict do nothing;
    return next a;
  end loop;
end $$;

create or replace function public.award_points(
  p_actor uuid, p_actor_name text, p_student_ids text[], p_amount integer, p_category uuid,
  p_reason text, p_event uuid default null, p_evidence text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare sid text; tx public.point_transactions; ach public.achievements; txs jsonb := '[]'; unlocked jsonb := '[]'; sname text; cat_name text;
begin
  if not exists (select 1 from public.profiles where id = p_actor and role in ('teacher', 'admin')) then
    raise exception 'Not allowed';
  end if;
  if p_amount = 0 or abs(p_amount) > 1000 then raise exception 'Amount must be between -1000 and 1000, and not zero'; end if;
  if coalesce(array_length(p_student_ids, 1), 0) = 0 then raise exception 'Pick at least one student'; end if;
  select name into cat_name from public.point_categories where id = p_category;
  if cat_name is null then raise exception 'Unknown category'; end if;

  foreach sid in array (select array_agg(distinct x) from unnest(p_student_ids) x) loop
    select name into sname from public.students where student_id = sid;
    if sname is null then raise exception 'Unknown student %', sid; end if;
    insert into public.point_transactions (student_id, team_id, amount, category_id, reason, event_id, awarded_by, awarded_by_name, evidence_path)
      values (sid, (select team_id from public.students where student_id = sid), p_amount, p_category, p_reason, p_event, p_actor, p_actor_name, p_evidence)
      returning * into tx;
    txs := txs || to_jsonb(tx);
    perform public.write_audit(p_actor, p_actor_name, case when p_amount > 0 then 'points.award' else 'points.deduct' end, sname,
      case when p_amount > 0 then '+' else '' end || p_amount || ' in ' || cat_name || ': ' || p_reason);
    for ach in select * from public.unlock_achievements(sid) loop
      unlocked := unlocked || jsonb_build_object('student_id', sid, 'student_name', sname, 'achievement_id', ach.id);
    end loop;
  end loop;
  return jsonb_build_object('transactions', txs, 'unlocked', unlocked);
end $$;

create or replace function public.reverse_transaction(p_actor uuid, p_actor_name text, p_tx uuid, p_note text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare orig public.point_transactions; comp uuid; sname text;
begin
  if not exists (select 1 from public.profiles where id = p_actor and role in ('teacher', 'admin')) then
    raise exception 'Not allowed';
  end if;
  select * into orig from public.point_transactions where id = p_tx for update;
  if orig.id is null then raise exception 'Transaction not found'; end if;
  if orig.status <> 'active' or orig.reverses_id is not null then raise exception 'This transaction can''t be reversed'; end if;
  update public.point_transactions set status = 'reversed' where id = orig.id;
  insert into public.point_transactions (student_id, team_id, amount, category_id, reason, event_id, awarded_by, awarded_by_name, status, reverses_id)
    values (orig.student_id, orig.team_id, -orig.amount, orig.category_id, 'Reversal: ' || coalesce(nullif(p_note, ''), orig.reason), orig.event_id, p_actor, p_actor_name, 'active', orig.id)
    returning id into comp;
  select name into sname from public.students where student_id = orig.student_id;
  perform public.write_audit(p_actor, p_actor_name, 'points.reverse', sname, orig.amount || ' reversed. ' || p_note);
  return comp;
end $$;

-- Only the service role may call the RPCs.
revoke all on function public.award_points(uuid, text, text[], integer, uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.reverse_transaction(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.unlock_achievements(text) from public, anon, authenticated;
revoke all on function public.write_audit(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.award_points(uuid, text, text[], integer, uuid, text, uuid, text) to service_role;
grant execute on function public.reverse_transaction(uuid, text, uuid, text) to service_role;
grant execute on function public.unlock_achievements(text) to service_role;
grant execute on function public.write_audit(uuid, text, text, text, text) to service_role;

-- Realtime: the public pulse table the leaderboard listens to.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.rank_events;
  end if;
end $$;
