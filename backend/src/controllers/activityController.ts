// Activity / Feed controller
import { Request, Response } from 'express';
import { getDB } from '../db';

export function getFeed(req: Request, res: Response): void {
  const db = getDB();
  const { username } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const user = db.prepare(`SELECT id FROM users WHERE username = ? AND is_deleted = 0`).get(username) as { id: string } | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM activities WHERE user_id = ? AND is_deleted = 0`
  ).get(user.id) as { count: number };

  const activities = db.prepare(
    `SELECT a.*, u.username, u.display_name, u.avatar_url
     FROM activities a JOIN users u ON a.user_id = u.id
     WHERE a.user_id = ? AND a.is_deleted = 0
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(user.id, limit, offset) as any[];

  // Parse metadata and enrich with target info
  const enriched = activities.map(a => {
    let target: any = null;
    if (a.target_type === 'post') {
      target = db.prepare(
        `SELECT id, title, slug FROM posts WHERE id = ? AND is_deleted = 0`
      ).get(a.target_id);
    } else if (a.target_type === 'project') {
      target = db.prepare(
        `SELECT id, title, slug FROM projects WHERE id = ? AND is_deleted = 0`
      ).get(a.target_id);
    }
    return {
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : null,
      target,
    };
  });

  res.json({
    success: true,
    data: enriched,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

// Get unread message count
export function getUnreadCount(req: Request, res: Response): void {
  const db = getDB();
  const count = db.prepare(
    `SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0
     AND is_deleted_by_receiver = 0`
  ).get(req.userId) as { count: number };

  res.json({ success: true, data: { unread: count.count } });
}
