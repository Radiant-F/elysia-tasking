import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../../index";

const api = treaty(app);

const signupAndToken = async () => {
  const suffix = `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const signup = await api.auth.signup.post({
    username: `task_${suffix}`,
    password: "securePassword123",
  });

  if (signup.error || !signup.data?.accessToken) {
    throw new Error("Failed to sign up test user");
  }

  return signup.data.accessToken;
};

describe("Task Module", () => {
  it("should create task with subtasks", async () => {
    const token = await signupAndToken();

    const { data, error } = await api.tasks.post(
      {
        title: "Parent Task",
        subtasks: [{ title: "Subtask 1" }, { title: "Subtask 2" }],
      },
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(error).toBeNull();
    expect(data?.subtasks.length).toBe(2);
  });

  it("should reject more than 10 subtasks", async () => {
    const token = await signupAndToken();

    const subtasks = Array.from({ length: 11 }, (_, index) => ({
      title: `Subtask ${index + 1}`,
    }));

    const { error } = await api.tasks.post(
      { title: "Too many", subtasks },
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(error?.status).toBe(422);
  });

  it("should paginate tasks with cursor", async () => {
    const token = await signupAndToken();

    for (let i = 0; i < 5; i += 1) {
      await api.tasks.post(
        { title: `Task ${i}` },
        { headers: { authorization: `Bearer ${token}` } },
      );
    }

    const firstPage = await api.tasks.get({
      headers: { authorization: `Bearer ${token}` },
      query: { limit: 2 },
    });

    expect(firstPage.error).toBeNull();
    expect(firstPage.data?.items.length).toBe(2);
    expect(firstPage.data?.nextCursor).toBeTruthy();

    const secondPage = await api.tasks.get({
      headers: { authorization: `Bearer ${token}` },
      query: { limit: 2, cursor: firstPage.data?.nextCursor ?? undefined },
    });

    expect(secondPage.error).toBeNull();
    expect(secondPage.data?.items.length).toBe(2);
  });

  it("should filter by importance", async () => {
    const token = await signupAndToken();

    await api.tasks.post(
      { title: "Important", isImportant: true },
      { headers: { authorization: `Bearer ${token}` } },
    );

    const { data, error } = await api.tasks.get({
      headers: { authorization: `Bearer ${token}` },
      query: { isImportant: true },
    });

    expect(error).toBeNull();
    expect(data?.items.some((task) => task.isImportant)).toBe(true);
  });
});
