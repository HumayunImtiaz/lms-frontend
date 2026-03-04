import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthState = {
  token: string | null;
  isAuthed: boolean;
  authLoading: boolean; // ✅ NEW
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "lms_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // ✅ NEW

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t) setTokenState(t);
    setAuthLoading(false); // ✅ auth check complete
  }, []);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const logout = () => setToken(null);

  const value = useMemo(
    () => ({ token, isAuthed: !!token, authLoading, setToken, logout }),
    [token, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}