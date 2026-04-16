// Posts list component — shows a user's articles
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post, POST_CATEGORY_LABELS } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePaginated } from '../../hooks/useFetch';

interface PostsListProps {
  username: string;
}

const PostsList: React.FC<PostsListProps> = ({ username }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isOwner = user?.username === username;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { items: allPosts, isLoading, error, hasMore, loadMore } = usePaginated<Post>(
    `/posts/user/${username}`,
    10
  );

  // Filter by category client-side
  const posts = activeCategory === 'all'
    ? allPosts
    : allPosts?.filter(p => p.category === activeCategory);

  // Collect categories from posts
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    allPosts?.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [allPosts]);

  if (isLoading && !posts) {
    return (
      <div className="empty-state">
        <div className="spinner" role="status">
          <span className="sr-only">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" role="alert">
        <p style={{ color: colors.error }}>加载失败：{error}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无文章</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="posts-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 id="posts-heading" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          文章
        </h2>

        {/* Category filter */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveCategory('all')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveCategory(cat)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {POST_CATEGORY_LABELS[cat as keyof typeof POST_CATEGORY_LABELS] || cat}
              </button>
            ))}
          </div>
        )}
      </div>
      <div role="list" aria-label="Article list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts?.map((post: Post) => (
          <Link
            key={post.id}
            to={`/a/${post.slug}`}
            role="listitem"
            className="card"
            style={{
              display: 'flex',
              gap: '1.25rem',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s ease',
              overflow: 'hidden',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            {/* Cover image */}
            {post.cover_image && (
              <div
                style={{
                  width: '160px',
                  height: '110px',
                  flexShrink: 0,
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={post.cover_image}
                  alt={post.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {post.title}
                {post.is_pinned && (
                  <span className="badge" style={{ background: colors.primary, color: '#fff', fontSize: '0.7rem' }}>
                    置顶
                  </span>
                )}
                {post.category && (
                  <span className="badge" style={{ fontSize: '0.7rem', background: `${colors.primary}15`, color: colors.primary }}>
                    {POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] || post.category}
                  </span>
                )}
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}
              >
                {post.excerpt || post.content?.slice(0, 150) || '暂无摘要'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <time dateTime={post.created_at} style={{ fontSize: '0.8rem', color: colors.textMuted }}>
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                </time>
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>{tag}</span>
                    ))}
                  </div>
                )}
                {isOwner && (
                  <Link
                    to={`/edit-post/${post.slug}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      color: colors.textMuted,
                      textDecoration: 'none',
                    }}
                  >
                    编辑
                  </Link>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={loadMore} className="btn btn-outline">
            加载更多
          </button>
        </div>
      )}
    </section>
  );
};

export default PostsList;
