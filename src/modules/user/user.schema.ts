import { t } from "elysia";

export const errorResponse = t.Object({
  message: t.String({ examples: ["Error description"] }),
});

export const userResponse = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  username: t.String({ examples: ["johndoe"] }),
});

export const updateUserBody = t.Object(
  {
    username: t.Optional(
      t.String({
        minLength: 3,
        maxLength: 32,
        examples: ["newusername"],
      }),
    ),
    password: t.Optional(
      t.String({
        minLength: 8,
        maxLength: 128,
        examples: ["newsecurepass123"],
      }),
    ),
  },
  {
    minProperties: 1,
  },
);
