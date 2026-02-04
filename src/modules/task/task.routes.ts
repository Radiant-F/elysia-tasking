import { Elysia } from "elysia";
import { authGuard } from "../auth/auth.guard";
import { taskService } from "./task.service";
import {
  addSubtasksBody,
  createTaskBody,
  errorResponse,
  listTasksQuery,
  subtaskParams,
  taskIdParams,
  taskListResponse,
  taskResponse,
  updateTaskBody,
} from "./task.schema";

export const taskRoutes = new Elysia({ prefix: "/tasks" })
  .use(authGuard)
  .post("/", async ({ user, body }) => taskService.createTask(user.id, body), {
    body: createTaskBody,
    response: {
      200: taskResponse,
      400: errorResponse,
      401: errorResponse,
      422: errorResponse,
    },
    detail: {
      summary: "Create task",
      description: "Creates a task with optional nested subtasks",
      tags: ["Tasks"],
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/", async ({ user, query }) => taskService.listTasks(user.id, query), {
    query: listTasksQuery,
    response: {
      200: taskListResponse,
      400: errorResponse,
      401: errorResponse,
    },
    detail: {
      summary: "List tasks",
      description: "Lists tasks with cursor pagination",
      tags: ["Tasks"],
      security: [{ bearerAuth: [] }],
    },
  })
  .get(
    "/:id",
    async ({ user, params }) => taskService.getTask(user.id, params.id),
    {
      params: taskIdParams,
      response: {
        200: taskResponse,
        401: errorResponse,
        404: errorResponse,
      },
      detail: {
        summary: "Get task",
        description: "Returns a task with its subtasks",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .put(
    "/:id",
    async ({ user, params, body }) =>
      taskService.updateTask(user.id, params.id, body),
    {
      params: taskIdParams,
      body: updateTaskBody,
      response: {
        200: taskResponse,
        400: errorResponse,
        401: errorResponse,
        404: errorResponse,
        422: errorResponse,
      },
      detail: {
        summary: "Update task",
        description: "Updates task fields",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .delete(
    "/:id",
    async ({ user, params }) => {
      await taskService.deleteTask(user.id, params.id);
      return { message: "Task deleted" };
    },
    {
      params: taskIdParams,
      response: {
        200: errorResponse,
        401: errorResponse,
        404: errorResponse,
      },
      detail: {
        summary: "Delete task",
        description: "Deletes a task and its subtasks",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .post(
    "/:id/subtasks",
    async ({ user, params, body }) =>
      taskService.addSubtasks(user.id, params.id, body.subtasks),
    {
      params: taskIdParams,
      body: addSubtasksBody,
      response: {
        200: taskResponse,
        400: errorResponse,
        401: errorResponse,
        404: errorResponse,
        422: errorResponse,
      },
      detail: {
        summary: "Add subtasks",
        description: "Adds subtasks to an existing task",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .put(
    "/:id/subtasks/:subtaskId",
    async ({ user, params, body }) =>
      taskService.updateSubtask(user.id, params.id, params.subtaskId, body),
    {
      params: subtaskParams,
      body: updateTaskBody,
      response: {
        200: taskResponse,
        400: errorResponse,
        401: errorResponse,
        404: errorResponse,
        422: errorResponse,
      },
      detail: {
        summary: "Update subtask",
        description: "Updates a subtask",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .delete(
    "/:id/subtasks/:subtaskId",
    async ({ user, params }) => {
      await taskService.deleteSubtask(user.id, params.id, params.subtaskId);
      return { message: "Subtask deleted" };
    },
    {
      params: subtaskParams,
      response: {
        200: errorResponse,
        401: errorResponse,
        404: errorResponse,
      },
      detail: {
        summary: "Delete subtask",
        description: "Deletes a subtask",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
      },
    },
  );
