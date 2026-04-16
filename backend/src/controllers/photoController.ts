// Photo controller — gallery photo CRUD
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';

// List photos for a user (public)
export function listPhotos(req: Request, res: Response): void {
  const db = getDB();
  const { username } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const user = db.prepare(`SELECT id FROM users WHERE username = ? AND is_deleted = 0`).get(username) as { id: string } | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM photos WHERE user_id = ?`
  ).get(user.id) as { count: number };

  const photos = db.prepare(
    `SELECT p.*, u.username, u.display_name
     FROM photos p JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(user.id, limit, offset) as any[];

  const parsed = photos.map(p => ({
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : [],
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

// Create a photo (auth required)
export function createPhoto(req: Request, res: Response): void {
  const db = getDB();
  const { image_url, caption, tags } = req.body as {
    image_url: string;
    caption?: string;
    tags?: string[];
  };

  if (!image_url) {
    res.status(400).json({ success: false, error: 'image_url is required' });
    return;
  }

  const id = uuid().replace(/-/g, '').slice(0, 32);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO photos (id, user_id, image_url, caption, tags, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.userId, image_url, caption || '', tags ? JSON.stringify(tags) : null, now
  );

  const photo = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id) as any;
  photo.tags = photo.tags ? JSON.parse(photo.tags) : [];

  res.status(201).json({ success: true, data: photo, message: 'Photo uploaded' });
}

// Update a photo (auth required)
export function updatePhoto(req: Request, res: Response): void {
  const db = getDB();
  const { id } = req.params;
  const { caption, tags, is_featured } = req.body as {
    caption?: string;
    tags?: string[];
    is_featured?: number;
  };

  const photo = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id) as any;
  if (!photo) {
    res.status(404).json({ success: false, error: 'Photo not found' });
    return;
  }
  if (photo.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (caption !== undefined) { fields.push('caption = ?'); values.push(caption); }
  if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(tags)); }
  if (is_featured !== undefined) { fields.push('is_featured = ?'); values.push(is_featured); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE photos SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id) as any;
  updated.tags = updated.tags ? JSON.parse(updated.tags) : [];

  res.json({ success: true, data: updated, message: 'Photo updated' });
}

// Delete a photo (auth required)
export function deletePhoto(req: Request, res: Response): void {
  const db = getDB();
  const { id } = req.params;

  const photo = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id) as any;
  if (!photo) {
    res.status(404).json({ success: false, error: 'Photo not found' });
    return;
  }
  if (photo.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  db.prepare(`DELETE FROM photos WHERE id = ?`).run(id);
  res.json({ success: true, message: 'Photo deleted' });
}
