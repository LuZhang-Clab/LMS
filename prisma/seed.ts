// Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Site
  await prisma.site.upsert({
    where: { id: "site" },
    update: {},
    create: { id: "site", titleEn: "LUMOS CREATIVE", titleZh: "里面是·创意事务", subtitleEn: "Creative Direction · Art Direction · Exhibition Design", subtitleZh: "创意策划 · 艺术指导 · 展览设计" },
  });

  // About
  await prisma.about.upsert({
    where: { id: "about" },
    update: {},
    create: {
      id: "about",
      nameEn: "LU ZHANG",
      nameZh: "张璐",
      titleEn: "Creative Director · Art Director",
      titleZh: "创意总监 · 艺术总监",
      bioEn:
        "Lu Zhang is a Beijing-based creative director and art director specializing in exhibition design, large-scale events, and technology-driven art installations. With a background in visual communication and spatial design, she brings a unique perspective to every project—blending narrative, technology, and aesthetics into memorable experiences.",
      bioZh:
        "张璐是一位驻北京的创意总监、艺术总监，专注于展览设计、大型活动策划与科技艺术装置创作。视觉传达与空间设计出身，擅长将叙事、科技与美学融合为独特的沉浸式体验。",
      quoteEn:
        '"Space is not a container — it is a medium of storytelling."',
      quoteZh: "「空间不是容器，而是叙事的媒介。」",
      educationEn: "BFA in Visual Communication Design, Central Academy of Fine Arts",
      educationZh: "中央美术学院视觉传达设计专业 · 学士",
      photo: "/images/about/0.jpg",
    },
  });

  // Services
  const services = [
    { titleEn: "Exhibition Design", titleZh: "展览设计", descEn: "Concept development, spatial design, and full production for museums, galleries, and brand exhibitions.", descZh: "博物馆、画廊、品牌展览的概念开发、空间设计与全程制作。" },
    { titleEn: "Large-Scale Events", titleZh: "大型活动策划", descEn: "Creative direction and production management for events with 500+ attendees.", descZh: "500人以上大型活动的创意策划与制作管理。" },
    { titleEn: "Art-Technology Integration", titleZh: "科技艺术装置", descEn: "Interactive installations blending light, sound, and digital media.", descZh: "融合光影、声效与数字媒体的交互式装置创作。" },
    { titleEn: "Brand Experience", titleZh: "品牌体验空间", descEn: "Spatial identity design and immersive brand environments.", descZh: "空间视觉识别设计与沉浸式品牌环境打造。" },
  ];

  for (let i = 0; i < services.length; i++) {
    await prisma.service.upsert({
      where: { id: `s-${i}` },
      update: services[i],
      create: { id: `s-${i}`, ...services[i], sortOrder: i },
    });
  }

  // Links
  const links = [
    { platform: "linkedin", url: "https://linkedin.com/in/lulumos", sortOrder: 0 },
    { platform: "email", url: "mailto:hello@lumoscreative.com", sortOrder: 1 },
  ];

  for (const link of links) {
    await prisma.link.upsert({
      where: { id: link.platform },
      update: link,
      create: link,
    });
  }

  // Categories & Projects
  const categories = [
    {
      key: "large-scale-events",
      nameEn: "Large-Scale Events",
      nameZh: "大型活动",
      sortOrder: 0,
      projects: [
        {
          id: "proj-1",
          titleEn: "China International Fair for Trade in Services",
          titleZh: "中国国际服务贸易交易会",
          cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
          imageFolder: "proj-1",
          contentZh: JSON.stringify([
            { type: "heading", text: "项目概述" },
            { type: "text", text: "为服贸会主宾国展馆提供整体创意设计与制作执行，涵盖空间规划、视觉系统与多媒体内容开发。" },
            { type: "images", files: ["1.jpg", "2.jpg"] },
          ]),
          contentEn: JSON.stringify([
            { type: "heading", text: "Overview" },
            { type: "text", text: "Full creative direction and production for the Country of Honor pavilion at the China International Fair for Trade in Services, including spatial planning, visual identity, and multimedia content." },
          ]),
          sortOrder: 0,
        },
      ],
    },
    {
      key: "art-tech",
      nameEn: "Art & Technology",
      nameZh: "艺术科技",
      sortOrder: 1,
      projects: [
        {
          id: "proj-2",
          titleEn: "Breath of Light",
          titleZh: "呼吸之光",
          cover: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1200&q=80",
          imageFolder: "proj-2",
          contentZh: JSON.stringify([
            { type: "heading", text: "关于作品" },
            { type: "text", text: "一件以实时传感数据驱动的沉浸式光影装置。观众呼吸的节奏被捕捉并转化为光的脉动，构建起身体与空间的对话。" },
          ]),
          contentEn: JSON.stringify([
            { type: "heading", text: "About the Work" },
            { type: "text", text: "An immersive light installation driven by real-time sensor data. The rhythm of visitors' breath is captured and translated into pulses of light, creating a dialogue between body and space." },
          ]),
          sortOrder: 0,
        },
      ],
    },
  ];

  for (const cat of categories) {
    const { projects, ...catData } = cat;
    await prisma.category.upsert({
      where: { id: cat.id ?? cat.key },
      update: catData,
      create: { id: cat.id ?? cat.key, ...catData },
    });

    for (const proj of projects) {
      const { categoryId, ...projData } = proj;
      await prisma.project.upsert({
        where: { id: proj.id },
        update: projData,
        create: { categoryId: cat.id ?? cat.key, ...projData },
      });
    }
  }

  // Work Experience
  const experiences = [
    {
      id: "we-1",
      titleEn: "Senior Creative Director",
      titleZh: "资深创意总监",
      period: "2021 – Present",
      detailFolder: "we-1",
      contentZh: JSON.stringify([
        { type: "text", text: "领导跨学科团队完成多个大型展览与品牌体验项目。" },
        { type: "text", text: "与国内外知名艺术家、建筑师及科技团队深度合作。" },
      ]),
      contentEn: JSON.stringify([
        { type: "text", text: "Led interdisciplinary teams on major exhibitions and brand experience projects." },
        { type: "text", text: "Collaborated deeply with renowned artists, architects, and technology teams worldwide." },
      ]),
      sortOrder: 0,
    },
    {
      id: "we-2",
      titleEn: "Art Director",
      titleZh: "艺术总监",
      period: "2018 – 2021",
      detailFolder: "we-2",
      contentZh: JSON.stringify([
        { type: "text", text: "负责多个国家级文化活动的视觉与空间创意。" },
      ]),
      contentEn: JSON.stringify([
        { type: "text", text: "Directed visual and spatial creativity for national-level cultural events." },
      ]),
      sortOrder: 1,
    },
  ];

  for (const exp of experiences) {
    await prisma.workExperience.upsert({
      where: { id: exp.id },
      update: exp,
      create: exp,
    });
  }

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
