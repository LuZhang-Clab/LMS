import HomeClient from "@/components/HomeClient";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const [about, categories] = await Promise.all([
    prisma.about.findFirst(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { projects: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const formatted = categories.map((c) => ({
    id: c.id,
    key: c.key,
    nameEn: c.nameEn,
    nameZh: c.nameZh,
    sortOrder: c.sortOrder,
    projects: c.projects.map((p) => ({
      id: p.id,
      titleEn: p.titleEn,
      titleZh: p.titleZh,
      cover: p.cover,
      imageFolder: p.imageFolder,
      images: p.images,
      contentZh: p.contentZh ?? "",
      contentEn: p.contentEn ?? "",
      link: p.link,
      sortOrder: p.sortOrder,
    })),
  }));

  const aboutData = about
    ? {
        nameEn: about.nameEn,
        nameZh: about.nameZh,
        titleEn: about.titleEn,
        titleZh: about.titleZh,
        photo: about.photo,
      }
    : {
        nameEn: "Lu Zhang",
        nameZh: "张璐",
        titleEn: "Creative Director | Media Professional | Storyteller",
        titleZh: "创意策划总监 | 媒体人 | 故事讲述与IP构建",
        photo: "",
      };

  return <HomeClient categories={formatted} about={aboutData} />;
}
