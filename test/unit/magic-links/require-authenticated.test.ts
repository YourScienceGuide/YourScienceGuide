import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const clerkMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

const magicMocks = vi.hoisted(() => ({
  readMagicLinkSession: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: clerkMocks.auth,
  currentUser: clerkMocks.currentUser,
}));

vi.mock("@/lib/magic-links/magic-links.server", () => ({
  readMagicLinkSession: magicMocks.readMagicLinkSession,
}));

describe("requireAuthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerkMocks.auth.mockResolvedValue({ isAuthenticated: false, userId: null });
    magicMocks.readMagicLinkSession.mockResolvedValue(null);
  });

  it("prefers a Clerk session over a magic-link cookie", async () => {
    clerkMocks.auth.mockResolvedValue({
      isAuthenticated: true,
      userId: "user_clerk_1",
    });
    magicMocks.readMagicLinkSession.mockResolvedValue({
      userId: "magic_link-1",
      linkId: "link-1",
      label: "Demo",
      expiresAt: new Date().toISOString(),
    });

    const { requireAuthenticated } = await import(
      "@/lib/auth/require-authenticated"
    );
    await expect(requireAuthenticated()).resolves.toEqual({
      ok: true,
      userId: "user_clerk_1",
    });
    expect(magicMocks.readMagicLinkSession).not.toHaveBeenCalled();
  });

  it("accepts a valid magic-link session when Clerk is signed out", async () => {
    magicMocks.readMagicLinkSession.mockResolvedValue({
      userId: "magic_link-1",
      linkId: "link-1",
      label: "Demo",
      expiresAt: new Date().toISOString(),
    });

    const { requireAuthenticated } = await import(
      "@/lib/auth/require-authenticated"
    );
    await expect(requireAuthenticated()).resolves.toEqual({
      ok: true,
      userId: "magic_link-1",
    });
  });

  it("rejects unauthenticated visitors", async () => {
    const { requireAuthenticated } = await import(
      "@/lib/auth/require-authenticated"
    );
    await expect(requireAuthenticated()).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });
  });
});
