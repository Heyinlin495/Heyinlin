// Edit Post page — edit or delete an existing article
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Header from '../components/Header/Header';
import { Post, POST_CATEGORY_LABELS } from '../types';

const EditPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('general');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.get<any>(`/posts/${slug}`).then(res => {
      if (res.success && res.data?.post) {
        const p = res.data.post;
        setPost(p);
        setTitle(p.title);
        setContent(p.content || '');
        setExcerpt(p.excerpt || '');
        setCoverImage(p.cover_image || '');
        setCategory(p.category || 'general');
        setStatus(p.status);
        setIsPinned(!!p.is_pinned);
      }
      setFetching(false);
    });
  }, [slug]);

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <p>请先登录</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>去登录</Link>
        </div>
      </>
    );
  }

  if (fetching) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state"><div className="spinner" role="status"><span className="sr-only">加载中...</span></div></div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <p>文章不存在</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>返回首页</Link>
        </div>
      </>
    );
  }

  if (post.user_id !== user?.id) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <p>无权编辑此文章</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>返回首页</Link>
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
      const res = await api.put(`/posts/${slug}`, {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || null,
        cover_image: coverImage.trim() || null,
        category,
        status,
        is_pinned: isPinned,
      });

      if (res.success) {
        setMessage('保存成功！');
        const updated = res.data as any;
        if (updated?.slug) {
          setTimeout(() => navigate(`/a/${updated.slug}`), 800);
        }
      } else {
        setMessage(res.error || '保存失败');
      }
    } catch (err) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return;

    setLoading(true);
    try {
      const res = await api.delete(`/posts/${slug}`);
      if (res.success) {
        navigate(`/u/${user?.username}`);
      } else {
        setMessage(res.error || '删除失败');
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>编辑文章</h1>
          <Link to={`/a/${slug}`} className="btn btn-sm btn-outline">
            预览 →
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
                <label htmlFor="edit-post-title" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  标题 *
                </label>
                <input
                  id="edit-post-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="edit-post-category" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  分类
                </label>
                <select
                  id="edit-post-category"
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
                <label htmlFor="edit-post-excerpt" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  摘要
                </label>
                <input
                  id="edit-post-excerpt"
                  type="text"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="简短介绍你的文章（可选）"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="edit-post-cover" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  封面图片 URL
                </label>
                <input
                  id="edit-post-cover"
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
                <label htmlFor="edit-post-content" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  正文（支持 Markdown）
                </label>
                <textarea
                  id="edit-post-content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={16}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-family-mono, monospace)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  状态：
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="radio" name="edit-status" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} />
                  草稿
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="radio" name="edit-status" value="published" checked={status === 'published'} onChange={() => setStatus('published')} />
                  已发布
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="radio" name="edit-status" value="archived" checked={status === 'archived'} onChange={() => setStatus('archived')} />
                  已归档
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                />
                <span style={{ fontSize: '0.9rem' }}>置顶显示</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !title.trim()} style={{ flex: 1 }}>
              {loading ? '保存中...' : '保存更改'}
            </button>
            <button type="button" onClick={handleDelete} className="btn btn-lg" style={{ background: colors.error, color: '#fff' }} disabled={loading}>
              删除
            </button>
            <Link to={`/u/${user?.username}`} className="btn btn-lg btn-outline">
              取消
            </Link>
          </div>
        </form>
      </main>
    </>
  );
};

export default EditPost;
