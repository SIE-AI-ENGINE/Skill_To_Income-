import { eq } from "drizzle-orm";
import { db, sieProfilesTable, type SieProfile } from "@workspace/db";
import { defaultProfile } from "./sie-data";

/**
 * Returns the signed-in user's profile row, creating a fresh one (seeded
 * with sensible defaults, `onboarded: false`) the first time it's needed —
 * e.g. right after signup.
 */
export async function ensureProfileForUser(
  userId: string,
  overrides: { name?: string; email?: string } = {},
): Promise<SieProfile> {
  const [existing] = await db
    .select()
    .from(sieProfilesTable)
    .where(eq(sieProfilesTable.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(sieProfilesTable)
    .values({
      ...defaultProfile,
      ...overrides,
      userId,
      onboarded: false,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create profile for user");
  }

  return created;
}
