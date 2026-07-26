import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Package, FolderTree, Tag, Image as ImageIcon, Boxes,
    ShoppingCart, Users, Star, Ticket, Percent, Truck, CreditCard, Receipt,
    Bell, Settings, Globe, BarChart3, LineChart, ShieldCheck, ScrollText,
    DatabaseBackup, LogOut, Menu, X, Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
    {
        label: null,
        items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
    },
    {
        label: "Catalog",
        items: [
            { to: "/admin/products", label: "Products", icon: Package },
            { to: "/admin/categories", label: "Categories", icon: FolderTree },
        ],
    },
    {
        label: "Marketing",
        items: [
            { to: "/admin/banners", label: "Banners", icon: ImageIcon },
            { to: "/admin/coupons", label: "Coupons", icon: Ticket },
            { to: "/admin/campaigns", label: "Discount Campaigns", icon: Percent },
        ],
    },
    {
        label: "Sales",
        items: [
            { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
            { to: "/admin/customers", label: "Customers", icon: Users },
            { to: "/admin/reviews", label: "Reviews", icon: Star },
        ],
    },
    {
        label: "Inventory",
        items: [{ to: "/admin/inventory", label: "Inventory", icon: Boxes }],
    },
    {
        label: "Configuration",
        items: [
            { to: "/admin/shipping", label: "Shipping Methods", icon: Truck },
        ],
    },
    {
        label: "Insights",
        items: [
            { to: "/admin/reports", label: "Reports", icon: BarChart3 },
            { to: "/admin/analytics", label: "Analytics", icon: LineChart },
        ],
    },
    {
        label: "System",
        items: [
            { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
            { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
            { to: "/admin/backup", label: "Backup & Restore", icon: DatabaseBackup },
        ],
    },
];

export function AdminLayout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const SidebarContent = (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <span className="font-serif text-xl font-bold">BK Admin</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {NAV_GROUPS.map((group, gi) => (
                    <div key={gi} className="mb-4">
                        {group.label && (
                            <p className="mb-1 px-3 text-caption font-medium uppercase tracking-wide text-text-secondary/70">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary",
                                            isActive && "border-l-2 border-accent-brown bg-bg-secondary text-text-primary",
                                        )
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="border-t border-border p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-state-danger hover:bg-state-danger/10"
                    onClick={async () => {
                        await signOut();
                        navigate("/");
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-bg-secondary lg:block">
                {SidebarContent}
            </aside>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-bg-secondary">
                        {SidebarContent}
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-bg-primary/80 px-4 backdrop-blur-md lg:px-8">
                    <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="font-serif text-lg font-semibold">Admin Panel</h1>
                    <div className="w-6 lg:hidden" />
                </header>
                <main id="main-content" className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
