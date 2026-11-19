-- Admins can rename a class (title + slug). The import history follows the
-- slug (the class page reads its prerequisites from there).
create function public.rename_topic(p_slug text, p_new text, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin' using errcode = '42501';
  end if;
  if p_new !~ '^[a-z0-9-]+$' or char_length(p_new) > 60 then
    raise exception 'Slug hanya huruf kecil, angka dan tanda hubung.' using errcode = 'P0001';
  end if;
  if btrim(p_title) = '' then
    raise exception 'Judul wajib diisi.' using errcode = 'P0001';
  end if;
  update public.topics set slug = p_new, title = btrim(p_title) where slug = p_slug;
  if not found then
    raise exception 'Kelas tidak ditemukan.' using errcode = 'P0001';
  end if;
  update public.import_jobs set slug = p_new where slug = p_slug and p_new <> p_slug;
exception when unique_violation then
  raise exception 'Slug sudah dipakai kelas lain.' using errcode = 'P0001';
end;
$$;

revoke all on function public.rename_topic(text, text, text) from public, anon;
grant execute on function public.rename_topic(text, text, text) to authenticated;

-- Progress follows a chapter to its republished copy by slug. A chapter whose
-- slug was edited has no copy with the old slug, so fall back to its position.
create or replace function public.carry_chapter_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  successor uuid;
begin
  if old.status = 'published' then
    select id into successor from public.chapters
    where topic_id = old.topic_id and status = 'draft'
      and (slug = old.slug or position = old.position)
    order by (slug = old.slug) desc
    limit 1;
    if successor is not null then
      update public.chapter_progress set chapter_id = successor where chapter_id = old.id;
      update public.progress set last_chapter_id = successor where last_chapter_id = old.id;
    end if;
  end if;
  return old;
end;
$$;
