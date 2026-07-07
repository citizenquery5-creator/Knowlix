/*
# Create necessary indexes for PostgREST
*/

CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_uploader_id ON ebooks(uploader_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);