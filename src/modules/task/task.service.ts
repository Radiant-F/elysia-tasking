import { BadRequestError, NotFoundError } from "../../lib/errors";
import { taskRepository } from "./task.repository";

const MAX_SUBTASKS = 10;

type TaskInput = {
  title: string;
  description?: string;
  isImportant?: boolean;
  dueAt?: string;
  isCompleted?: boolean;
};

type TaskUpdateInput = {
  title?: string;
  description?: string;
  isImportant?: boolean;
  dueAt?: string;
  isCompleted?: boolean;
};

type ListQuery = {
  limit?: number;
  cursor?: string;
  isImportant?: boolean | string;
  dueFrom?: string;
  dueTo?: string;
  isCompleted?: boolean | string;
};

const parseOptionalDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError("Invalid date format");
  }
  return date;
};

const parseBoolean = (value?: boolean | string): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new BadRequestError("Invalid boolean value");
};

const encodeCursor = (createdAt: Date, id: string): string =>
  Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id }),
  ).toString("base64");

const decodeCursor = (cursor: string): { createdAt: Date; id: string } => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { createdAt: string; id: string };
    if (!parsed?.createdAt || !parsed?.id) {
      throw new Error("Invalid cursor");
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor date");
    }

    return { createdAt, id: parsed.id };
  } catch {
    throw new BadRequestError("Invalid cursor");
  }
};

const toResponse = (task: {
  id: string;
  title: string;
  description: string | null;
  isImportant: boolean;
  dueAt: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: task.id,
  title: task.title,
  description: task.description ?? null,
  isImportant: task.isImportant,
  dueAt: task.dueAt ? task.dueAt.toISOString() : null,
  isCompleted: task.isCompleted,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});

export const taskService = {
  async createTask(
    userId: string,
    input: TaskInput & { subtasks?: TaskInput[] },
  ) {
    const subtasks = input.subtasks ?? [];
    if (subtasks.length > MAX_SUBTASKS) {
      throw new BadRequestError("Subtasks limit exceeded");
    }

    const task = await taskRepository.createTask({
      userId,
      title: input.title,
      description: input.description ?? null,
      isImportant: input.isImportant ?? false,
      dueAt: parseOptionalDate(input.dueAt) ?? null,
      isCompleted: input.isCompleted ?? false,
    });

    const createdSubtasks = await taskRepository.createSubtasks(
      subtasks.map((subtask) => ({
        userId,
        parentId: task.id,
        title: subtask.title,
        description: subtask.description ?? null,
        isImportant: subtask.isImportant ?? false,
        dueAt: null,
        isCompleted: subtask.isCompleted ?? false,
      })),
    );

    return {
      ...toResponse(task),
      subtasks: createdSubtasks.map(toResponse),
    };
  },

  async addSubtasks(userId: string, taskId: string, subtasks: TaskInput[]) {
    const task = await taskRepository.findTaskById(userId, taskId);
    if (!task || task.parentId) {
      throw new NotFoundError("Task not found");
    }

    const existingCount = await taskRepository.countSubtasks(taskId);
    if (existingCount + subtasks.length > MAX_SUBTASKS) {
      throw new BadRequestError("Subtasks limit exceeded");
    }

    await taskRepository.createSubtasks(
      subtasks.map((subtask) => ({
        userId,
        parentId: taskId,
        title: subtask.title,
        description: subtask.description ?? null,
        isImportant: subtask.isImportant ?? false,
        dueAt: null,
        isCompleted: subtask.isCompleted ?? false,
      })),
    );

    const allSubtasks = await taskRepository.listSubtasks([taskId]);

    return {
      ...toResponse(task),
      subtasks: allSubtasks.map(toResponse),
    };
  },

  async listTasks(userId: string, query: ListQuery) {
    const limit = Math.min(query.limit ?? 20, 50);
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;

    const tasks = await taskRepository.listTasks(userId, {
      limit: limit + 1,
      cursor,
      isImportant: parseBoolean(query.isImportant),
      dueFrom: parseOptionalDate(query.dueFrom),
      dueTo: parseOptionalDate(query.dueTo),
      isCompleted: parseBoolean(query.isCompleted),
    });

    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, limit) : tasks;

    const subtasks = await taskRepository.listSubtasks(
      items.map((task) => task.id),
    );

    const subtasksByParent = subtasks.reduce<Record<string, typeof subtasks>>(
      (acc, subtask) => {
        if (!subtask.parentId) return acc;
        acc[subtask.parentId] = acc[subtask.parentId] ?? [];
        acc[subtask.parentId].push(subtask);
        return acc;
      },
      {},
    );

    const nextCursor = hasMore
      ? encodeCursor(
          items[items.length - 1].createdAt,
          items[items.length - 1].id,
        )
      : null;

    return {
      items: items.map((task) => ({
        ...toResponse(task),
        subtasks: (subtasksByParent[task.id] ?? []).map(toResponse),
      })),
      nextCursor,
    };
  },

  async getTask(userId: string, id: string) {
    const task = await taskRepository.findTaskById(userId, id);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const subtasks = await taskRepository.listSubtasks([task.id]);

    return {
      ...toResponse(task),
      subtasks: subtasks.map(toResponse),
    };
  },

  async updateTask(userId: string, id: string, input: TaskUpdateInput) {
    const existing = await taskRepository.findTaskById(userId, id);
    if (!existing) {
      throw new NotFoundError("Task not found");
    }

    const updated = await taskRepository.updateTask(userId, id, {
      title: input.title,
      description: input.description ?? null,
      isImportant: input.isImportant,
      dueAt: parseOptionalDate(input.dueAt),
      isCompleted: input.isCompleted,
    });

    const subtasks = await taskRepository.listSubtasks([updated.id]);

    return {
      ...toResponse(updated),
      subtasks: subtasks.map(toResponse),
    };
  },

  async updateSubtask(
    userId: string,
    taskId: string,
    subtaskId: string,
    input: TaskUpdateInput,
  ) {
    const parent = await taskRepository.findTaskById(userId, taskId);
    if (!parent || parent.parentId) {
      throw new NotFoundError("Task not found");
    }

    const subtask = await taskRepository.findSubtask(userId, taskId, subtaskId);
    if (!subtask) {
      throw new NotFoundError("Subtask not found");
    }

    const updated = await taskRepository.updateTask(userId, subtaskId, {
      title: input.title,
      description: input.description ?? null,
      isImportant: input.isImportant,
      dueAt: null,
      isCompleted: input.isCompleted,
    });

    return {
      ...toResponse(updated),
      subtasks: [],
    };
  },

  async deleteTask(userId: string, id: string) {
    const existing = await taskRepository.findTaskById(userId, id);
    if (!existing) {
      throw new NotFoundError("Task not found");
    }

    await taskRepository.deleteTask(userId, id);
  },

  async deleteSubtask(userId: string, taskId: string, subtaskId: string) {
    const parent = await taskRepository.findTaskById(userId, taskId);
    if (!parent || parent.parentId) {
      throw new NotFoundError("Task not found");
    }

    const subtask = await taskRepository.findSubtask(userId, taskId, subtaskId);
    if (!subtask) {
      throw new NotFoundError("Subtask not found");
    }

    await taskRepository.deleteTask(userId, subtaskId);
  },
};
