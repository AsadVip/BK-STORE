import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import { LoadingScreen } from "@/components/storefront/loading-screen";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppProviders>
            <LoadingScreen />
            <AppRouter />
        </AppProviders>
    </StrictMode>,
);
