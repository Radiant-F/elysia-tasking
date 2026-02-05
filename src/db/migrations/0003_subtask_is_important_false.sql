UPDATE "tasks"
SET "is_important" = false
WHERE "parent_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks"
	ADD CONSTRAINT "tasks_subtask_is_important_false"
	CHECK ("parent_id" IS NULL OR "is_important" = false);
