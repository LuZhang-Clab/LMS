import AboutClient from "@/components/AboutClient";
import Nav from "@/components/Nav";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getServerLocale } from "@/context/LocaleContext";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "About — LUMOS" };
}

export default async function AboutPage() {
  const locale = await getServerLocale();

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

  const workExpData = workExperience.map((w) => ({
    id: w.id,
    titleEn: w.titleEn,
    titleZh: w.titleZh,
    period: w.period,
    detailFolder: w.detailFolder,
    images: (() => { try { return JSON.parse(w.images); } catch { return []; } })(),
    cover: w.cover,
    contentZh: w.contentZh,
    contentEn: w.contentEn,
    sortOrder: w.sortOrder,
  }));

  return (
    <>
      <Nav />
      <AboutClient
        about={aboutData}
        workExperience={workExpData}
        services={services}
        links={links}
      />
    </>
  );
}
