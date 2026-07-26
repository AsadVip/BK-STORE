-- ============================================================================
-- SQL FIX FOR SUPABASE AUTH EMAIL RATE LIMIT & AUTO-CONFIRMATION
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to auto-confirm any users created 
-- during rate-limit testing and ensure profiles are synchronized automatically.

-- 1. Auto-confirm all unconfirmed users in auth.users table
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Ensure handle_new_user trigger correctly inserts & updates public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = CASE WHEN public.profiles.first_name IS NULL OR public.profiles.first_name = '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN public.profiles.last_name IS NULL OR public.profiles.last_name = '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    email = EXCLUDED.email;
  RETURN new;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
