import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../../index";

const api = treaty(app);

const extractRefreshCookie = (setCookie: string | null): string | null => {
  if (!setCookie) return null;
  const [cookie] = setCookie.split(";");
  return cookie ?? null;
};

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

const extractMaxAge = (setCookie: string | null): number | null => {
  if (!setCookie) return null;
  const match = /Max-Age=(\d+)/i.exec(setCookie);
  if (!match) return null;
  return Number(match[1]);
};

describe("Auth Module", () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "securePassword123",
  };

  it("signup should register a new user", async () => {
    const { data, error } = await api.auth.signup.post(testUser);

    expect(error).toBeNull();
    expect(data?.accessToken).toBeDefined();
    expect(data?.user.username).toBe(testUser.username);
  });

  it("signup should return 409 for duplicate username", async () => {
    const { error } = await api.auth.signup.post(testUser);
    expect(error?.status).toBe(409);
  });

  it("signup should return 422 for invalid data", async () => {
    const { error } = await api.auth.signup.post({
      username: "ab",
      password: "short",
    });

    expect(error?.status).toBe(422);
  });

  it("signin should return tokens", async () => {
    const { data, error } = await api.auth.signin.post(testUser);

    expect(error).toBeNull();
    expect(data?.accessToken).toBeDefined();
  });

  it("signin with rememberMe should set long refresh cookie", async () => {
    const user = {
      username: `remember_${Date.now()}`,
      password: "securePassword123",
    };

    await api.auth.signup.post(user);

    const signin = await api.auth.signin.post({
      ...user,
      rememberMe: true,
    });

    const maxAge = extractMaxAge(
      signin.response?.headers.get("set-cookie") ?? null,
    );

    const expected = parseDurationToSeconds(
      process.env.REMEMBER_ME_REFRESH_EXPIRES_IN ?? "30d",
    );

    expect(maxAge).toBe(expected);
  });

  it("signin should return 401 for wrong password", async () => {
    const { error } = await api.auth.signin.post({
      username: testUser.username,
      password: "wrongpassword",
    });

    expect(error?.status).toBe(401);
  });

  it("refresh should return a new access token", async () => {
    const signup = await api.auth.signup.post({
      username: `refresh_${Date.now()}`,
      password: "securePassword123",
    });

    const cookie = extractRefreshCookie(
      signup.response?.headers.get("set-cookie") ?? null,
    );

    const { data, error } = await api.auth.refresh.post(
      {},
      {
        headers: {
          cookie: cookie ?? "",
        },
      },
    );

    expect(error).toBeNull();
    expect(data?.accessToken).toBeDefined();
  });

  it("logout should revoke token", async () => {
    const signup = await api.auth.signup.post({
      username: `logout_${Date.now()}`,
      password: "securePassword123",
    });

    const token = signup.data?.accessToken ?? "";

    const { error } = await api.auth.logout.post(
      {},
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );

    expect(error).toBeNull();
  });
});
