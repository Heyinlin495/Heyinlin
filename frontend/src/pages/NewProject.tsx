// New Project page — create a new portfolio project
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Header from '../components/Header/Header';

interface MediaItem {
  type: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

interface ExternalLink {
  label: string;
  url: string;
}

const NewProject: React.FC = () => {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <p>请先登录后再发布作品</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>去登录</Link>
        </div>
      </>
    );
  }

  const addMediaItem = () => {
    setMediaItems([...mediaItems, { type: 'image', url: '' }]);
  };

  const updateMediaItem = (index: number, field: keyof MediaItem, value: string) => {
    const updated = [...mediaItems];
    updated[index] = { ...updated[index], [field]: value };
    setMediaItems(updated);
  };

  const removeMediaItem = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };

  const addExternalLink = () => {
    setExternalLinks([...externalLinks, { label: '', url: '' }]);
  };

  const updateExternalLink = (index: number, field: keyof ExternalLink, value: string) => {
    const updated = [...externalLinks];
    updated[index] = { ...updated[index], [field]: value };
    setExternalLinks(updated);
  };

  const removeExternalLink = (index: number) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage('请输入标题');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/projects', {
        title: title.trim(),
        description: description.trim() || null,
        cover_image: coverImage.trim() || null,
        tags: tagsText.split(',').map(s => s.trim()).filter(Boolean),
        media: mediaItems.filter(m => m.url.trim()),
        external_links: externalLinks.filter(l => l.label.trim() && l.url.trim()),
        status,
      });

      if (res.success && res.data) {
        setMessage(status === 'published' ? '作品发布成功！' : '草稿保存成功！');
        const project = res.data as any;
        if (status === 'published' && project.slug) {
          setTimeout(() => navigate(`/p/${project.slug}`), 800);
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>发布新作品</h1>
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
          {/* Basic info */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>基本信息</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="project-title" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  标题 *
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="给你的作品起个标题"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="project-desc" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  描述
                </label>
                <textarea
                  id="project-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="简要描述你的作品..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label htmlFor="project-cover" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  封面图片 URL
                </label>
                <input
                  id="project-cover"
                  type="url"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
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
                <label htmlFor="project-tags" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  标签（逗号分隔）
                </label>
                <input
                  id="project-tags"
                  type="text"
                  value={tagsText}
                  onChange={e => setTagsText(e.target.value)}
                  placeholder="React, UI设计, 开源"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Media items */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>媒体素材</h2>
              <button type="button" onClick={addMediaItem} className="btn btn-sm btn-outline">
                + 添加
              </button>
            </div>

            {mediaItems.map((item, index) => (
              <div key={index} style={{ padding: '1rem', background: colors.bgTertiary, borderRadius: 'var(--radius)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <select
                    value={item.type}
                    onChange={e => updateMediaItem(index, 'type', e.target.value)}
                    style={{
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <option value="image">图片</option>
                    <option value="video">视频</option>
                    <option value="audio">音频</option>
                    <option value="document">文档</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMediaItem(index)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: colors.error,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    删除
                  </button>
                </div>
                <input
                  value={item.url}
                  onChange={e => updateMediaItem(index, 'url', e.target.value)}
                  placeholder="文件 URL"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <input
                  value={item.title || ''}
                  onChange={e => updateMediaItem(index, 'title', e.target.value)}
                  placeholder="标题（可选）"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <input
                  value={item.description || ''}
                  onChange={e => updateMediaItem(index, 'description', e.target.value)}
                  placeholder="描述（可选）"
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            {mediaItems.length === 0 && (
              <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center' }}>
                还没有添加媒体素材
              </p>
            )}
          </div>

          {/* External links */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>外部链接</h2>
              <button type="button" onClick={addExternalLink} className="btn btn-sm btn-outline">
                + 添加
              </button>
            </div>

            {externalLinks.map((link, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  value={link.label}
                  onChange={e => updateExternalLink(index, 'label', e.target.value)}
                  placeholder="链接名称"
                  style={{ flex: 1 }}
                />
                <input
                  value={link.url}
                  onChange={e => updateExternalLink(index, 'url', e.target.value)}
                  placeholder="https://"
                  type="url"
                  style={{ flex: 2 }}
                />
                <button
                  type="button"
                  onClick={() => removeExternalLink(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.error,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  删除
                </button>
              </div>
            ))}

            {externalLinks.length === 0 && (
              <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center' }}>
                还没有添加外部链接
              </p>
            )}
          </div>

          {/* Publish settings */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                发布方式：
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="project-status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                />
                存为草稿
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="project-status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                />
                立即发布
              </label>
            </div>
          </div>

          {/* Submit buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !title.trim()}
              style={{ flex: 1 }}
            >
              {loading ? '提交中...' : status === 'published' ? '发布作品' : '保存草稿'}
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

export default NewProject;
