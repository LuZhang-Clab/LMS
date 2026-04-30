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
  link?: string;
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
  images: string[]; cover: string;
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
    awards_en?: string; awards_zh?: string;
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
  awardsEn?: string;
  awardsZh?: string;
}

export interface WorkExperience {
  id: string;
  titleEn: string;
  titleZh: string;
  period: string;
  detailFolder: string;
  images: string | string[];
  cover: string;
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
  link?: string;
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

// Helper to parse content fields from DB rows.
// Handles both legacy JSON ContentBlock[] format and modern HTML format.
export function parseContent(value: string): ContentBlock[] {
  if (!value || typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  // Already HTML — contains HTML tags (new Tiptap format)
  if (/^<(p|h[1-6]|div|ul|ol|li|img|a|span|b|i|u|strong|em)[^>]*>/i.test(trimmed)) {
    // Cannot convert HTML back to ContentBlock[], return empty so caller skips block rendering
    return [];
  }

  // Try parsing as JSON array (legacy format)
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Plain text string
  }
  return [];
}
