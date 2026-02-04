import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../../lib/env";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "accessJwt",
      secret: env.JWT_ACCESS_SECRET,
    }),
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: env.JWT_REFRESH_SECRET,
    }),
  );
