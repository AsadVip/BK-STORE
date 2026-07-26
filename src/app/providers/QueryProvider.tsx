import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 min default; tuned per-query where needed
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
