-- ============================================================================
-- BK Store — Supabase Storage bucket for images
-- ============================================================================
-- Run this script in the Supabase SQL Editor (or `supabase db push`) to create
-- the `media` storage bucket and the Row-Level-Security (RLS) policies that
-- control who can read, upload, update, and delete image files.
--
-- The `media` bucket is referenced by the admin Media Library
-- (`supabase.storage.from("media")`) and stores all uploaded product images,
-- banner images, category/brand logos, and any other storefront assets.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create the storage bucket
-- ----------------------------------------------------------------------------
-- `public` = true  → files are readable by anyone with the public URL
--                    (no auth required to view images on the storefront).
-- `file_size_limit` = 5 MB keeps uploads reasonable for web images.
-- `allowed_mime_types` restricts uploads to common image formats.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'media',
    'media',
    true,
    5242880,                                  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Storage policies (Row Level Security on storage.objects)
-- ----------------------------------------------------------------------------
-- Supabase Storage uses RLS policies on the `storage.objects` table to
-- authorize operations. We grant:
--   • Public  SELECT  → anyone can view images (storefront).
--   • Admin    INSERT → only admins can upload new images.
--   • Admin    UPDATE → only admins can replace/modify images.
--   • Admin    DELETE → only admins can remove images.
--
-- The `public.is_admin()` function is defined in the main `supabase.sql`
-- schema and returns true when the current authenticated user holds an
-- admin role. If you run this file standalone, make sure `is_admin()` exists
-- first (see the main schema) or replace the check with your own logic.
-- ----------------------------------------------------------------------------

-- Public read access for all media files.
create policy "Public read media"
    on storage.objects for select
    using (bucket_id = 'media');

-- Admin-only upload (insert) of new media files.
create policy "Admin upload media"
    on storage.objects for insert
    with check (bucket_id = 'media' and public.is_admin());

-- Admin-only update of existing media files.
create policy "Admin update media"
    on storage.objects for update
    using (bucket_id = 'media' and public.is_admin());

-- Admin-only delete of media files.
create policy "Admin delete media"
    on storage.objects for delete
    using (bucket_id = 'media' and public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. (Optional) Helper: a folder structure convention
-- ----------------------------------------------------------------------------
-- Files are stored under descriptive sub-folders so the Media Library can
-- group them by purpose. The admin upload flow should use paths like:
--
--   media/products/<product-id>/<filename>
--   media/banners/<filename>
--   media/categories/<filename>
--   media/brands/<filename>
--   media/misc/<filename>
--
-- No SQL is required for folders — Supabase Storage creates them implicitly
-- from the file path on upload.
-- ----------------------------------------------------------------------------
