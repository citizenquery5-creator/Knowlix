/*
# Fix uploader relationship to profiles table

## Issue
The documents and ebooks tables have uploader_id that references auth.users,
but PostgREST cannot automatically join with auth.users (it's a protected schema).
The frontend code tries to join uploader:profiles which fails because there's
no FK relationship.

## Solution
Add foreign key constraints from uploader_id -> profiles.id (which is the same as auth.users.id)
This allows PostgREST to do the join properly.
*/

-- ============================================================
-- FIX DOCUMENTS TABLE - Add FK to profiles for uploader
-- ============================================================

-- First check if the constraint already exists, then add if not
DO $$
BEGIN
  -- Drop any existing FK to auth.users if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_uploader_id_fkey' 
    AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_uploader_id_fkey;
  END IF;
END $$;

-- Add FK to profiles table
ALTER TABLE documents 
ADD CONSTRAINT documents_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX EBOOKS TABLE - Add FK to profiles for uploader  
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ebooks_uploader_id_fkey' 
    AND table_name = 'ebooks'
  ) THEN
    ALTER TABLE ebooks DROP CONSTRAINT ebooks_uploader_id_fkey;
  END IF;
END $$;

ALTER TABLE ebooks 
ADD CONSTRAINT ebooks_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX DOWNLOADS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'downloads_user_id_fkey' 
    AND table_name = 'downloads'
  ) THEN
    ALTER TABLE downloads DROP CONSTRAINT downloads_user_id_fkey;
  END IF;
END $$;

ALTER TABLE downloads 
ADD CONSTRAINT downloads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX BOOKMARKS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookmarks_user_id_fkey' 
    AND table_name = 'bookmarks'
  ) THEN
    ALTER TABLE bookmarks DROP CONSTRAINT bookmarks_user_id_fkey;
  END IF;
END $$;

ALTER TABLE bookmarks 
ADD CONSTRAINT bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX LIKES TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_user_id_fkey' 
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE likes DROP CONSTRAINT likes_user_id_fkey;
  END IF;
END $$;

ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX COMMENTS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_user_id_fkey' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;
  END IF;
END $$;

ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX SUBSCRIPTIONS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_user_id_fkey' 
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
  END IF;
END $$;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX PAYMENTS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_user_id_fkey' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_user_id_fkey;
  END IF;
END $$;

ALTER TABLE payments 
ADD CONSTRAINT payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX NOTIFICATIONS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey' 
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
  END IF;
END $$;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX REPORTS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reports_reporter_id_fkey' 
    AND table_name = 'reports'
  ) THEN
    ALTER TABLE reports DROP CONSTRAINT reports_reporter_id_fkey;
  END IF;
END $$;

ALTER TABLE reports 
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX CREATORS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'creators_user_id_fkey' 
    AND table_name = 'creators'
  ) THEN
    ALTER TABLE creators DROP CONSTRAINT creators_user_id_fkey;
  END IF;
END $$;

ALTER TABLE creators 
ADD CONSTRAINT creators_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX READING_PROGRESS TABLE - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reading_progress_user_id_fkey' 
    AND table_name = 'reading_progress'
  ) THEN
    ALTER TABLE reading_progress DROP CONSTRAINT reading_progress_user_id_fkey;
  END IF;
END $$;

ALTER TABLE reading_progress 
ADD CONSTRAINT reading_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- FIX PAYMENTS reviewed_by - Add FK to profiles
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_reviewed_by_fkey' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_reviewed_by_fkey;
  END IF;
END $$;

ALTER TABLE payments 
ADD CONSTRAINT payments_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;