-- claim_referral also refuses an account whose email is not confirmed, so a
-- script cannot sign up with junk addresses and inflate someone's count.
create or replace function public.claim_referral(code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  mine public.profiles%rowtype;
  made timestamptz;
  confirmed timestamptz;
  inviter uuid;
begin
  if me is null then return false; end if;
  select * into mine from public.profiles where user_id = me for update;
  if not found or mine.referred_by is not null then return false; end if;
  select created_at, email_confirmed_at into made, confirmed from auth.users where id = me;
  if confirmed is null or made < now() - interval '1 day' then return false; end if;
  select user_id into inviter from public.profiles where referral_code = upper(trim(code));
  if inviter is null or inviter = me then return false; end if;
  update public.profiles set referred_by = inviter where user_id = me;
  return true;
end;
$$;
