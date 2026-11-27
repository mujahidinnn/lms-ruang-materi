-- What the admin answered or fixed when closing a report, an optional source
-- link, and when it was closed. Shown in /admin/laporan and mailed to the learner.
alter table public.chapter_reports
  add column response text check (char_length(response) <= 2000),
  add column source_url text check (char_length(source_url) <= 500 and source_url ~ '^(https?://|/)'),
  add column resolved_at timestamptz;
