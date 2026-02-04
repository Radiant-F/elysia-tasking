import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import { tasks, type NewTask, type Task } from "../../db/schema";

export type TaskListFilters = {
  cursor?: { createdAt: Date; id: string };
  limit: number;
  isImportant?: boolean;
  dueFrom?: Date;
  dueTo?: Date;
  isCompleted?: boolean;
};

export const taskRepository = {
  async createTask(data: NewTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  },

  async createSubtasks(data: NewTask[]): Promise<Task[]> {
    if (data.length === 0) return [];
    const created = await db.insert(tasks).values(data).returning();
    return created;
  },

  async findTaskById(userId: string, id: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
      .limit(1);
    return task;
  },

  async listTasks(userId: string, filters: TaskListFilters): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId), isNull(tasks.parentId)];

    if (filters.isImportant !== undefined) {
      conditions.push(eq(tasks.isImportant, filters.isImportant));
    }

    if (filters.isCompleted !== undefined) {
      conditions.push(eq(tasks.isCompleted, filters.isCompleted));
    }

    if (filters.dueFrom) {
      conditions.push(gte(tasks.dueAt, filters.dueFrom));
    }

    if (filters.dueTo) {
      conditions.push(lte(tasks.dueAt, filters.dueTo));
    }

    if (filters.cursor) {
      const { createdAt, id } = filters.cursor;
      const cursorCreatedAt = createdAt.toISOString();
      const cursorCondition = or(
        sql`${tasks.createdAt} < ${cursorCreatedAt}`,
        and(
          sql`${tasks.createdAt} = ${cursorCreatedAt}`,
          sql`${tasks.id} < ${id}`,
        ),
      );

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt), desc(tasks.id))
      .limit(filters.limit);
  },

  async listSubtasks(parentIds: string[]): Promise<Task[]> {
    if (parentIds.length === 0) return [];
    return db
      .select()
      .from(tasks)
      .where(inArray(tasks.parentId, parentIds))
      .orderBy(asc(tasks.createdAt), asc(tasks.id));
  },

  async updateTask(
    userId: string,
    id: string,
    data: Partial<NewTask>,
  ): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
      .returning();
    return task;
  },

  async deleteTask(userId: string, id: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, id)));
  },

  async countSubtasks(parentId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.parentId, parentId));
    return Number(result?.count ?? 0);
  },

  async findSubtask(
    userId: string,
    parentId: string,
    subtaskId: string,
  ): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.parentId, parentId),
          eq(tasks.id, subtaskId),
        ),
      )
      .limit(1);
    return task;
  },
};
