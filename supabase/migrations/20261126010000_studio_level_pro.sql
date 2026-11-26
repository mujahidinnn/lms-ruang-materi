-- Studio Proyek: a fourth level above lanjut.
alter table public.studio_defs drop constraint studio_defs_level_check;
alter table public.studio_defs add constraint studio_defs_level_check check (level in ('pemula', 'menengah', 'lanjut', 'pro'));
