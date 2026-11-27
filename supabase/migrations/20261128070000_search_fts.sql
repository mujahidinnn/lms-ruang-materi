-- Full-text search for /cari. 'simple' config: Postgres has no Indonesian
-- stemmer, and code words (useState, git) must stay as typed. Every word must
-- match, the last one as a prefix so a half-typed word still finds results.
alter table public.topics add column fts tsvector generated always as (
  setweight(to_tsvector('simple', title), 'A') || setweight(to_tsvector('simple', coalesce(description, '')), 'B')
) stored;
alter table public.chapters add column fts tsvector generated always as (
  setweight(to_tsvector('simple', title), 'A') || setweight(to_tsvector('simple', body), 'B')
) stored;
create index on public.topics using gin (fts);
create index on public.chapters using gin (fts);

-- Runs as the caller, so RLS still hides drafts; the status checks only keep
-- the plan on published rows.
create or replace function public.search_content(p_q text)
returns table (kind text, topic_slug text, topic_title text, slug text, title text, body text)
language sql
stable
security invoker
set search_path = ''
as $$
  -- plainto_tsquery parses the query like the documents (node.js stays one
  -- word); ':*' on the result makes its last word a prefix.
  with q as (
    select (s || ':*')::tsquery as tq
    from (select nullif(plainto_tsquery('simple', left(p_q, 60))::text, '') as s) x
    where s is not null
  )
  (select 'kelas', t.slug, t.title, null, t.title, coalesce(t.description, '')
   from public.topics t, q
   where t.status = 'published' and t.fts @@ q.tq
   order by ts_rank(t.fts, q.tq) desc limit 8)
  union all
  (select 'bab', t.slug, t.title, c.slug, c.title, c.body
   from public.chapters c join public.topics t on t.id = c.topic_id, q
   where c.status = 'published' and t.status = 'published' and c.fts @@ q.tq
   order by ts_rank(c.fts, q.tq) desc limit 20);
$$;

grant execute on function public.search_content(text) to anon, authenticated;
