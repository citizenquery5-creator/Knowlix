/*
# Fix handle_new_user function - simpler version

The error "Database error querying schema" suggests the trigger function
is interfering with auth schema queries. We'll:
1. Drop the trigger entirely first
2. Create a simpler version that doesn't use exceptions
3. Only create the trigger after ensuring it works
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simpler version without error handling that could interfere
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'free_user')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger - make sure it's AFTER INSERT to not interfere with auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();