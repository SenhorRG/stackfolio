-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('related', 'alternative', 'prerequisite', 'advanced', 'ecosystem');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "urls" JSONB,
    "resources" JSONB,
    "news_cache" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "based_on_profile_id" TEXT,
    "profile_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_skills" (
    "profile_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "years" DOUBLE PRECISION,
    "highlight" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profile_skills_pkey" PRIMARY KEY ("profile_id","skill_id")
);

-- CreateTable
CREATE TABLE "resume_projects" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Resume',
    "theme" TEXT NOT NULL DEFAULT 'classic',
    "font" TEXT NOT NULL DEFAULT 'inter',
    "spacing" TEXT NOT NULL DEFAULT 'normal',
    "section_order" JSONB NOT NULL,
    "visibility" JSONB NOT NULL,
    "divider_style" TEXT NOT NULL DEFAULT 'line',
    "page_count" INTEGER NOT NULL DEFAULT 1,
    "json_layout" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_relations" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "relation_type" "RelationType" NOT NULL,

    CONSTRAINT "skill_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" TEXT NOT NULL,
    "news_enabled" BOOLEAN NOT NULL DEFAULT true,
    "recent_profile_ids" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "resume_projects_profile_id_idx" ON "resume_projects"("profile_id");

-- CreateIndex
CREATE INDEX "skill_relations_source_id_idx" ON "skill_relations"("source_id");

-- CreateIndex
CREATE INDEX "skill_relations_target_id_idx" ON "skill_relations"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_relations_source_id_target_id_relation_type_key" ON "skill_relations"("source_id", "target_id", "relation_type");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_based_on_profile_id_fkey" FOREIGN KEY ("based_on_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_relations" ADD CONSTRAINT "skill_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_relations" ADD CONSTRAINT "skill_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
