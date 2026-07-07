/*
# Re-enable RLS with proper policies
*/

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_public ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own_or_admin ON profiles;
DROP POLICY IF EXISTS profiles_delete_own_or_admin ON profiles;

CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_delete_own_or_admin" ON profiles FOR DELETE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Documents RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_select_approved ON documents;
DROP POLICY IF EXISTS documents_insert_creator ON documents;
DROP POLICY IF EXISTS documents_update_own ON documents;
DROP POLICY IF EXISTS documents_delete_admin ON documents;

CREATE POLICY "documents_select_approved" ON documents FOR SELECT 
  USING (is_approved = true OR auth.uid() = uploader_id);
CREATE POLICY "documents_insert_creator" ON documents FOR INSERT 
  WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "documents_update_own" ON documents FOR UPDATE 
  USING (auth.uid() = uploader_id);
CREATE POLICY "documents_delete_admin" ON documents FOR DELETE 
  USING (auth.uid() = uploader_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ebooks RLS
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ebooks_select_approved ON ebooks;
DROP POLICY IF EXISTS ebooks_insert_creator ON ebooks;
DROP POLICY IF EXISTS ebooks_update_own ON ebooks;
DROP POLICY IF EXISTS ebooks_delete_admin ON ebooks;

CREATE POLICY "ebooks_select_approved" ON ebooks FOR SELECT 
  USING (is_approved = true OR auth.uid() = uploader_id);
CREATE POLICY "ebooks_insert_creator" ON ebooks FOR INSERT 
  WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "ebooks_update_own" ON ebooks FOR UPDATE 
  USING (auth.uid() = uploader_id);
CREATE POLICY "ebooks_delete_admin" ON ebooks FOR DELETE 
  USING (auth.uid() = uploader_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Contact messages RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_insert_public ON contact_messages;
DROP POLICY IF EXISTS contact_messages_select_admin ON contact_messages;

CREATE POLICY "contact_messages_insert_public" ON contact_messages FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "contact_messages_select_admin" ON contact_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));