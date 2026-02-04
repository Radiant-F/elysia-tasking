import { db } from "./index";
import { users } from "./schema";

const passwordHash = await Bun.password.hash("password123");

await db.insert(users).values({
  username: `seed_user_${Date.now()}`,
  passwordHash,
});

// eslint-disable-next-line no-console
console.log("Seed complete");
