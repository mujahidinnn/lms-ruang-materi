-- Numbers for the "Ajakan teman" card on /admin: how many learners came
-- through an invite, who invited the most, and the latest invites.
create function public.admin_referral_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not (select public.is_admin()) then null else jsonb_build_object(
    'total', (select count(*) from public.profiles where referred_by is not null),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'n', t.n) order by t.n desc, t.name)
      from (
        select i.user_id as id, coalesce(nullif(trim(i.display_name), ''), split_part(u.email, '@', 1)) as name, count(*) as n
        from public.profiles c
        join public.profiles i on i.user_id = c.referred_by
        join auth.users u on u.id = i.user_id
        group by i.user_id, i.display_name, u.email
        order by count(*) desc, 2 limit 5
      ) t
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'by_id', r.by_id, 'by', r.by, 'at', r.at) order by r.at desc)
      from (
        select c.user_id as id, coalesce(nullif(trim(c.display_name), ''), split_part(cu.email, '@', 1)) as name,
               i.user_id as by_id, coalesce(nullif(trim(i.display_name), ''), split_part(iu.email, '@', 1)) as by,
               c.created_at as at
        from public.profiles c
        join auth.users cu on cu.id = c.user_id
        join public.profiles i on i.user_id = c.referred_by
        join auth.users iu on iu.id = i.user_id
        order by c.created_at desc limit 5
      ) r
    ), '[]'::jsonb)
  ) end
$$;
revoke execute on function public.admin_referral_summary() from public, anon;
grant execute on function public.admin_referral_summary() to authenticated;
