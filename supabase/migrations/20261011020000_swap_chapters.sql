-- Reorder two chapters in one transaction (positions are unique, deferred).
create or replace function public.swap_chapters(a uuid, b uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pa int;
  pb int;
begin
  select position into pa from public.chapters where id = a;
  select position into pb from public.chapters where id = b;
  update public.chapters set position = pb where id = a;
  update public.chapters set position = pa where id = b;
end;
$$;

revoke execute on function public.swap_chapters(uuid, uuid) from public, anon;
grant execute on function public.swap_chapters(uuid, uuid) to authenticated;
