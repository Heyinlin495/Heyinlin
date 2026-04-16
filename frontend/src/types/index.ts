// ============================================================
// Frontend type definitions (matching backend API types)
// ============================================================

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  role_type: string;
  website: string | null;
  location: string | null;
  is_verified: 0 | 1;
  is_private: 0 | 1;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileBio {
  id: string;
  user_id: string;
  headline: string | null;
  occupation: string | null;
  skills: string[] | null;
  social_links: Record<string, string> | null;
  education: any[] | null;
  experience: any[] | null;
}

export type PostCategory = 'general' | 'tutorial' | 'diary' | 'review' | 'tech' | 'photography' | 'art' | 'writing';

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  general: '日常',
  tutorial: '教程',
  diary: '随笔',
  review: '评测',
  tech: '技术',
  photography: '摄影',
  art: '艺术',
  writing: '写作',
};

export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: string;
  is_pinned: boolean;
  category?: PostCategory;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags?: string[];
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface ProjectMediaItem {
  type: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  media: ProjectMediaItem[];
  tags: string[];
  external_links: { label: string; url: string }[];
  version_history: { version: string; date: string; changes: string }[];
  status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  post_id?: string;
  project_id?: string;
  parent_id?: string;
  replies?: Comment[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Follow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, any> | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  target: { id: string; title: string; slug: string } | null;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  tags: string[] | null;
  is_featured: 0 | 1;
  username?: string;
  display_name?: string;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ThemeType = 'creative' | 'tech' | 'photography' | 'writing';
