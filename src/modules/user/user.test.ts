import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../../index";

const api = treaty(app);

describe("User Module", () => {
  it("should return profile for authenticated user", async () => {
    const signup = await api.auth.signup.post({
      username: `profile_${Date.now()}`,
      password: "securePassword123",
    });

    const token = signup.data?.accessToken ?? "";

    const { data, error } = await api.users.me.get({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(error).toBeNull();
    expect(data?.username).toContain("profile_");
  });

  it("should update profile", async () => {
    const signup = await api.auth.signup.post({
      username: `update_${Date.now()}`,
      password: "securePassword123",
    });

    const token = signup.data?.accessToken ?? "";

    const { data, error } = await api.users.me.put(
      { username: `updated_${Date.now()}` },
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(error).toBeNull();
    expect(data?.username).toContain("updated_");
  });

  it("should delete profile", async () => {
    const signup = await api.auth.signup.post({
      username: `delete_${Date.now()}`,
      password: "securePassword123",
    });

    const token = signup.data?.accessToken ?? "";

    const { error } = await api.users.me.delete(
      {},
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(error).toBeNull();
  });
});
