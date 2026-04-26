import Nav from "@/components/Nav";
import HomeClient from "@/components/HomeClient";
import { prisma } from "@/lib/db";
import { parseContent } from "@/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [about, categories] = await Promise.all([
    prisma.about.findFirst(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        projects: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const formatted = categories.map((c) => ({
    ...c,
    projects: c.projects.map((p) => ({
      ...p,
      contentZh: parseContent(p.contentZh),
      contentEn: parseContent(p.contentEn),
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

  return (
    <HomeClient categories={formatted} about={aboutData} locale={locale} />
  );
}
