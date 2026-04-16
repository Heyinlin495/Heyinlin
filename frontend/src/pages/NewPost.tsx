// New Post page — create a new article
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Header from '../components/Header/Header';
import { POST_CATEGORY_LABELS } from '../types';

const NewPost: React.FC = () => {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('general');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <p>请先登录后再发布文章</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>去登录</Link>
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage('请输入标题');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/posts', {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || title.trim().slice(0, 150),
        cover_image: coverImage.trim() || null,
        category,
        status,
      });

      if (res.success && res.data) {
        setMessage(status === 'published' ? '文章发布成功！' : '草稿保存成功！');
        const post = res.data as any;
        if (status === 'published' && post.slug) {
          setTimeout(() => navigate(`/a/${post.slug}`), 800);
        }
      } else {
        setMessage(res.error || '发布失败');
      }
    } catch (err) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }} role="main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>发布新文章</h1>
          <Link to={`/u/${user?.username}`} className="btn btn-sm btn-outline">
            &larr; 返回我的空间
          </Link>
        </div>

        {message && (
          <div
            role="status"
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              background: message.includes('成功') ? `${colors.success}15` : `${colors.error}15`,
              color: message.includes('成功') ? colors.success : colors.error,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="post-title" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  标题 *
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="给你的文章起个标题"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="post-excerpt" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  摘要
                </label>
                <input
                  id="post-excerpt"
                  type="text"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="简短介绍你的文章（可选）"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="post-category" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  分类
                </label>
                <select
                  id="post-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  {Object.entries(POST_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="post-cover" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  封面图片 URL
                </label>
                <input
                  id="post-cover"
                  type="url"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%' }}
                />
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius)', marginTop: '0.75rem' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>

              <div>
                <label htmlFor="post-content" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  正文（支持 Markdown）
                </label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="# 开始写作...\n\n在这里写你的文章内容，支持 Markdown 语法。"
                  rows={16}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-family-mono, monospace)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  发布方式：
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                  />
                  存为草稿
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                  />
                  立即发布
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !title.trim()}
              style={{ flex: 1 }}
            >
              {loading ? '提交中...' : status === 'published' ? '发布文章' : '保存草稿'}
            </button>
            <Link
              to={`/u/${user?.username}`}
              className="btn btn-lg btn-outline"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </>
  );
};

export default NewPost;
