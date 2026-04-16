// Message controller — direct messaging
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';

// List conversations (unique users messaged with)
export function listConversations(req: Request, res: Response): void {
  const db = getDB();
  const userId = req.userId!;

  const conversations = db.prepare(
    `SELECT
       CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
       u.username, u.display_name, u.avatar_url,
       (SELECT COUNT(*) FROM messages
        WHERE receiver_id = ? AND sender_id = other_user_id AND is_read = 0
          AND is_deleted_by_receiver = 0) as unread_count,
       MAX(m.created_at) as last_message_at,
       (SELECT content FROM messages
        WHERE (sender_id = ? AND receiver_id = other_user_id)
           OR (sender_id = other_user_id AND receiver_id = ?)
        ORDER BY created_at DESC LIMIT 1) as last_message
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
     WHERE (m.sender_id = ? OR m.receiver_id = ?)
       AND m.is_deleted_by_sender = 0 AND m.is_deleted_by_receiver = 0
       AND u.is_deleted = 0
     GROUP BY other_user_id
     ORDER BY last_message_at DESC`
  ).all(userId, userId, userId, userId, userId, userId, userId) as any[];

  res.json({ success: true, data: conversations });
}

// Get messages in a conversation
export function getConversation(req: Request, res: Response): void {
  const db = getDB();
  const { targetUsername } = req.params;
  const userId = req.userId!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const target = db.prepare(
    `SELECT id FROM users WHERE username = ? AND is_deleted = 0`
  ).get(targetUsername) as { id: string } | undefined;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const messages = db.prepare(
    `SELECT m.*, u.username, u.display_name, u.avatar_url
     FROM messages m JOIN users u ON m.sender_id = u.id
     WHERE ((m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?))
       AND m.is_deleted_by_${req.userId === target.id ? 'receiver' : 'sender'} = 0
     ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
  ).all(userId, target.id, target.id, userId, limit, offset) as any[];

  // Mark messages as read
  db.prepare(
    `UPDATE messages SET is_read = 1
     WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`
  ).run(target.id, userId);

  res.json({ success: true, data: messages.reverse() });
}

// Send a message
export function sendMessage(req: Request, res: Response): void {
  const db = getDB();
  const { targetUsername, content } = req.body as { targetUsername: string; content: string };

  if (!content) {
    res.status(400).json({ success: false, error: 'content is required' });
    return;
  }

  const target = db.prepare(
    `SELECT id FROM users WHERE username = ? AND is_deleted = 0`
  ).get(targetUsername) as { id: string } | undefined;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  if (target.id === req.userId) {
    res.status(400).json({ success: false, error: 'Cannot message yourself' });
    return;
  }

  const id = uuid().replace(/-/g, '').slice(0, 32);
  db.prepare(
    `INSERT INTO messages (id, sender_id, receiver_id, content)
     VALUES (?, ?, ?, ?)`
  ).run(id, req.userId, target.id, content);

  const message = db.prepare(
    `SELECT m.*, u.username, u.display_name, u.avatar_url
     FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`
  ).get(id);

  res.status(201).json({ success: true, data: message, message: 'Message sent' });
}

// Delete a message (soft delete per user)
export function deleteMessage(req: Request, res: Response): void {
  const db = getDB();
  const { id } = req.params;
  const userId = req.userId!;

  const message = db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as any;
  if (!message) {
    res.status(404).json({ success: false, error: 'Message not found' });
    return;
  }

  const col = message.sender_id === userId ? 'is_deleted_by_sender' : 'is_deleted_by_receiver';
  db.prepare(
    `UPDATE messages SET ${col} = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(id);

  res.json({ success: true, message: 'Message deleted' });
}
