import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";

/**
 * Root provider stack: Query → Auth → (app) → Toaster.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>
                {children}
                <Toaster />
            </AuthProvider>
        </QueryProvider>
    );
}

// Re-export the toast hook for convenience.
export { useToast };
