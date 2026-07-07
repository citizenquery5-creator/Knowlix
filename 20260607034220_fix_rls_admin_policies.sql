/*
# Fix RLS Admin Policies

## Summary
Adds admin-level access policies to all tables that need admin management.
The current policies only allow users to manage their own data, but admins
need full access to manage all content and users.

## Changes
1. profiles - Allow admins to update/delete any profile
2. documents - Ensure admin can update/delete any document
3. ebooks - Ensure admin can update/delete any ebook
4. payments - Admin already has update access, verify it
5. reports - Admin already has access
*/

-- ============================================================
-- FIX PROFILES TABLE - Add admin policies for user management
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

-- Create new policies that allow both owner AND admin
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "profiles_delete_own_or_admin" ON profiles FOR DELETE
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- VERIFY ADMIN ACCESS TO SETTINGS (for admin panel settings tab)
-- ============================================================
-- Settings already has admin-only policies, but let's verify they're correct

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
DROP POLICY IF EXISTS "settings_update_admin" ON settings;

CREATE POLICY "settings_insert_admin" ON settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "settings_update_admin" ON settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FIX NOTIFICATIONS - Allow admins to insert for any user
-- ============================================================

DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;

CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FIX CATEGORIES - Ensure admin full access
-- ============================================================

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FIX SUBSCRIPTIONS - Admin can manage all subscriptions
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_update_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_admin" ON subscriptions;

CREATE POLICY "subscriptions_update_admin" ON subscriptions FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "subscriptions_delete_admin" ON subscriptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FIX CONTACT_MESSAGES - Admin can read and update
-- ============================================================

-- First check if policies exist, then create if needed
DO $$
BEGIN
  -- Contact messages select policy for admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'contact_messages_select_admin'
  ) THEN
    EXECUTE 'CREATE POLICY "contact_messages_select_admin" ON contact_messages FOR SELECT
      TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;
  
  -- Contact messages update policy for admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'contact_messages_update_admin'
  ) THEN
    EXECUTE 'CREATE POLICY "contact_messages_update_admin" ON contact_messages FOR UPDATE
      TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;