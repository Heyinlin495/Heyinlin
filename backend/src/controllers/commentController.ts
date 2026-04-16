// Comment controller
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';

export function listComments(req: Request, res: Response): void {
  const db = getDB();
  const { targetType, targetId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const col = targetType === 'post' ? 'post_id' : targetType === 'project' ? 'project_id' : null;
  if (!col) {
    res.status(400).json({ success: false, error: 'Invalid target type' });
    return;
  }

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM comments WHERE ${col} = ? AND parent_id IS NULL AND is_deleted = 0`
  ).get(targetId) as { count: number };

  const comments = db.prepare(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.${col} = ? AND c.parent_id IS NULL AND c.is_deleted = 0
     ORDER BY c.created_at ASC LIMIT ? OFFSET ?`
  ).all(targetId, limit, offset) as any[];

  // Get replies for each comment
  for (const comment of comments) {
    comment.replies = db.prepare(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = ? AND c.is_deleted = 0
       ORDER BY c.created_at ASC`
    ).all(comment.id) as any[];
  }

  res.json({
    success: true,
    data: comments,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

export function createComment(req: Request, res: Response): void {
  const db = getDB();
  const { content, post_id, project_id, parent_id } = req.body as {
    content: string; post_id?: string; project_id?: string; parent_id?: string;
  };

  if (!content || (!post_id && !project_id)) {
    res.status(400).json({ success: false, error: 'content and either post_id or project_id required' });
    return;
  }

  const id = uuid().replace(/-/g, '').slice(0, 32);
  db.prepare(
    `INSERT INTO comments (id, user_id, post_id, project_id, parent_id, content)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, post_id || null, project_id || null, parent_id || null, content);

  // Activity
  if (!parent_id) {
    db.prepare(
      `INSERT INTO activities (id, user_id, action_type, target_type, target_id)
       VALUES (?, ?, 'comment', ?, ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, post_id ? 'post' : 'project', post_id || project_id);
  }

  const comment = db.prepare(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`
  ).get(id);

  res.status(201).json({ success: true, data: comment, message: 'Comment created' });
}

export function deleteComment(req: Request, res: Response): void {
  const db = getDB();
  const { id } = req.params;

  const comment = db.prepare(`SELECT * FROM comments WHERE id = ? AND is_deleted = 0`).get(id) as any;
  if (!comment) {
    res.status(404).json({ success: false, error: 'Comment not found' });
    return;
  }
  if (comment.user_id !== req.userId) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  db.prepare(
    `UPDATE comments SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(id);

  res.json({ success: true, message: 'Comment deleted' });
}
