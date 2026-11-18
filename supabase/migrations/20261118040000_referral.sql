-- Referral codes: every learner has a code; a new learner who arrives through
-- someone's link records who invited them. Only the functions below write
-- referred_by (profiles' column grants do not include it).
alter table public.profiles add column referral_code text unique;
alter table public.profiles add column referred_by uuid references auth.users (id) on delete set null;

-- 7 characters without I, O, 0, 1; repeats until unused.
create function public.new_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') into c from generate_series(1, 7);
    exit when not exists (select 1 from public.profiles where referral_code = c);
  end loop;
  return c;
end;
$$;
revoke execute on function public.new_referral_code() from public, anon, authenticated;

update public.profiles set referral_code = public.new_referral_code() where referral_code is null;
alter table public.profiles alter column referral_code set not null;

-- Always 'student', raw_user_meta_data is ignored on purpose.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, referral_code) values (new.id, public.new_referral_code());
  return new;
end;
$$;

-- Called from the sign-in callback after the email is confirmed. True when
-- recorded. Refused: already invited, own code, unknown code, account older
-- than a day.
create function public.claim_referral(code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  mine public.profiles%rowtype;
  inviter uuid;
begin
  if me is null then return false; end if;
  select * into mine from public.profiles where user_id = me for update;
  if not found or mine.referred_by is not null then return false; end if;
  if (select created_at from auth.users where id = me) < now() - interval '1 day' then return false; end if;
  select user_id into inviter from public.profiles where referral_code = upper(trim(code));
  if inviter is null or inviter = me then return false; end if;
  update public.profiles set referred_by = inviter where user_id = me;
  return true;
end;
$$;
revoke execute on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

create function public.my_referral()
returns table (code text, joined int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.referral_code, (select count(*)::int from public.profiles c where c.referred_by = p.user_id)
  from public.profiles p
  where p.user_id = (select auth.uid())
$$;
revoke execute on function public.my_referral() from public, anon;
grant execute on function public.my_referral() to authenticated;

-- 'invited_by': who invited target. 'invited': whom target invited.
create function public.admin_user_referrals(target uuid)
returns table (relation text, user_id uuid, name text, at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'invited_by', i.user_id, coalesce(i.display_name, split_part(u.email, '@', 1)), t.created_at
  from public.profiles t
  join public.profiles i on i.user_id = t.referred_by
  join auth.users u on u.id = i.user_id
  where t.user_id = target and (select public.is_admin())
  union all
  select 'invited', c.user_id, coalesce(c.display_name, split_part(u.email, '@', 1)), c.created_at
  from public.profiles c
  join auth.users u on u.id = c.user_id
  where c.referred_by = target and (select public.is_admin())
  order by 1, 4
$$;
revoke execute on function public.admin_user_referrals(uuid) from public, anon;
grant execute on function public.admin_user_referrals(uuid) to authenticated;

-- admin_users() with who invited each account and how many they invited.
drop function public.admin_users();
create function public.admin_users()
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
         (select coalesce(ip.display_name, split_part(iu.email, '@', 1))
            from public.profiles ip join auth.users iu on iu.id = ip.user_id where ip.user_id = p.referred_by),
         (select count(*)::int from public.profiles c where c.referred_by = u.id)
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;
revoke execute on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;
