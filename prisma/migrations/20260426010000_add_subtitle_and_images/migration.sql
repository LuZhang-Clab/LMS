-- Migration: Add subtitle fields to Site, images to Project
-- Run with: npx prisma migrate dev --name add_subtitle_and_images
-- Or apply manually: npx prisma migrate deploy

-- Add subtitle fields to Site table
ALTER TABLE "Site" ADD COLUMN "subtitle_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Site" ADD COLUMN "subtitle_zh" TEXT NOT NULL DEFAULT '';

-- Add images JSON array to Project table
ALTER TABLE "Project" ADD COLUMN "images" TEXT NOT NULL DEFAULT '[]';
