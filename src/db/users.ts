import { db } from './index.ts';
import { users, userOperations } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user registration failed:", error);
    throw new Error("Database query failed. Please try again later.");
  }
}

export async function logUserOperation(userId: number, operationType: string, details?: any) {
  try {
    const result = await db.insert(userOperations)
      .values({
        userId,
        operationType,
        details: details || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to log user operation in Cloud SQL:", error);
    throw new Error("Failed to log user operation.");
  }
}
