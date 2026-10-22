-- A certificate is permanent. Deleting one let its owner issue it again
-- under another name and code; account deletion still cascades.
drop policy "certificates: delete own" on public.certificates;

-- The learner types the certificate name when claiming, apart from the
-- display name (which stays free to change). Spaces are squeezed.
drop function public.issue_certificate(uuid);
create function public.issue_certificate(p_topic uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  existing text;
  nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  new_code text;
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  select code into existing from public.certificates where topic_id = p_topic and user_id = uid;
  if existing is not null then
    return existing;
  end if;
  if char_length(nm) not between 3 and 80 then
    raise exception 'Nama sertifikat 3 sampai 80 huruf' using errcode = '22023';
  end if;
  if not (public.certificate_status(p_topic) ->> 'eligible')::boolean then
    raise exception 'Belum memenuhi syarat sertifikat' using errcode = 'P0001';
  end if;
  new_code := upper(substr(md5(gen_random_uuid()::text), 1, 5) || '-' || substr(md5(gen_random_uuid()::text), 1, 5));
  insert into public.certificates (code, user_id, topic_id, name) values (new_code, uid, p_topic, nm)
  on conflict (user_id, topic_id) do nothing;
  select code into existing from public.certificates where topic_id = p_topic and user_id = uid;
  return existing;
end;
$$;

revoke execute on function public.issue_certificate(uuid, text) from public;
grant execute on function public.issue_certificate(uuid, text) to authenticated;
