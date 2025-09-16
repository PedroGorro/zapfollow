import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // 1) pega sessão atual ao montar
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error('[Auth] getSession error:', error);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    // 2) escuta mudanças (login, logout, refresh, link de reset)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s ?? null);
      // garante que, se estivermos carregando, pare aqui também
      setLoading(false);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,

    // ações de autenticação (mantidos com os mesmos nomes)
    signOut: async () => {
  try {
    await supabase.auth.signOut();
  } finally {
    // garante limpeza imediata no cliente
    try { localStorage.removeItem('zapfollow.auth'); } catch {}
    setSession(null); // já deixa user = null pro Protected
  }
},

    signUpWithPassword: (email, password) =>
      supabase.auth.signUp({ email, password }),

    signInWithPassword: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),

    resetPasswordForEmail: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }),

    updatePassword: (newPassword) =>
      supabase.auth.updateUser({ password: newPassword }),
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
