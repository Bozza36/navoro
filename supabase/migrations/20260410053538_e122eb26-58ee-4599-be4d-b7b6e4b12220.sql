
-- Add is_pro to profiles
ALTER TABLE public.profiles ADD COLUMN is_pro boolean NOT NULL DEFAULT false;

-- Expand lesson_category enum
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Aerospace';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Surgical Residency';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Medical Research';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Health Informatics';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Product Management';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'AI Ethics';
ALTER TYPE public.lesson_category ADD VALUE IF NOT EXISTS 'Corporate Law';

-- Add path_group to lessons
ALTER TABLE public.lessons ADD COLUMN path_group text NOT NULL DEFAULT 'Engineering';
