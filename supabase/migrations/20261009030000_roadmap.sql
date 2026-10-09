-- Roadmap rules: an edge joins two nodes of one track and never closes a
-- cycle. The track row is locked first, so two edges added at once cannot
-- form a cycle together.

create or replace function public.check_track_edge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_track uuid;
  to_track uuid;
begin
  select track_id into from_track from public.track_nodes where id = new.from_node_id;
  select track_id into to_track from public.track_nodes where id = new.to_node_id;
  if from_track is distinct from to_track then
    raise exception 'Prasyarat harus dari track yang sama' using errcode = 'P0001';
  end if;

  perform 1 from public.tracks where id = from_track for update;

  -- A cycle exists when the new target already reaches the new source.
  if exists (
    with recursive reach(node) as (
      select new.to_node_id
      union
      select e.to_node_id from public.track_edges e join reach r on e.from_node_id = r.node
      where e.id is distinct from new.id
    )
    select 1 from reach where node = new.from_node_id
  ) then
    raise exception 'Prasyarat ini membuat lingkaran' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger check_track_edge before insert or update of from_node_id, to_node_id
  on public.track_edges for each row execute function public.check_track_edge();

-- Moving a node to another track would leave its edges crossing tracks.
create or replace function public.keep_node_track()
returns trigger
language plpgsql
as $$
begin
  if new.track_id <> old.track_id then
    raise exception 'Node tidak bisa dipindah ke track lain' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger keep_node_track before update of track_id
  on public.track_nodes for each row execute function public.keep_node_track();

-- Publishes a track with every node and edge in it. New nodes and edges
-- start as draft, so edits stay hidden until this runs again.
create or replace function public.publish_track(p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.tracks;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin' using errcode = '42501';
  end if;

  select * into t from public.tracks where slug = p_slug for update;
  if not found then
    raise exception 'Track tidak ditemukan' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.track_nodes where track_id = t.id) then
    raise exception 'Track belum punya topik' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.track_nodes n join public.topics tp on tp.id = n.topic_id
    where n.track_id = t.id and tp.status <> 'published'
  ) then
    raise exception 'Semua topik di track harus sudah terbit' using errcode = 'P0001';
  end if;

  update public.track_nodes set status = 'published' where track_id = t.id;
  update public.track_edges set status = 'published'
  where from_node_id in (select id from public.track_nodes where track_id = t.id);
  update public.tracks set status = 'published' where id = t.id;
end;
$$;

revoke execute on function public.publish_track(text) from public, anon;
grant execute on function public.publish_track(text) to authenticated;
