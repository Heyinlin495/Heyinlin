// Follow/Subscribe controller
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';

// Follow a user
export function followUser(req: Request, res: Response): void {
  const db = getDB();
  const { targetUsername } = req.params;

  const target = db.prepare(
    `SELECT id, is_private FROM users WHERE username = ? AND is_deleted = 0`
  ).get(targetUsername) as { id: string; is_private: number } | undefined;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  if (target.id === req.userId) {
    res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    return;
  }

  const existing = db.prepare(
    `SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`
  ).get(req.userId, target.id) as any;

  if (existing) {
    if (existing.status === 'accepted') {
      res.status(409).json({ success: false, error: 'Already following this user' });
      return;
    }
    // Re-request follow
    db.prepare(`UPDATE follows SET status = ?, created_at = CURRENT_TIMESTAMP
                WHERE follower_id = ? AND following_id = ?`)
      .run(target.is_private ? 'pending' : 'accepted', req.userId, target.id);
  } else {
    db.prepare(
      `INSERT INTO follows (id, follower_id, following_id, status)
       VALUES (?, ?, ?, ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, target.id,
          target.is_private ? 'pending' : 'accepted');
  }

  // Activity
  db.prepare(
    `INSERT INTO activities (id, user_id, action_type, target_type, target_id)
     VALUES (?, ?, 'follow', 'user', ?)`
  ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, target.id);

  res.status(201).json({ success: true, message: target.is_private ? 'Follow request sent' : 'Now following' });
}

// Unfollow
export function unfollowUser(req: Request, res: Response): void {
  const db = getDB();
  const { targetUsername } = req.params;

  const target = db.prepare(
    `SELECT id FROM users WHERE username = ? AND is_deleted = 0`
  ).get(targetUsername) as { id: string } | undefined;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  db.prepare(
    `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`
  ).run(req.userId, target.id);

  res.json({ success: true, message: 'Unfollowed' });
}

// Get followers / following list
export function getFollowList(req: Request, res: Response): void {
  const db = getDB();
  const { username, type } = req.params; // type: 'followers' | 'following'
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const user = db.prepare(`SELECT id FROM users WHERE username = ? AND is_deleted = 0`).get(username) as { id: string } | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const col = type === 'followers' ? 'follower_id' : 'following_id';
  const joinCol = type === 'followers' ? 'following_id' : 'follower_id';

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM follows WHERE ${joinCol} = ? AND status = 'accepted'`
  ).get(user.id) as { count: number };

  const follows = db.prepare(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, f.created_at
     FROM follows f JOIN users u ON f.${col} = u.id
     WHERE f.${joinCol} = ? AND f.status = 'accepted'
     ORDER BY f.created_at DESC LIMIT ? OFFSET ?`
  ).all(user.id, limit, offset) as any[];

  res.json({
    success: true,
    data: follows,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) }
  });
}

// Check if current user follows a target
export function checkFollow(req: Request, res: Response): void {
  const db = getDB();
  const { targetUsername } = req.params;

  const target = db.prepare(
    `SELECT id FROM users WHERE username = ? AND is_deleted = 0`
  ).get(targetUsername) as { id: string } | undefined;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const follow = db.prepare(
    `SELECT status FROM follows WHERE follower_id = ? AND following_id = ?`
  ).get(req.userId, target.id) as { status: string } | undefined;

  res.json({ success: true, data: { following: !!follow, status: follow?.status || null } });
}
