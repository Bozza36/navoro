-- ============================================================================
-- Navoro Phase 1 — Biomedical content reset + DHF Portfolio infrastructure
-- ============================================================================
-- This migration:
--   1. Wipes the legacy 7-level biomedical seed (lessons + progress).
--   2. Creates the dhf_documents table that backs each user's CardioSense Pro
--      Design History File portfolio.
--   3. Adds task-level XP / colleague metadata columns the new content uses.
-- Subsequent migrations (Phase 2, Phase 3) will INSERT the new task data.
-- ============================================================================

-- 1. Drop old biomedical content + any user progress against it
DELETE FROM public.user_lesson_progress
  WHERE lesson_id IN (SELECT id FROM public.lessons WHERE category = 'Biomedical');

DELETE FROM public.lessons WHERE category = 'Biomedical';

-- 2. DHF Portfolio table — every Document Builder output the user produces
CREATE TABLE IF NOT EXISTS public.dhf_documents (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  task_index      INTEGER NOT NULL DEFAULT 0,
  doc_code        TEXT NOT NULL,         -- e.g. "DID-001", "VP-012", "CR-007"
  doc_title       TEXT NOT NULL,
  doc_section     TEXT,                  -- "Design Inputs", "Verification", "Change Control", ...
  body_markdown   TEXT NOT NULL,         -- the user's final document text
  score           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id, task_index)
);

ALTER TABLE public.dhf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own DHF documents"
  ON public.dhf_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own DHF documents"
  ON public.dhf_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own DHF documents"
  ON public.dhf_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_dhf_documents_updated_at
  BEFORE UPDATE ON public.dhf_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Optional metadata for the new per-task XP scoring + colleague cards.
--    Stored in lesson.content JSON, but we also expose a quick lookup for
--    aggregation queries.
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS task_xp_total  INTEGER,
  ADD COLUMN IF NOT EXISTS colleague_name TEXT,
  ADD COLUMN IF NOT EXISTS colleague_role TEXT;

-- 4. Track which level-complete celebrations a user has already seen so we
--    only animate the badge unlock once.
CREATE TABLE IF NOT EXISTS public.level_completions (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     public.lesson_category NOT NULL,
  level        INTEGER NOT NULL CHECK (level BETWEEN 1 AND 7),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  team_review  JSONB NOT NULL DEFAULT '{}'::jsonb,  -- snapshot of all colleague quotes at completion
  UNIQUE (user_id, category, level)
);

ALTER TABLE public.level_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own level completions"
  ON public.level_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own level completions"
  ON public.level_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
