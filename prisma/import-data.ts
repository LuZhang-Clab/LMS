/**
 * Migration script: Import data from data.json into SQLite database
 * Run with: npx tsx prisma/import-data.ts
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Load data.json
const dataPath = path.join(__dirname, "..", "..", "data.json");
const raw = fs.readFileSync(dataPath, "utf-8");
const data = JSON.parse(raw);

async function main() {
  console.log("Starting data import from data.json...\n");

  // === Site ===
  await prisma.site.upsert({
    where: { id: "site" },
    update: {
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
      subtitleEn: data.site.subtitle_en || "",
      subtitleZh: data.site.subtitle_zh || "",
    },
    create: {
      id: "site",
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
      subtitleEn: data.site.subtitle_en || "",
      subtitleZh: data.site.subtitle_zh || "",
    },
  });
  console.log("✓ Site");

  // === About ===
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

  // === Work Experience ===
  await prisma.workExperience.deleteMany({});
  for (let i = 0; i < data.workExperience.length; i++) {
    const exp = data.workExperience[i];
    await prisma.workExperience.create({
      data: {
        id: exp.id || `we-${i}`,
        titleEn: exp.title_en,
        titleZh: exp.title_zh,
        period: exp.period,
        detailFolder: exp.detailFolder || "",
        contentZh: JSON.stringify(exp.content_zh || []),
        contentEn: JSON.stringify(exp.content_en || []),
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Work Experience (${data.workExperience.length} entries)`);

  // === Services ===
  await prisma.service.deleteMany({});
  for (let i = 0; i < data.services.length; i++) {
    const svc = data.services[i];
    await prisma.service.create({
      data: {
        id: `svc-${i}`,
        titleEn: svc.title_en,
        titleZh: svc.title_zh,
        descEn: svc.desc_en,
        descZh: svc.desc_zh,
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Services (${data.services.length} entries)`);

  // === Links ===
  await prisma.link.deleteMany({});
  const platformMap: Record<string, string> = {
    linkedin: "linkedin",
    github: "github",
    replit: "replit",
    xiaohongshu: "xiaohongshu",
    email: "email",
  };
  let linkIdx = 0;
  for (const [key, url] of Object.entries(data.links)) {
    if (url) {
      await prisma.link.create({
        data: {
          id: `link-${linkIdx}`,
          platform: platformMap[key] || key,
          url: url as string,
          sortOrder: linkIdx,
        },
      });
      linkIdx++;
    }
  }
  console.log(`✓ Links (${linkIdx} entries)`);

  // === Categories & Projects ===
  // First delete all existing to avoid duplicates (upsert by key)
  await prisma.project.deleteMany({});
  await prisma.category.deleteMany({});

  for (let ci = 0; ci < data.categories.length; ci++) {
    const cat = data.categories[ci];
    const catKey = cat.id || `cat-${ci}`;

    await prisma.category.create({
      data: {
        id: catKey,
        key: catKey,
        nameEn: cat.name_en,
        nameZh: cat.name_zh,
        sortOrder: ci,
      },
    });

    for (let pi = 0; pi < cat.projects.length; pi++) {
      const proj = cat.projects[pi];

      // Build images array from content_zh/en images blocks
      const allImages: string[] = [];
      for (const block of [...(proj.content_zh || []), ...(proj.content_en || [])]) {
        if (block.type === "images" && Array.isArray(block.files)) {
          for (const file of block.files) {
            const url = `/images/projects/${proj.imageFolder || proj.id}/${file}`;
            if (!allImages.includes(url)) allImages.push(url);
          }
        }
      }

      await prisma.project.create({
        data: {
          id: proj.id || `proj-${ci}-${pi}`,
          categoryId: catKey,
          titleEn: proj.title_en || "",
          titleZh: proj.title_zh || "",
          cover: proj.cover || allImages[0] || "",
          imageFolder: proj.imageFolder || proj.id || "",
          images: JSON.stringify(allImages),
          contentZh: JSON.stringify(proj.content_zh || []),
          contentEn: JSON.stringify(proj.content_en || []),
          link: proj.link || "",
          sortOrder: pi,
        },
      });
    }
    console.log(`✓ Category: ${cat.name_zh} (${cat.projects.length} projects)`);
  }

  console.log("\n✅ Data import complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
