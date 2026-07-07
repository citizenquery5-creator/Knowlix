-- Update free plan: 2-day trial, 1 download per day
-- Update premium plan: ₹149/month billed yearly

-- Update free_downloads_per_day from 5 to 1
UPDATE public.settings SET value = '1' WHERE key = 'free_downloads_per_day';

-- Add free_trial_days setting if it doesn't exist
INSERT INTO public.settings (key, value, description)
VALUES ('free_trial_days', '2', 'Free trial duration in days')
ON CONFLICT (key) DO UPDATE SET value = '2', description = 'Free trial duration in days';

-- Update premium_price to 149 if it exists
INSERT INTO public.settings (key, value, description)
VALUES ('premium_price', '149', 'Premium plan monthly price (billed yearly)')
ON CONFLICT (key) DO UPDATE SET value = '149', description = 'Premium plan monthly price (billed yearly)';

-- Remove pro_price setting since Pro plan is discontinued
DELETE FROM public.settings WHERE key = 'pro_price';
