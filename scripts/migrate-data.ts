import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface OldContentBlock {
  type: "heading" | "text" | "images" | "link";
  text?: string;
  files?: string[];
  url?: string;
}

interface OldProject {
  id: string;
  title_en: string;
  title_zh: string;
  cover: string;
  imageFolder: string;
  content_zh: OldContentBlock[];
  content_en: OldContentBlock[];
  sortOrder?: number;
}

interface OldCategory {
  id: string;
  name_en: string;
  name_zh: string;
  projects: OldProject[];
}

interface OldWorkExperience {
  id: string;
  title_en: string;
  title_zh: string;
  period: string;
  detailFolder: string;
  content_zh: OldContentBlock[];
  content_en: OldContentBlock[];
}

interface OldService {
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
}

interface OldSiteData {
  site: { title_en: string; title_zh: string };
  about: {
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
  };
  workExperience: OldWorkExperience[];
  services: OldService[];
  links: Record<string, string>;
  categories: OldCategory[];
}

async function migrate() {
  const dataPath = path.join(__dirname, "..", "..", "data.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: OldSiteData = JSON.parse(raw);

  console.log("Starting migration...\n");

  // --- Site ---
  await prisma.site.upsert({
    where: { id: "site" },
    update: {
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
    },
    create: {
      id: "site",
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
    },
  });
  console.log("✓ Site");

  // --- About ---
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

  // --- Work Experience ---
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
        contentZh: JSON.stringify(w.content_zh),
        contentEn: JSON.stringify(w.content_en),
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Work Experience (${data.workExperience.length} entries)`);

  // --- Services ---
  await prisma.service.deleteMany({});
  for (let i = 0; i < data.services.length; i++) {
    const s = data.services[i];
    await prisma.service.create({
      data: {
        titleEn: s.title_en,
        titleZh: s.title_zh,
        descEn: s.desc_en,
        descZh: s.desc_zh,
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Services (${data.services.length} entries)`);

  // --- Links ---
  await prisma.link.deleteMany({});
  const linkOrder = ["linkedin", "github", "replit", "xiaohongshu", "email"];
  for (let i = 0; i < linkOrder.length; i++) {
    const platform = linkOrder[i];
    const url = data.links[platform];
    if (!url) continue;
    await prisma.link.create({
      data: {
        platform,
        url: platform === "email" ? `mailto:${url}` : url,
        sortOrder: i,
      },
    });
  }
  console.log(`✓ Links (${linkOrder.filter(p => data.links[p]).length} entries)`);

  // --- Categories & Projects ---
  await prisma.project.deleteMany({});
  await prisma.category.deleteMany({});

  let totalProjects = 0;
  for (let i = 0; i < data.categories.length; i++) {
    const cat = data.categories[i];
    const createdCat = await prisma.category.create({
      data: {
        id: cat.id,
        key: cat.id,
        nameEn: cat.name_en,
        nameZh: cat.name_zh,
        sortOrder: i,
      },
    });

    for (let j = 0; j < cat.projects.length; j++) {
      const proj = cat.projects[j];
      await prisma.project.create({
        data: {
          id: proj.id,
          categoryId: createdCat.id,
          titleEn: proj.title_en,
          titleZh: proj.title_zh,
          cover: proj.cover,
          imageFolder: proj.imageFolder,
          contentZh: JSON.stringify(proj.content_zh || []),
          contentEn: JSON.stringify(proj.content_en || []),
          sortOrder: j,
        },
      });
      totalProjects++;
    }
  }
  console.log(`✓ Categories (${data.categories.length}) + Projects (${totalProjects})`);

  console.log("\n✅ Migration complete!");
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
