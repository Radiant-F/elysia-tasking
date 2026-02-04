import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users, type NewUser, type User } from "../../db/schema";

export const authRepository = {
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  },

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async incrementTokenVersion(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  },
};
