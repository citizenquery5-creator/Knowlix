/*
# Disable the trigger temporarily to isolate the issue

If login works without the trigger, we know the trigger is causing problems.
We can create profiles manually for test users instead.
*/

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();