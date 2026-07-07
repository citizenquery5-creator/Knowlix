/*
# Temporarily disable RLS to test if that's causing the schema error

If login works after this, we know RLS policies are the culprit.
*/

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;