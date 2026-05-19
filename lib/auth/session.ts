import {
  AUTH_SESSION_KEY,
  MOCK_PASSWORD,
  MOCK_USERNAME,
} from "@/lib/auth/constants";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
}

export function setAuthenticated() {
  sessionStorage.setItem(AUTH_SESSION_KEY, "1");
}

export function clearAuthenticated() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function validateCredentials(
  username: string,
  password: string,
): boolean {
  return username.trim() === MOCK_USERNAME && password === MOCK_PASSWORD;
}
