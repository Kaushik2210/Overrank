-- Team-only awards: points can be given to a team without crediting an individual student.

alter table public.point_transactions alter column student_id drop not null;

-- A student's transaction always takes that student's team. A team award keeps the team it was given.
create or replace function public.tx_enforce_team() returns trigger
language plpgsql as $$
begin
  if new.student_id is not null then
    select team_id into new.team_id from public.students where student_id = new.student_id;
  end if;
  if new.team_id is null then raise exception 'A point entry needs a team'; end if;
  return new;
end $$;

drop function if exists public.award_points(uuid, text, text[], integer, uuid, text, uuid, text);

create or replace function public.award_points(
  p_actor uuid, p_actor_name text, p_student_ids text[], p_amount integer, p_category uuid,
  p_reason text, p_event uuid default null, p_evidence text default null, p_team_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare sid text; tx public.point_transactions; ach public.achievements; txs jsonb := '[]'; unlocked jsonb := '[]'; sname text; cat_name text; tname text;
begin
  if not exists (select 1 from public.profiles where id = p_actor and role in ('teacher', 'admin')) then
    raise exception 'Not allowed';
  end if;
  if p_amount = 0 or abs(p_amount) > 1000 then raise exception 'Amount must be between -1000 and 1000, and not zero'; end if;
  select name into cat_name from public.point_categories where id = p_category;
  if cat_name is null then raise exception 'Unknown category'; end if;

  if coalesce(array_length(p_student_ids, 1), 0) = 0 then
    select name into tname from public.teams where id = p_team_id;
    if tname is null then raise exception 'Pick a team'; end if;
    insert into public.point_transactions (student_id, team_id, amount, category_id, reason, event_id, awarded_by, awarded_by_name, evidence_path)
      values (null, p_team_id, p_amount, p_category, p_reason, p_event, p_actor, p_actor_name, p_evidence)
      returning * into tx;
    txs := txs || to_jsonb(tx);
    perform public.write_audit(p_actor, p_actor_name, case when p_amount > 0 then 'points.award' else 'points.deduct' end, tname,
      case when p_amount > 0 then '+' else '' end || p_amount || ' in ' || cat_name || ': ' || p_reason);
    return jsonb_build_object('transactions', txs, 'unlocked', unlocked);
  end if;

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

revoke all on function public.award_points(uuid, text, text[], integer, uuid, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.award_points(uuid, text, text[], integer, uuid, text, uuid, text, uuid) to service_role;

-- reversing a team award has no student name to log, so fall back to the team's
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
  select coalesce((select name from public.students where student_id = orig.student_id), (select name from public.teams where id = orig.team_id), '') into sname;
  perform public.write_audit(p_actor, p_actor_name, 'points.reverse', sname, orig.amount || ' reversed. ' || p_note);
  return comp;
end $$;
