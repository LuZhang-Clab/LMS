// ============================================================
// Shared TypeScript types matching Prisma schema (camelCase)
// ============================================================

// Admin API types (snake_case, matches /api/data response shape)
export interface AdminService {
  id?: string;
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
  sort_order?: number;
}

export interface AdminProject {
  id?: string;
  title_en: string;
  title_zh: string;
  cover: string;
  image_folder: string;
  link: string;
  images: string[];
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

export interface AdminCategory {
  id: string;
  key: string;
  name_en: string;
  name_zh: string;
  sort_order?: number;
  projects: AdminProject[];
}

export interface AdminWorkExperience {
  id?: string;
  title_en: string; title_zh: string;
  period: string; detail_folder: string;
  content_zh: ContentBlock[]; content_en: ContentBlock[];
}

export interface AdminSiteData {
  site: {
    title_en: string; title_zh: string;
    subtitle_en: string; subtitle_zh: string;
  };
  about: {
    name_en: string; name_zh: string;
    title_en: string; title_zh: string;
    bio_en: string; bio_zh: string;
    quote_en: string; quote_zh: string;
    education_en: string; education_zh: string;
    photo: string;
  };
  workExperience: AdminWorkExperience[];
  services: AdminService[];
  links: { id?: string; platform: string; url: string; sort_order?: number }[];
  categories: AdminCategory[];
}

// Public-facing types (camelCase)
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
  contentZh: string | ContentBlock[];
  contentEn: string | ContentBlock[];
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

// Alias for consumer components that named it differently
export type SiteLink = Link;

export interface Project {
  id: string;
  titleEn: string;
  titleZh: string;
  cover: string;
  imageFolder: string;
  images: string;
  contentZh: string | ContentBlock[];
  contentEn: string | ContentBlock[];
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
