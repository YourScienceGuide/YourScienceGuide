import {
  MOCK_ADMIN_USERNAME,
  MOCK_PASSWORD,
  MOCK_USERNAME,
  REGISTERED_ACCOUNTS_KEY,
} from "@/lib/auth/constants";

type RegisteredAccounts = Record<string, { password: string }>;

function readAccounts(): RegisteredAccounts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RegisteredAccounts;
  } catch {
    return {};
  }
}

function writeAccounts(accounts: RegisteredAccounts) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

const RESERVED_USERNAMES = new Set([
  MOCK_USERNAME.toLowerCase(),
  MOCK_ADMIN_USERNAME.toLowerCase(),
]);

export function registerAccount(
  username: string,
  password: string,
): { ok: true } | { ok: false; error: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: "Username must be at least 3 characters." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return {
      ok: false,
      error: "That username is reserved. Choose a different one.",
    };
  }

  const accounts = readAccounts();
  if (accounts[trimmed.toLowerCase()]) {
    return { ok: false, error: "An account with that username already exists." };
  }

  accounts[trimmed.toLowerCase()] = { password };
  writeAccounts(accounts);
  return { ok: true };
}

export function validateRegisteredAccount(
  username: string,
  password: string,
): boolean {
  const trimmed = username.trim();
  const entry = readAccounts()[trimmed.toLowerCase()];
  return entry?.password === password;
}
