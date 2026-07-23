import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*, roles:role_id(slug, label, can_manage_users, can_view_sensitive, can_delete, can_view_all_audit)")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      loadProfile(s?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null); };
  const refreshProfile = () => loadProfile(session?.user?.id);

  const role = profile?.roles;
  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    loading,
    isResponsable: role?.slug === "responsable",
    canViewSensitive: !!role?.can_view_sensitive,
    canManageUsers: !!role?.can_manage_users,
    canDelete: !!role?.can_delete,
    displayName: profile?.display_name || profile?.first_name || session?.user?.email || "Utilisateur",
    signOut,
    refreshProfile,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
