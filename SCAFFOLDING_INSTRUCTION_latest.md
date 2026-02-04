# ElysiaJS Backend Scaffolding Instruction

You are a senior backend architect and TypeScript engineer.

Your task is to scaffold a production-ready backend project using the following stack and principles.
Follow ALL instructions carefully and do not skip steps or take shortcuts.

---

## CORE STACK & RUNTIME

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Runtime         | Bun                                                |
| Framework       | ElysiaJS                                           |
| Language        | TypeScript (strict mode)                           |
| Database        | PostgreSQL (already installed)                     |
| ORM             | Drizzle ORM (SQL-first, type-safe)                 |
| API Docs        | `@elysiajs/openapi` (OpenAPI 3.1 / Scalar UI)      |
| Client/Testing  | `@elysiajs/eden` (Eden Treaty)                     |
| Authentication  | `@elysiajs/jwt` (access + refresh token in cookie) |
| Testing         | `bun:test`                                         |
| Linting         | ESLint + TypeScript                                |
| Package Manager | Bun ONLY (`bun add` / `bun add -d`)                |

---

## KEY PATTERNS

> For detailed explanations, refer to the official documentation in REFERENCES section.

**Critical patterns to follow:**

1. **Use `t.*` (TypeBox)** for all validation—Elysia's type inference depends on it
2. **Export app type** for Eden Treaty: `export type App = typeof app`
3. **Use `.derive()`** for request-scoped context, `.decorate()` for app-wide singletons
4. **Plugins are scoped by default**—use `{ as: 'global' }` in derive/state to propagate
5. **Keep handlers thin**—delegate business logic to service layer
6. **DO NOT manually edit `package.json` WHEN adding packages**—always use `bun add` commands to avoid outdated package version

---

## REFERENCES

Consult the official ElysiaJS documentation for implementation details:

**Priority reads for this scaffold:**

1. [Validation](https://elysiajs.com/essential/validation) – TypeBox patterns
2. [Plugin](https://elysiajs.com/essential/plugin) – Composition patterns
3. [Extends Context](https://elysiajs.com/patterns/extends-context) – State, derive, decorate
4. [JWT Plugin](https://elysiajs.com/plugins/jwt) – Auth implementation
5. [Eden Treaty Unit Test](https://elysiajs.com/eden/treaty/unit-test) – Testing patterns
6. [Drizzle Integration](https://elysiajs.com/integrations/drizzle) – Database setup

**Additional resources:**

- [Route](https://elysiajs.com/essential/route) – Path patterns, methods
- [Handler](https://elysiajs.com/essential/handler) – Context object
- [Lifecycle](https://elysiajs.com/essential/life-cycle) – Request lifecycle hooks
- [Error Handling](https://elysiajs.com/patterns/error-handling) – Centralized errors
- [Cookie](https://elysiajs.com/patterns/cookie) – Reactive cookie handling
- [OpenAPI](https://elysiajs.com/patterns/openapi) – API documentation

---

## PROJECT ASSUMPTIONS

The user has already:

- Created a default ElysiaJS project using `bun create elysia`
- Installed PostgreSQL locally
- Has access to `psql`

The app must:

- **NEVER** auto-create databases or users
- Read database credentials from environment variables
- Use `DATABASE_URL` for database connection

---

## FOLDER STRUCTURE

```
project-root/
├── src/
│   ├── index.ts              # App composition & export type
│   ├── server.ts             # Bootstrap / listen
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── jwt.plugin.ts
│   │   │   └── auth.test.ts
│   │   │
│   │   └── user/
│   │       ├── user.routes.ts
│   │       ├── user.service.ts
│   │       ├── user.schema.ts
│   │       ├── user.repository.ts
│   │       └── user.test.ts
│   │
│   ├── db/
│   │   ├── index.ts          # Drizzle client instance
│   │   ├── schema/
│   │   │   ├── index.ts      # Export all schemas
│   │   │   └── users.ts      # User table schema
│   │   ├── migrations/       # Drizzle migrations
│   │   └── seed.ts           # Development seed script
│   │
│   ├── lib/
│   │   ├── env.ts            # Environment config with validation
│   │   └── errors.ts         # Custom error classes
│   │
│   └── plugins/
│       └── error-handler.ts  # Global error handler plugin
│
├── drizzle.config.ts
├── .env.example
├── tsconfig.json
├── eslint.config.js
└── package.json
```

**Structure Principles:**

1. **Feature-based modules** – Each module is self-contained
2. **Routes as plugins** – Export Elysia instances from route files
3. **Colocated tests** – Tests live next to the code they test
4. **Repository pattern** – Database operations isolated from business logic

---

## ENVIRONMENT CONFIGURATION

### .env.example

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Environment Validation (src/lib/env.ts)

```typescript
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: getEnvVar("ACCESS_TOKEN_EXPIRES_IN", "15m"),
  REFRESH_TOKEN_EXPIRES_IN: getEnvVar("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  PORT: parseInt(getEnvVar("PORT", "3000"), 10),
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
} as const;
```

---

## DATABASE SETUP (DRIZZLE ORM)

### Schema Definition (src/db/schema/users.ts)

```typescript
import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  tokenVersion: integer("token_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Drizzle Client (src/db/index.ts)

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## SCHEMA PATTERN (Single Source of Truth)

All schemas should follow this pattern with OpenAPI metadata:

```typescript
// src/modules/{feature}/{feature}.schema.ts
import { t } from "elysia";

// Reusable error response
export const errorResponse = t.Object({
  message: t.String({ examples: ["Error description"] }),
});

// Request schemas with validation + examples
export const createUserBody = t.Object({
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
});

// Response schemas with examples
export const userResponse = t.Object({
  id: t.String({ examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  username: t.String({ examples: ["johndoe"] }),
});

export const authResponse = t.Object({
  accessToken: t.String({ examples: ["eyJhbGciOiJIUzI1NiIs..."] }),
  user: userResponse,
});
```

---

## REPOSITORY PATTERN

```typescript
// src/modules/user/user.repository.ts
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users, type User, type NewUser } from "../../db/schema";

export const userRepository = {
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  },

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  },

  async incrementTokenVersion(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  },
};
```

---

## AUTHENTICATION MODEL

### Token Strategy

| Token         | Lifetime | Storage                 | Purpose            |
| ------------- | -------- | ----------------------- | ------------------ |
| Access Token  | 15 min   | Authorization header    | API authentication |
| Refresh Token | 7 days   | HTTP-only secure cookie | Token renewal      |

**Token Version:** Store `tokenVersion` in users table. Include in JWT payload. Compare on verification. Increment on logout to invalidate all tokens.

### JWT Plugin (src/modules/auth/jwt.plugin.ts)

```typescript
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../../lib/env";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "accessJwt",
      secret: env.JWT_ACCESS_SECRET,
    }),
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: env.JWT_REFRESH_SECRET,
    }),
  );
```

### Auth Guard (src/modules/auth/auth.guard.ts)

```typescript
import { Elysia } from "elysia";
import { jwtPlugin } from "./jwt.plugin";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const authGuard = new Elysia({ name: "authGuard" })
  .use(jwtPlugin)
  .derive({ as: "global" }, async ({ accessJwt, headers, set }) => {
    const authorization = headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Missing authorization header");
    }

    const token = authorization.slice(7);
    const payload = await accessJwt.verify(token);

    if (!payload || typeof payload === "boolean") {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }

    const sub = payload.sub as string;
    const tokenVersion = payload.tokenVersion as number;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!user || user.tokenVersion !== tokenVersion) {
      set.status = 401;
      throw new Error("Token revoked");
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        tokenVersion: user.tokenVersion,
      },
    };
  });
```

---

## API ENDPOINTS

| Method | Path            | Auth     | Description           |
| ------ | --------------- | -------- | --------------------- |
| POST   | `/auth/signup`  | Public   | Register new user     |
| POST   | `/auth/signin`  | Public   | Login, issue tokens   |
| POST   | `/auth/refresh` | Cookie   | Refresh access token  |
| POST   | `/auth/logout`  | Required | Invalidate all tokens |
| GET    | `/users/me`     | Required | Get current user      |
| PUT    | `/users/me`     | Required | Update current user   |
| DELETE | `/users/me`     | Required | Delete current user   |
| GET    | `/health`       | Public   | Health check          |

---

## ROUTE IMPLEMENTATION PATTERN

```typescript
// src/modules/auth/auth.routes.ts
import { Elysia } from "elysia";
import { signupBody, authResponse, errorResponse } from "./auth.schema";
import { authService } from "./auth.service";
import { jwtPlugin } from "./jwt.plugin";

export const authRoutes = new Elysia({ prefix: "/auth" }).use(jwtPlugin).post(
  "/signup",
  async ({ body, accessJwt, refreshJwt, cookie, set }) => {
    try {
      const result = await authService.signup(body);

      const accessToken = await accessJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
      });

      const refreshToken = await refreshJwt.sign({
        sub: result.user.id,
        tokenVersion: result.user.tokenVersion,
      });

      cookie.refreshToken.set({
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return { accessToken, user: result.user };
    } catch (err) {
      if (err instanceof ConflictError) {
        set.status = 409;
        return { message: err.message };
      }
      throw err;
    }
  },
  {
    body: signupBody,
    response: {
      200: authResponse,
      400: errorResponse,
      409: errorResponse,
    },
    detail: {
      summary: "Register a new user",
      description: "Creates a new user account and returns access token",
      tags: ["Auth"],
    },
  },
);
```

---

## API DOCUMENTATION (OpenAPI)

```typescript
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia().use(
  openapi({
    path: "/docs",
    documentation: {
      info: {
        title: "My API",
        version: "1.0.0",
        description: "Production-ready ElysiaJS API",
      },
      tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Users", description: "User management endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  }),
);
```

**Every route MUST include:**

- `detail.summary` – Short description
- `detail.tags` – Category grouping
- `body` schema with `examples`
- `response` schemas for all status codes
- `detail.security` for protected routes

---

## TESTING WITH EDEN TREATY

### Important: Eden Treaty Parameter Structure

When calling API methods with Eden Treaty, use the correct parameter pattern:

```typescript
// GET/HEAD with headers
api.users.me.get({
  headers: { authorization: `Bearer ${token}` },
});

// POST/PUT/DELETE with body AND headers (two arguments)
api.auth.signup.post(
  { username: "john", password: "secret123" }, // body (first arg)
  { headers: { authorization: `Bearer ${token}` } }, // options (second arg)
);

// POST/DELETE with headers but NO body - pass empty object as body
api.auth.logout.post(
  {}, // empty body (required first arg)
  { headers: { authorization: `Bearer ${token}` } },
);
```

### Important: Validation Error Status Code

ElysiaJS returns **422 Unprocessable Entity** for validation errors (not 400):

```typescript
it("should return 422 for invalid data", async () => {
  const { error } = await api.auth.signup.post({
    username: "ab", // too short, fails minLength: 3
    password: "short",
  });
  expect(error?.status).toBe(422); // NOT 400
});
```

### Test Example

```typescript
// src/modules/auth/auth.test.ts
import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../../index";

const api = treaty(app);

describe("Auth Module", () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "securePassword123",
  };

  describe("POST /auth/signup", () => {
    it("should register a new user with valid data", async () => {
      const { data, error } = await api.auth.signup.post(testUser);

      expect(error).toBeNull();
      expect(data?.accessToken).toBeDefined();
      expect(data?.user.username).toBe(testUser.username);
    });

    it("should return 409 for duplicate username", async () => {
      const { error } = await api.auth.signup.post(testUser);
      expect(error?.status).toBe(409);
    });

    it("should return 422 for validation error", async () => {
      const { error } = await api.auth.signup.post({
        username: "ab",
        password: "short",
      });
      expect(error?.status).toBe(422);
    });
  });
});
```

### Test Coverage Checklist

**Auth Module:**

- [ ] Signup: valid data → 200 + tokens
- [ ] Signup: duplicate username → 409
- [ ] Signup: invalid data → 422 (validation error)
- [ ] Signin: valid credentials → 200 + tokens
- [ ] Signin: wrong password → 401
- [ ] Signin: non-existent user → 401
- [ ] Refresh: valid cookie → 200 + new token
- [ ] Refresh: invalid cookie → 401
- [ ] Logout: valid token → 200 + invalidates sessions

**Protected Routes:**

- [ ] No token → 401
- [ ] Invalid token → 401
- [ ] Revoked token (after logout) → 401
- [ ] Valid token → 200

**User Module:**

- [ ] GET /me → returns profile
- [ ] PUT /me → updates profile
- [ ] PUT /me: invalid data → 422
- [ ] DELETE /me → deletes account

---

## CONFIGURATION FILES

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "declaration": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### eslint.config.js

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["node_modules/", "dist/", "src/db/migrations/", "*.config.*"],
  },
);
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "bun run --watch src/server.ts",
    "build": "bun build src/server.ts --outdir ./dist",
    "start": "bun run dist/server.js",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "validate": "bun run lint && bun run typecheck && bun test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run src/db/seed.ts"
  }
}
```

---

## FINAL VALIDATION

After scaffolding, run:

```bash
bun run validate
```

This must pass with **zero errors**.

---

## SETUP.md OUTPUT

Create a `SETUP.md` with:

```markdown
# Project Setup

## Prerequisites

- Bun >= 1.0
- PostgreSQL >= 14

## Database Setup

> ⚠️ The application does NOT auto-create databases.

\`\`\`bash
createdb myapp_dev
\`\`\`

## Environment Setup

\`\`\`bash
cp .env.example .env

# Edit .env with your values

\`\`\`

## Install & Run

\`\`\`bash
bun install
bun run db:generate
bun run db:migrate
bun run dev
\`\`\`

- API: http://localhost:3000
- Docs: http://localhost:3000/docs

## Testing

\`\`\`bash
bun test
\`\`\`
```
