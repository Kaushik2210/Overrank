-- Private bucket for evidence uploads. No public access; the app issues short-lived signed URLs.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('evidence', 'evidence', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
    on conflict (id) do update set public = false, file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  end if;
end $$;
