// Database seed script — creates demo data for development
import 'dotenv/config';
import { initDB, getDB, closeDB } from './index';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

async function seed() {
  await initDB();
  const db = getDB();

  // Check if already seeded
  const existing = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
  if (existing.count > 0) {
    console.log('Database already has data. Skipping seed.');
    closeDB();
    process.exit(0);
  }

  const SALT_ROUNDS = 10;
  const passwordHash = bcrypt.hashSync('demo1234', SALT_ROUNDS);

  console.log('Seeding database...');

  db.transaction(() => {
    // Create demo users
    const userId1 = uuid().replace(/-/g, '').slice(0, 32); // heyinlin
    const userId2 = uuid().replace(/-/g, '').slice(0, 32); // visitor
    const userId3 = uuid().replace(/-/g, '').slice(0, 32); // designer

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, bio, role_type, theme, is_verified, website, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId1, 'heyinlin', 'heyinlin@example.com', passwordHash,
      '何雨林', '创意设计师与全栈开发者。热爱用代码构建美好的事物。',
      'creative', 'creative', 1, 'https://heyinlin.dev', '上海'
    );

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, bio, role_type, theme, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId2, 'visitor', 'visitor@example.com', passwordHash,
      '访客', '喜欢探索新技术和创意设计',
      'tech', 'tech', 0
    );

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, bio, role_type, theme, is_verified, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId3, 'designer', 'designer@example.com', passwordHash,
      '设计师小王', 'UI/UX 设计师，专注于用户体验',
      'photography', 'photography', 1, 'https://designer.co'
    );

    // Profile bios
    db.prepare(
      `INSERT INTO profile_bios (id, user_id, headline, occupation, skills, social_links)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      uuid().replace(/-/g, '').slice(0, 32), userId1,
      '用代码编织创意', '全栈开发者',
      JSON.stringify(['React', 'TypeScript', 'Node.js', 'Design']),
      JSON.stringify({ github: 'https://github.com/heyinlin', twitter: '@heyinlin' })
    );

    // Posts
    const now = new Date().toISOString();
    const postIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const postId = uuid().replace(/-/g, '').slice(0, 32);
      postIds.push(postId);
      db.prepare(
        `INSERT INTO posts (id, user_id, title, slug, content, excerpt, status, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, 'published', datetime('now', ?), datetime('now', ?))`
      ).run(
        postId, userId1,
        `个人空间开发指南 #${i + 1}`,
        `guide-${i + 1}-${Date.now()}`,
        `这是一篇关于个人空间开发的技术文章第 ${i + 1} 部分。涵盖了从设计到实现的完整流程。`,
        `探索个人空间开发的第 ${i + 1} 个关键方面`,
        `-${7 - i} days`, `-${7 - i} days`
      );
    }

    // Projects
    for (let i = 0; i < 4; i++) {
      const projectId = uuid().replace(/-/g, '').slice(0, 32);
      db.prepare(
        `INSERT INTO projects (id, user_id, title, slug, description, cover_image, media, tags, external_links, status, is_featured, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, datetime('now', ?), datetime('now', ?))`
      ).run(
        projectId, userId1,
        ['个人品牌网站', '数据可视化仪表板', '创意作品集', '博客引擎'][i],
        ['brand-site', 'data-viz', 'creative-portfolio', 'blog-engine'][i],
        ['一个展示个人品牌与作品的响应式网站', '实时数据监控与可视化平台', '多媒体创意作品展示平台', '基于 Markdown 的轻量博客系统'][i],
        null,
        JSON.stringify([
          { type: 'image', url: `/api/uploads/project-${i}.jpg`, title: '项目截图' }
        ]),
        JSON.stringify([['React', '设计'][i % 2], ['TypeScript', 'D3.js'][i % 2], 'Node.js']),
        JSON.stringify([{ label: '在线预览', url: 'https://example.com' }, { label: '源代码', url: 'https://github.com' }]),
        i < 2 ? 1 : 0,
        `-${5 - i} days`, `-${5 - i} days`
      );
    }

    // Follows
    db.prepare(
      `INSERT INTO follows (id, follower_id, following_id, status) VALUES (?, ?, ?, 'accepted')`
    ).run(uuid().replace(/-/g, '').slice(0, 32), userId2, userId1);
    db.prepare(
      `INSERT INTO follows (id, follower_id, following_id, status) VALUES (?, ?, ?, 'accepted')`
    ).run(uuid().replace(/-/g, '').slice(0, 32), userId3, userId1);

    // Comments
    for (let i = 0; i < 3; i++) {
      db.prepare(
        `INSERT INTO comments (id, user_id, post_id, content, created_at)
         VALUES (?, ?, ?, ?, datetime('now', ?))`
      ).run(
        uuid().replace(/-/g, '').slice(0, 32),
        [userId2, userId3, userId2][i],
        postIds[i],
        ['写得很棒！', '很有启发的内容', '期待后续文章'][i],
        `-${3 - i} days`
      );
    }

    // Activities
    db.prepare(
      `INSERT INTO activities (id, user_id, action_type, target_type, target_id, created_at)
       VALUES (?, ?, 'post_created', 'post', ?, datetime('now', '-7 days'))`
    ).run(uuid().replace(/-/g, '').slice(0, 32), userId1, postIds[0]);
    db.prepare(
      `INSERT INTO activities (id, user_id, action_type, target_type, target_id, created_at)
       VALUES (?, ?, 'project_created', 'project', ?, datetime('now', '-5 days'))`
    ).run(uuid().replace(/-/g, '').slice(0, 32), userId1, postIds[0]);

    console.log('Seed completed successfully!');
    console.log('Demo users:');
    console.log('  heyinlin / demo1234 (creative theme)');
    console.log('  visitor  / demo1234 (tech theme)');
    console.log('  designer / demo1234 (photography theme)');
  })();

  closeDB();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
