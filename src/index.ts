import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { authRoutes } from "./modules/auth/auth.routes";
import { taskRoutes } from "./modules/task/task.routes";
import { userRoutes } from "./modules/user/user.routes";
import { errorHandler } from "./plugins/error-handler";
import { cors } from "@elysiajs/cors";
import { env } from "./lib/env";

const allowedOrigins = env.ALLOWED_CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin =
  allowedOrigins.length === 0 || allowedOrigins.includes("*")
    ? true
    : allowedOrigins;

export const app = new Elysia()
  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "Tasking API",
          version: "1.0.0",
          description: "Production-ready ElysiaJS API",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Users", description: "User management endpoints" },
          { name: "Tasks", description: "Task management endpoints" },
          { name: "Health", description: "Health check" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }),
  )
  .use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  )
  .use(errorHandler)
  .use(authRoutes)
  .use(taskRoutes)
  .use(userRoutes)
  .get("/health", () => ({ status: "ok" }), {
    response: {
      200: t.Object({
        status: t.String({ examples: ["ok"] }),
      }),
    },
    detail: {
      summary: "Health check",
      description: "Service health check",
      tags: ["Health"],
    },
  });

export type App = typeof app;
