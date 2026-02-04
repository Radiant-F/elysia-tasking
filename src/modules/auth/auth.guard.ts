import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { UnauthorizedError } from "../../lib/errors";
import { jwtPlugin } from "./jwt.plugin";

export const authGuard = new Elysia({ name: "authGuard" })
  .use(jwtPlugin)
  .derive({ as: "global" }, async ({ accessJwt, headers }) => {
    const authorization = headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authorization header");
    }

    const token = authorization.slice(7);
    const payload = await accessJwt.verify(token);

    if (!payload || typeof payload === "boolean") {
      throw new UnauthorizedError("Invalid or expired token");
    }

    const sub = payload.sub as string;
    const tokenVersion = payload.tokenVersion as number;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!user || user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedError("Token revoked");
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        tokenVersion: user.tokenVersion,
      },
    };
  });
