"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AuthRole } from "@/lib/auth/constants";
import {
  clearAuthenticated,
  getAuthRole,
  isAuthenticated,
  setAuthenticated,
  validateCredentials,
} from "@/lib/auth/session";

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  role: AuthRole | null;
  isAdmin: boolean;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);

  useEffect(() => {
    setAuthenticatedState(isAuthenticated());
    setRole(getAuthRole());
    setReady(true);
  }, []);

  const signIn = useCallback((username: string, password: string) => {
    const resolved = validateCredentials(username, password);
    if (!resolved) return false;
    setAuthenticated(resolved);
    setAuthenticatedState(true);
    setRole(resolved);
    return true;
  }, []);

  const signOut = useCallback(() => {
    clearAuthenticated();
    setAuthenticatedState(false);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ready,
        authenticated,
        role,
        isAdmin: role === "admin",
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
