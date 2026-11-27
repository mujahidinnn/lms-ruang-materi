-- Extra detail for one log row, shown when the row is opened in /admin/log:
-- a list of [label, value] pairs, so the page needs no per-action layout.
alter table public.admin_audit_log
  add column meta jsonb not null default '[]'
  check (jsonb_typeof(meta) = 'array' and pg_column_size(meta) <= 16000);
