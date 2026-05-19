"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthenticated,
  isAuthenticated,
  setAuthenticated,
  validateCredentials,
} from "@/lib/auth/session";

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticatedState] = useState(false);

  useEffect(() => {
    setAuthenticatedState(isAuthenticated());
    setReady(true);
  }, []);

  const signIn = useCallback((username: string, password: string) => {
    if (!validateCredentials(username, password)) return false;
    setAuthenticated();
    setAuthenticatedState(true);
    return true;
  }, []);

  const signOut = useCallback(() => {
    clearAuthenticated();
    setAuthenticatedState(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ready, authenticated, signIn, signOut }}
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
