-- Review follow-ups: the one day window counts from email confirmation,
-- an empty display name falls back to the email name, referred_by is indexed.
create index profiles_referred_by_idx on public.profiles (referred_by);

create or replace function public.claim_referral(code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  mine public.profiles%rowtype;
  confirmed timestamptz;
  inviter uuid;
begin
  if me is null then return false; end if;
  select * into mine from public.profiles where user_id = me for update;
  if not found or mine.referred_by is not null then return false; end if;
  select email_confirmed_at into confirmed from auth.users where id = me;
  if confirmed is null or confirmed < now() - interval '1 day' then return false; end if;
  select user_id into inviter from public.profiles where referral_code = upper(trim(code));
  if inviter is null or inviter = me then return false; end if;
  update public.profiles set referred_by = inviter where user_id = me;
  return true;
end;
$$;

create or replace function public.admin_user_referrals(target uuid)
returns table (relation text, user_id uuid, name text, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'invited_by', i.user_id, coalesce(nullif(trim(i.display_name), ''), split_part(u.email, '@', 1)), t.created_at
  from public.profiles t
  join public.profiles i on i.user_id = t.referred_by
  join auth.users u on u.id = i.user_id
  where t.user_id = target and (select public.is_admin())
  union all
  select 'invited', c.user_id, coalesce(nullif(trim(c.display_name), ''), split_part(u.email, '@', 1)), c.created_at
  from public.profiles c
  join auth.users u on u.id = c.user_id
  where c.referred_by = target and (select public.is_admin())
  order by 1, 4
$$;

create or replace function public.admin_users()
returns table (
  user_id uuid, email text, display_name text, role text, provider text, avatar_url text,
  created_at timestamptz, last_sign_in_at timestamptz, last_active_at timestamptz, confirmed boolean,
  referred_by_name text, referral_count int
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.display_name, coalesce(p.role, 'student'),
         coalesce(
           (select string_agg(i.provider, ',' order by i.created_at) from auth.identities i where i.user_id = u.id),
           'email'
         ),
         coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
         u.created_at, u.last_sign_in_at,
         greatest(
           u.last_sign_in_at,
           p.last_seen_at,
           (select max(g.updated_at) from public.progress g where g.user_id = u.id),
           (select max(c.completed_at) from public.chapter_progress c where c.user_id = u.id)
         ),
         u.email_confirmed_at is not null,
         (select coalesce(nullif(trim(ip.display_name), ''), split_part(iu.email, '@', 1))
            from public.profiles ip join auth.users iu on iu.id = ip.user_id where ip.user_id = p.referred_by),
         (select count(*)::int from public.profiles c where c.referred_by = u.id)
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;
