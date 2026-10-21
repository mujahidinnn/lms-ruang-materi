-- One choice on /mulai instead of a guardian checkbox for everyone: an adult
-- agrees to the privacy policy, a learner under 18 confirms their parent or
-- guardian allows it (UU PDP Pasal 25). Either choice sets guardian_consent,
-- which the progress triggers keep reading as "consent recorded".
alter table public.profiles
  add column age_group text check (age_group in ('dewasa', 'anak'));

grant update (age_group) on public.profiles to authenticated;
