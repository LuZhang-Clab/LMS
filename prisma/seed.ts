// Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client";
import data from "../../data.json";

const prisma = new PrismaClient();

async function main() {
  // Site
  await prisma.site.upsert({
    where: { id: "site" },
    update: {
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
      subtitleEn: "Creative Direction · Media Professional · Storyteller and IP Builder",
      subtitleZh: "创意策划总监 · 媒体人 · 故事讲述与IP构建",
    },
    create: {
      id: "site",
      titleEn: data.site.title_en,
      titleZh: data.site.title_zh,
      subtitleEn: "Creative Direction · Media Professional · Storyteller and IP Builder",
      subtitleZh: "创意策划总监 · 媒体人 · 故事讲述与IP构建",
    },
  });

  // About
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
      photo: data.about.photo || "/images/about/0.jpg",
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
      photo: data.about.photo || "/images/about/0.jpg",
    },
  });

  // Work Experience
  for (const exp of data.workExperience) {
    await prisma.workExperience.upsert({
      where: { id: exp.id },
      update: {
        titleEn: exp.title_en,
        titleZh: exp.title_zh,
        period: exp.period,
        detailFolder: exp.detailFolder || exp.id,
        contentZh: JSON.stringify(exp.content_zh || []),
        contentEn: JSON.stringify(exp.content_en || []),
        sortOrder: data.workExperience.indexOf(exp),
      },
      create: {
        id: exp.id,
        titleEn: exp.title_en,
        titleZh: exp.title_zh,
        period: exp.period,
        detailFolder: exp.detailFolder || exp.id,
        contentZh: JSON.stringify(exp.content_zh || []),
        contentEn: JSON.stringify(exp.content_en || []),
        sortOrder: data.workExperience.indexOf(exp),
      },
    });
  }

  // Services
  for (let i = 0; i < data.services.length; i++) {
    const svc = data.services[i];
    const svcId = `svc-${i}`;
    await prisma.service.upsert({
      where: { id: svcId },
      update: {
        titleEn: svc.title_en,
        titleZh: svc.title_zh,
        descEn: svc.desc_en,
        descZh: svc.desc_zh,
        sortOrder: i,
      },
      create: {
        id: svcId,
        titleEn: svc.title_en,
        titleZh: svc.title_zh,
        descEn: svc.desc_en,
        descZh: svc.desc_zh,
        sortOrder: i,
      },
    });
  }

  // Links
  const linksData = [
    { platform: "linkedin", url: data.links.linkedin || "", sortOrder: 0 },
    { platform: "github", url: data.links.github || "", sortOrder: 1 },
    { platform: "replit", url: data.links.replit || "", sortOrder: 2 },
    { platform: "xiaohongshu", url: data.links.xiaohongshu || "", sortOrder: 3 },
    { platform: "email", url: `mailto:${data.links.email || ""}`, sortOrder: 4 },
  ];
  for (const link of linksData) {
    if (!link.url || link.url === "mailto:") continue;
    await prisma.link.upsert({
      where: { id: link.platform },
      update: { url: link.url, sortOrder: link.sortOrder },
      create: link,
    });
  }

  // Categories & Projects
  for (let ci = 0; ci < data.categories.length; ci++) {
    const cat = data.categories[ci];
    const catId = cat.id;

    await prisma.category.upsert({
      where: { id: catId },
      update: {
        key: cat.id,
        nameEn: cat.name_en || cat.name_zh || cat.id,
        nameZh: cat.name_zh || cat.name_en || cat.id,
        sortOrder: ci,
      },
      create: {
        id: catId,
        key: cat.id,
        nameEn: cat.name_en || cat.name_zh || cat.id,
        nameZh: cat.name_zh || cat.name_en || cat.id,
        sortOrder: ci,
      },
    });

    for (let pi = 0; pi < cat.projects.length; pi++) {
      const proj = cat.projects[pi];
      const projId = proj.id;

      // Resolve cover: if it's an absolute URL keep it, if starts with / keep it,
      // otherwise prepend /images/home/
      let cover = proj.cover || "";
      if (cover && !cover.startsWith("http") && !cover.startsWith("/")) {
        cover = `/images/home/${proj.id}.jpg`;
      }

      // Resolve imageFolder: use proj.imageFolder or fall back to proj.id
      const imageFolder = proj.imageFolder || proj.id;

      await prisma.project.upsert({
        where: { id: projId },
        update: {
          categoryId: catId,
          titleEn: proj.title_en || proj.title_zh || proj.id,
          titleZh: proj.title_zh || proj.title_en || proj.id,
          cover,
          imageFolder,
          images: JSON.stringify([]),
          contentZh: JSON.stringify(proj.content_zh || []),
          contentEn: JSON.stringify(proj.content_en || []),
          link: "",
          sortOrder: pi,
        },
        create: {
          id: projId,
          categoryId: catId,
          titleEn: proj.title_en || proj.title_zh || proj.id,
          titleZh: proj.title_zh || proj.title_en || proj.id,
          cover,
          imageFolder,
          images: JSON.stringify([]),
          contentZh: JSON.stringify(proj.content_zh || []),
          contentEn: JSON.stringify(proj.content_en || []),
          link: "",
          sortOrder: pi,
        },
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
