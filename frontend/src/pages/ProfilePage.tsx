// Profile Page — main personal space layout
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, ProfileBio } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header/Header';
import Bio from '../components/Bio/Bio';
import Portfolio from '../components/Portfolio/Portfolio';
import Feed from '../components/Feed/Feed';
import PostsList from '../components/Feed/PostsList';
import Photos from '../components/Photos/Photos';
import Contact from '../components/Contact/Contact';

interface ProfileData {
  user: User;
  bio: ProfileBio;
  stats: { followers: number; following: number; posts: number; projects: number };
  isFollowing: boolean;
}

type TabType = 'portfolio' | 'posts' | 'photos' | 'feed' | 'about';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api.get<ProfileData>(`/users/${username}`).then((res: { success: boolean; data?: ProfileData; error?: string }) => {
      if (!cancelled) {
        if (res.success && res.data) {
          setProfileData(res.data);
        } else {
          setError(res.error || '用户不存在');
        }
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setError('加载失败');
        setIsLoading(false);
      }
    });
    return () => { cancelled = true };
  }, [username]);

  if (isLoading && !profileData) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state">
            <div className="spinner" role="status"><span className="sr-only">Loading...</span></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !profileData) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state" role="alert">
            <p style={{ color: colors.error }}>用户不存在或加载失败</p>
            <Link to="/" className="btn btn-primary">返回首页</Link>
          </div>
        </div>
      </>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'portfolio', label: '作品' },
    { key: 'posts', label: '文章' },
    { key: 'photos', label: '照片' },
    { key: 'feed', label: '动态' },
    { key: 'about', label: '关于' },
  ];

  return (
    <>
      <Header />

      {/* Shin-chan wallpaper banner */}
      <div
        style={{
          width: '100%',
          height: '420px',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <img
          src="/shinchan-bg.jpg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 50%',
          }}
        />
      </div>

      <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }} role="main">
        {/* Profile bio */}
        <Bio
          user={profileData.user}
          bio={profileData.bio}
          stats={profileData.stats}
          isFollowing={profileData.isFollowing}
          onFollowChange={() => {
            setProfileData(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
          }}
        />

        {/* Tab navigation */}
        <nav
          role="tablist"
          aria-label="Profile sections"
          style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '1.5rem',
            borderBottom: `2px solid ${colors.borderLight}`,
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                borderBottom: activeTab === tab.key ? `2px solid ${colors.primary}` : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab}>
          {activeTab === 'portfolio' && <Portfolio username={username!} />}
          {activeTab === 'posts' && <PostsList username={username!} />}
          {activeTab === 'photos' && <Photos username={username!} />}
          {activeTab === 'feed' && <Feed username={username!} />}
          {activeTab === 'about' && (
            <Contact user={profileData.user} bio={profileData.bio} />
          )}
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
