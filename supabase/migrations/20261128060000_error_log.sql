-- Server and browser errors, one row per distinct error (source, path,
-- message) with a count. Written only through log_error(), read by admins in
-- /admin/error. Anyone may call log_error, so it truncates its input and
-- accepts at most 100 new rows an hour; repeats only bump the count.
create table public.error_log (
  id bigint generated always as identity primary key,
  fingerprint text not null unique,
  source text not null check (source in ('server', 'rpc', 'client')),
  path text not null default '',
  message text not null,
  stack text not null default '',
  count integer not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  alerted_at timestamptz,
  resolved_at timestamptz
);

create index on public.error_log (last_at desc);

alter table public.error_log enable row level security;

create policy "error_log: read admin" on public.error_log
  for select to authenticated
  using ((select public.is_admin()));

create policy "error_log: resolve editor" on public.error_log
  for update to authenticated
  using ((select public.can_edit()))
  with check ((select public.can_edit()));

grant update (resolved_at) on public.error_log to authenticated;

-- Returns true when the app should email the owner: the error is new (or came
-- back after being marked resolved) and no alert went out in the last hour.
create or replace function public.log_error(p_source text, p_path text, p_message text, p_stack text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text := left(coalesce(split_part(p_path, '?', 1), ''), 300);
  v_message text := left(coalesce(nullif(trim(p_message), ''), '(tanpa pesan)'), 500);
  v_fp text;
  v_old public.error_log;
begin
  if p_source not in ('server', 'rpc', 'client') then return false; end if;
  v_fp := md5(p_source || '|' || v_path || '|' || v_message);
  select * into v_old from public.error_log where fingerprint = v_fp;
  if v_old.id is null
     and (select count(*) from public.error_log where first_at > now() - interval '1 hour') >= 100 then
    return false;
  end if;

  insert into public.error_log (fingerprint, source, path, message, stack)
  values (v_fp, p_source, v_path, v_message, left(coalesce(p_stack, ''), 4000))
  on conflict (fingerprint) do update
    set count = public.error_log.count + 1, last_at = now(), stack = excluded.stack, resolved_at = null;
  -- A repeat of an error that is still open needs no new email.
  if v_old.id is not null and v_old.resolved_at is null then return false; end if;

  if exists (select 1 from public.error_log where alerted_at > now() - interval '1 hour') then return false; end if;
  update public.error_log set alerted_at = now() where fingerprint = v_fp;
  return true;
end;
$$;

revoke execute on function public.log_error(text, text, text, text) from public;
grant execute on function public.log_error(text, text, text, text) to anon, authenticated;
