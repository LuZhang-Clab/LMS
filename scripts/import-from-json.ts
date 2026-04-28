/**
 * import-from-json.ts
 *
 * Reads the original data.json and upserts all records into the PostgreSQL database
 * via Prisma. Run with: npx tsx scripts/import-from-json.ts
 *
 * Prerequisites:
 *   1. DATABASE_URL is set in .env
 *   2. Prisma Client is generated: npx prisma generate
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── Types matching data.json ────────────────────────────────────────────────

interface ContentBlock {
  type: "heading" | "text" | "images" | "link";
  text?: string;
  files?: string[];
  url?: string;
}

interface DataProject {
  id: string;
  title_en: string;
  title_zh: string;
  cover: string;
  imageFolder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface DataCategory {
  id: string;
  name_en: string;
  name_zh: string;
  projects: DataProject[];
}

interface DataWorkExperience {
  id: string;
  title_en: string;
  title_zh: string;
  period: string;
  detailFolder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface DataService {
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
}

interface DataSite {
  title_en: string;
  title_zh: string;
}

interface DataAbout {
  name_en: string;
  name_zh: string;
  title_en: string;
  title_zh: string;
  bio_en: string;
  bio_zh: string;
  quote_en: string;
  quote_zh: string;
  education_en: string;
  education_zh: string;
  photo: string;
}

interface DataLinks {
  linkedin: string;
  github: string;
  replit: string;
  xiaohongshu: string;
  email: string;
}

interface DataFile {
  site: DataSite;
  about: DataAbout;
  workExperience: DataWorkExperience[];
  services: DataService[];
  links: DataLinks;
  categories: DataCategory[];
}

// ─── ContentBlock[] → HTML ───────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentBlocksToHtml(blocks: ContentBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h3>${escapeHtml(block.text ?? "")}</h3>`;
        case "text":
          return `<p>${(block.text ?? "").split("\n").map(escapeHtml).join("<br>")}</p>`;
        case "images": {
          const files = block.files ?? [];
          if (files.length === 0) return "";
          return files.map((f) => `<p><img src="${escapeHtml(f)}" alt="" /></p>`).join("");
        }
        case "link":
          return `<p><a href="${escapeHtml(block.url ?? "")}">${escapeHtml(block.text ?? "")}</a></p>`;
        default:
          return "";
      }
    })
    .join("");
}

interface DataProject {
  id: string;
  title_en: string;
  title_zh: string;
  cover: string;
  imageFolder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface DataCategory {
  id: string;
  name_en: string;
  name_zh: string;
  projects: DataProject[];
}

interface DataWorkExperience {
  id: string;
  title_en: string;
  title_zh: string;
  period: string;
  detailFolder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface DataService {
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
}

interface DataSite {
  title_en: string;
  title_zh: string;
}

interface DataAbout {
  name_en: string;
  name_zh: string;
  title_en: string;
  title_zh: string;
  bio_en: string;
  bio_zh: string;
  quote_en: string;
  quote_zh: string;
  education_en: string;
  education_zh: string;
  photo: string;
}

interface DataLinks {
  linkedin: string;
  github: string;
  replit: string;
  xiaohongshu: string;
  email: string;
}

interface DataFile {
  site: DataSite;
  about: DataAbout;
  workExperience: DataWorkExperience[];
  services: DataService[];
  links: DataLinks;
  categories: DataCategory[];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Find data.json — look in the project root (next-app/)
  const scriptDir = __dirname;
  const projectRoot = path.resolve(scriptDir, "..");
  const jsonPath = path.resolve(projectRoot, "data.json");

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`data.json not found at ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: DataFile = JSON.parse(raw);

  console.log("Loaded data.json — starting import...\n");

  // ── Site ──────────────────────────────────────────────────────────────────
  await prisma.site.upsert({
    where: { id: "site" },
    update: { titleEn: data.site.title_en, titleZh: data.site.title_zh },
    create: { id: "site", titleEn: data.site.title_en, titleZh: data.site.title_zh },
  });
  console.log("✓ Site");

  // ── About ─────────────────────────────────────────────────────────────────
  await prisma.about.upsert({
    where: { id: "about" },
    update: {
      nameEn: data.about.name_en,
      nameZh: data.about.name_zh,
      titleEn: data.about.title_en,
      titleZh: data.about.title_zh,
      bioEn: data.about.bio_en,
      bioZh: data.about.bio_zh,
      quoteEn: data.about.quote_en,
      quoteZh: data.about.quote_zh,
      educationEn: data.about.education_en,
      educationZh: data.about.education_zh,
      photo: data.about.photo,
    },
    create: {
      id: "about",
      nameEn: data.about.name_en,
      nameZh: data.about.name_zh,
      titleEn: data.about.title_en,
      titleZh: data.about.title_zh,
      bioEn: data.about.bio_en,
      bioZh: data.about.bio_zh,
      quoteEn: data.about.quote_en,
      quoteZh: data.about.quote_zh,
      educationEn: data.about.education_en,
      educationZh: data.about.education_zh,
      photo: data.about.photo,
    },
  });
  console.log("✓ About");

  // ── Work Experience ───────────────────────────────────────────────────────
  await prisma.workExperience.deleteMany({});
  for (let i = 0; i < data.workExperience.length; i++) {
    const w = data.workExperience[i];
    await prisma.workExperience.create({
      data: {
        id: w.id,
        titleEn: w.title_en,
        titleZh: w.title_zh,
        period: w.period,
        detailFolder: w.detailFolder,
        images: JSON.stringify([]),
        cover: "",
        contentZh: contentBlocksToHtml(w.content_zh),
        contentEn: contentBlocksToHtml(w.content_en),
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Work Experience (${data.workExperience.length} entries)`);

  // ── Services ───────────────────────────────────────────────────────────────
  await prisma.service.deleteMany({});
  for (let i = 0; i < data.services.length; i++) {
    const s = data.services[i];
    await prisma.service.create({
      data: {
        id: `svc-${Date.now()}-${i}`,
        titleEn: s.title_en,
        titleZh: s.title_zh,
        descEn: s.desc_en,
        descZh: s.desc_zh,
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Services (${data.services.length} entries)`);

  // ── Links ──────────────────────────────────────────────────────────────────
  await prisma.link.deleteMany({});
  const platformOrder: Record<string, number> = {
    linkedin: 0, github: 1, replit: 2, xiaohongshu: 3, email: 4,
  };
  for (const [platform, url] of Object.entries(data.links)) {
    await prisma.link.create({
      data: {
        id: `link-${Date.now()}-${platform}`,
        platform,
        url,
        sortOrder: platformOrder[platform] ?? 99,
      },
    });
  }
  console.log(`✓ Links (${Object.keys(data.links).length} entries)`);

  // ── Categories & Projects ─────────────────────────────────────────────────
  await prisma.project.deleteMany({});
  await prisma.category.deleteMany({});

  for (let ci = 0; ci < data.categories.length; ci++) {
    const cat = data.categories[ci];

    await prisma.category.create({
      data: {
        id: cat.id,
        key: cat.id,
        nameEn: cat.name_en,
        nameZh: cat.name_zh,
        sortOrder: ci,
      },
    });

    for (let pi = 0; pi < cat.projects.length; pi++) {
      const p = cat.projects[pi];
      await prisma.project.create({
        data: {
          id: p.id,
          categoryId: cat.id,
          titleEn: p.title_en,
          titleZh: p.title_zh,
          cover: p.cover,
          imageFolder: p.imageFolder,
          images: JSON.stringify([]),
          contentZh: contentBlocksToHtml(p.content_zh),
          contentEn: contentBlocksToHtml(p.content_en),
          link: "",
          sortOrder: pi,
        },
      });
    }

    console.log(`  ✓ Category "${cat.name_en}" — ${cat.projects.length} projects`);
  }
  console.log(`✓ Categories (${data.categories.length})`);

  console.log("\nImport complete! All data restored from data.json.");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
