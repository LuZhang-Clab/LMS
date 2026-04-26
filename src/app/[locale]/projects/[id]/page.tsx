import ProjectDetailClient from "@/components/ProjectDetailClient";
import { prisma } from "@/lib/db";
import { parseContent } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { title: "Not Found" };
  const title = locale === "en" ? project.titleEn : project.titleZh;
  return { title: `${title} — LUMOS` };
}

function resolveCoverUrl(cover: string | null, imageFolder: string | null): string {
  if (cover) {
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("/")) return cover;
    return `/images/projects/${imageFolder}/${cover}`;
  }
  if (imageFolder) return `/images/projects/${imageFolder}/cover.jpg`;
  return "";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!project) notFound();

  const content = parseContent(
    locale === "en" ? project.contentEn : project.contentZh
  );
  const coverUrl = resolveCoverUrl(project.cover, project.imageFolder);

  return (
    <ProjectDetailClient
      title={locale === "en" ? project.titleEn : project.titleZh}
      titleEn={project.titleEn}
      titleZh={project.titleZh}
      categoryName={project.category.nameZh}
      categoryNameEn={project.category.nameEn}
      cover={project.cover || ""}
      coverUrl={coverUrl}
      imageFolder={project.imageFolder || ""}
      content={content}
      link={project.link}
      locale={locale}
    />
  );
}
