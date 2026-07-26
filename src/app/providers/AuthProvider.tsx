import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: string | null; session?: Session | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId: string) => {
        const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
        setProfile(data as Profile | null);
        // Check admin status via the is_admin() RPC.
        const { data: adminFlag } = await supabase.rpc("is_admin");
        setIsAdmin(Boolean(adminFlag));
    };

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session);
            if (data.session?.user) {
                loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
                loadProfile(newSession.user.id);
            } else {
                setProfile(null);
                setIsAdmin(false);
            }
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            profile,
            isAdmin,
            loading,
            signIn: async (email, password) => {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    const msg = typeof error.message === "string" && error.message.trim().length > 0
                        ? error.message
                        : "Invalid login credentials or email not confirmed.";
                    return { error: msg };
                }
                return { error: null };
            },
            signUp: async (email, password, firstName, lastName) => {
                // ── STRATEGY: Try RPC first (bypasses rate limits), then standard signUp ──

                // 1. Try custom_register_user RPC FIRST (no rate limit, no email sent)
                try {
                    const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc("custom_register_user", {
                        p_email: email,
                        p_password: password,
                        p_first_name: firstName ?? "",
                        p_last_name: lastName ?? "",
                    });

                    console.log("[SignUp] RPC result:", JSON.stringify(rpcRes), "error:", rpcErr);

                    if (!rpcErr && rpcRes && (rpcRes as { success?: boolean }).success) {
                        // User created/updated via RPC — now sign them in
                        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                        if (!signInErr && signInData?.session) {
                            return { error: null, session: signInData.session };
                        }
                        console.error("[SignUp] RPC succeeded but signIn failed:", signInErr);
                    }
                } catch (rpcCatch) {
                    // RPC function doesn't exist yet — that's OK, fall through to standard signUp
                    console.warn("[SignUp] RPC not available, falling back to standard signUp:", rpcCatch);
                }

                // 2. Fallback: Try standard Supabase signUp
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { first_name: firstName, last_name: lastName } },
                });

                if (!error && data?.session) {
                    return { error: null, session: data.session };
                }
                if (!error && data?.user) {
                    // User created but needs email confirmation
                    return { error: null, session: null };
                }

                // 3. If signUp also fails, try direct sign in (user might already exist)
                if (error) {
                    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                    if (!signInErr && signInData?.session) {
                        return { error: null, session: signInData.session };
                    }

                    const errMsg = typeof error.message === "string" && error.message.trim().length > 0
                        ? error.message : "Registration failed";
                    return { error: errMsg, session: null };
                }

                return { error: null, session: data?.session ?? null };
            },
            signOut: async () => {
                await supabase.auth.signOut();
                setProfile(null);
                setIsAdmin(false);
            },
            resetPassword: async (email) => {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                return { error: error?.message ?? null };
            },
            refreshProfile: async () => {
                if (session?.user) await loadProfile(session.user.id);
            },
        }),
        [session, profile, isAdmin, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
