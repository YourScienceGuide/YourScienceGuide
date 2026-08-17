import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAGIC_SESSION_COOKIE, encodeCookieValue } from "@/lib/magic-links/token";

vi.mock("server-only", () => ({}));

const cookieJar = new Map<string, string>();
const cookieStore = {
  get: vi.fn((name: string) => {
    const value = cookieJar.get(name);
    return value ? { name, value } : undefined;
  }),
  set: vi.fn((name: string, value: string) => {
    cookieJar.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    cookieJar.delete(name);
  }),
};

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const familyMocks = vi.hoisted(() => ({
  countFamilyStudents: vi.fn(),
  createFamilyStudent: vi.fn(),
}));

vi.mock("@/lib/family/family-students.server", () => ({
  countFamilyStudents: familyMocks.countFamilyStudents,
  createFamilyStudent: familyMocks.createFamilyStudent,
}));

const supabaseMocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: supabaseMocks.createSupabaseAdmin,
  isSupabaseConfigured: supabaseMocks.isSupabaseConfigured,
}));

const originalEnv = { ...process.env };
const SECRET = "unit-magic-secret";
const TOKEN = "550e8400-e29b-41d4-a716-446655440000";
const LINK_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

type MagicRow = {
  id: string;
  token: string;
  label: string;
  access_mode: "anyone" | "first_browser";
  expires_at: string;
  disabled_at: string | null;
  disabled_by: string | null;
  created_by: string;
  created_at: string;
  last_redeemed_at: string | null;
  redeem_count: number;
  claimed_at: string | null;
  claimed_browser_hash: string | null;
};

function futureIso(ms = 7 * 24 * 60 * 60 * 1000): string {
  return new Date(Date.now() + ms).toISOString();
}

function row(overrides: Partial<MagicRow> = {}): MagicRow {
  return {
    id: LINK_ID,
    token: TOKEN,
    label: "Classroom preview",
    access_mode: "anyone",
    expires_at: futureIso(),
    disabled_at: null,
    disabled_by: null,
    created_by: "user_admin",
    created_at: new Date().toISOString(),
    last_redeemed_at: null,
    redeem_count: 0,
    claimed_at: null,
    claimed_browser_hash: null,
    ...overrides,
  };
}

function magicLinksClient(options: {
  selectRow?: MagicRow | null;
  updateRow?: { id: string } | null;
  updateError?: { message: string } | null;
}) {
  let lastOp: "select" | "update" = "select";
  const chain: Record<string, unknown> = {};
  const self = chain as {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };

  self.select = vi.fn(() => self);
  self.eq = vi.fn(() => self);
  self.is = vi.fn(() => self);
  self.order = vi.fn(() => self);
  self.insert = vi.fn(() => self);
  self.update = vi.fn(() => {
    lastOp = "update";
    return self;
  });
  self.maybeSingle = vi.fn(async () => {
    if (lastOp === "update") {
      return {
        data: options.updateRow === undefined ? { id: LINK_ID } : options.updateRow,
        error: options.updateError ?? null,
      };
    }
    return { data: options.selectRow ?? null, error: null };
  });
  self.single = vi.fn(async () => ({
    data: options.selectRow ?? null,
    error: null,
  }));

  return {
    from: vi.fn(() => self),
    chain: self,
  };
}

async function loadServer() {
  return import("@/lib/magic-links/magic-links.server");
}

describe("magic link server redeem and session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    process.env = { ...originalEnv, MAGIC_LINK_SECRET: SECRET };
    supabaseMocks.isSupabaseConfigured.mockReturnValue(true);
    familyMocks.countFamilyStudents.mockResolvedValue(0);
    familyMocks.createFamilyStudent.mockResolvedValue({ id: "student-1" });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns unavailable when Supabase or the signing secret is missing", async () => {
    const { redeemMagicLink } = await loadServer();
    supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });

    supabaseMocks.isSupabaseConfigured.mockReturnValue(true);
    delete process.env.MAGIC_LINK_SECRET;
    delete process.env.CLERK_SECRET_KEY;
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("rejects unknown, disabled, and expired tokens", async () => {
    const { redeemMagicLink } = await loadServer();

    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({ selectRow: null }),
    );
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });

    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({ disabled_at: new Date().toISOString() }),
      }),
    );
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "disabled",
    });

    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({ expires_at: new Date(Date.now() - 1000).toISOString() }),
      }),
    );
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("sets an httpOnly session cookie and creates a demo student on first redeem", async () => {
    const client = magicLinksClient({ selectRow: row() });
    supabaseMocks.createSupabaseAdmin.mockReturnValue(client);

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({ ok: true });

    expect(cookieStore.set).toHaveBeenCalledWith(
      MAGIC_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(familyMocks.createFamilyStudent).toHaveBeenCalledWith(
      `magic_${LINK_ID}`,
      {
        name: "Classroom preview",
        displayName: "Classroom preview",
      },
    );
  });

  it("names an unlabeled demo student Demo student", async () => {
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({ selectRow: row({ label: "  " }) }),
    );

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({ ok: true });
    expect(familyMocks.createFamilyStudent).toHaveBeenCalledWith(
      `magic_${LINK_ID}`,
      {
        name: "Demo student",
        displayName: "Demo student",
      },
    );
  });

  it("does not create another student when one already exists", async () => {
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({ selectRow: row() }),
    );
    familyMocks.countFamilyStudents.mockResolvedValue(1);

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({ ok: true });
    expect(familyMocks.createFamilyStudent).not.toHaveBeenCalled();
  });

  it("rejects a first-browser link already bound to another browser", async () => {
    const { hashBrowserNonce } = await import("@/lib/magic-links/token");
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({
          access_mode: "first_browser",
          claimed_browser_hash: hashBrowserNonce("first-browser"),
        }),
      }),
    );

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "claimed",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("lets the bound first browser reuse the link", async () => {
    const { hashBrowserNonce } = await import("@/lib/magic-links/token");
    const nonce = "bound-browser";
    cookieJar.set(
      MAGIC_SESSION_COOKIE,
      encodeCookieValue(
        {
          v: 1,
          id: LINK_ID,
          n: nonce,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        SECRET,
      ),
    );
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({
          access_mode: "first_browser",
          claimed_browser_hash: hashBrowserNonce(nonce),
        }),
      }),
    );

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({ ok: true });
    expect(cookieStore.set).toHaveBeenCalled();
  });

  it("rejects a first-browser claim when another browser wins the race", async () => {
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({ access_mode: "first_browser" }),
        updateRow: null,
      }),
    );

    const { redeemMagicLink } = await loadServer();
    await expect(redeemMagicLink(TOKEN)).resolves.toEqual({
      ok: false,
      reason: "claimed",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("ignores the cookie as soon as an admin disables the link", async () => {
    cookieJar.set(
      MAGIC_SESSION_COOKIE,
      encodeCookieValue(
        {
          v: 1,
          id: LINK_ID,
          n: "browser-a",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        SECRET,
      ),
    );
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({
        selectRow: row({ disabled_at: new Date().toISOString() }),
      }),
    );

    const { readMagicLinkSession } = await loadServer();
    await expect(readMagicLinkSession()).resolves.toBeNull();
    expect(cookieStore.delete).toHaveBeenCalledWith(MAGIC_SESSION_COOKIE);
  });

  it("returns a synthetic student session for an active cookie", async () => {
    cookieJar.set(
      MAGIC_SESSION_COOKIE,
      encodeCookieValue(
        {
          v: 1,
          id: LINK_ID,
          n: "browser-a",
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        SECRET,
      ),
    );
    supabaseMocks.createSupabaseAdmin.mockReturnValue(
      magicLinksClient({ selectRow: row() }),
    );

    const { readMagicLinkSession } = await loadServer();
    await expect(readMagicLinkSession()).resolves.toEqual({
      userId: `magic_${LINK_ID}`,
      linkId: LINK_ID,
      label: "Classroom preview",
      expiresAt: expect.any(String),
    });
  });
});
