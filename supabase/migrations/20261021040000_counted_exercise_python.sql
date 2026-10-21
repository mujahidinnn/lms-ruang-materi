-- Python exercises count toward a chapter like the other runnable kinds.
-- A separate migration: a new enum value cannot be used in the transaction
-- that adds it.
create or replace function public.counted_exercise(e public.code_exercises)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_array_length(e.tests) > 0 and e.kind in ('web', 'js', 'express', 'python');
$$;
