// ============================================================
// Shared TypeScript types matching Prisma schema (camelCase)
// ============================================================

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "images"; files: string[] }
  | { type: "link"; text: string; url: string };

export interface Site {
  id: string;
  titleEn: string;
  titleZh: string;
  subtitleEn: string;
  subtitleZh: string;
}

export interface About {
  id: string;
  nameEn: string;
  nameZh: string;
  titleEn: string;
  titleZh: string;
  bioEn: string;
  bioZh: string;
  quoteEn: string;
  quoteZh: string;
  educationEn: string;
  educationZh: string;
  photo: string;
}

export interface WorkExperience {
  id: string;
  titleEn: string;
  titleZh: string;
  period: string;
  detailFolder: string;
  contentZh: string;
  contentEn: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  titleEn: string;
  titleZh: string;
  descEn: string;
  descZh: string;
  sortOrder: number;
}

export interface Link {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  titleEn: string;
  titleZh: string;
  cover: string;
  imageFolder: string;
  images: string;
  contentZh: string;
  contentEn: string;
  link: string;
  sortOrder: number;
  categoryId?: string;
}

export interface Category {
  id: string;
  key: string;
  nameEn: string;
  nameZh: string;
  sortOrder: number;
  projects: Project[];
}

export interface SiteData {
  site: Site;
  about: About;
  workExperience: WorkExperience[];
  services: Service[];
  links: Link[];
  categories: Category[];
}

// Helper to parse JSON content fields from DB rows
export function parseContent(jsonStr: string): ContentBlock[] {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}
