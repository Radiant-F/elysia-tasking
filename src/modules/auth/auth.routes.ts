import { Elysia } from "elysia";
import { authService } from "./auth.service";
import {
  authResponse,
  errorResponse,
  signinBody,
  signupBody,
} from "./auth.schema";
import { jwtPlugin } from "./jwt.plugin";
import { authGuard } from "./auth.guard";
import { UnauthorizedError } from "../../lib/errors";
import { env } from "../../lib/env";

const parseDurationToSeconds = (value: string): number => {
  const trimmed = value.trim();
  const match = /^(\d+)([smhd])$/i.exec(trimmed);

  if (match) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "s":
        return amount;
      case "m":
        return amount * 60;
      case "h":
        return amount * 60 * 60;
      case "d":
        return amount * 24 * 60 * 60;
    }
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Invalid duration value: ${value}`);
  }

  return numeric;
};

const baseRefreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const getRefreshCookieOptions = (rememberMe: boolean) => ({
  ...baseRefreshCookieOptions,
  maxAge: rememberMe
    ? parseDurationToSeconds(env.REMEMBER_ME_REFRESH_EXPIRES_IN)
    : parseDurationToSeconds(env.REFRESH_TOKEN_EXPIRES_IN),
});

const clearRefreshCookieOptions = {
  ...baseRefreshCookieOptions,
  maxAge: 0,
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)
  .post(
    "/signup",
    async ({ body, accessJwt, refreshJwt, cookie }) => {
      const rememberMe = body.rememberMe ?? false;
      const result = await authService.signup(body);

      const accessToken = await accessJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
        exp: env.ACCESS_TOKEN_EXPIRES_IN,
      });

      const refreshToken = await refreshJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
        rememberMe,
        exp: rememberMe
          ? env.REMEMBER_ME_REFRESH_EXPIRES_IN
          : env.REFRESH_TOKEN_EXPIRES_IN,
      });

      cookie.refreshToken.set({
        value: refreshToken,
        ...getRefreshCookieOptions(rememberMe),
      });

      return { accessToken, user: result.user };
    },
    {
      body: signupBody,
      response: {
        200: authResponse,
        409: errorResponse,
        422: errorResponse,
      },
      detail: {
        summary: "Register a new user",
        description: "Creates a new user account and returns access token",
        tags: ["Auth"],
      },
    },
  )
  .post(
    "/signin",
    async ({ body, accessJwt, refreshJwt, cookie }) => {
      const rememberMe = body.rememberMe ?? false;
      const result = await authService.signin(body);

      const accessToken = await accessJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
        exp: env.ACCESS_TOKEN_EXPIRES_IN,
      });

      const refreshToken = await refreshJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
        rememberMe,
        exp: rememberMe
          ? env.REMEMBER_ME_REFRESH_EXPIRES_IN
          : env.REFRESH_TOKEN_EXPIRES_IN,
      });

      cookie.refreshToken.set({
        value: refreshToken,
        ...getRefreshCookieOptions(rememberMe),
      });

      return { accessToken, user: result.user };
    },
    {
      body: signinBody,
      response: {
        200: authResponse,
        401: errorResponse,
        422: errorResponse,
      },
      detail: {
        summary: "Sign in",
        description: "Authenticates user and returns access token",
        tags: ["Auth"],
      },
    },
  )
  .post(
    "/refresh",
    async ({ refreshJwt, accessJwt, cookie }) => {
      const token = cookie.refreshToken?.value;
      if (!token || typeof token !== "string") {
        throw new UnauthorizedError("Missing refresh token");
      }

      const payload = await refreshJwt.verify(token);
      if (!payload || typeof payload === "boolean") {
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      const user = await authService.getUserById(payload.sub as string);
      if (user.tokenVersion !== (payload.tokenVersion as number)) {
        throw new UnauthorizedError("Token revoked");
      }

      const rememberMe = Boolean(
        (payload as { rememberMe?: boolean }).rememberMe,
      );

      const accessToken = await accessJwt.sign({
        sub: user.id,
        tokenVersion: user.tokenVersion,
        exp: env.ACCESS_TOKEN_EXPIRES_IN,
      });

      const refreshToken = await refreshJwt.sign({
        sub: user.id,
        tokenVersion: user.tokenVersion,
        rememberMe,
        exp: rememberMe
          ? env.REMEMBER_ME_REFRESH_EXPIRES_IN
          : env.REFRESH_TOKEN_EXPIRES_IN,
      });

      cookie.refreshToken.set({
        value: refreshToken,
        ...getRefreshCookieOptions(rememberMe),
      });

      return { accessToken, user };
    },
    {
      response: {
        200: authResponse,
        401: errorResponse,
      },
      detail: {
        summary: "Refresh access token",
        description: "Refreshes access token using refresh cookie",
        tags: ["Auth"],
      },
    },
  )
  .use(authGuard)
  .post(
    "/logout",
    async ({ user, cookie }) => {
      await authService.logout(user.id);
      cookie.refreshToken.set({
        value: "",
        ...clearRefreshCookieOptions,
      });
      return { message: "Logged out" };
    },
    {
      response: {
        200: errorResponse,
        401: errorResponse,
      },
      detail: {
        summary: "Logout",
        description: "Invalidates all tokens for current user",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
      },
    },
  );
