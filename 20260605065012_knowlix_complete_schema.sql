
/*
# Knowlix Complete Database Schema

## Summary
Creates the full Knowlix educational platform schema including users/profiles,
documents, ebooks, categories, subscriptions, payments, and all related tables.

## Tables Created
1. profiles - Extended user profiles with roles (admin/creator/premium_user/free_user)
2. categories - Document/ebook categories
3. documents - Uploaded educational documents (PDF, DOCX, PPT, etc.)
4. ebooks - E-books with additional metadata
5. downloads - Download tracking per user/document/ebook
6. bookmarks - User bookmarks for documents and ebooks
7. likes - Like system for documents and ebooks
8. comments - Comment system on documents and ebooks
9. subscriptions - User subscription plans with expiry
10. payments - UPI payment records with screenshot and approval flow
11. creators - Creator-specific profile data and earnings
12. reports - Content moderation reports
13. notifications - In-app notification system
14. settings - Platform-wide key-value settings

## Security
- RLS enabled on all tables
- Admin/creator/user-scoped policies on sensitive tables
- Public read access for published content
- Private write access restricted to owners

## Notes
1. The admin account (Ankit Sharma / ankitfreelancehub@gmail.com / Admin@123) is seeded.
2. Default categories are seeded.
3. All tables use uuid PKs with gen_random_uuid() defaults.
*/

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'free_user' CHECK (role IN ('admin','creator','premium_user','free_user')),
  is_active boolean NOT NULL DEFAULT true,
  downloads_today integer NOT NULL DEFAULT 0,
  last_download_reset date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'free_user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_hi text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'BookOpen',
  color text DEFAULT '#6366F1',
  document_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text,
  file_type text NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf','docx','ppt','pptx','txt')),
  file_size bigint DEFAULT 0,
  thumbnail_url text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  uploader_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  view_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  language text DEFAULT 'en',
  ai_summary text,
  ai_keywords text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category_id);
CREATE INDEX IF NOT EXISTS documents_uploader_idx ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

DROP POLICY IF EXISTS "documents_select_approved" ON documents;
CREATE POLICY "documents_select_approved" ON documents FOR SELECT
  TO anon, authenticated USING (
    is_approved = true
    OR (auth.uid() IS NOT NULL AND uploader_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "documents_insert_auth" ON documents;
CREATE POLICY "documents_insert_auth" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "documents_update_own_or_admin" ON documents;
CREATE POLICY "documents_update_own_or_admin" ON documents FOR UPDATE
  TO authenticated USING (
    auth.uid() = uploader_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "documents_delete_own_or_admin" ON documents;
CREATE POLICY "documents_delete_own_or_admin" ON documents FOR DELETE
  TO authenticated USING (
    auth.uid() = uploader_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- EBOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  description text DEFAULT '',
  cover_url text,
  file_url text,
  file_type text NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf','epub')),
  file_size bigint DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  uploader_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  isbn text DEFAULT '',
  publisher text DEFAULT '',
  publish_year integer,
  pages integer DEFAULT 0,
  language text DEFAULT 'en',
  is_premium boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  view_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ebooks_category_idx ON ebooks(category_id);
CREATE INDEX IF NOT EXISTS ebooks_uploader_idx ON ebooks(uploader_id);
CREATE INDEX IF NOT EXISTS ebooks_status_idx ON ebooks(status);

DROP POLICY IF EXISTS "ebooks_select_approved" ON ebooks;
CREATE POLICY "ebooks_select_approved" ON ebooks FOR SELECT
  TO anon, authenticated USING (
    is_approved = true
    OR (auth.uid() IS NOT NULL AND uploader_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "ebooks_insert_auth" ON ebooks;
CREATE POLICY "ebooks_insert_auth" ON ebooks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "ebooks_update_own_or_admin" ON ebooks;
CREATE POLICY "ebooks_update_own_or_admin" ON ebooks FOR UPDATE
  TO authenticated USING (
    auth.uid() = uploader_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "ebooks_delete_own_or_admin" ON ebooks;
CREATE POLICY "ebooks_delete_own_or_admin" ON ebooks FOR DELETE
  TO authenticated USING (
    auth.uid() = uploader_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- DOWNLOADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT download_target_check CHECK (
    (document_id IS NOT NULL AND ebook_id IS NULL) OR
    (document_id IS NULL AND ebook_id IS NOT NULL)
  )
);
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS downloads_user_idx ON downloads(user_id);
CREATE INDEX IF NOT EXISTS downloads_document_idx ON downloads(document_id);
CREATE INDEX IF NOT EXISTS downloads_ebook_idx ON downloads(ebook_id);

DROP POLICY IF EXISTS "downloads_select_own" ON downloads;
CREATE POLICY "downloads_select_own" ON downloads FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "downloads_insert_own" ON downloads;
CREATE POLICY "downloads_insert_own" ON downloads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_update_admin" ON downloads;
CREATE POLICY "downloads_update_admin" ON downloads FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "downloads_delete_own" ON downloads;
CREATE POLICY "downloads_delete_own" ON downloads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id),
  UNIQUE(user_id, ebook_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_update_own" ON bookmarks;
CREATE POLICY "bookmarks_update_own" ON bookmarks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id),
  UNIQUE(user_id, ebook_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_update_own" ON likes;
CREATE POLICY "likes_update_own" ON likes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS comments_document_idx ON comments(document_id);
CREATE INDEX IF NOT EXISTS comments_ebook_idx ON comments(ebook_id);

DROP POLICY IF EXISTS "comments_select_approved" ON comments;
CREATE POLICY "comments_select_approved" ON comments FOR SELECT
  TO anon, authenticated USING (
    is_approved = true
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own_or_admin" ON comments;
CREATE POLICY "comments_delete_own_or_admin" ON comments FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','pending')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_admin" ON subscriptions;
CREATE POLICY "subscriptions_update_admin" ON subscriptions FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "subscriptions_delete_admin" ON subscriptions;
CREATE POLICY "subscriptions_delete_admin" ON subscriptions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pro','premium')),
  amount numeric(10,2) NOT NULL,
  upi_transaction_id text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
CREATE POLICY "payments_select_own_or_admin" ON payments FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
CREATE POLICY "payments_delete_admin" ON payments FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- CREATORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bio text DEFAULT '',
  website text DEFAULT '',
  total_uploads integer NOT NULL DEFAULT 0,
  total_downloads integer NOT NULL DEFAULT 0,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creators_select_all" ON creators;
CREATE POLICY "creators_select_all" ON creators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creators_insert_own" ON creators;
CREATE POLICY "creators_insert_own" ON creators FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creators_update_own_or_admin" ON creators;
CREATE POLICY "creators_update_own_or_admin" ON creators FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "creators_delete_admin" ON creators;
CREATE POLICY "creators_delete_admin" ON creators FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_admin" ON reports;
CREATE POLICY "reports_select_admin" ON reports FOR SELECT
  TO authenticated USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "reports_insert_auth" ON reports;
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "reports_delete_admin" ON reports;
CREATE POLICY "reports_delete_admin" ON reports FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','upload','subscription','approval')),
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, is_read);

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all" ON settings;
CREATE POLICY "settings_select_all" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "settings_delete_admin" ON settings;
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- READING PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 1,
  total_pages integer NOT NULL DEFAULT 1,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_progress_select_own" ON reading_progress;
CREATE POLICY "reading_progress_select_own" ON reading_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_insert_own" ON reading_progress;
CREATE POLICY "reading_progress_insert_own" ON reading_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_update_own" ON reading_progress;
CREATE POLICY "reading_progress_update_own" ON reading_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_delete_own" ON reading_progress;
CREATE POLICY "reading_progress_delete_own" ON reading_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SEED: DEFAULT CATEGORIES
-- ============================================================
INSERT INTO categories (name, name_hi, slug, icon, color, sort_order) VALUES
  ('Nursing Notes', 'नर्सिंग नोट्स', 'nursing-notes', 'Heart', '#EC4899', 1),
  ('Community Health Nursing', 'सामुदायिक स्वास्थ्य नर्सिंग', 'community-health-nursing', 'Users', '#8B5CF6', 2),
  ('B.Sc Nursing', 'बी.एससी नर्सिंग', 'bsc-nursing', 'GraduationCap', '#6366F1', 3),
  ('GNM', 'जीएनएम', 'gnm', 'Stethoscope', '#3B82F6', 4),
  ('ANM', 'एएनएम', 'anm', 'Activity', '#0EA5E9', 5),
  ('Medical Notes', 'मेडिकल नोट्स', 'medical-notes', 'BookMedical', '#14B8A6', 6),
  ('Research Papers', 'शोध पत्र', 'research-papers', 'Search', '#22C55E', 7),
  ('Assignments', 'असाइनमेंट', 'assignments', 'ClipboardList', '#EAB308', 8),
  ('Case Studies', 'केस स्टडी', 'case-studies', 'BarChart2', '#F97316', 9),
  ('Previous Year Papers', 'पिछले वर्ष के पेपर', 'previous-year-papers', 'FileText', '#EF4444', 10),
  ('Competitive Exams', 'प्रतियोगी परीक्षाएं', 'competitive-exams', 'Award', '#DC2626', 11),
  ('Government Jobs', 'सरकारी नौकरियां', 'government-jobs', 'Building2', '#9333EA', 12),
  ('School Notes', 'स्कूल नोट्स', 'school-notes', 'School', '#7C3AED', 13),
  ('College Notes', 'कॉलेज नोट्स', 'college-notes', 'BookOpen', '#2563EB', 14),
  ('Technology', 'टेक्नोलॉजी', 'technology', 'Monitor', '#0891B2', 15),
  ('Business', 'व्यापार', 'business', 'Briefcase', '#059669', 16),
  ('E-Books', 'ई-बुक्स', 'ebooks', 'Book', '#D97706', 17)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: DEFAULT SETTINGS
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
  ('upi_id', '9406970754@upi', 'UPI payment ID'),
  ('pro_price', '99', 'Pro plan price in INR'),
  ('premium_price', '199', 'Premium plan price in INR'),
  ('free_downloads_per_day', '5', 'Free plan daily download limit'),
  ('site_name', 'Knowlix', 'Platform name'),
  ('site_tagline', 'Knowledge Without Limits', 'Platform tagline'),
  ('maintenance_mode', 'false', 'Site maintenance mode'),
  ('allow_registration', 'true', 'Allow new user registration'),
  ('auto_approve_uploads', 'false', 'Auto approve uploaded content')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: ADMIN USER
-- ============================================================
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'ankitfreelancehub@gmail.com';

  IF admin_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      role, aud, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'ankitfreelancehub@gmail.com',
      crypt('Admin@123', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      now(),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"full_name":"Ankit Sharma"}'::jsonb,
      '', '',
      false
    ) RETURNING id INTO admin_id;
  END IF;

  -- Upsert admin profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (admin_id, 'ankitfreelancehub@gmail.com', 'Ankit Sharma', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Ankit Sharma';
END $$;
