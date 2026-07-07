-- Add is_downloadable column to documents (admin can enable/disable downloads per document)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_downloadable boolean NOT NULL DEFAULT true;

-- Add free_trial_days setting
INSERT INTO public.settings (key, value, description)
VALUES ('free_trial_days', '2', 'Free trial duration in days')
ON CONFLICT (key) DO UPDATE SET value = '2', description = 'Free trial duration in days';

-- Add downloads_enabled global setting (admin can disable all downloads)
INSERT INTO public.settings (key, value, description)
VALUES ('downloads_enabled', 'true', 'Global toggle to enable/disable all downloads')
ON CONFLICT (key) DO NOTHING;
