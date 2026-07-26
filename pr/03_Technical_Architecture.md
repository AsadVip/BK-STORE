# BK STORE — 03. Technical Architecture

## 1. Overall Architecture

BK Store is a **Jamstack-style SPA** built with React + TypeScript + Vite, communicating directly with **Supabase** (Postgres, Auth, Storage, Edge Functions) via its auto-generated REST/RPC API and client SDK. There is no bespoke Node/Express backend — business logic that must run server-side (e.g., payment webhook handling, order total recalculation, sending emails) lives in **Supabase Edge Functions** (Deno runtime).

```
┌────────────────────────┐        ┌──────────────────────────┐
│   React SPA (Vite)     │  HTTPS │        Supabase           │
│  - React Router        │◄──────►│  - PostgREST (auto API)  │
│  - TanStack Query      │        │  - Auth (GoTrue)         │
│  - Zod + RHF forms     │        │  - Storage               │
│  - shadcn/ui + Tailwind│        │  - Edge Functions (Deno) │
└──────────┬─────────────┘        │  - Realtime (optional)   │
           │                      └───────────┬──────────────┘
           │ Static hosting                   │
           ▼                                  ▼
        Vercel CDN                      PostgreSQL (RLS-secured)
                                          + Scheduled Jobs (pg_cron)
```

Payment provider (e.g., Stripe) webhooks post to a Supabase Edge Function, which verifies the signature, updates order/payment records, and triggers notification jobs.

## 2. Folder Structure

```
bk-store/
├── src/
│   ├── app/                     # App shell: router, providers, layout
│   │   ├── routes/              # Route definitions per surface
│   │   │   ├── storefront/
│   │   │   ├── dashboard/
│   │   │   └── admin/
│   │   └── providers/           # QueryClientProvider, AuthProvider, ThemeProvider
│   ├── features/                # Feature-sliced modules
│   │   ├── catalog/             # products, categories, brands
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── reviews/
│   │   ├── marketing/           # banners, coupons, campaigns
│   │   ├── notifications/
│   │   └── admin-settings/
│   ├── components/              # Shared/dumb UI components (shadcn/ui wrappers)
│   ├── lib/
│   │   ├── supabase/            # client init, typed helpers
│   │   ├── validation/           # Zod schemas shared across forms
│   │   └── utils/
│   ├── hooks/                   # Shared React hooks
│   ├── types/                   # Generated Supabase types + domain types
│   └── styles/                  # Tailwind config, global CSS
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── functions/                # Edge Functions (payments, emails, cron jobs)
│   └── seed.sql
├── public/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

Each `features/*` module follows the same internal shape: `api/` (query/mutation hooks), `components/`, `schemas/` (Zod), `types.ts`.

## 3. State Management Strategy

- **Server state:** TanStack Query exclusively — all Supabase reads/writes go through query/mutation hooks with defined query keys per feature, cache invalidation on mutation success.
- **Client/UI state:** Local component state (`useState`/`useReducer`) for ephemeral UI; React Context only for cross-cutting concerns (Auth session, Cart, Theme) that must be globally accessible.
- **Cart state:** Hybrid — cart lives in a Postgres `carts`/`cart_items` table for authenticated users (synced via TanStack Query) and in local storage (via a Zustand-lite context, not raw `localStorage` reads scattered around) for guests, merged into the DB cart on login.
- **Form state:** React Hook Form + Zod resolver for every form; no ad-hoc controlled-input state.

## 4. Tech Stack Decisions & Rationale

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | Vite | Fast dev server/HMR, simpler config than webpack for an SPA |
| Routing | React Router | Mature, flexible nested routing for 3 distinct surfaces |
| Data fetching | TanStack Query | Caching, background refetch, optimistic updates out of the box |
| Forms | React Hook Form + Zod | Minimal re-renders, shared validation schemas client/server |
| UI Kit | shadcn/ui + Tailwind | Fully customizable, no runtime CSS-in-JS overhead, matches design tokens directly |
| Backend | Supabase | Managed Postgres + Auth + Storage; RLS gives per-row security without a custom API layer |
| Hosting | Vercel (frontend) + Supabase (backend) | Global CDN for static assets, managed infra for the database/auth layer |

## 5. Database Architecture

Full DDL is provided in `Supabase.sql` (embedded in `04_Development_Guide.md`). Summary of core entities:

- **Identity:** `profiles` (1:1 with `auth.users`), `addresses`.
- **Catalog:** `categories` (self-referencing for nesting), `brands`, `products`, `product_variants`, `product_attributes`, `product_attribute_values`, `product_images`.
- **Inventory:** `inventory_adjustments` (audit trail), stock columns on `product_variants`.
- **Commerce:** `carts`, `cart_items`, `orders`, `order_items`, `payments`, `refunds`.
- **Marketing:** `coupons`, `discount_campaigns`, `discount_campaign_targets`, `banners`.
- **Engagement:** `reviews`, `wishlists`, `wishlist_items`, `recently_viewed`.
- **Operations:** `shipping_methods`, `tax_rules`, `notifications`, `notification_templates`.
- **Admin/System:** `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users`, `audit_logs`, `media_assets`, `store_settings`, `seo_metadata`.

All primary keys are `uuid` (via `gen_random_uuid()`); all tables carry `created_at`, `updated_at` (trigger-maintained), and soft-deletable tables carry `deleted_at`.

## 6. API Architecture

BK Store relies primarily on **Supabase's auto-generated PostgREST API** accessed through the `@supabase/supabase-js` client, scoped by RLS policies rather than hand-written REST endpoints. Custom server logic is exposed via **Edge Functions** as narrow RPC-style endpoints. See `04_Development_Guide.md` and the "APIs" section below for concrete endpoint documentation.

### 6.1 Access Patterns
- Reads: `supabase.from('products').select(...)` with filters/joins, wrapped in typed query hooks.
- Writes: `supabase.from('orders').insert(...)` etc., wrapped in typed mutation hooks; server-side validation still occurs via Postgres constraints + RLS `WITH CHECK` clauses.
- Complex/atomic operations (e.g., "place order" which must validate stock, create order + order_items, decrement inventory, and create a payment intent) are implemented as **Postgres functions** called via `supabase.rpc('place_order', {...})`, executed transactionally.

### 6.2 Custom Endpoints (Edge Functions)

| Endpoint | Method | Purpose |
|---|---|---|
| `/functions/v1/checkout-create-intent` | POST | Creates a payment intent with the payment provider, returns client secret |
| `/functions/v1/checkout-webhook` | POST | Receives payment provider webhooks, verifies signature, finalizes order/payment status |
| `/functions/v1/send-email` | POST | Triggered internally (via DB webhook or RPC) to send transactional emails |
| `/functions/v1/coupon-validate` | POST | Server-side coupon validation before checkout submission |
| `/functions/v1/generate-invoice` | POST | Generates a PDF invoice for a completed order |

Each Edge Function validates its payload with a Zod schema (Deno-compatible), authenticates the caller via the Supabase JWT (except the webhook endpoint, which authenticates via provider signature), and returns a consistent `{ data, error }` envelope.

## 7. Authentication

- Supabase Auth (GoTrue) handles registration, login, password reset, and session/JWT issuance.
- Sessions stored as httpOnly-managed refresh tokens by the Supabase client SDK; access token (short-lived JWT) attached automatically to API calls.
- Email verification enabled via Supabase Auth email templates (configurable on/off per launch requirements).
- Password reset: user requests reset → Supabase emails a secure link with a one-time token → `Reset Password` page calls `supabase.auth.updateUser` after verifying the recovery session.
- Admin users authenticate through the **same** Supabase Auth system but are distinguished by a row in `admin_users` linked to `auth.users.id`; the storefront login and admin login are separate route/UI entry points against the same underlying identity provider.

## 8. Authorization (RBAC Model)

Two authorization layers work together:

1. **Application-level RBAC** for the Admin Panel:
   - `admin_roles` (e.g., Super Admin, Store Manager, Support Agent, Content Editor)
   - `admin_permissions` (granular, e.g., `products.write`, `orders.refund`, `settings.manage`)
   - `admin_role_permissions` (join table)
   - `admin_users.role_id` assigns a role to a staff account
   - UI hides/disables actions the current admin lacks permission for; every mutation is re-checked server-side via RLS/function-level checks — the UI check is a UX convenience, not the security boundary.

2. **Row Level Security (RLS)** at the database layer for both customer-facing and admin-facing tables:
   - Customers can only `SELECT`/`UPDATE` their own rows in `orders`, `addresses`, `wishlists`, `reviews`, etc. (matched via `auth.uid()`).
   - Admin-only tables (`admin_roles`, `audit_logs`, `store_settings`) are readable/writable only by rows where the requesting user exists in `admin_users` with the relevant permission, checked via a `has_permission(auth.uid(), 'permission.key')` SQL function used inside policies.
   - Guests (anonymous role) get read-only access to published catalog data (`products`, `categories`, `brands`) and insert-only access to `carts`/`cart_items` scoped to their session/device id.

## 9. Middleware

Because there is no custom Node server, "middleware" concerns are implemented as:
- **Route guards** in React Router (redirect unauthenticated users away from Dashboard/Admin routes; redirect non-admins away from `/admin/*`).
- **Postgres triggers** for cross-cutting DB concerns (timestamps, audit logging, inventory decrement).
- **Edge Function middleware** (a shared `withAuth`/`withValidation` wrapper) applied to every custom function for consistent auth checks, request validation, and error formatting.

## 10. Validation Strategy

- All forms define a single Zod schema per feature (e.g., `productSchema`, `checkoutAddressSchema`) shared between the React Hook Form resolver and, where applicable, the Edge Function that ultimately persists the data — avoiding drift between client and "server" validation.
- Database-level constraints (`CHECK`, `NOT NULL`, `UNIQUE`, foreign keys, enums) act as the final authority and are never relied upon to be the *only* validation layer (defense in depth).

## 11. Storage Strategy

- Supabase Storage buckets:
  - `product-images` (public read, admin write) — product/variant imagery.
  - `banner-images` (public read, admin write) — marketing banners.
  - `avatars` (public read, owner write) — customer/admin profile photos.
  - `invoices` (private, signed-URL read only) — generated PDF invoices.
- All uploads pass through client-side type/size validation, then a Storage RLS policy re-validates `mimetype`/size at the bucket level.
- Images are stored at original resolution with on-the-fly transformation via Supabase's image transformation API (resize/format) for responsive `<img>` `srcset` generation — avoiding multiple manually-generated derivative files.

## 12. File Upload Flow

1. Admin selects image(s) in the Product/Banner/Media Library form.
2. Client validates type (jpg/png/webp) and max size (e.g., 5MB) via Zod.
3. Client requests a signed upload path (or uploads directly using the authenticated Supabase client, since admin RLS permits it).
4. On success, the returned public URL/path is stored in `product_images`/`media_assets` along with alt text and display order.
5. Media Library lists all `media_assets` for reuse across products/banners without re-uploading.

## 13. Notification Architecture

- `notification_templates` table stores subject/body templates (email) per event type (order confirmed, order shipped, password reset, low stock alert, etc.), with placeholders resolved at send time.
- `notifications` table stores in-app notifications per user (for the Customer Dashboard "Notifications" page and Admin alerts).
- Triggering events (e.g., an order status update) call a Postgres function that (a) inserts an in-app `notifications` row and (b) invokes the `send-email` Edge Function asynchronously via `pg_net`/webhook for the corresponding transactional email.
- SMS is architecturally reserved (a `channel` column on `notifications`/`notification_templates`) but not required at launch.

## 14. Search Architecture

- Launch implementation: Postgres full-text search using a generated `tsvector` column on `products` (name, description, brand, category names via a materialized/denormalized search document), indexed with a GIN index, queried via `websearch_to_tsquery`.
- Combined with structured filters (category, brand, price range, attributes) applied as standard `WHERE` clauses alongside the full-text rank ordering.
- Reserved for future: swap to a dedicated search service (e.g., Meilisearch/Typesense/pgvector semantic search) behind the same query-hook interface without changing the UI layer.

## 15. Security

- **RLS everywhere:** every table has RLS enabled; no table is left with default-open access.
- **Least privilege:** the client uses the Supabase `anon`/authenticated JWT roles only; the `service_role` key is used exclusively inside Edge Functions, never shipped to the client.
- **Secrets:** payment provider secret keys, service role key, and email provider keys stored as Supabase/Vercel environment variables, never committed to source control.
- **Password policy:** minimum 8 characters, at least one letter and one number, enforced both client-side (Zod) and via Supabase Auth password strength settings.
- **Rate limiting:** Edge Functions apply basic rate limiting (per-IP/per-user) on sensitive endpoints (login, password reset, coupon validation) to mitigate brute force/abuse.
- **XSS protection:** React's default escaping + strict avoidance of `dangerouslySetInnerHTML` (used only for sanitized rich-text content, e.g., product descriptions, passed through a sanitizer such as DOMPurify).
- **CSRF protection:** Not applicable in the traditional cookie-session sense since auth uses bearer JWTs over HTTPS from a JS client; API calls require the JWT explicitly rather than relying on ambient cookies.
- **SQL injection prevention:** All queries go through PostgREST/parameterized RPC calls — no raw string-concatenated SQL is ever constructed from user input.
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` exposed to the client (safe, RLS-protected); `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `EMAIL_PROVIDER_API_KEY` restricted to server/Edge Function runtime only.

## 16. Performance

- Route-based code splitting (React Router lazy routes) so the Admin Panel bundle is never shipped to storefront visitors.
- Image optimization via Supabase's transformation API + responsive `srcset`/`sizes`.
- Lazy loading for below-the-fold images and carousels (`loading="lazy"`, IntersectionObserver-driven component mounting for heavy widgets like charts).
- TanStack Query caching + `staleTime` tuning to minimize redundant network calls (e.g., category list rarely changes, cached longer than order data).
- Skeleton loaders instead of layout-shifting spinners to protect Cumulative Layout Shift (CLS).
- Pagination/virtualization for large admin tables (orders, customers, products).

## 17. Deployment Strategy

- **Frontend:** Vercel, deployed from the `main` branch with preview deployments per pull request; environment variables configured per environment (Preview/Production).
- **Backend:** Supabase project per environment (recommended: separate `staging` and `production` Supabase projects) with migrations applied via the Supabase CLI (`supabase db push`) as part of the deploy pipeline.
- **Edge Functions:** deployed via `supabase functions deploy` in CI, versioned alongside the migrations they depend on.

## 18. Testing Strategy

- **Unit tests:** Vitest for utility functions, Zod schemas, and pure business logic (e.g., price/discount calculations).
- **Component tests:** React Testing Library for critical components (ProductCard, CartDrawer, CheckoutForm).
- **Integration tests:** Testing Query hooks against a local Supabase instance (via `supabase start`) seeded with fixture data.
- **End-to-end tests:** Playwright covering the critical paths — browse → cart → checkout → order confirmation; admin login → create product → verify storefront visibility.
- **Database tests:** `pgTAP` (optional) or SQL fixtures verifying RLS policies actually block cross-account access.

## 19. Monitoring

- Vercel Analytics/Speed Insights for Core Web Vitals in production.
- Supabase's built-in database and Auth logs/metrics dashboard for query performance and auth error rates.
- Application error tracking (e.g., Sentry) capturing unhandled frontend exceptions and Edge Function errors with release/version tagging.

## 20. Logging

- `audit_logs` table (application-level) for admin actions (who/what/when/before-after).
- Edge Function invocation logs retained via Supabase's function logs for debugging payment/webhook issues.
- Structured client-side error logging (breadcrumbs) sent to the error tracker on failed mutations, correlated with the request id returned by Supabase where available.

## 21. CI/CD Recommendations

- GitHub Actions pipeline:
  1. Lint + type-check (`tsc --noEmit`, ESLint).
  2. Unit + component tests (Vitest).
  3. Build (`vite build`).
  4. Apply Supabase migrations to a staging project on merge to `develop`.
  5. Run Playwright E2E suite against the staging deployment.
  6. Promote to production Supabase project + Vercel production deploy on merge to `main`, gated by a manual approval step.
- Database migrations are additive/backward-compatible where possible; destructive changes are shipped as multi-step migrations (add → backfill → switch reads → drop).
