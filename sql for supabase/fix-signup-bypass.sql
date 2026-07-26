-- ============================================================================
-- BULLETPROOF SIGNUP BYPASS – Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================
-- This script:
--   1. Auto-confirms all existing unconfirmed users
--   2. Fixes handle_new_user trigger so it never causes 500 errors
--   3. Creates custom_register_user() RPC that bypasses email rate limits
-- ============================================================================

-- ── 0. Ensure pgcrypto is available ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Auto-confirm all existing unconfirmed users ──
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ── 2. Fix handle_new_user trigger (never throw 500 on duplicate) ──
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
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    email      = EXCLUDED.email;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Drop old function if exists ──
DROP FUNCTION IF EXISTS public.custom_register_user(text, text, text, text);

-- ── 4. Create new bulletproof RPC ──
CREATE OR REPLACE FUNCTION public.custom_register_user(
  p_email     text,
  p_password  text,
  p_first_name text DEFAULT '',
  p_last_name  text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id      uuid;
  v_existing_id  uuid;
  v_encrypted_pw text;
BEGIN
  p_email := lower(trim(p_email));

  -- ── Hash the password with bcrypt ──
  BEGIN
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Password hashing failed: ' || SQLERRM);
    END;
  END;

  -- ── Check if user already exists ──
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = p_email LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- User already exists → update password & confirm email
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_existing_id;

    -- Upsert profile
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (v_existing_id, p_email, p_first_name, p_last_name)
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name  = EXCLUDED.last_name,
      email      = EXCLUDED.email;

    RETURN jsonb_build_object('success', true, 'user_id', v_existing_id, 'existing', true);
  END IF;

  -- ── New user: clean up any orphaned profile rows with same email ──
  DELETE FROM public.profiles
  WHERE lower(email) = p_email
    AND id NOT IN (SELECT id FROM auth.users);

  v_user_id := gen_random_uuid();

  -- ── Insert into auth.users with ALL required columns ──
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
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
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
    false,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- ── Insert identity row (required for signInWithPassword to work) ──
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    p_email,
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- ── Insert profile ──
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (v_user_id, p_email, p_first_name, p_last_name)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    email      = EXCLUDED.email;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ── 5. Grant execute to all roles ──
GRANT EXECUTE ON FUNCTION public.custom_register_user(text, text, text, text) TO anon, authenticated, service_role;
