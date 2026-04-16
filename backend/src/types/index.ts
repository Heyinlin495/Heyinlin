// ============================================================
// Entity type definitions for the Personal Space API
// ============================================================

// -- User --
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  role_type: 'creative' | 'tech' | 'photography' | 'writing';
  website: string | null;
  location: string | null;
  is_verified: number;
  is_private: number;
  theme: string;
  is_deleted: number;
  deleted_at: string | null;
  anonymized: number;
  created_at: string;
  updated_at: string;
}

export type CreateUserInput = Pick<User, 'username' | 'email' | 'password_hash'> & {
  display_name?: string;
  bio?: string;
  role_type?: string;
  theme?: string;
};

export type UpdateUserInput = Partial<Pick<User, 'display_name' | 'avatar_url' | 'bio' | 'website' | 'location' | 'theme' | 'is_private'>>;

// Public user (safe to expose to clients)
export type PublicUser = Omit<User, 'password_hash' | 'is_deleted' | 'deleted_at' | 'anonymized'>;

// -- Profile Bio --
export interface ProfileBio {
  id: string;
  user_id: string;
  headline: string | null;
  occupation: string | null;
  skills: string | null;     // JSON array
  social_links: string | null; // JSON object
  education: string | null;    // JSON array
  experience: string | null;   // JSON array
  created_at: string;
  updated_at: string;
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

// -- Post --
export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  is_pinned: number;
  category: PostCategory;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags: string | null;
}

export type CreatePostInput = Pick<Post, 'title' | 'slug'> & {
  content?: string;
  excerpt?: string;
  cover_image?: string;
  category?: PostCategory;
};

export type UpdatePostInput = Partial<CreatePostInput & Pick<Post, 'status' | 'is_pinned'>>;

// -- Project --
export interface Project {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  media: string | null;          // JSON array
  tags: string | null;           // JSON array
  external_links: string | null; // JSON array
  version_history: string | null; // JSON array
  status: 'draft' | 'published' | 'archived';
  is_featured: number;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ProjectMediaItem {
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

export interface ProjectExternalLink {
  label: string;
  url: string;
}

export interface ProjectVersion {
  version: string;
  date: string;
  changes: string;
}

export type CreateProjectInput = Pick<Project, 'title' | 'slug'> & {
  description?: string;
  cover_image?: string;
  media?: ProjectMediaItem[];
  tags?: string[];
  external_links?: ProjectExternalLink[];
};

export type UpdateProjectInput = Partial<CreateProjectInput & Pick<Project, 'status' | 'is_featured'>>;

// -- Comment --
export interface Comment {
  id: string;
  user_id: string;
  post_id: string | null;
  project_id: string | null;
  parent_id: string | null;
  content: string;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCommentInput = Pick<Comment, 'content'> & {
  post_id?: string;
  project_id?: string;
  parent_id?: string;
};

// -- Follow --
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

// -- Message --
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: number;
  is_deleted_by_sender: number;
  is_deleted_by_receiver: number;
  deleted_at: string | null;
  created_at: string;
}

export type CreateMessageInput = Pick<Message, 'content' | 'receiver_id'>;

// -- Activity --
export interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: string | null;  // JSON
  is_deleted: number;
  created_at: string;
}

// -- Audit Log --
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// -- JWT Payload --
export interface JWTPayload {
  sub: string;    // user id
  username: string;
  iat?: number;
  exp?: number;
}

// -- API Response wrapper --
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// -- Pagination query params --
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// -- Auth tokens --
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
