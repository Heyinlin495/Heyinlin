// Portfolio — project grid with lazy loading, filtering, and pagination
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePaginated } from '../../hooks/useFetch';

interface PortfolioProps {
  username: string;
}

const Portfolio: React.FC<PortfolioProps> = ({ username }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isOwner = user?.username === username;
  const [activeTag, setActiveTag] = useState<string>('all');
  const loaderRef = useRef<HTMLDivElement>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const {
    items: projects,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginated<Project>(
    `/projects/user/${username}`,
    9,
    [activeTag]
  );

  // Collect all unique tags from loaded projects
  useEffect(() => {
    const tags = new Set<string>();
    projects?.forEach(p => p.tags?.forEach(t => tags.add(t)));
    setAllTags(['all', ...Array.from(tags)]);
  }, [projects]);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Filter by tag client-side (for simplicity; server-side filtering available in API)
  const filtered = activeTag === 'all'
    ? projects
    : projects?.filter(p => p.tags?.includes(activeTag));

  return (
    <section aria-labelledby="portfolio-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 id="portfolio-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          作品墙
        </h2>
        <button onClick={refresh} className="btn btn-sm btn-outline" aria-label="Refresh">
          ↻ 刷新
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 1 && (
        <nav
          role="tablist"
          aria-label="Filter by tag"
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          {allTags.map(tag => (
            <button
              key={tag}
              role="tab"
              aria-selected={activeTag === tag}
              onClick={() => setActiveTag(tag)}
              className={`btn btn-sm ${
                activeTag === tag ? 'btn-primary' : 'btn-outline'
              }`}
              style={{
                fontSize: '0.8rem',
                padding: '0.3rem 0.75rem',
              }}
            >
              {tag === 'all' ? '全部' : tag}
            </button>
          ))}
        </nav>
      )}

      {/* Loading state */}
      {isLoading && projects?.length === 0 && (
        <div className="empty-state">
          <div className="spinner" role="status">
            <span className="sr-only">加载中...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="empty-state" role="alert">
          <p style={{ color: colors.error }}>加载失败：{error}</p>
          <button onClick={refresh} className="btn btn-primary btn-sm">
            重试
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered?.length === 0 && (
        <div className="empty-state">
          <p>暂无作品</p>
        </div>
      )}

      {/* Project grid */}
      <div
        className="project-grid"
        role="list"
        aria-label="Project list"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filtered?.map((project: Project) => (
          <Link
            key={project.id}
            to={`/p/${project.slug}`}
            role="listitem"
            className="card"
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            {/* Cover image */}
            {project.cover_image ? (
              <div
                style={{
                  height: '160px',
                  margin: '-1.5rem -1.5rem 1rem',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={project.cover_image}
                  alt={project.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: '120px',
                  margin: '-1.5rem -1.5rem 1rem',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.accentLight})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  color: colors.primary,
                }}
              >
                📁
              </div>
            )}

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {project.title}
            </h3>

            {project.description && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: colors.textSecondary,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {project.description}
              </p>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem', marginBottom: isOwner ? '0.5rem' : 0 }}>
                {project.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
                {project.tags.length > 3 && (
                  <span className="badge">+{project.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Edit link for owner */}
            {isOwner && (
              <Link
                to={`/edit-project/${project.slug}`}
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: colors.textMuted,
                  textDecoration: 'none',
                }}
              >
                编辑作品
              </Link>
            )}

            {/* Featured badge */}
            {project.is_featured && (
              <span
                className="badge"
                style={{
                  background: colors.primary,
                  color: '#fff',
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                }}
              >
                精选
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={loaderRef} style={{ height: '1px' }} aria-hidden="true" />

      {/* Loading more indicator */}
      {isLoading && projects && projects.length > 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}>
            <span className="sr-only">加载更多...</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default Portfolio;
