// Project detail page
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Comment as CommentType } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import Header from '../components/Header/Header';

interface ProjectData {
  project: Project;
  comments: (CommentType)[];
}

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useFetch<ProjectData>(`/projects/${slug}`);

  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state">
            <div className="spinner" role="status"><span className="sr-only">加载中...</span></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state" role="alert">
            <p style={{ color: colors.error }}>作品不存在或加载失败</p>
            <Link to="/" className="btn btn-primary">返回首页</Link>
          </div>
        </div>
      </>
    );
  }

  const { project, comments } = data;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post('/comments', {
        content: newComment.trim(),
        project_id: project.id,
      });
      if (res.success) {
        setNewComment('');
        refetch?.();
      }
    } finally {
      setCommenting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: '900px' }} role="main">
        {/* Back link */}
        <Link
          to={`/u/${project.username}`}
          style={{ color: colors.primary, fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
        >
          &larr; 返回 {project.display_name || project.username} 的空间
        </Link>

        {/* Project header */}
        <article className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: colors.text }}>
            {project.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: colors.textMuted, fontSize: '0.85rem' }}>
            <Link to={`/u/${project.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
              {project.display_name || project.username}
            </Link>
            <span>&middot;</span>
            <time dateTime={project.created_at}>{new Date(project.created_at).toLocaleDateString('zh-CN')}</time>
            {project.is_featured && <span className="badge" style={{ background: colors.primary, color: '#fff' }}>精选</span>}
          </div>

          {/* Cover image */}
          {project.cover_image && (
            <img
              src={project.cover_image}
              alt={project.title}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}
            />
          )}

          {/* Description */}
          {project.description && (
            <p style={{ fontSize: '1.05rem', color: colors.textSecondary, marginBottom: '1.5rem', lineHeight: 1.7 }}>
              {project.description}
            </p>
          )}

          {/* Media gallery */}
          {project.media && project.media.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {project.media.map((m: any, i: number) => (
                <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {m.thumbnail || m.url ? (
                    <img
                      src={m.thumbnail || m.url}
                      alt={m.title || ''}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgTertiary, fontSize: '2rem' }}>
                      {m.type === 'video' ? '🎬' : m.type === 'audio' ? '🎵' : m.type === 'document' ? '📄' : '🖼️'}
                    </div>
                  )}
                  {m.title && (
                    <div style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 500 }}>
                      {m.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {project.tags.map(tag => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>
          )}

          {/* External links */}
          {project.external_links && project.external_links.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {project.external_links.map((link: any) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  🔗 {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Version history */}
          {project.version_history && project.version_history.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>版本历史</h3>
              {project.version_history.map((v: any) => (
                <div key={v.version} style={{ padding: '0.75rem', background: colors.bgTertiary, borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>v{v.version} — {v.date}</div>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{v.changes}</div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Comments */}
        <section style={{ marginTop: '2rem' }} aria-labelledby="comments-heading">
          <h2 id="comments-heading" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            评论 ({comments.length})
          </h2>

          {/* Comment form */}
          {user && (
            <form onSubmit={handleComment} style={{ marginBottom: '1.5rem' }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                style={{ width: '100%', resize: 'vertical', marginBottom: '0.5rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={commenting || !newComment.trim()}>
                {commenting ? '发送中...' : '发表评论'}
              </button>
            </form>
          )}

          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>暂无评论</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {comments.map(c => (
                <div key={c.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: colors.text }}>
                      {c.display_name || c.username}
                    </span>
                    <time dateTime={c.created_at} style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      {new Date(c.created_at).toLocaleDateString('zh-CN')}
                    </time>
                  </div>
                  <div style={{ lineHeight: 1.6, color: colors.textSecondary }}>{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default ProjectDetail;
