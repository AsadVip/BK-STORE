import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { StorefrontLayout } from "@/app/layouts/StorefrontLayout";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";
import { RequireAuth, RequireAdmin, RedirectIfAuthed } from "@/app/guards";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";

// ---- Storefront (lazy) ----
const HomePage = lazy(() => import("@/features/storefront/pages/HomePage"));
const ShopPage = lazy(() => import("@/features/storefront/pages/ShopPage"));
const ProductPage = lazy(() => import("@/features/storefront/pages/ProductPage"));
const CategoriesPage = lazy(() => import("@/features/storefront/pages/CategoriesPage"));
const SearchPage = lazy(() => import("@/features/storefront/pages/SearchPage"));
const WishlistPage = lazy(() => import("@/features/storefront/pages/WishlistPage"));
const CartPage = lazy(() => import("@/features/storefront/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/features/storefront/pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("@/features/storefront/pages/OrderSuccessPage"));
const LoginPage = lazy(() => import("@/features/storefront/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/storefront/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/features/storefront/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/features/storefront/pages/ResetPasswordPage"));
const StaticPage = lazy(() => import("@/features/storefront/pages/StaticPage"));
const NotFoundPage = lazy(() => import("@/features/storefront/pages/NotFoundPage"));

// ---- Customer Dashboard (lazy) ----
const AccountDashboard = lazy(() => import("@/features/dashboard/pages/AccountDashboard"));
const OrdersPage = lazy(() => import("@/features/dashboard/pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/features/dashboard/pages/OrderDetailPage"));
const AccountWishlistPage = lazy(() => import("@/features/dashboard/pages/AccountWishlistPage"));
const AddressesPage = lazy(() => import("@/features/dashboard/pages/AddressesPage"));
const ProfilePage = lazy(() => import("@/features/dashboard/pages/ProfilePage"));
const ChangePasswordPage = lazy(() => import("@/features/dashboard/pages/ChangePasswordPage"));
const NotificationsPage = lazy(() => import("@/features/dashboard/pages/NotificationsPage"));
const ReviewsPage = lazy(() => import("@/features/dashboard/pages/ReviewsPage"));

// ---- Admin Panel (lazy) ----
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const AdminProductsPage = lazy(() => import("@/features/admin/pages/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/features/admin/pages/AdminCategoriesPage"));
const AdminBrandsPage = lazy(() => import("@/features/admin/pages/AdminBrandsPage"));
const AdminBannersPage = lazy(() => import("@/features/admin/pages/AdminBannersPage"));
const AdminOrdersPage = lazy(() => import("@/features/admin/pages/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("@/features/admin/pages/AdminCustomersPage"));
const AdminReviewsPage = lazy(() => import("@/features/admin/pages/AdminReviewsPage"));
const AdminCouponsPage = lazy(() => import("@/features/admin/pages/AdminCouponsPage"));
const AdminCampaignsPage = lazy(() => import("@/features/admin/pages/AdminCampaignsPage"));
const AdminInventoryPage = lazy(() => import("@/features/admin/pages/AdminInventoryPage"));
const AdminShippingPage = lazy(() => import("@/features/admin/pages/AdminShippingPage"));
const AdminPaymentsPage = lazy(() => import("@/features/admin/pages/AdminPaymentsPage"));
const AdminTaxPage = lazy(() => import("@/features/admin/pages/AdminTaxPage"));
const AdminNotificationsPage = lazy(() => import("@/features/admin/pages/AdminNotificationsPage"));
const AdminMediaPage = lazy(() => import("@/features/admin/pages/AdminMediaPage"));
const AdminSeoPage = lazy(() => import("@/features/admin/pages/AdminSeoPage"));
const AdminStoreSettingsPage = lazy(() => import("@/features/admin/pages/AdminStoreSettingsPage"));
const AdminWebsiteSettingsPage = lazy(() => import("@/features/admin/pages/AdminWebsiteSettingsPage"));
const AdminReportsPage = lazy(() => import("@/features/admin/pages/AdminReportsPage"));
const AdminAnalyticsPage = lazy(() => import("@/features/admin/pages/AdminAnalyticsPage"));
const AdminRolesPage = lazy(() => import("@/features/admin/pages/AdminRolesPage"));
const AdminAuditLogsPage = lazy(() => import("@/features/admin/pages/AdminAuditLogsPage"));
const AdminBackupPage = lazy(() => import("@/features/admin/pages/AdminBackupPage"));
const AdminPlaceholderPage = lazy(() => import("@/features/admin/pages/AdminPlaceholderPage"));

function PageFallback() {
    return (
        <div className="w-full min-h-[60vh]">
            <div className="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden bg-bg-secondary">
                <div className="h-full w-1/3 animate-[loadingbar_1.2s_ease-in-out_infinite] rounded-full bg-btn-primary" />
            </div>
            <div className="container-bk py-12">
                <ProductGridSkeleton count={8} />
            </div>
        </div>
    );
}


const TrackOrderPage = lazy(() => import("@/features/storefront/pages/TrackOrderPage"));

const router = createBrowserRouter([
    {
        element: <StorefrontLayout />,
        children: [
            { index: true, element: <Suspense fallback={<PageFallback />}><HomePage /></Suspense> },
            { path: "shop", element: <Suspense fallback={<PageFallback />}><ShopPage /></Suspense> },
            { path: "shop/:categorySlug", element: <Suspense fallback={<PageFallback />}><ShopPage /></Suspense> },
            { path: "product/:slug", element: <Suspense fallback={<PageFallback />}><ProductPage /></Suspense> },
            { path: "categories", element: <Suspense fallback={<PageFallback />}><CategoriesPage /></Suspense> },
            { path: "search", element: <Suspense fallback={<PageFallback />}><SearchPage /></Suspense> },
            { path: "wishlist", element: <Suspense fallback={<PageFallback />}><WishlistPage /></Suspense> },
            { path: "cart", element: <Suspense fallback={<PageFallback />}><CartPage /></Suspense> },
            { path: "checkout", element: <Suspense fallback={<PageFallback />}><CheckoutPage /></Suspense> },
            { path: "track-order", element: <Suspense fallback={<PageFallback />}><TrackOrderPage /></Suspense> },
            { path: "order-success/:orderNumber", element: <Suspense fallback={<PageFallback />}><OrderSuccessPage /></Suspense> },
            { path: "login", element: <RedirectIfAuthed><Suspense fallback={<PageFallback />}><LoginPage /></Suspense></RedirectIfAuthed> },
            { path: "register", element: <RedirectIfAuthed><Suspense fallback={<PageFallback />}><RegisterPage /></Suspense></RedirectIfAuthed> },
            { path: "forgot-password", element: <Suspense fallback={<PageFallback />}><ForgotPasswordPage /></Suspense> },
            { path: "reset-password", element: <Suspense fallback={<PageFallback />}><ResetPasswordPage /></Suspense> },
            { path: "about", element: <Suspense fallback={<PageFallback />}><StaticPage slug="about" /></Suspense> },
            { path: "contact", element: <Suspense fallback={<PageFallback />}><StaticPage slug="contact" /></Suspense> },
            { path: "faq", element: <Suspense fallback={<PageFallback />}><StaticPage slug="faq" /></Suspense> },
            { path: "privacy-policy", element: <Suspense fallback={<PageFallback />}><StaticPage slug="privacy-policy" /></Suspense> },
            { path: "terms", element: <Suspense fallback={<PageFallback />}><StaticPage slug="terms" /></Suspense> },
            { path: "shipping-policy", element: <Suspense fallback={<PageFallback />}><StaticPage slug="shipping-policy" /></Suspense> },
            { path: "return-policy", element: <Suspense fallback={<PageFallback />}><StaticPage slug="return-policy" /></Suspense> },
            { path: "404", element: <Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense> },
            { path: "*", element: <Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense> },
        ],
    },
    {
        path: "/account",
        element: <RequireAuth><DashboardLayout /></RequireAuth>,
        children: [
            { index: true, element: <Suspense fallback={<PageFallback />}><AccountDashboard /></Suspense> },
            { path: "orders", element: <Suspense fallback={<PageFallback />}><OrdersPage /></Suspense> },
            { path: "orders/:orderNumber", element: <Suspense fallback={<PageFallback />}><OrderDetailPage /></Suspense> },
            { path: "wishlist", element: <Suspense fallback={<PageFallback />}><AccountWishlistPage /></Suspense> },
            { path: "addresses", element: <Suspense fallback={<PageFallback />}><AddressesPage /></Suspense> },
            { path: "profile", element: <Suspense fallback={<PageFallback />}><ProfilePage /></Suspense> },
            { path: "password", element: <Suspense fallback={<PageFallback />}><ChangePasswordPage /></Suspense> },
            { path: "notifications", element: <Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense> },
            { path: "reviews", element: <Suspense fallback={<PageFallback />}><ReviewsPage /></Suspense> },
        ],
    },
    {
        path: "/admin",
        element: <RequireAdmin><AdminLayout /></RequireAdmin>,
        children: [
            { index: true, element: <Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense> },
            { path: "products", element: <Suspense fallback={<PageFallback />}><AdminProductsPage /></Suspense> },
            { path: "categories", element: <Suspense fallback={<PageFallback />}><AdminCategoriesPage /></Suspense> },
            { path: "brands", element: <Suspense fallback={<PageFallback />}><AdminBrandsPage /></Suspense> },
            { path: "banners", element: <Suspense fallback={<PageFallback />}><AdminBannersPage /></Suspense> },
            { path: "orders", element: <Suspense fallback={<PageFallback />}><AdminOrdersPage /></Suspense> },
            { path: "customers", element: <Suspense fallback={<PageFallback />}><AdminCustomersPage /></Suspense> },
            { path: "reviews", element: <Suspense fallback={<PageFallback />}><AdminReviewsPage /></Suspense> },
            { path: "coupons", element: <Suspense fallback={<PageFallback />}><AdminCouponsPage /></Suspense> },
            { path: "campaigns", element: <Suspense fallback={<PageFallback />}><AdminCampaignsPage /></Suspense> },
            { path: "inventory", element: <Suspense fallback={<PageFallback />}><AdminInventoryPage /></Suspense> },
            { path: "shipping", element: <Suspense fallback={<PageFallback />}><AdminShippingPage /></Suspense> },
            { path: "payments", element: <Suspense fallback={<PageFallback />}><AdminPaymentsPage /></Suspense> },
            { path: "tax", element: <Suspense fallback={<PageFallback />}><AdminTaxPage /></Suspense> },
            { path: "notifications", element: <Suspense fallback={<PageFallback />}><AdminNotificationsPage /></Suspense> },
            { path: "media", element: <Suspense fallback={<PageFallback />}><AdminMediaPage /></Suspense> },
            { path: "seo", element: <Suspense fallback={<PageFallback />}><AdminSeoPage /></Suspense> },
            { path: "store-settings", element: <Suspense fallback={<PageFallback />}><AdminStoreSettingsPage /></Suspense> },
            { path: "website-settings", element: <Suspense fallback={<PageFallback />}><AdminWebsiteSettingsPage /></Suspense> },
            { path: "reports", element: <Suspense fallback={<PageFallback />}><AdminReportsPage /></Suspense> },
            { path: "analytics", element: <Suspense fallback={<PageFallback />}><AdminAnalyticsPage /></Suspense> },
            { path: "roles", element: <Suspense fallback={<PageFallback />}><AdminRolesPage /></Suspense> },
            { path: "audit-logs", element: <Suspense fallback={<PageFallback />}><AdminAuditLogsPage /></Suspense> },
            { path: "backup", element: <Suspense fallback={<PageFallback />}><AdminBackupPage /></Suspense> },
        ],
    },
    { path: "/admin/*", element: <Navigate to="/admin" replace /> },
], {
    future: {
        v7_relativeSplatPath: true,
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_skipActionErrorRevalidation: true,
    },
});

export function AppRouter() {
    return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
