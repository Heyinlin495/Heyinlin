// User controller — registration, login, profile CRUD, privacy
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db';
import { CreateUserInput, UpdateUserInput, PublicUser, AuthTokens, ApiResponse } from '../types';
import { verifyCaptcha } from '../utils/captcha';

const SALT_ROUNDS = 10;
const ACCESS_EXPIRES_MS = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_MS = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const ACCESS_EXPIRES_SQL = process.env.JWT_EXPIRES_IN || '7 days';
const REFRESH_EXPIRES_SQL = process.env.JWT_REFRESH_EXPIRES_IN || '30 days';
const SECRET = process.env.JWT_SECRET || 'fallback-secret';

function signTokens(userId: string, username: string): AuthTokens {
  const accessToken = jwt.sign({ sub: userId, username }, SECRET, { expiresIn: ACCESS_EXPIRES_MS } as jwt.SignOptions);
  const refreshToken = jwt.sign({ sub: userId, username }, SECRET, { expiresIn: REFRESH_EXPIRES_MS } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

// Register a new user
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password, display_name, bio, role_type, theme } = req.body as {
      username: string; email: string; password: string;
      display_name?: string; bio?: string; role_type?: string; theme?: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: 'username, email, and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    const db = getDB();

    // Check username uniqueness
    const usernameTaken = db.prepare(
      `SELECT id FROM users WHERE username = ?`
    ).get(username) as { id: string } | undefined;

    if (usernameTaken) {
      res.status(409).json({ success: false, error: '用户名已存在' });
      return;
    }

    // Check email uniqueness
    const emailTaken = db.prepare(
      `SELECT id FROM users WHERE email = ?`
    ).get(email) as { id: string } | undefined;

    if (emailTaken) {
      res.status(409).json({ success: false, error: '邮箱已存在' });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuid().replace(/-/g, '').slice(0, 32);

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, bio, role_type, theme)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, username, email, password_hash, display_name || username, bio || '', role_type || 'creative', theme || 'creative');

    // Create default profile bio
    db.prepare(
      `INSERT INTO profile_bios (id, user_id) VALUES (?, ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), id);

    const tokens = signTokens(id, username);

    // Store refresh token
    const tokenHash = require('crypto').createHash('sha256').update(tokens.refreshToken).digest('hex');
    db.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, datetime('now', ?))`
    ).run(uuid().replace(/-/g, '').slice(0, 32), id, tokenHash, `+${REFRESH_EXPIRES_SQL}`);

    const user = db.prepare(
      `SELECT id, username, display_name, avatar_url, bio, role_type, website, location,
              is_verified, is_private, theme, created_at
       FROM users WHERE id = ?`
    ).get(id) as PublicUser;

    res.status(201).json({
      success: true,
      data: { user, tokens },
      message: 'User registered successfully'
    } as ApiResponse);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, captchaToken, captchaAnswer } = req.body as { email: string; password: string; captchaToken?: string; captchaAnswer?: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required' });
      return;
    }

    // Verify captcha
    if (captchaToken && captchaAnswer) {
      if (!verifyCaptcha(captchaToken, captchaAnswer)) {
        res.status(400).json({ success: false, error: '验证码错误或已过期' });
        return;
      }
    }

    const db = getDB();
    const user = db.prepare(
      `SELECT * FROM users WHERE (email = ? OR username = ?) AND is_deleted = 0`
    ).get(email, email) as any;

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const tokens = signTokens(user.id, user.username);

    // Audit log
    db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, ip_address, user_agent)
       VALUES (?, ?, 'login', 'user', ?, ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), user.id, req.ip, req.headers['user-agent']);

    const publicUser: PublicUser = {
      id: user.id, username: user.username, email: user.email,
      display_name: user.display_name, avatar_url: user.avatar_url,
      bio: user.bio, role_type: user.role_type, website: user.website,
      location: user.location, is_verified: user.is_verified,
      is_private: user.is_private, theme: user.theme,
      created_at: user.created_at, updated_at: user.updated_at,
    };

    res.json({ success: true, data: { user: publicUser, tokens } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Refresh token
export function refreshToken(req: Request, res: Response): void {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'refreshToken is required' });
      return;
    }

    const payload = jwt.verify(refreshToken, SECRET) as { sub: string; username: string };
    const db = getDB();
    const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

    const stored = db.prepare(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')`
    ).get(tokenHash) as any;

    if (!stored) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const tokens = signTokens(payload.sub, payload.username);

    // Revoke old token, store new one
    db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`).run(stored.id);
    const newHash = require('crypto').createHash('sha256').update(tokens.refreshToken).digest('hex');
    db.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, datetime('now', ?))`
    ).run(uuid().replace(/-/g, '').slice(0, 32), payload.sub, newHash, `+${REFRESH_EXPIRES_SQL}`);

    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
}

// Logout (revoke all refresh tokens)
export function logout(req: Request, res: Response): void {
  const db = getDB();
  db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`).run(req.userId);

  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, ip_address)
     VALUES (?, ?, 'logout', 'user', ?)`
  ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, req.ip);

  res.json({ success: true, message: 'Logged out successfully' });
}

// Get public profile
export function getProfile(req: Request, res: Response): void {
  const db = getDB();
  const { username } = req.params;

  const user = db.prepare(
    `SELECT id, username, display_name, avatar_url, bio, role_type,
            website, location, is_verified, is_private, theme, created_at
     FROM users WHERE username = ? AND is_deleted = 0`
  ).get(username) as PublicUser | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const bio = db.prepare(`SELECT * FROM profile_bios WHERE user_id = ?`).get(user.id) as any;
  // Parse JSON fields from profile_bios
  console.log('getProfile bio.raw:', bio?.skills, typeof bio?.skills);
  if (bio?.skills) bio.skills = JSON.parse(bio.skills);
  if (bio?.social_links) bio.social_links = JSON.parse(bio.social_links);
  if (bio?.education) bio.education = JSON.parse(bio.education);
  if (bio?.experience) bio.experience = JSON.parse(bio.experience);
  console.log('getProfile bio.parsed:', bio?.skills, typeof bio?.skills);
  const followerCount = db.prepare(
    `SELECT COUNT(*) as count FROM follows WHERE following_id = ? AND status = 'accepted'`
  ).get(user.id) as { count: number };
  const followingCount = db.prepare(
    `SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND status = 'accepted'`
  ).get(user.id) as { count: number };
  const postCount = db.prepare(
    `SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND status = 'published' AND is_deleted = 0`
  ).get(user.id) as { count: number };
  const projectCount = db.prepare(
    `SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'published' AND is_deleted = 0`
  ).get(user.id) as { count: number };

  res.json({
    success: true,
    data: {
      user,
      bio,
      stats: {
        followers: followerCount.count,
        following: followingCount.count,
        posts: postCount.count,
        projects: projectCount.count,
      },
      isFollowing: req.userId
        ? !!db.prepare(`SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'`)
            .get(req.userId, user.id)
        : false,
    }
  });
}

// Update own profile
export function updateProfile(req: Request, res: Response): void {
  const db = getDB();
  const updates = req.body as UpdateUserInput;
  const allowed = ['display_name', 'avatar_url', 'bio', 'website', 'location', 'theme', 'is_private'];
  const fields: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = ?`);
      values.push((updates as any)[key]);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: 'No valid fields to update' });
    return;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.userId);

  const oldUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const newUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId);

  // Audit log
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
     VALUES (?, ?, 'update', 'user', ?, ?, ?, ?)`
  ).run(
    uuid().replace(/-/g, '').slice(0, 32), req.userId, req.userId,
    JSON.stringify(oldUser), JSON.stringify(newUser), req.ip
  );

  const user = db.prepare(
    `SELECT id, username, display_name, avatar_url, bio, role_type,
            website, location, is_verified, is_private, theme, created_at, updated_at
     FROM users WHERE id = ?`
  ).get(req.userId) as PublicUser;

  res.json({ success: true, data: user, message: 'Profile updated' });
}

// Get own profile (for editing)
export function getMyProfile(req: Request, res: Response): void {
  const db = getDB();
  const user = db.prepare(
    `SELECT id, username, email, display_name, avatar_url, bio, role_type,
            website, location, is_verified, is_private, theme, created_at, updated_at
     FROM users WHERE id = ? AND is_deleted = 0`
  ).get(req.userId) as any;

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const bio = db.prepare(`SELECT * FROM profile_bios WHERE user_id = ?`).get(user.id) as any;
  if (bio?.skills) bio.skills = JSON.parse(bio.skills);
  if (bio?.social_links) bio.social_links = JSON.parse(bio.social_links);
  if (bio?.education) bio.education = JSON.parse(bio.education);
  if (bio?.experience) bio.experience = JSON.parse(bio.experience);
  res.json({ success: true, data: { user, bio } });
}

// Update profile bio (extended info)
export function updateProfileBio(req: Request, res: Response): void {
  const db = getDB();
  const { headline, occupation, skills, social_links, education, experience } = req.body;

  const existing = db.prepare(`SELECT id FROM profile_bios WHERE user_id = ?`).get(req.userId);

  if (existing) {
    db.prepare(
      `UPDATE profile_bios SET headline = ?, occupation = ?, skills = ?,
              social_links = ?, education = ?, experience = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).run(headline || null, occupation || null, skills ? JSON.stringify(skills) : null,
          social_links ? JSON.stringify(social_links) : null,
          education ? JSON.stringify(education) : null,
          experience ? JSON.stringify(experience) : null, req.userId);
  } else {
    db.prepare(
      `INSERT INTO profile_bios (id, user_id, headline, occupation, skills, social_links, education, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId,
          headline || null, occupation || null, skills ? JSON.stringify(skills) : null,
          social_links ? JSON.stringify(social_links) : null,
          education ? JSON.stringify(education) : null,
          experience ? JSON.stringify(experience) : null);
  }

  const bio = db.prepare(`SELECT * FROM profile_bios WHERE user_id = ?`).get(req.userId);
  res.json({ success: true, data: bio, message: 'Profile bio updated' });
}

// Anonymize and delete account (privacy strategy)
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const { password } = req.body as { password: string };
    const db = getDB();
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId) as any;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ success: false, error: 'Invalid password' });
      return;
    }

    const userId = req.userId;

    db.transaction(() => {
      // 1. Anonymize personal data
      db.prepare(
        `UPDATE users SET
          display_name = 'Deleted User',
          avatar_url = NULL,
          bio = '',
          website = NULL,
          location = NULL,
          email = 'deleted_' || id || '@deleted.local',
          anonymized = 1,
          is_deleted = 1,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(userId);

      // 2. Revoke all refresh tokens
      db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`).run(userId);

      // 3. Soft delete posts
      db.prepare(
        `UPDATE posts SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`
      ).run(userId);

      // 4. Soft delete projects
      db.prepare(
        `UPDATE projects SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`
      ).run(userId);

      // 5. Soft delete comments
      db.prepare(
        `UPDATE comments SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`
      ).run(userId);

      // 6. Soft delete messages (both sides)
      db.prepare(
        `UPDATE messages SET
          is_deleted_by_sender = 1,
          is_deleted_by_receiver = 1,
          deleted_at = CURRENT_TIMESTAMP
         WHERE sender_id = ? OR receiver_id = ?`
      ).run(userId, userId);

      // 7. Audit log
      db.prepare(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, ip_address)
         VALUES (?, ?, 'delete', 'user', ?, ?, ?)`
      ).run(uuid().replace(/-/g, '').slice(0, 32), userId, userId, JSON.stringify({
        username: user.username, email: user.email, display_name: user.display_name
      }), req.ip);
    })();

    res.json({ success: true, message: 'Account deleted. Your data has been anonymized.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Upload avatar image (stores as base64 data URL in SQLite)
export function uploadAvatar(req: Request, res: Response): void {
  try {
    const db = getDB();
    const file = (req as any).file;

    if (!file) {
      console.error('uploadAvatar: No file in request');
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // Convert file buffer to base64 data URL
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    console.log(`Updating avatar for user ${req.userId}, ${file.originalname}, ${file.size} bytes, data length: ${dataUrl.length}`);

    db.prepare(`UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(dataUrl, req.userId);

    const user = db.prepare(
      `SELECT id, username, display_name, avatar_url, bio, role_type,
              website, location, is_verified, is_private, theme, created_at, updated_at
       FROM users WHERE id = ?`
    ).get(req.userId) as PublicUser;

    console.log('Avatar updated successfully for user', user.username);
    res.json({ success: true, data: user, message: 'Avatar updated' });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
}

// Change password
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: '请提供当前密码和新密码' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: '新密码至少需要6个字符' });
      return;
    }

    const db = getDB();
    const user = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.userId) as any;

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: '当前密码不正确' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(newPasswordHash, req.userId);

    db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, ip_address)
       VALUES (?, ?, 'change_password', 'user', ?)`
    ).run(uuid().replace(/-/g, '').slice(0, 32), req.userId, req.ip);

    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
