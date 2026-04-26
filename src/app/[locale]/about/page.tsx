import AboutClient from "@/components/AboutClient";
import Nav from "@/components/Nav";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "About — LUMOS" : "关于 — LUMOS" };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [about, workExperience, services, links] = await Promise.all([
    prisma.about.findFirst(),
    prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.link.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const aboutData = about
    ? {
        nameEn: about.nameEn,
        nameZh: about.nameZh,
        titleEn: about.titleEn,
        titleZh: about.titleZh,
        bioEn: about.bioEn,
        bioZh: about.bioZh,
        quoteEn: about.quoteEn,
        quoteZh: about.quoteZh,
        educationEn: about.educationEn,
        educationZh: about.educationZh,
        photo: about.photo,
        awardsZh: about.awardsZh || "",
        awardsEn: about.awardsEn || "",
      }
    : {
        nameEn: "Lu Zhang",
        nameZh: "张璐",
        titleEn: "Creative Director | Media Professional | Storyteller",
        titleZh: "创意策划总监 | 媒体人 | 故事讲述与IP构建",
        bioEn: "",
        bioZh: "",
        quoteEn: "",
        quoteZh: "",
        educationEn: "",
        educationZh: "",
        photo: "",
        awardsZh: "",
        awardsEn: "",
      };

  return (
    <AboutClient
      about={aboutData}
      workExperience={workExperience}
      services={services}
      links={links}
      locale={locale}
    />
  );
}
