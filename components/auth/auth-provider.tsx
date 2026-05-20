"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { registerAccount } from "@/lib/auth/accounts";
import type { AuthRole } from "@/lib/auth/constants";
import {
  clearAuthenticated,
  getAuthRole,
  getAuthUsername,
  isAuthenticated,
  setAuthenticated,
  validateCredentials,
} from "@/lib/auth/session";
import { hasActiveSubscription } from "@/lib/billing/subscription";

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  role: AuthRole | null;
  username: string | null;
  isAdmin: boolean;
  hasLessonAccess: boolean;
  signIn: (username: string, password: string) => boolean;
  createAccount: (
    username: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string };
  purchaseSubscription: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);

  const hydrate = useCallback(() => {
    setAuthenticatedState(isAuthenticated());
    setRole(getAuthRole());
    setUsername(getAuthUsername());
  }, []);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  const isAdmin = role === "admin";

  const hasLessonAccess = useMemo(() => {
    if (!authenticated || !username) return false;
    if (isAdmin) return true;
    void subscriptionVersion;
    return hasActiveSubscription(username);
  }, [authenticated, username, isAdmin, subscriptionVersion]);

  const signIn = useCallback(
    (user: string, password: string) => {
      const resolved = validateCredentials(user, password);
      if (!resolved) return false;
      setAuthenticated(resolved.role, resolved.username);
      setAuthenticatedState(true);
      setRole(resolved.role);
      setUsername(resolved.username);
      return true;
    },
    [],
  );

  const createAccount = useCallback(
    (user: string, password: string) => {
      const result = registerAccount(user, password);
      if (!result.ok) return result;
      const trimmed = user.trim();
      setAuthenticated("student", trimmed);
      setAuthenticatedState(true);
      setRole("student");
      setUsername(trimmed);
      return { ok: true as const };
    },
    [],
  );

  const purchaseSubscription = useCallback(() => {
    setSubscriptionVersion((v) => v + 1);
  }, []);

  const signOut = useCallback(() => {
    clearAuthenticated();
    setAuthenticatedState(false);
    setRole(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ready,
        authenticated,
        role,
        username,
        isAdmin,
        hasLessonAccess,
        signIn,
        createAccount,
        purchaseSubscription,
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
