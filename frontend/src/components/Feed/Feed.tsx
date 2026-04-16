// Feed — user activity timeline
import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { usePaginated } from '../../hooks/useFetch';

interface FeedProps {
  username: string;
}

// Action type labels
const ACTION_LABELS: Record<string, string> = {
  post_created: '发布了文章',
  project_created: '创建了作品',
  follow: '关注了用户',
  comment: '发表了评论',
  profile_updated: '更新了资料',
};

// Action type icons
const ACTION_ICONS: Record<string, string> = {
  post_created: '📝',
  project_created: '🎨',
  follow: '👤',
  comment: '💬',
  profile_updated: '✏️',
};

// Relative time formatter
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

const Feed: React.FC<FeedProps> = ({ username }) => {
  const { colors } = useTheme();
  const {
    items: activities,
    isLoading,
    error,
    hasMore,
    loadMore,
  } = usePaginated<Activity>(`/feed/${username}`, 15);

  if (isLoading && !activities) {
    return (
      <div className="empty-state">
        <div className="spinner" role="status">
          <span className="sr-only">加载动态...</span>
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

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无动态</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="feed-heading">
      <h2 id="feed-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
        动态
      </h2>

      <div role="list" aria-label="Activity feed" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activities.map((activity: Activity) => (
          <div
            key={activity.id}
            role="listitem"
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            {/* Icon */}
            <span
              style={{
                fontSize: '1.5rem',
                flexShrink: 0,
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors.bgTertiary,
                borderRadius: '50%',
              }}
              aria-hidden="true"
            >
              {ACTION_ICONS[activity.action_type] || '📌'}
            </span>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, color: colors.text }}>
                  {activity.display_name || activity.username}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                  {ACTION_LABELS[activity.action_type] || activity.action_type}
                </span>
              </div>

              {/* Target link */}
              {activity.target && (
                <Link
                  to={
                    activity.target_type === 'post'
                      ? `/a/${activity.target.slug}`
                      : `/p/${activity.target.slug}`
                  }
                  style={{
                    display: 'block',
                    marginTop: '0.25rem',
                    color: colors.primary,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                >
                  {activity.target.title}
                </Link>
              )}

              {/* Time */}
              <time
                dateTime={activity.created_at}
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: colors.textMuted,
                  marginTop: '0.25rem',
                }}
              >
                {relativeTime(activity.created_at)}
              </time>
            </div>
          </div>
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

export default Feed;
