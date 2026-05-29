-- Drop news-related columns (news system removed)
ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "news_enabled";
ALTER TABLE "skills" DROP COLUMN IF EXISTS "news_cache";
