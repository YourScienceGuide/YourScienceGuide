import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireAuthenticated() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  return { ok: true as const, userId };
}

export async function requireStudentOrAdminForUser(targetUserId: string) {
  const session = await requireAuthenticated();
  if (!session.ok) return session;

  if (session.userId === targetUserId) {
    return session;
  }

  const user = await currentUser();
  if (user?.publicMetadata?.role === "admin") {
    return session;
  }

  return { ok: false as const, status: 403, error: "Forbidden" };
}

export async function requireFamilyStudentAccess(familyStudentId: string) {
  const session = await requireAuthenticated();
  if (!session.ok) return session;

  const { verifyFamilyStudentOwnership } = await import(
    "@/lib/family/family-students.server"
  );
  const owned = await verifyFamilyStudentOwnership(session.userId, familyStudentId);
  if (!owned) {
    const user = await currentUser();
    if (user?.publicMetadata?.role === "admin") {
      return session;
    }
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return session;
}
