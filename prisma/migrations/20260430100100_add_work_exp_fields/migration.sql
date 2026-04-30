-- Add images and cover fields to WorkExperience
ALTER TABLE "WorkExperience" ADD COLUMN "images" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "WorkExperience" ADD COLUMN "cover" TEXT NOT NULL DEFAULT '';
