// Post controller — CRUD with pagination, filtering, soft delete
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';
import { CreatePostInput, UpdatePostInput, Post, PublicUser } from '../types';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
}

// List posts (public, with pagination & filtering)
export function listPosts(req: Request, res: Response): void {
  const db = getDB();
  const { username } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;
  const tag = req.query.tag as string | undefined;
  const status = req.query.status as string || 'published';
  const sort = req.query.sort as string || 'created_at';
  const order = (req.query.order as string || 'desc').toUpperCase();

  const user = db.prepare(`SELECT id FROM users WHERE username = ? AND is_deleted = 0`).get(username) as { id: string } | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  let where = `p.user_id = ? AND p.status = ? AND p.is_deleted = 0`;
  const params: any[] = [user.id, status];

  if (tag) {
    where += ` AND p.tags LIKE ?`;
    params.push(`%${tag}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...params) as { count: number };

  const posts = db.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE ${where}
     ORDER BY p.is_pinned DESC, p.${sort} ${order === 'DESC' ? 'DESC' : 'ASC'}
     LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as unknown as (Post & Pick<PublicUser, 'username' | 'display_name' | 'avatar_url'>)[];

  // Parse JSON fields
  const parsed = posts.map(p => ({
    ...p,
    tags: (p as any).tags ? JSON.parse((p as any).tags as string) : [],
    category: (p as any).category || 'general',
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

// Get single post
export function getPost(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;

  const post = db.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.slug = ? AND p.is_deleted = 0`
  ).get(slug) as (Post & Pick<PublicUser, 'username' | 'display_name' | 'avatar_url'>) | undefined;

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }

  // Get comments
  const comments = db.prepare(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ? AND c.is_deleted = 0 AND c.parent_id IS NULL
     ORDER BY c.created_at ASC`
  ).all(post.id) as any[];

  res.json({ success: true, data: { post, comments } });
}

// Create post (auth required)
export function createPost(req: Request, res: Response): void {
  const db = getDB();
  const { title, content, excerpt, cover_image, status, category } = req.body as CreatePostInput & { status?: string };

  if (!title) {
    res.status(400).json({ success: false, error: 'title is required' });
    return;
  }

  const slug = slugify(title) + '-' + Date.now().toString(36);
  const id = uuid().replace(/-/g, '').slice(0, 32);
  const now = new Date().toISOString();
  const postStatus = status || 'draft';
  const postCategory = category || 'general';

  db.prepare(
    `INSERT INTO posts (id, user_id, title, slug, content, excerpt, cover_image, status, category, created_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, title, slug, content || null, excerpt || null, cover_image || null,
        postStatus, postCategory, now, postStatus === 'published' ? now : null);

  // Activity feed
  if (postStatus === 'published') {
    db.prepare(
      `INSERT INTO activities (id, user_id, action_type, target_type, target_id)
       VALUES (?, ?, 'post_created', 'post', ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, id);
  }

  const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);
  res.status(201).json({ success: true, data: post, message: 'Post created' });
}

// Update post (auth required, own posts only)
export function updatePost(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;
  const updates = req.body as UpdatePostInput;

  const post = db.prepare(`SELECT * FROM posts WHERE slug = ? AND is_deleted = 0`).get(slug) as Post | undefined;
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  if (post.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
  if (updates.excerpt !== undefined) { fields.push('excerpt = ?'); values.push(updates.excerpt); }
  if (updates.cover_image !== undefined) { fields.push('cover_image = ?'); values.push(updates.cover_image); }
  if (updates.status !== undefined) {
    fields.push('status = ?'); values.push(updates.status);
    if (updates.status === 'published' && !post.published_at) {
      fields.push('published_at = ?'); values.push(new Date().toISOString());
    }
  }
  if (updates.is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(updates.is_pinned); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(slug);

  db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE slug = ?`).run(...values);
  const updated = db.prepare(`SELECT * FROM posts WHERE slug = ?`).get(slug);

  res.json({ success: true, data: updated, message: 'Post updated' });
}

// Delete post (soft delete)
export function deletePost(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;

  const post = db.prepare(`SELECT * FROM posts WHERE slug = ? AND is_deleted = 0`).get(slug) as Post | undefined;
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  if (post.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  db.prepare(
    `UPDATE posts SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE slug = ?`
  ).run(slug);

  // Audit log
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values)
     VALUES (?, ?, 'delete', 'post', ?, ?)`
  ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, post.id, JSON.stringify(post));

  res.json({ success: true, message: 'Post deleted' });
}
