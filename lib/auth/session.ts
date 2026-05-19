import {
  AUTH_ROLE_KEY,
  AUTH_SESSION_KEY,
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

export function isAdmin(): boolean {
  return getAuthRole() === "admin";
}

export function setAuthenticated(role: AuthRole) {
  sessionStorage.setItem(AUTH_SESSION_KEY, "1");
  sessionStorage.setItem(AUTH_ROLE_KEY, role);
}

export function clearAuthenticated() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_ROLE_KEY);
}

export function validateCredentials(
  username: string,
  password: string,
): AuthRole | null {
  if (password !== MOCK_PASSWORD) return null;
  const trimmed = username.trim();
  if (trimmed === MOCK_ADMIN_USERNAME) return "admin";
  if (trimmed === MOCK_USERNAME) return "student";
  return null;
}
