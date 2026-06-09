import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "admin") {
    return { ok: false as const, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, userId };
}
