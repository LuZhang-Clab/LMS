import ProjectDetailClient from "@/components/ProjectDetailClient";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/context/LocaleContext";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { title: "Not Found" };
  return { title: `${project.titleEn} — LUMOS` };
}

function resolveCoverUrl(cover: string | null, imageFolder: string | null): string {
  if (cover) {
    if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
    if (cover.startsWith("/")) return cover;
    return `/images/projects/${imageFolder || "default"}/${cover}`;
  }
  if (imageFolder) return `/images/projects/${imageFolder}/cover.jpg`;
  return "";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getServerLocale();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { category: true },
  });

  console.log("[DetailPage] project from Prisma:", project ? { id: project.id, contentZhLen: project.contentZh?.length, contentEnLen: project.contentEn?.length } : "NOT FOUND");

  if (!project) notFound();

  const contentRaw = locale === "en" ? project.contentEn : project.contentZh;
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
      contentHtml={contentRaw}
      link={project.link}
    />
  );
}
