# BK Store — Premium eCommerce Platform

A production-ready, scalable eCommerce web application built with **React + TypeScript + Vite**, backed by **Supabase** (Postgres, Auth, Storage, Edge Functions). Designed per a three-part PRD: a luxury-minimal storefront, a customer self-service dashboard, and an enterprise-grade admin panel.

## Tech Stack

| Concern | Choice |
|---|---|
| Build tool | Vite |
| Routing | React Router |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| UI Kit | shadcn/ui + Tailwind CSS |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Charts | Recharts |
| Motion | Framer Motion |
| Icons | Lucide React |

## Project Structure

```
bk-store/
├── src/
│   ├── app/                  # App shell: router, providers, layouts, guards
│   ├── features/             # Feature-sliced modules
│   │   ├── catalog/          # Products, categories, brands (API hooks)
│   │   ├── storefront/       # Public storefront pages
│   │   ├── dashboard/        # Customer dashboard pages
│   │   └── admin/            # Admin panel pages
│   ├── components/           # Shared UI components (shadcn-based)
│   ├── lib/                  # Supabase client, utils, validation, cart stores
│   ├── types/                # Database types
│   └── styles/               # Tailwind config, global CSS
├── supabase.sql              # Full database schema (DDL + RLS + triggers + seed)
├── .env.local.example        # Credentials template
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your environment
Copy the credentials template and fill in your Supabase keys:
```bash
cp .env.local.example .env.local
```
Open `.env.local` and paste your values:
- `VITE_SUPABASE_URL` — from Supabase → Project Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` — from Supabase → Project Settings → API → anon public key

### 3. Set up the database
Run the full schema in your Supabase project:
- **Option A (SQL Editor):** Open the Supabase SQL Editor, paste the contents of `supabase.sql`, and run it.
- **Option B (CLI):** `supabase db push` (if using the Supabase CLI with a linked project)

This creates all tables, RLS policies, triggers, RPC functions, storage buckets, and seed data (admin roles, permissions, shipping methods, sample categories/brands).

### 4. Create an admin user
After running the schema, to access the admin panel:
1. Register a user via the `/register` page (this creates an `auth.users` + `profiles` row).
2. In the Supabase SQL Editor, insert an admin row linking that user to a role:
   ```sql
   insert into public.admin_users (id, role_id, display_name)
   select '<your-auth-user-id>', '00000000-0000-0000-0000-000000000001', 'Super Admin'
   where not exists (select 1 from public.admin_users where id = '<your-auth-user-id>');
   ```
3. Sign out and back in — you'll now have access to `/admin`.

### 5. Run the dev server
```bash
npm run dev
```
Visit `http://localhost:5173`.

### 6. Build for production
```bash
npm run build
```
Output is in `dist/`, deployable to Vercel or any static host.

## Surfaces

### Storefront (`/`)
Home, Shop, Product Details, Categories, Search, Wishlist, Cart, Checkout, Order Success, Login, Register, Forgot/Reset Password, and static pages (About, Contact, FAQ, Policies).

### Customer Dashboard (`/account`)
Dashboard overview, Orders + Order Detail, Wishlist, Addresses, Profile, Change Password, Notifications, My Reviews. (Protected by `RequireAuth`.)

### Admin Panel (`/admin`)
Dashboard with KPIs + charts, Products, Categories, Brands, Banners, Orders, Customers, Reviews, Coupons, Campaigns, Inventory, Shipping, Payments, Tax, Notifications, Media, SEO, Store Settings, Website Settings, Reports, Analytics, Roles & Permissions, Audit Logs, Backup & Restore. (Protected by `RequireAdmin`.)

## Database

The complete schema lives in [`supabase.sql`](./supabase.sql). It includes:
- **30+ tables** across Identity, Catalog, Inventory, Commerce, Marketing, Engagement, Operations, and Admin/System modules.
- **Row Level Security (RLS)** on every table — no default-open access.
- **Triggers** for `updated_at` timestamps, product search documents, inventory audit, rating recomputation, and auto-profile creation on signup.
- **RPC functions:** `place_order` (transactional checkout), `validate_coupon`, `merge_guest_cart`, `has_permission`, `is_admin`.
- **Storage buckets:** product-images, banner-images, avatars, invoices.
- **Seed data:** 4 admin roles, 21 permissions, role-permission mappings, notification templates, shipping methods, tax rules, sample categories and brands.

## Security

- RLS on all tables; least-privilege anon/authenticated roles.
- The `service_role` key is **never** shipped to the client — it's used only in Edge Functions.
- Zod validation on all forms (client) mirrored by Postgres constraints (server).
- Password policy: min 8 chars, at least one letter and one number.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run lint` | Run ESLint |
