import {
  boolean,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    title: text("title").notNull(),
    description: text("description"),
    isImportant: boolean("is_important").notNull().default(false),
    dueAt: timestamp("due_at", { withTimezone: true }),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("tasks_user_created_idx").on(
      table.userId,
      table.createdAt,
      table.id,
    ),
    parentIdx: index("tasks_parent_idx").on(table.parentId),
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "tasks_parent_fk",
    }).onDelete("cascade"),
  }),
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
