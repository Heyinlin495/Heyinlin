// Post detail page
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Post, Comment as CommentType } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import Header from '../components/Header/Header';

interface PostData {
  post: Post;
  comments: (CommentType)[];
}

// Simple Markdown-like rendering (handles basic formatting)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let key = 0;

  const processInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    // Bold **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    const segments: React.ReactNode[] = [];

    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        segments.push(remaining.slice(lastIndex, match.index));
      }
      segments.push(<strong key={partKey++}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      segments.push(remaining.slice(lastIndex));
    }

    if (segments.length === 1 && typeof segments[0] === 'string') {
      // Check for italic *text*
      const italicSegments: React.ReactNode[] = [];
      let rest = segments[0] as string;
      const italicRegex = /\*(.+?)\*/g;
      let iLastIndex = 0;
      let iPartKey = 0;

      while ((match = italicRegex.exec(rest)) !== null) {
        if (match.index > iLastIndex) {
          italicSegments.push(rest.slice(iLastIndex, match.index));
        }
        italicSegments.push(<em key={iPartKey++}>{match[1]}</em>);
        iLastIndex = match.index + match[0].length;
      }
      if (iLastIndex < rest.length) {
        italicSegments.push(rest.slice(iLastIndex));
      }

      if (italicSegments.length === 1 && typeof italicSegments[0] === 'string') {
        // Check for inline code `text`
        const codeSegments: React.ReactNode[] = [];
        let codeRest = italicSegments[0] as string;
        const codeRegex = /`(.+?)`/g;
        let cLastIndex = 0;
        let cPartKey = 0;

        while ((match = codeRegex.exec(codeRest)) !== null) {
          if (match.index > cLastIndex) {
            codeSegments.push(codeRest.slice(cLastIndex, match.index));
          }
          codeSegments.push(
            <code key={cPartKey++} style={{ background: '#f0f0f0', padding: '0.15rem 0.35rem', borderRadius: '3px', fontSize: '0.9em' }}>
              {match[1]}
            </code>
          );
          cLastIndex = match.index + match[0].length;
        }
        if (cLastIndex < codeRest.length) {
          codeSegments.push(codeRest.slice(cLastIndex));
        }
        parts.push(...codeSegments);
      } else {
        parts.push(...italicSegments);
      }
    } else {
      parts.push(...segments);
    }

    return parts;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (inCodeBlock) {
      if (line.trim() === '```') {
        inCodeBlock = false;
        elements.push(
          <pre key={key++} style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: 'var(--radius)', overflow: 'auto', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (line.trim() === '```') {
      inCodeBlock = true;
      codeLines = [];
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1rem 0 0.5rem' }}>{processInline(line.slice(4))}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.25rem 0 0.5rem' }}>{processInline(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} style={{ fontSize: '1.5rem', fontWeight: 800, margin: '1.5rem 0 0.75rem' }}>{processInline(line.slice(2))}</h1>);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} style={{ border: 'none', borderTop: `1px solid var(--border-light, #F0F0F0)`, margin: '1.5rem 0' }} />);
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s/)) {
      elements.push(
        <li key={key++} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>
          {processInline(line.replace(/^\s*[-*]\s/, ''))}
        </li>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} style={{ borderLeft: `3px solid var(--primary-light, #A29BFE)`, paddingLeft: '1rem', margin: '0.75rem 0', color: 'var(--text-secondary, #636E72)', fontStyle: 'italic' }}>
          {processInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: '0.5rem' }} />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} style={{ marginBottom: '0.75rem', lineHeight: 1.8 }}>
        {processInline(line)}
      </p>
    );
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key={key++} style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: 'var(--radius)', overflow: 'auto', fontSize: '0.85rem' }}>
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useFetch<PostData>(`/posts/${slug}`);

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
            <p style={{ color: colors.error }}>文章不存在或加载失败</p>
            <Link to="/" className="btn btn-primary">返回首页</Link>
          </div>
        </div>
      </>
    );
  }

  const { post, comments } = data;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post('/comments', {
        content: newComment.trim(),
        post_id: post.id,
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
      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: '760px' }} role="main">
        {/* Back link */}
        <Link
          to={`/u/${post.username}`}
          style={{ color: colors.primary, fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
        >
          &larr; 返回 {post.display_name || post.username} 的空间
        </Link>

        {/* Post header */}
        <article className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: colors.text }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: colors.textMuted, fontSize: '0.85rem' }}>
            <Link to={`/u/${post.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
              {post.display_name || post.username}
            </Link>
            <span>&middot;</span>
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('zh-CN')}</time>
          </div>

          {/* Cover image */}
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}
            />
          )}

          {/* Content with Markdown rendering */}
          <div
            style={{
              lineHeight: 1.8,
              color: colors.text,
              wordBreak: 'break-word',
            }}
          >
            {post.content ? renderMarkdown(post.content) : <p style={{ color: colors.textMuted }}>暂无内容</p>}
          </div>
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

export default PostDetail;
