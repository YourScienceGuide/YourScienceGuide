import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

export async function getParentPrimaryEmail(
  parentClerkUserId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(parentClerkUserId);
    return (
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null
    );
  } catch (error) {
    console.error("Failed to load parent email from Clerk:", error);
    return null;
  }
}

export async function getParentDisplayName(
  parentClerkUserId: string,
): Promise<string> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(parentClerkUserId);
    return (
      user.firstName ??
      user.username ??
      user.primaryEmailAddress?.emailAddress ??
      "Parent"
    );
  } catch {
    return "Parent";
  }
}
