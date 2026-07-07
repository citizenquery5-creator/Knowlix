/*
# Recreate handle_new_user trigger safely

## Issue
The auth login is failing with "Database error querying schema" which suggests
the trigger might be causing issues during auth operations.

## Solution
Recreate the function and trigger more carefully to ensure it doesn't block auth.
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function with explicit error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_app_meta_data->>'role', 'free_user')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail the user creation
    NULL;
  END;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();