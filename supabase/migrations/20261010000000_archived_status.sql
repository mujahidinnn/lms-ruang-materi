-- Rows that past attempts or reviews still point at are archived, not
-- deleted. Its own migration: a new enum value is usable only after commit.
alter type public.content_status add value 'archived';
