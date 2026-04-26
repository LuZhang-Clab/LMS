// ============================================================
// Shared TypeScript types mirroring the /api/data response shape
// (API returns snake_case field names to match Prisma column naming)
// ============================================================

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "images"; files: string[] }
  | { type: "link"; text: string; url: string };

export interface Site {
  title_en: string;
  title_zh: string;
  subtitle_en: string;
  subtitle_zh: string;
}

export interface About {
  name_en: string;
  name_zh: string;
  title_en: string;
  title_zh: string;
  bio_en: string;
  bio_zh: string;
  quote_en: string;
  quote_zh: string;
  education_en: string;
  education_zh: string;
  photo: string;
}

export interface WorkExperience {
  id: string;
  title_en: string;
  title_zh: string;
  period: string;
  detail_folder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
  sort_order: number;
}

export interface Service {
  id: string;
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
  sort_order: number;
}

export interface Link {
  id: string;
  platform: string;
  url: string;
  sort_order: number;
}

// Alias for use in components that import Next.js Link
export type SiteLink = Link;

export interface Project {
  id: string;
  title_en: string;
  title_zh: string;
  cover: string;
  image_folder: string;
  images: ContentBlock[];
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
  link: string;
  sort_order: number;
}

export interface Category {
  id: string;
  key: string;
  name_en: string;
  name_zh: string;
  sort_order: number;
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
