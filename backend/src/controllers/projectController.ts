// Project controller — CRUD with media, tags, version history
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';
import { Project, CreateProjectInput, UpdateProjectInput, PublicUser } from '../types';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
}

// List projects (public)
export function listProjects(req: Request, res: Response): void {
  const db = getDB();
  const { username } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;
  const tag = req.query.tag as string | undefined;
  const sort = req.query.sort as string || 'created_at';
  const order = (req.query.order as string || 'desc').toUpperCase();

  const user = db.prepare(`SELECT id FROM users WHERE username = ? AND is_deleted = 0`).get(username) as { id: string } | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  let where = `p.user_id = ? AND p.status = 'published' AND p.is_deleted = 0`;
  const params: any[] = [user.id];

  if (tag) {
    where += ` AND p.tags LIKE ?`;
    params.push(`%${tag}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM projects p WHERE ${where}`).get(...params) as { count: number };

  const projects = db.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url
     FROM projects p JOIN users u ON p.user_id = u.id
     WHERE ${where}
     ORDER BY p.is_featured DESC, p.${sort} ${order === 'DESC' ? 'DESC' : 'ASC'}
     LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as any[];

  const parsed = projects.map(p => ({
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : [],
    external_links: p.external_links ? JSON.parse(p.external_links) : [],
    media: p.media ? JSON.parse(p.media) : [],
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

// Get single project
export function getProject(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;

  const project = db.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url
     FROM projects p JOIN users u ON p.user_id = u.id
     WHERE p.slug = ? AND p.is_deleted = 0`
  ).get(slug) as any;

  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  // Parse JSON fields
  project.media = project.media ? JSON.parse(project.media) : [];
  project.tags = project.tags ? JSON.parse(project.tags) : [];
  project.external_links = project.external_links ? JSON.parse(project.external_links) : [];
  project.version_history = project.version_history ? JSON.parse(project.version_history) : [];

  // Get comments
  const comments = db.prepare(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.project_id = ? AND c.is_deleted = 0 AND c.parent_id IS NULL
     ORDER BY c.created_at ASC`
  ).all(project.id) as any[];

  res.json({ success: true, data: { project, comments } });
}

// Create project (auth required)
export function createProject(req: Request, res: Response): void {
  const db = getDB();
  const { title, description, cover_image, media, tags, external_links, status } =
    req.body as CreateProjectInput & { status?: string };

  if (!title) {
    res.status(400).json({ success: false, error: 'title is required' });
    return;
  }

  const slug = slugify(title) + '-' + Date.now().toString(36);
  const id = uuid().replace(/-/g, '').slice(0, 32);
  const now = new Date().toISOString();
  const projStatus = status || 'draft';

  db.prepare(
    `INSERT INTO projects (id, user_id, title, slug, description, cover_image, media, tags,
                           external_links, status, created_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.userId, title, slug, description || null, cover_image || null,
    media ? JSON.stringify(media) : null, tags ? JSON.stringify(tags) : null,
    external_links ? JSON.stringify(external_links) : null, projStatus, now,
    projStatus === 'published' ? now : null
  );

  if (projStatus === 'published') {
    db.prepare(
      `INSERT INTO activities (id, user_id, action_type, target_type, target_id)
       VALUES (?, ?, 'project_created', 'project', ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, id);
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  res.status(201).json({ success: true, data: project, message: 'Project created' });
}

// Update project (auth required)
export function updateProject(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;
  const updates = req.body as UpdateProjectInput;

  const project = db.prepare(`SELECT * FROM projects WHERE slug = ? AND is_deleted = 0`).get(slug) as Project | undefined;
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  if (project.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.cover_image !== undefined) { fields.push('cover_image = ?'); values.push(updates.cover_image); }
  if (updates.media !== undefined) { fields.push('media = ?'); values.push(JSON.stringify(updates.media)); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.external_links !== undefined) { fields.push('external_links = ?'); values.push(JSON.stringify(updates.external_links)); }
  if (updates.status !== undefined) {
    fields.push('status = ?'); values.push(updates.status);
    if (updates.status === 'published' && !project.published_at) {
      fields.push('published_at = ?'); values.push(new Date().toISOString());
    }
  }
  if (updates.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(updates.is_featured); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(slug);

  const oldValues = db.prepare(`SELECT * FROM projects WHERE slug = ?`).get(slug);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE slug = ?`).run(...values);
  const updated = db.prepare(`SELECT * FROM projects WHERE slug = ?`).get(slug);

  // Audit log
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values)
     VALUES (?, ?, 'update', 'project', ?, ?, ?)`
  ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, project.id, JSON.stringify(oldValues), JSON.stringify(updated));

  res.json({ success: true, data: updated, message: 'Project updated' });
}

// Delete project (soft delete)
export function deleteProject(req: Request, res: Response): void {
  const db = getDB();
  const { slug } = req.params;

  const project = db.prepare(`SELECT * FROM projects WHERE slug = ? AND is_deleted = 0`).get(slug) as Project | undefined;
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  if (project.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  db.prepare(
    `UPDATE projects SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE slug = ?`
  ).run(slug);

  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values)
     VALUES (?, ?, 'delete', 'project', ?, ?)`
  ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, project.id, JSON.stringify(project));

  res.json({ success: true, message: 'Project deleted' });
}
