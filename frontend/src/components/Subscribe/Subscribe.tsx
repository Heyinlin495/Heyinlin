// Subscribe component — follow/unfollow with count display
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface SubscribeProps {
  targetUsername: string;
  initialFollowing: boolean;
  followerCount: number;
  onFollowChange?: (count: number) => void;
}

const Subscribe: React.FC<SubscribeProps> = ({
  targetUsername,
  initialFollowing,
  followerCount,
  onFollowChange,
}) => {
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followerCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (following) {
        await api.delete(`/follows/${targetUsername}`);
        setCount(c => c - 1);
      } else {
        await api.post(`/follows/${targetUsername}`, {});
        setCount(c => c + 1);
      }
      setFollowing(!following);
      onFollowChange?.(following ? count - 1 : count + 1);
    } catch (err) {
      console.error('Subscribe toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`btn ${following ? 'btn-outline' : 'btn-primary'}`}
        aria-label={following ? `Unfollow ${targetUsername}` : `Follow ${targetUsername}`}
        aria-pressed={following}
      >
        {loading ? '...' : following ? '已关注' : '+ 关注'}
      </button>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #636E72)' }}>
        {count} 位关注者
      </span>
    </div>
  );
};

export default Subscribe;
