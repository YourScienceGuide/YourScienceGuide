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

export type SignupModalReason = "limit" | "locked" | "default";

type AuthContextValue = {
  ready: boolean;
  /** Global login flag — false until a session exists. */
  isLoggedIn: boolean;
  isGuest: boolean;
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
  signupModalOpen: boolean;
  signupModalReason: SignupModalReason | null;
  openSignupModal: (reason?: SignupModalReason) => void;
  closeSignupModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupModalReason, setSignupModalReason] =
    useState<SignupModalReason | null>(null);

  const hydrate = useCallback(() => {
    setAuthenticatedState(isAuthenticated());
    setRole(getAuthRole());
    setUsername(getAuthUsername());
  }, []);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  const isLoggedIn = authenticated;
  const isGuest = !authenticated;
  const isAdmin = role === "admin";

  const hasLessonAccess = useMemo(() => {
    if (!isLoggedIn || !username) return false;
    if (isAdmin) return true;
    void subscriptionVersion;
    return hasActiveSubscription(username);
  }, [isLoggedIn, username, isAdmin, subscriptionVersion]);

  const openSignupModal = useCallback((reason: SignupModalReason = "default") => {
    setSignupModalReason(reason);
    setSignupModalOpen(true);
  }, []);

  const closeSignupModal = useCallback(() => {
    setSignupModalOpen(false);
    setSignupModalReason(null);
  }, []);

  const signIn = useCallback(
    (user: string, password: string) => {
      const resolved = validateCredentials(user, password);
      if (!resolved) return false;
      setAuthenticated(resolved.role, resolved.username);
      setAuthenticatedState(true);
      setRole(resolved.role);
      setUsername(resolved.username);
      closeSignupModal();
      return true;
    },
    [closeSignupModal],
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
      closeSignupModal();
      return { ok: true as const };
    },
    [closeSignupModal],
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
        isLoggedIn,
        isGuest,
        authenticated,
        role,
        username,
        isAdmin,
        hasLessonAccess,
        signIn,
        createAccount,
        purchaseSubscription,
        signOut,
        signupModalOpen,
        signupModalReason,
        openSignupModal,
        closeSignupModal,
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
