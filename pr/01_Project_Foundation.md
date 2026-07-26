# BK STORE — 01. Project Foundation

## 1. Project Overview

**Project Name:** BK Store
**Project Type:** Client / Startup
**Platform:** Web Application (Responsive)
**Category:** Modern Premium eCommerce Platform

BK Store is a scalable, category-agnostic eCommerce platform built for a premium direct-to-consumer brand experience. The platform is intentionally designed to be product-agnostic: the data model, storefront, and admin panel must support any product catalog (apparel, electronics, home goods, accessories, etc.) without structural changes. Product categories, attributes, and variant structures are fully configurable through the admin panel rather than hard-coded.

The system consists of three surfaces:
1. **Public Storefront** — browsing, search, cart, checkout, account management.
2. **Customer Dashboard** — authenticated self-service area for orders, wishlist, addresses, profile.
3. **Admin Panel** — enterprise-grade back office for catalog, orders, marketing, content, and system configuration.

## 2. Vision

To deliver a premium, trustworthy, and frictionless online shopping experience that feels boutique and luxury-grade regardless of the product category being sold, backed by an admin system powerful enough to run the entire business without engineering intervention for day-to-day operations.

## 3. Objectives

- Launch a production-ready, scalable eCommerce web application.
- Support any product category through a fully generic catalog schema (products, categories, brands, variants, attributes).
- Provide a luxury/minimal visual identity consistent across every page.
- Give the business team full operational control (products, orders, pricing, promotions, content, SEO) via the admin panel.
- Ensure the platform is secure, performant, accessible, and SEO-ready from day one.
- Design the schema and architecture so new features (subscriptions, marketplaces, multi-currency, POS) can be added later without a rebuild.

## 4. Business Goals

- Maximize conversion rate through a frictionless browse → cart → checkout flow.
- Reduce cart abandonment via guest checkout, saved addresses, and clear shipping/tax visibility.
- Increase average order value (AOV) through related products, bundles, and coupons.
- Build repeat-purchase behavior through wishlists, order history, and email/notification touchpoints.
- Provide the business with real-time visibility into sales, inventory, and customer behavior via analytics and reports.
- Keep operating costs low by using a managed backend (Supabase) and serverless hosting (Vercel).

## 5. Functional Requirements

### 5.1 Storefront
- Browse products by category, brand, collection, and search.
- Filter by price, category, brand, attributes (size/color/etc.), rating, and availability.
- Sort by price, newest, popularity, rating.
- Product detail page with variant selection, image gallery, stock status, reviews.
- Wishlist (persisted for logged-in users, session-based for guests with merge-on-login).
- Cart (persisted across sessions, merges guest cart into account on login).
- Multi-step checkout: shipping info → shipping method → payment → review → confirmation.
- Guest checkout and authenticated checkout.
- Coupon code application at cart/checkout.
- Order confirmation page and confirmation email.
- Newsletter signup.
- Static/informational pages (About, Contact, FAQ, policies).

### 5.2 Authentication
- Register, login, logout.
- Forgot password / reset password via emailed token link.
- Email verification (optional, configurable).
- Session persistence via Supabase Auth (JWT + refresh token).
- Social login extensibility (Google/Apple) reserved in architecture, not required at launch.

### 5.3 Customer Dashboard
- Dashboard summary (recent orders, account status, wishlist count).
- Order list + order detail with status timeline and tracking info.
- Wishlist management.
- Address book (add/edit/delete/set default, shipping & billing).
- Profile management (name, email, phone, avatar).
- Change password.
- Notification preferences and notification inbox.
- Submit and view product reviews.

### 5.4 Admin Panel
- Dashboard with KPIs (revenue, orders, customers, low stock alerts).
- Product management (CRUD, variants, images, SEO metadata, status).
- Category management (nested/hierarchical, drag-reorder, visibility).
- Brand management.
- Banner/promotional content management with scheduling.
- Inventory management (stock levels, thresholds, adjustments, audit trail).
- Order management (status transitions, refunds, fulfillment, invoices).
- Customer management (profiles, order history, notes, block/unblock).
- Review moderation (approve/reject/reply).
- Coupon management (fixed/percentage, usage limits, expiry).
- Discount campaigns (scheduled sales, category/product-wide discounts).
- Shipping method configuration (flat rate, free threshold, zone-based).
- Payment settings (provider keys, enabled methods, test/live mode).
- Tax settings (rate rules by region, tax-inclusive/exclusive pricing).
- Notification settings (email/SMS templates, triggers).
- Media library (centralized asset management backed by Supabase Storage).
- SEO management (meta titles/descriptions, sitemaps, redirects).
- Website/store settings (branding, contact info, social links, currency, locale).
- Reports (sales, inventory, customer, coupon performance).
- Analytics dashboards (traffic-to-conversion funnel, top products).
- Roles & permissions (RBAC configuration for admin users).
- Audit logs (who changed what, when).
- Backup & restore documentation/process.

## 6. Non-Functional Requirements

- **Performance:** Largest Contentful Paint < 2.5s on 4G; product listing pages paginated/virtualized.
- **Scalability:** Database and API designed to scale horizontally via Supabase/Postgres; stateless frontend deployable on Vercel edge/CDN.
- **Security:** Row Level Security (RLS) on all tables; least-privilege service roles; input validation via Zod on client and server.
- **Availability:** Target 99.9% uptime; graceful degradation if non-critical services (e.g., recommendations) fail.
- **Accessibility:** WCAG 2.1 AA compliance across storefront and dashboard.
- **SEO:** Server-rendered or pre-rendered meta tags, sitemap.xml, robots.txt, structured data (Product, BreadcrumbList, Organization schema).
- **Maintainability:** Strict TypeScript, modular folder structure, documented API contracts.
- **Internationalization-ready:** Currency and locale fields reserved in schema even if single-locale at launch.

## 7. User Roles

| Role | Description | Access |
|---|---|---|
| **Guest** | Unauthenticated visitor | Browse, search, add to cart/wishlist (session-based), guest checkout |
| **Customer** | Authenticated shopper | All guest capabilities + dashboard, saved addresses, order history, reviews |
| **Administrator** | Staff/business operator | Full or scoped access to admin panel per RBAC role/permission set |

Administrator is further subdivided by **Roles & Permissions** in the admin panel (e.g., Super Admin, Store Manager, Support Agent, Content Editor) — see `03_Technical_Architecture.md` for the RBAC model.

## 8. Complete Page List

### Public Website
1. Home
2. Shop (product listing / category listing)
3. Product Details
4. Categories (category landing/index)
5. Search Results
6. Wishlist
7. Cart
8. Checkout
9. Order Success
10. Login
11. Register
12. Forgot Password
13. Reset Password
14. About
15. Contact
16. FAQ
17. Privacy Policy
18. Terms & Conditions
19. Shipping Policy
20. Return Policy
21. 404 Not Found

### Customer Dashboard
1. Dashboard (overview)
2. Orders (list)
3. Order Details
4. Wishlist
5. Addresses
6. Profile
7. Change Password
8. Notifications
9. Reviews (my reviews)

### Admin Panel
1. Dashboard
2. Products (list/create/edit)
3. Categories
4. Brands
5. Banners
6. Inventory
7. Orders (list/detail)
8. Customers
9. Reviews
10. Coupons
11. Discount Campaigns
12. Shipping Methods
13. Payment Settings
14. Tax Settings
15. Notifications
16. Media Library
17. SEO Management
18. Website Settings
19. Store Settings
20. Reports
21. Analytics
22. Roles & Permissions
23. Audit Logs
24. Backup & Restore (documentation/settings)

## 9. Features (Master List)

Search, Filters, Sorting, Pagination, Wishlist, Shopping Cart, Checkout, Coupon System, Product Variants, Stock Management, Inventory Alerts, Reviews & Ratings, Recently Viewed, Featured Products, Best Sellers, New Arrivals, Related Products, Newsletter, Promotional Banners, SEO, Responsive Design, Accessibility, Performance Optimization, Image Optimization, Lazy Loading, Skeleton Loaders, Error States, Empty States, Loading States, Guest Checkout, Order Tracking, Multi-Address Support, RBAC Admin Access, Audit Logging, Media Library, Analytics Dashboards.

## 10. Modules

| Module | Responsibility |
|---|---|
| Catalog | Products, categories, brands, variants, attributes, media |
| Inventory | Stock levels, thresholds, adjustments |
| Pricing & Promotions | Base pricing, discount campaigns, coupons |
| Cart & Checkout | Cart state, shipping, tax, payment orchestration |
| Orders & Fulfillment | Order lifecycle, invoices, refunds |
| Customers | Accounts, addresses, profiles |
| Reviews | Product reviews & ratings, moderation |
| Marketing | Banners, newsletter, campaigns |
| Content & SEO | Static pages, meta management, sitemap |
| Notifications | Email/SMS triggers and templates |
| Admin & Access | RBAC, audit logs, settings |
| Reporting | Sales, inventory, customer, coupon reports |

## 11. Navigation (High-Level)

### Public Website Navigation Tree
```
Home
├── Shop
│   ├── Category → Product List
│   └── Product Details
├── Search
├── Wishlist
├── Cart
├── Checkout
│   └── Order Success
├── Account
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   └── Reset Password
└── Info
    ├── About
    ├── Contact
    ├── FAQ
    ├── Privacy Policy
    ├── Terms & Conditions
    ├── Shipping Policy
    └── Return Policy
```

### Customer Dashboard Navigation Tree
```
Dashboard
├── Orders
│   └── Order Details
├── Wishlist
├── Addresses
├── Profile
│   └── Change Password
├── Notifications
└── Reviews
```

### Admin Panel Navigation Tree
```
Dashboard
├── Catalog
│   ├── Products
│   ├── Categories
│   └── Brands
├── Marketing
│   ├── Banners
│   ├── Coupons
│   └── Discount Campaigns
├── Sales
│   ├── Orders
│   ├── Customers
│   └── Reviews
├── Inventory
├── Configuration
│   ├── Shipping Methods
│   ├── Payment Settings
│   ├── Tax Settings
│   ├── Notifications
│   ├── Store Settings
│   └── Website Settings
├── Content
│   ├── Media Library
│   └── SEO Management
├── Insights
│   ├── Reports
│   └── Analytics
└── System
    ├── Roles & Permissions
    ├── Audit Logs
    └── Backup & Restore
```

## 12. Business Rules

- **SKU uniqueness:** Every product variant must have a globally unique SKU.
- **Inventory validation:** An order line cannot exceed available stock at the time of checkout; stock is decremented on order confirmation (not on cart add).
- **Soft deletes:** Products, categories, brands, and customers are never hard-deleted; a `deleted_at` timestamp hides them from active queries while preserving referential integrity for historical orders.
- **Coupon validation:** Coupons validate against expiry date, usage limit (global and per-customer), minimum order value, and applicable scope (product/category/store-wide) before being applied.
- **Banner scheduling:** Banners have `start_at`/`end_at` timestamps; only active, in-window, published banners render on the storefront.
- **Product visibility:** A product is publicly visible only if `status = 'published'`, `deleted_at IS NULL`, and it has at least one in-stock, active variant (configurable).
- **Category restrictions:** A product must belong to at least one active category; categories can be nested up to a configurable max depth (default 3).
- **Order lifecycle:** `pending → confirmed → processing → shipped → delivered`, with `cancelled` and `refunded` as terminal branch states reachable from earlier states per configured rules.
- **Refund workflow:** Refunds must reference an existing order/order item, require an admin-entered reason, and update inventory only if the item is marked returned-to-stock.
- **Customer permissions:** Customers may only read/modify their own orders, addresses, wishlist, and reviews; enforced via Row Level Security, not just UI logic.
- **Review eligibility:** A customer may review a product only after a delivered order containing that product (configurable to allow open reviews if desired).
- **Audit logging:** All admin mutations to products, orders, pricing, and settings are recorded in the audit log with actor, timestamp, before/after diff.

## 13. Customer Flow (Narrative)

1. Guest lands on Home → browses Shop or searches.
2. Views Product Details → selects variant → Adds to Cart or Wishlist.
3. Proceeds to Cart → reviews items, applies coupon.
4. Proceeds to Checkout → enters/select shipping address → selects shipping method → enters payment → reviews order.
5. Places order → redirected to Order Success → receives confirmation email.
6. If not logged in, prompted to create an account post-purchase (optional) to track the order.
7. Returns later via Login → Customer Dashboard → tracks order status, leaves a review once delivered.

## 14. Admin Flow (Narrative)

1. Admin logs in → lands on Dashboard with KPI snapshot and alerts (low stock, pending orders).
2. Adds/updates a Product → sets category/brand/attributes/variants/images/SEO → publishes.
3. Configures a Discount Campaign or Coupon tied to the new product/category.
4. Monitors incoming Orders → transitions status as fulfillment progresses → issues a refund if needed.
5. Reviews and moderates incoming product Reviews.
6. Checks Reports/Analytics weekly to inform restocking and marketing decisions.
7. Manages staff access via Roles & Permissions; reviews Audit Logs for accountability.

## 15. Validation Rules (Summary)

- All form inputs validated client-side with Zod schemas mirrored server-side (never trust the client).
- Email fields: RFC-compliant format validation.
- Passwords: minimum 8 characters, at least one letter and one number (configurable policy, see `03_Technical_Architecture.md`).
- Phone numbers: E.164 format where collected.
- Prices/quantities: non-negative, numeric, currency-aware rounding.
- SKUs: alphanumeric + hyphen, unique constraint enforced at the database level.
- Coupon codes: case-insensitive uniqueness, alphanumeric.
- File uploads: type and size restrictions enforced both client-side and via Supabase Storage policies.

## 16. Success Criteria

- Storefront fully functional end-to-end: browse → cart → checkout → order confirmation.
- Admin panel allows complete store operation without direct database access.
- All pages responsive across desktop, laptop, tablet, and mobile breakpoints.
- Core Web Vitals pass on representative pages (Home, PLP, PDP).
- Zero critical accessibility violations (axe-core clean on key pages).
- RLS policies verified to prevent cross-customer data access.
- Admin actions are fully auditable.

## 17. Future Scalability

- Multi-currency and multi-language support (schema fields reserved).
- Multi-vendor/marketplace mode (vendor ownership fields reserved on products).
- Subscription/recurring order support.
- POS / in-store integration using the same product and inventory tables.
- Mobile app consuming the same Supabase backend.
- Advanced search (e.g., vector/semantic search) layered on top of existing product data.
- Loyalty/rewards program using the existing customer and order tables.
