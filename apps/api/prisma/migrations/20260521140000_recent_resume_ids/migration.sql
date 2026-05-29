-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "recent_resume_ids" JSONB NOT NULL DEFAULT '[]';
