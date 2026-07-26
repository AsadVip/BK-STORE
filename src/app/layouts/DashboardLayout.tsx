import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Heart, MapPin, User, KeyRound, Bell, Star, LogOut } from "lucide-react";
import { FlashSaleBar } from "@/components/storefront/flash-sale-bar";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { useAuth } from "@/app/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
    { to: "/account", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/account/orders", label: "Orders", icon: Package },
    { to: "/account/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account/addresses", label: "Addresses", icon: MapPin },
    { to: "/account/profile", label: "Profile", icon: User },
    { to: "/account/password", label: "Change Password", icon: KeyRound },
    { to: "/account/notifications", label: "Notifications", icon: Bell },
    { to: "/account/reviews", label: "My Reviews", icon: Star },
];

export function DashboardLayout() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col bg-bg-primary">
            <FlashSaleBar />
            <Header />
            <div className="container-bk flex-1 flex gap-8 py-8">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 lg:block">
                    <div className="sticky top-24">
                        <div className="mb-6 rounded-2xl bg-bg-secondary p-5">
                            <p className="text-sm text-text-secondary">Welcome back,</p>
                            <p className="font-serif text-lg font-semibold text-text-primary">
                                {profile?.first_name || profile?.email || "Customer"}
                            </p>
                        </div>
                        <nav className="space-y-1">
                            {NAV.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary",
                                            isActive && "border-l-2 border-accent-brown bg-bg-secondary text-text-primary font-semibold",
                                        )
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                        <Button
                            variant="ghost"
                            className="mt-4 w-full justify-start text-state-danger hover:bg-state-danger/10"
                            onClick={async () => {
                                await signOut();
                                navigate("/");
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </aside>

                {/* Content */}
                <main id="main-content" className="min-w-0 flex-1">
                    {/* Mobile nav */}
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
                        {NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    cn(
                                        "flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary",
                                        isActive && "border-btn-primary bg-btn-primary text-white font-semibold",
                                    )
                                }
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                    <Outlet />
                </main>
            </div>
            <Footer />
        </div>
    );
}

