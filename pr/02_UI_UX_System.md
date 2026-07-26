# BK STORE — 02. UI/UX System

## 1. Design Philosophy

BK Store's visual language is **Luxury Minimal**: generous white space, restrained color usage, refined serif headings paired with clean sans-serif body text, soft shadows instead of hard borders, and motion that is subtle rather than decorative. The interface should feel like a boutique flagship store, not a generic template — every category of product (from earbuds to furniture) should look equally premium within this system because the design language is abstracted from any single product type.

## 2. Color System

### 2.1 Palette Tokens

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0F0F10` | Primary dark background (storefront hero, footer, admin sidebar) |
| `--bg-secondary` | `#1B1B1D` | Secondary surface (cards, panels on dark backgrounds) |
| `--accent-brown` | `#6B4A3D` | Accent details, dividers, secondary emphasis |
| `--btn-primary` | `#8B5E4B` | Primary button fill |
| `--btn-primary-hover` | `#A46C56` | Primary button hover state |
| `--bg-light` | `#F4F1EC` | Light-mode surfaces, cards on light backgrounds |
| `--text-primary` | `#FFFFFF` | Primary text on dark backgrounds |
| `--text-secondary` | `#B6B6B6` | Secondary/muted text on dark backgrounds |
| `--state-success` | `#2E7D32` | Success messages, in-stock badges |
| `--state-danger` | `#C62828` | Errors, out-of-stock, destructive actions |
| `--state-warning` | `#FF9800` | Warnings, low-stock alerts |

On light surfaces (`--bg-light`), text uses a near-black (`#1A1A1A`) for primary and a mid-gray (`#5C5C5C`) for secondary — not defined in the source palette but derived to maintain AA contrast; document this as a design decision if implemented.

### 2.2 Usage Rules
- Dark background (`--bg-primary`) is the default canvas for hero sections, navigation, and footer.
- Product cards and content sections alternate between `--bg-secondary` (dark) and `--bg-light` sections to create visual rhythm without ever feeling cluttered.
- Accent brown is used sparingly — dividers, icon backgrounds, active nav underlines — never as a large fill.
- Primary buttons always use `--btn-primary` → `--btn-primary-hover` on interaction; secondary/ghost buttons use a 1px border in `--text-secondary` at low opacity.
- Status colors (success/danger/warning) are reserved exclusively for system feedback (badges, toasts, form validation) — never for decorative use.

## 3. Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| Headings (H1–H4) | Playfair Display | 500, 600, 700 | Hero titles, section headings, product name on PDP |
| Body / UI Text | Poppins | 300, 400, 500, 600 | Paragraphs, labels, buttons, nav, form fields |

### Type Scale (desktop)
- H1: 48px / 56px line-height, Playfair Display 600
- H2: 36px / 44px, Playfair Display 600
- H3: 28px / 36px, Playfair Display 500
- H4: 22px / 30px, Playfair Display 500
- Body Large: 18px / 28px, Poppins 400
- Body: 16px / 24px, Poppins 400
- Small: 14px / 20px, Poppins 400
- Caption/Label: 12px / 16px, Poppins 500, letter-spacing 0.04em, uppercase for eyebrow labels

Mobile scale reduces H1–H3 by roughly 20–25% while keeping body sizes constant for readability.

## 4. Iconography & Motion

- **Icons:** Lucide React exclusively, stroke width 1.5–2px, sized 16/20/24px depending on context (inline text, buttons, standalone).
- **Motion (Framer Motion):**
  - Page transitions: fade + slight vertical slide (200–300ms, ease-out).
  - Card hover: subtle scale (1.0 → 1.02) + shadow elevation increase, 150ms.
  - Modal/drawer: slide-in with backdrop fade, 250ms.
  - Skeleton shimmer for loading states rather than spinners where content shape is known.
  - Motion must respect `prefers-reduced-motion` — fall back to instant/opacity-only transitions.

## 5. Layout Rules & Grid System

- **Max content width:** 1440px, centered, with 24px (mobile) to 80px (desktop) horizontal gutters.
- **Grid:** 12-column grid on desktop/laptop, 8-column on tablet, 4-column on mobile — implemented via Tailwind's grid utilities.
- **Vertical rhythm:** Section spacing uses a consistent scale — 96px between major sections on desktop, 48px on mobile.
- **Corners:** Rounded corners standard at `rounded-2xl` (16px) for cards, `rounded-full` for buttons/pills and avatar images.
- **Shadows:** Soft, diffuse shadows only (`shadow-md`/`shadow-lg` with low opacity, no hard drop shadows) — reinforces the premium, floating-card feel.
- **Glass effects:** Reserved for overlays on top of hero imagery (e.g., sticky nav on scroll, promo banner overlays) — `backdrop-blur-md` with 60–70% background opacity.

## 6. Responsive Breakpoints

| Breakpoint | Width | Grid Columns |
|---|---|---|
| Mobile | < 640px | 4 |
| Tablet | 640–1024px | 8 |
| Laptop | 1024–1440px | 12 |
| Desktop | > 1440px | 12 (max-width container) |

All interactive targets maintain a minimum 44x44px touch target on mobile/tablet.

## 7. Accessibility

- Color contrast: all text/background combinations verified to meet WCAG AA (4.5:1 for body text, 3:1 for large text/headings).
- All interactive elements reachable and operable via keyboard; visible focus ring (2px, `--btn-primary`) on every focusable element.
- Semantic HTML (`<nav>`, `<main>`, `<button>`, `<form>`) with ARIA labels where native semantics are insufficient.
- Images require descriptive `alt` text; decorative images use `alt=""`.
- Forms: every input has an associated `<label>`; error messages linked via `aria-describedby`.
- Skip-to-content link present on every page.

## 8. Core Components (shadcn/ui based)

### 8.1 Buttons
- **Primary:** solid `--btn-primary` fill, white text, `rounded-full`, hover → `--btn-primary-hover`, subtle scale on press.
- **Secondary/Outline:** transparent fill, 1px border `--text-secondary` at 40% opacity, text `--text-primary`.
- **Ghost/Text:** no border/fill, underline on hover.
- **Destructive:** `--state-danger` fill, used only for delete/cancel confirmations.
- Sizes: `sm` (36px height), `md` (44px), `lg` (52px) — `lg` reserved for primary CTAs (Add to Cart, Place Order).

### 8.2 Cards (Product Card)
- Structure: image (1:1 or 4:5 ratio) → product name (Poppins 500, 16px) → price (Poppins 600) → optional rating/star row → quick "Add to Wishlist" icon overlay on hover.
- Background: `--bg-secondary` on dark sections, white/`--bg-light` on light sections.
- Corner radius `rounded-2xl`, soft shadow, hover elevates shadow and scales image 1.03 within a fixed-overflow container.
- Out-of-stock state: image desaturated 30%, "Out of Stock" badge (`--state-danger` background, white text) top-left.
- Sale state: "Sale" or "-X%" badge (`--btn-primary` background) top-left, original price shown struck-through next to sale price.

### 8.3 Tables (Admin)
- Sticky header row, zebra-free (relies on row hover highlight instead of alternating fill, consistent with minimal aesthetic).
- Row hover: subtle background tint.
- Row-level actions (edit/delete/view) right-aligned as icon buttons, revealed on hover on desktop, always visible on mobile.
- Bulk-select checkbox column when bulk actions are supported (e.g., bulk delete products).
- Pagination controls bottom-right; page-size selector bottom-left.
- Empty state: centered icon + message + primary CTA (e.g., "No products yet — Add your first product").

### 8.4 Forms
- Field groups: label (Poppins 500, 14px, `--text-secondary`) above input.
- Inputs: `rounded-xl`, 1px border, focus ring `--btn-primary`, 44px height minimum.
- Inline validation: error text in `--state-danger` below the field, error border on the input itself.
- Multi-step forms (checkout): horizontal stepper at top showing current step, completed steps checked, disabled future steps.

### 8.5 Modals & Drawers
- Modals: centered, `rounded-2xl`, max-width 480–640px depending on content, backdrop blur + dim.
- Drawers: cart drawer slides from the right on desktop, full-screen on mobile; used for Cart preview, Filter panel (mobile), and Notifications.

### 8.6 Badges & Tags
- Status badges (Order status, Stock status): pill-shaped, colored per status per the token table, 12px text, uppercase, letter-spacing.

## 9. Layout Specifications

### 9.1 Header (Storefront)
- Top utility bar (optional): shipping/promo message, currency/locale switcher (reserved for future).
- Main header: logo (left/center depending on breakpoint), primary nav (center on desktop), icons for Search / Wishlist / Cart / Account (right).
- Sticky on scroll with glass-blur background once user scrolls past hero.
- Mobile: hamburger menu opening a full-screen nav drawer.

### 9.2 Footer
- Four-column layout on desktop: Brand/About blurb + social icons, Shop links, Customer Service links (FAQ/Contact/Returns), Newsletter signup form.
- Bottom bar: copyright, payment method icons, legal links (Privacy/Terms).
- Background `--bg-primary`, text `--text-secondary`/`--text-primary`.

### 9.3 Sidebar (Admin & Customer Dashboard)
- Fixed-width (240–280px) collapsible sidebar on desktop, off-canvas drawer on mobile/tablet.
- Grouped nav items matching the navigation tree in `01_Project_Foundation.md` (Catalog, Marketing, Sales, etc. for Admin; flat list for Customer Dashboard).
- Active item indicated by accent-brown left border + `--bg-secondary` highlight.
- Collapsed state (icon-only) available on desktop for more workspace.

### 9.4 Product Card (Detailed)
Already specified in 8.2 — used consistently across Shop, Search Results, Related Products, Wishlist, and Recently Viewed sections.

### 9.5 Product Detail Layout
- Two-column desktop layout: left = image gallery (main image + thumbnail strip, zoom on hover), right = product info (name, price, rating summary, variant selectors, quantity stepper, Add to Cart + Add to Wishlist buttons, stock status, short description, accordion for Details/Shipping/Returns).
- Below the fold: full description, specifications table, customer reviews section (list + rating breakdown + "Write a Review" CTA), Related Products carousel.
- Mobile: single column, image gallery as a swipeable carousel, sticky "Add to Cart" bar pinned to bottom of viewport.

### 9.6 Checkout Layout
- Two-column desktop: left = step content (Shipping → Shipping Method → Payment → Review), right = sticky order summary (line items, subtotal, discount, tax, shipping, total, coupon input).
- Mobile: single column, order summary collapses into an expandable "Order Summary" accordion above the step content.
- Step indicator at top; back/continue buttons at bottom of each step.
- Order Success page: centered confirmation icon, order number, summary, "Continue Shopping" and "View Order" CTAs.

### 9.7 Admin Dashboard Wireframe (Text Description)
- Top row: 4 KPI cards (Total Revenue, Orders Today, New Customers, Low Stock Alerts) — each with a value, trend indicator (up/down %), and sparkline.
- Second row: Revenue-over-time line chart (left, 2/3 width) + Order Status breakdown donut chart (right, 1/3 width).
- Third row: Recent Orders table (last 10, with quick status update) alongside a Low Stock Products list.
- Sidebar navigation persistent on the left per section 9.3.

### 9.8 Customer Dashboard Wireframe (Text Description)
- Top: greeting header ("Welcome back, {name}") + account status summary.
- Grid of 3 quick-stat cards: Active Orders, Wishlist Items, Reward/Notification count (if applicable).
- Recent Orders list (3–5 most recent, "View All" link to Orders page).
- Sidebar (or top tab bar on mobile) linking to Orders, Wishlist, Addresses, Profile, Notifications, Reviews.

## 10. Page-by-Page UI Specifications

- **Home:** Hero (full-bleed image/video, headline in Playfair Display, primary CTA), Featured Categories grid, Best Sellers carousel, Brand story/value props (3-column icon+text), New Arrivals carousel, Newsletter banner, Footer.
- **Shop / Category:** Left filter sidebar (desktop) / filter drawer (mobile), top bar with result count + sort dropdown, responsive product grid (2 cols mobile, 3 tablet, 4 desktop), pagination or infinite scroll with skeleton loaders.
- **Search Results:** Same grid as Shop, plus a "Showing results for '{query}'" header and a no-results empty state with suggested categories.
- **Wishlist:** Grid of product cards with a remove icon; empty state CTA to continue shopping.
- **Cart:** Line-item list (image, name, variant, quantity stepper, price, remove), order summary panel, coupon input, "Proceed to Checkout" CTA; empty state illustration + CTA.
- **404:** Centered illustration, message, "Back to Home" CTA.

## 11. Loading, Empty, and Error States

- **Loading:** Skeleton components matching the shape of the eventual content (card skeletons for grids, line skeletons for tables/text) — no generic spinners except for button-level inline actions (e.g., "Placing order…").
- **Empty:** Centered icon (Lucide), one-line message, optional secondary line, and a primary CTA where a next action exists (e.g., "Add your first product", "Continue Shopping").
- **Error:** Inline error banners (form-level and page-level) using `--state-danger` accents, human-readable messages (never raw error codes), with a retry action where applicable (e.g., "Something went wrong loading your orders — Retry").
