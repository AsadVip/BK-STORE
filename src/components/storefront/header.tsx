import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, User, X, LayoutDashboard, Watch, ChevronRight, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGuestCart } from "@/lib/cart/guest-cart";
import { useGuestWishlist } from "@/lib/cart/guest-wishlist";
import { BkLogo } from "@/components/ui/bk-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_LINKS = [
    { label: "Shop", to: "/shop" },
    { label: "Categories", to: "/categories" },
    { label: "Track Order", to: "/track-order" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const { user, profile, isAdmin } = useAuth();
    const cartCount = useGuestCart((s) => s.count());
    const wishlistCount = useGuestWishlist((s) => s.productIds.length);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setSearchOpen(false);
            setMobileOpen(false);
            setQuery("");
        }
    };

    return (
        <>
            <header
                className={cn(
                    "sticky top-0 z-40 w-full transition-all duration-300",
                    scrolled ? "glass shadow-sm border-b border-border/60 backdrop-blur-md" : "bg-bg-primary/95 backdrop-blur-sm",
                )}
            >
                <div className="container-bk flex h-16 items-center justify-between gap-4 lg:h-20">
                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-bg-secondary lg:hidden"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5 text-text-primary" />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="shrink-0">
                        <BkLogo size="md" variant="full" />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden items-center gap-7 lg:flex">
                        {NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    cn(
                                        "relative py-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary",
                                        isActive && "text-text-primary font-semibold",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {link.label}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNavIndicator"
                                                className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-btn-primary"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                            type="button"
                            aria-label="Search"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                            onClick={() => setSearchOpen((v) => !v)}
                        >
                            <Search className="h-4.5 w-4.5" />
                        </button>

                        <Link
                            to="/wishlist"
                            aria-label="Wishlist"
                            className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                        >
                            <Heart className="h-4.5 w-4.5" />
                            <AnimatePresence>
                                {wishlistCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
                                    >
                                        {wishlistCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        <Link
                            to="/cart"
                            aria-label="Cart"
                            className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                        >
                            <ShoppingBag className="h-4.5 w-4.5" />
                            <AnimatePresence>
                                {cartCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-btn-primary px-1 text-[9px] font-bold text-white shadow-sm"
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        {isAdmin && (
                            <Link
                                to="/admin"
                                title="Admin Portal"
                                className="hidden sm:flex items-center gap-1.5 rounded-full bg-btn-primary/10 px-3 py-1.5 text-xs font-semibold text-btn-primary transition-colors hover:bg-btn-primary/20"
                            >
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Admin
                            </Link>
                        )}

                        <Link
                            to={user ? "/account" : "/login"}
                            aria-label="Account"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                        >
                            <User className="h-4.5 w-4.5" />
                        </Link>
                    </div>
                </div>

                {/* Search bar drawer */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden border-t border-border/60 bg-bg-primary/95 backdrop-blur-md"
                        >
                            <form onSubmit={submitSearch} className="container-bk flex items-center gap-3 py-4">
                                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                                <Input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search products, categories…"
                                    className="border-0 bg-transparent px-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/70"
                                />
                                <Button type="submit" size="sm" className="shrink-0 bg-btn-primary text-white hover:bg-btn-primary-hover rounded-xl">
                                    Search
                                </Button>
                                <button type="button" onClick={() => setSearchOpen(false)} className="text-text-secondary hover:text-text-primary">
                                    <X className="h-5 w-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Mobile Drawer — rendered outside header to avoid z-index clipping */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] lg:hidden"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />

                        {/* Sidebar Panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-bg-primary shadow-2xl flex flex-col overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
                                <Link to="/" onClick={() => setMobileOpen(false)}>
                                    <BkLogo size="sm" variant="full" />
                                </Link>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* User greeting */}
                            {user && (
                                <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-btn-primary/10 border border-btn-primary/20 px-4 py-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-btn-primary text-white text-sm font-bold shrink-0">
                                        {profile?.first_name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">Hi, {profile?.first_name || "User"}</p>
                                        <p className="text-xs text-text-secondary truncate max-w-[160px]">{user.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <nav className="flex-1 px-4 pt-4 space-y-1">
                                <Link
                                    to="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                                >
                                    <Home className="h-4 w-4 shrink-0" />
                                    Home
                                </Link>
                                {NAV_LINKS.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-btn-primary/10 text-btn-primary font-semibold border border-btn-primary/20"
                                                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
                                            )
                                        }
                                    >
                                        <span>{link.label}</span>
                                        <ChevronRight className="h-4 w-4 opacity-40" />
                                    </NavLink>
                                ))}
                            </nav>

                            {/* Quick stats */}
                            <div className="px-4 py-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/cart"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-bg-secondary/60 py-3 text-center"
                                    >
                                        <div className="relative">
                                            <ShoppingBag className="h-5 w-5 text-btn-primary" />
                                            {cartCount > 0 && (
                                                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-btn-primary text-[9px] font-bold text-white">{cartCount}</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-text-secondary">My Cart</span>
                                    </Link>
                                    <Link
                                        to="/wishlist"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-bg-secondary/60 py-3 text-center"
                                    >
                                        <div className="relative">
                                            <Heart className="h-5 w-5 text-red-500" />
                                            {wishlistCount > 0 && (
                                                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{wishlistCount}</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-text-secondary">Wishlist</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Bottom actions */}
                            <div className="border-t border-border/50 px-4 pb-6 pt-4 flex flex-col gap-2 shrink-0">
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-btn-primary/10 py-3 text-sm font-semibold text-btn-primary border border-btn-primary/20 hover:bg-btn-primary/20 transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4" /> Admin Portal
                                    </Link>
                                )}
                                <Link
                                    to={user ? "/account" : "/login"}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-btn-primary py-3.5 text-sm font-bold text-white shadow-lg hover:bg-btn-primary-hover transition-colors"
                                >
                                    <User className="h-4 w-4" />
                                    {user ? "My Account" : "Sign In / Register"}
                                </Link>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
