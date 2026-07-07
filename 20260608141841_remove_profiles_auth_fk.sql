/*
# Remove FK from profiles to auth.users

The FK constraint on profiles.id referencing auth.users might be causing
PostgREST schema introspection to fail. Since profiles.id IS auth.users.id,
we can rely on application-level referential integrity instead.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;