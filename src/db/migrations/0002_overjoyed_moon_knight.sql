ALTER TABLE "tasks" RENAME COLUMN "status" TO "is_completed";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "is_completed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tasks"
	ALTER COLUMN "is_completed" TYPE boolean
	USING ("is_completed" = 'done');--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "is_completed" SET DEFAULT false;--> statement-breakpoint
DROP TYPE "public"."task_status";