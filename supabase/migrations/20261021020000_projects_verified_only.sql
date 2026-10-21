-- A project counts for learners only once verified: a project added to a
-- published topic, or edited (which clears verified_at), stays hidden and
-- does not block certificates until its solution passes "Uji solusi".

drop policy "projects: read published" on public.projects;
create policy "projects: read published" on public.projects for select to anon, authenticated
  using (status = 'published' and verified_at is not null
    and topic_id in (select id from public.topics where status = 'published'));

create or replace function public.pass_project(p_project uuid, p_code jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  if jsonb_typeof(p_code) is distinct from 'object' or octet_length(p_code::text) > 65536 then
    raise exception 'Kode tidak valid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.projects pr
    join public.topics t on t.id = pr.topic_id and t.status = 'published'
    where pr.id = p_project and pr.status = 'published' and pr.verified_at is not null
  ) then
    raise exception 'Proyek tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.project_progress (user_id, project_id, code) values (uid, p_project, p_code)
  on conflict (user_id, project_id) do update set code = excluded.code, passed_at = now();
end;
$$;

create or replace function public.certificate_status(p_topic uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  total int;
  done int;
  exam_ok boolean;
  proj uuid;
  proj_ok boolean;
  cert text;
begin
  select count(*) into total from public.chapters where topic_id = p_topic and status = 'published';
  select count(*) into done from public.chapter_progress cp
    join public.chapters c on c.id = cp.chapter_id and c.topic_id = p_topic and c.status = 'published'
    where cp.user_id = uid;
  select exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.topic_id = p_topic and a.user_id = uid and a.passed
  ) into exam_ok;
  select id into proj from public.projects where topic_id = p_topic and status = 'published' and verified_at is not null;
  proj_ok := proj is null or exists (select 1 from public.project_progress where project_id = proj and user_id = uid);
  select code into cert from public.certificates where topic_id = p_topic and user_id = uid;
  return jsonb_build_object(
    'chapters_done', done,
    'chapters_total', total,
    'exam_passed', exam_ok,
    'project_required', proj is not null,
    'project_passed', proj is not null and proj_ok,
    'eligible', uid is not null and done >= total and exam_ok and proj_ok,
    'code', cert
  );
end;
$$;
