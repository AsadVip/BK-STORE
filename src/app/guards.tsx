import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route guard: requires an authenticated user.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const hasGuestEmail = typeof window !== "undefined" && Boolean(localStorage.getItem("bk_customer_email"));

    if (loading) return <FullPageLoader />;
    if (!user && !hasGuestEmail) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    return <>{children}</>;
}

/**
 * Route guard: requires an authenticated admin user.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();
    if (loading) return <FullPageLoader />;
    if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
}

/**
 * Route guard: redirect authenticated users away from auth pages (login/register).
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <FullPageLoader />;
    if (user) return <Navigate to="/account" replace />;
    return <>{children}</>;
}

function FullPageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-bg-primary">
            <div className="w-full max-w-md space-y-4 p-8">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
}
