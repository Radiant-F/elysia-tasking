import { Elysia } from "elysia";
import { AppError } from "../lib/errors";

export const errorHandler = new Elysia({ name: "errorHandler" }).onError(
  ({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return { message: error.message };
    }

    if (code === "VALIDATION") {
      set.status = 422;
      return { message: "Validation error" };
    }

    set.status = 500;
    return { message: "Internal server error" };
  },
);
