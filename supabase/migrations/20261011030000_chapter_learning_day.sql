-- Finishing a chapter is learning: it counts toward the streak like a
-- practice set, a flashcard review or an exam submit.
create trigger log_learning_day after insert on public.chapter_progress
  for each row execute function public.log_learning_day();
