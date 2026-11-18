begin;
select plan(19);

-- ana mengajak budi. cici's account is old. admin reads the relations.
insert into auth.users (id, email, created_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana@contoh.id', now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'budi@contoh.id', now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'cici@contoh.id', now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000a4', 'dedi@contoh.id', now(), now()),
  ('00000000-0000-0000-0000-0000000000a5', 'admin-ref@contoh.id', now(), now()),
  ('00000000-0000-0000-0000-0000000000a6', 'eko@contoh.id', now(), null),
  ('00000000-0000-0000-0000-0000000000a7', 'fani@contoh.id', now() - interval '3 days', now());
update public.profiles set display_name = '' where user_id = '00000000-0000-0000-0000-0000000000a2';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-0000000000a5';

select matches((select referral_code from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1'),
  '^[A-HJ-NP-Z2-9]{7}$', 'a new learner gets a 7 character code');

create temp table codes as
  select user_id, referral_code as code from public.profiles where user_id::text like '00000000-0000-0000-0000-0000000000a%';
grant select on codes to authenticated;

-- budi claims ana's code
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';
select is(public.claim_referral(lower((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a1'))), true,
  'a new learner can claim another learner''s code (any case)');
select is(public.claim_referral((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a4')), false,
  'a second claim does not replace the first');
reset role;

select is((select referred_by from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a2'),
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'referred_by keeps the first inviter');

-- dedi claims his own code; cici is too old
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a4", "role": "authenticated"}';
select is(public.claim_referral((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a4')), false,
  'a learner cannot claim their own code');
select is(public.claim_referral('ZZZZZZZ'), false, 'an unknown code is refused');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a3", "role": "authenticated"}';
select is(public.claim_referral((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a1')), false,
  'an account older than a day cannot claim');
select throws_ok($$ update public.profiles set referred_by = '00000000-0000-0000-0000-0000000000a1' where user_id = '00000000-0000-0000-0000-0000000000a3' $$,
  '42501', null, 'a learner cannot write referred_by directly');
reset role;

-- eko never confirmed his email: no claim
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a6", "role": "authenticated"}';
select is(public.claim_referral((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a1')), false,
  'an unconfirmed account cannot claim');
reset role;

-- fani signed up 3 days ago but confirmed just now: still a new learner
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a7", "role": "authenticated"}';
select is(public.claim_referral((select code from codes where user_id = '00000000-0000-0000-0000-0000000000a1')), true,
  'the one day window starts at confirmation');
reset role;

-- ana sees one joined friend
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';
select is((select joined from public.my_referral()), 2, 'the inviter sees both friends joined');
select is((select count(*)::int from public.admin_user_referrals('00000000-0000-0000-0000-0000000000a2')), 0,
  'a learner gets no rows from admin_user_referrals');
reset role;

-- admin sees both directions
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a5", "role": "authenticated"}';
select is((select relation from public.admin_user_referrals('00000000-0000-0000-0000-0000000000a2') limit 1), 'invited_by',
  'admin sees who invited budi');
select is((select name from public.admin_user_referrals('00000000-0000-0000-0000-0000000000a1') where user_id = '00000000-0000-0000-0000-0000000000a2'), 'budi',
  'an empty display name falls back to the email name');
select is((select count(*)::int from public.admin_users() where referral_count = 2 and referred_by_name is null), 1,
  'admin_users carries the invited count');
select cmp_ok((public.admin_referral_summary() ->> 'total')::int, '>=', 2, 'the dashboard counts invited learners');
select cmp_ok((public.admin_referral_summary() -> 'top' -> 0 ->> 'n')::int, '>=', 2, 'the top inviter has at least our two friends');
select cmp_ok(jsonb_array_length(public.admin_referral_summary() -> 'recent'), '>=', 1, 'the dashboard lists the latest invites');
reset role;

-- the inviter leaves: budi stays, the link is cleared
delete from auth.users where id = '00000000-0000-0000-0000-0000000000a1';
select is((select referred_by from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a2'), null,
  'deleting the inviter clears referred_by and keeps the invited learner');

select * from finish();
rollback;
