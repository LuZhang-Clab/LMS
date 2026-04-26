-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'site',
    "title_en" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'about',
    "name_en" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "bio_en" TEXT NOT NULL,
    "bio_zh" TEXT NOT NULL,
    "quote_en" TEXT NOT NULL,
    "quote_zh" TEXT NOT NULL,
    "education_en" TEXT NOT NULL,
    "education_zh" TEXT NOT NULL,
    "photo" TEXT NOT NULL DEFAULT '/images/about/0.jpg'
);

-- CreateTable
CREATE TABLE "WorkExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title_en" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "detail_folder" TEXT NOT NULL,
    "content_zh" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title_en" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "desc_en" TEXT NOT NULL,
    "desc_zh" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "cover" TEXT NOT NULL DEFAULT '',
    "image_folder" TEXT NOT NULL,
    "content_zh" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Project_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
