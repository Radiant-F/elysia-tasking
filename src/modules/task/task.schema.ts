import { t } from "elysia";

export const errorResponse = t.Object({
  message: t.String({ examples: ["Error description"] }),
});

const dateTime = t.String({
  format: "date-time",
  examples: ["2026-02-04T10:00:00.000Z"],
});

export const subtaskInput = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    examples: ["Draft proposal"],
  }),
  description: t.Optional(
    t.String({
      maxLength: 2000,
      examples: ["Write the first draft"],
    }),
  ),
  isImportant: t.Optional(t.Boolean({ examples: [false] })),
  isCompleted: t.Optional(t.Boolean({ examples: [false] })),
});

export const createTaskBody = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    examples: ["Prepare report"],
  }),
  description: t.Optional(
    t.String({
      maxLength: 2000,
      examples: ["Include Q4 highlights"],
    }),
  ),
  isImportant: t.Optional(t.Boolean({ examples: [true] })),
  dueAt: t.Optional(dateTime),
  isCompleted: t.Optional(t.Boolean({ examples: [false] })),
  subtasks: t.Optional(t.Array(subtaskInput, { maxItems: 10 })),
});

export const updateTaskBody = t.Object(
  {
    title: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 200,
        examples: ["Prepare report v2"],
      }),
    ),
    description: t.Optional(
      t.String({
        maxLength: 2000,
        examples: ["Add more charts"],
      }),
    ),
    isImportant: t.Optional(t.Boolean({ examples: [false] })),
    dueAt: t.Optional(dateTime),
    isCompleted: t.Optional(t.Boolean({ examples: [false] })),
  },
  { minProperties: 1 },
);

export const addSubtasksBody = t.Object({
  subtasks: t.Array(subtaskInput, { minItems: 1, maxItems: 10 }),
});

export const taskResponse = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  title: t.String({ examples: ["Prepare report"] }),
  description: t.Union([t.String(), t.Null()]),
  isImportant: t.Boolean({ examples: [false] }),
  dueAt: t.Union([dateTime, t.Null()]),
  isCompleted: t.Boolean({ examples: [false] }),
  createdAt: dateTime,
  updatedAt: dateTime,
  subtasks: t.Array(
    t.Object({
      id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
      title: t.String({ examples: ["Draft proposal"] }),
      description: t.Union([t.String(), t.Null()]),
      isImportant: t.Boolean({ examples: [false] }),
      isCompleted: t.Boolean({ examples: [false] }),
      createdAt: dateTime,
      updatedAt: dateTime,
    }),
  ),
});

export const taskListResponse = t.Object({
  items: t.Array(taskResponse),
  nextCursor: t.Union([
    t.String({ examples: ["eyJjcmVhdGVkQXQiOiI..."] }),
    t.Null(),
  ]),
});

export const listTasksQuery = t.Object({
  limit: t.Optional(t.Integer({ minimum: 1, maximum: 50, examples: [20] })),
  cursor: t.Optional(t.String({ examples: ["eyJjcmVhdGVkQXQiOiI..."] })),
  isImportant: t.Optional(t.Boolean({ examples: [true] })),
  dueFrom: t.Optional(dateTime),
  dueTo: t.Optional(dateTime),
  isCompleted: t.Optional(t.Boolean({ examples: [false] })),
});

export const taskIdParams = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
});

export const subtaskParams = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  subtaskId: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
});
