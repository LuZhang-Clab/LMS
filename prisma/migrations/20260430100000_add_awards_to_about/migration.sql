-- Add awards fields to About table
ALTER TABLE "About" ADD COLUMN "awards_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "About" ADD COLUMN "awards_zh" TEXT NOT NULL DEFAULT '';
