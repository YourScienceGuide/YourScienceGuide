"use client";

import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AuthRole } from "@/lib/auth/constants";
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

function resolveRole(user: ReturnType<typeof useUser>["user"]): AuthRole | null {
  const role = user?.publicMetadata?.role;
  if (role === "admin" || role === "student") return role;
  if (user) return "student";
  return null;
}

function resolveUsername(user: ReturnType<typeof useUser>["user"]): string | null {
  if (!user) return null;
  return (
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    user.id
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const router = useRouter();

  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupModalReason, setSignupModalReason] =
    useState<SignupModalReason | null>(null);

  const ready = isLoaded;
  const authenticated = !!isSignedIn;
  const isLoggedIn = authenticated;
  const isGuest = !authenticated;
  const username = resolveUsername(user);
  const role = resolveRole(user);
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
    (_user: string, _password: string) => {
      router.push("/sign-in");
      return false;
    },
    [router],
  );

  const createAccount = useCallback(
    (_user: string, _password: string) => {
      router.push("/sign-up");
      return { ok: false as const, error: "Continue on the sign-up page." };
    },
    [router],
  );

  const purchaseSubscription = useCallback(() => {
    setSubscriptionVersion((v) => v + 1);
  }, []);

  const signOut = useCallback(() => {
    void clerkSignOut({ redirectUrl: "/" });
  }, [clerkSignOut]);

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
