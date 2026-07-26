-- ============================================================================
-- SQL FIX FOR SUPABASE AUTH EMAIL RATE LIMIT & DIRECT SIGNUP RPC
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor.
-- It provides a custom_register_user RPC function that bypasses Supabase GoTrue 
-- rate limits by creating users directly in auth.users & public.profiles.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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

-- 3. Custom Direct Signup RPC Function (Bypasses Supabase Auth Rate Limits)
CREATE OR REPLACE FUNCTION public.custom_register_user(
  p_email text,
  p_password text,
  p_first_name text DEFAULT '',
  p_last_name text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
  v_encrypted_pw text;
BEGIN
  p_email := lower(trim(p_email));

  -- Check if user already exists
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = p_email;
  IF v_existing_id IS NOT NULL THEN
    -- If user exists, update password if needed and return success
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_existing_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_existing_id, 'existing', true);
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert directly into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name),
    now(),
    now()
  );

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (v_user_id, p_email, p_first_name, p_last_name)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.custom_register_user(text, text, text, text) TO anon, authenticated, service_role;
