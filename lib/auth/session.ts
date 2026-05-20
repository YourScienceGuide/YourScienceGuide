import { validateRegisteredAccount } from "@/lib/auth/accounts";
import {
  AUTH_ROLE_KEY,
  AUTH_SESSION_KEY,
  AUTH_USERNAME_KEY,
  MOCK_ADMIN_USERNAME,
  MOCK_PASSWORD,
  MOCK_USERNAME,
  type AuthRole,
} from "@/lib/auth/constants";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
}

export function getAuthRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const role = sessionStorage.getItem(AUTH_ROLE_KEY);
  if (role === "admin" || role === "student") return role;
  return null;
}

export function getAuthUsername(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_USERNAME_KEY);
}

export function isAdmin(): boolean {
  return getAuthRole() === "admin";
}

export function setAuthenticated(role: AuthRole, username: string) {
  sessionStorage.setItem(AUTH_SESSION_KEY, "1");
  sessionStorage.setItem(AUTH_ROLE_KEY, role);
  sessionStorage.setItem(AUTH_USERNAME_KEY, username.trim());
}

export function clearAuthenticated() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_ROLE_KEY);
  sessionStorage.removeItem(AUTH_USERNAME_KEY);
}

export function validateCredentials(
  username: string,
  password: string,
): { role: AuthRole; username: string } | null {
  const trimmed = username.trim();
  if (password !== MOCK_PASSWORD) {
    if (!validateRegisteredAccount(trimmed, password)) return null;
    return { role: "student", username: trimmed };
  }
  if (trimmed === MOCK_ADMIN_USERNAME) {
    return { role: "admin", username: trimmed };
  }
  if (trimmed === MOCK_USERNAME) {
    return { role: "student", username: trimmed };
  }
  return null;
}
