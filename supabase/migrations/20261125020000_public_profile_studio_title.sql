-- The public profile shows each project's title, now that projects live in the database.
create or replace function public.public_profile(p_handle text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'name', p.display_name,
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object('code', c.code, 'title', t.title, 'issued_at', c.issued_at) order by c.issued_at)
      from public.certificates c join public.topics t on t.id = c.topic_id where c.user_id = p.user_id
    ), '[]'),
    'badges', coalesce((
      select jsonb_agg(tr.title) from public.badges b join public.tracks tr on tr.id = b.track_id where b.user_id = p.user_id
    ), '[]'),
    'studio', coalesce((
      select jsonb_agg(jsonb_build_object('project', sp.project, 'title', coalesce(d.title, sp.project), 'url', sp.url) order by sp.updated_at)
      from public.studio_projects sp left join public.studio_defs d on d.slug = sp.project
      where sp.user_id = p.user_id and not sp.hidden
    ), '[]'),
    'chapters', (select count(*) from public.chapter_progress where user_id = p.user_id),
    'best_streak', coalesce((select best_days from public.learning_streaks where user_id = p.user_id), 0)
  )
  from public.profiles p
  where p.public_handle = p_handle and p.guardian_consent
    and coalesce(trim(p.display_name), '') <> ''
$$;
