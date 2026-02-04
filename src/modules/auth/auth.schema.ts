import { t } from "elysia";

export const errorResponse = t.Object({
  message: t.String({ examples: ["Error description"] }),
});

export const signupBody = t.Object({
  username: t.String({
    minLength: 3,
    maxLength: 32,
    examples: ["johndoe"],
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    examples: ["securepass123"],
  }),
  rememberMe: t.Optional(
    t.Boolean({
      examples: [true],
    }),
  ),
});

export const signinBody = t.Object({
  username: t.String({
    minLength: 3,
    maxLength: 32,
    examples: ["johndoe"],
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    examples: ["securepass123"],
  }),
  rememberMe: t.Optional(
    t.Boolean({
      examples: [true],
    }),
  ),
});

export const userResponse = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  username: t.String({ examples: ["johndoe"] }),
});

export const authResponse = t.Object({
  accessToken: t.String({ examples: ["eyJhbGciOiJIUzI1NiIs..."] }),
  user: userResponse,
});
