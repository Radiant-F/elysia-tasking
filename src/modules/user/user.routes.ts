import { Elysia } from "elysia";
import { authGuard } from "../auth/auth.guard";
import { errorResponse, updateUserBody, userResponse } from "./user.schema";
import { userService } from "./user.service";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authGuard)
  .get("/me", async ({ user }) => userService.getMe(user.id), {
    response: {
      200: userResponse,
      401: errorResponse,
      404: errorResponse,
    },
    detail: {
      summary: "Get current user",
      description: "Returns the authenticated user profile",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
    },
  })
  .put("/me", async ({ user, body }) => userService.updateMe(user.id, body), {
    body: updateUserBody,
    response: {
      200: userResponse,
      401: errorResponse,
      404: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
    detail: {
      summary: "Update current user",
      description: "Updates the authenticated user profile",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
    },
  })
  .delete(
    "/me",
    async ({ user }) => {
      await userService.deleteMe(user.id);
      return { message: "User deleted" };
    },
    {
      response: {
        200: errorResponse,
        401: errorResponse,
      },
      detail: {
        summary: "Delete current user",
        description: "Deletes the authenticated user account",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
      },
    },
  );
