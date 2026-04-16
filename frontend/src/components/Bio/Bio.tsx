// Profile Bio component — user introduction and stats
import React from 'react';
import { Link } from 'react-router-dom';
import { User, ProfileBio } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface BioProps {
  user: User;
  bio: ProfileBio | null;
  stats: { followers: number; following: number; posts: number; projects: number };
  isFollowing: boolean;
  onFollowChange?: () => void;
}

// 10 bio copy templates in different styles
export const BIO_TEMPLATES: Record<string, string[]> = {
  formal: [
    '专业{role}，致力于创造卓越的用户体验与技术创新。',
    '资深{role}，拥有多年行业经验，追求极致品质。',
    '{role} | 创新思维 · 精益求精 · 持续成长',
  ],
  humor: [
    '白天写代码，晚上写bug，凌晨改bug的{role}。',
    '一名{role}，咖啡因依赖型生物，靠deadline驱动。',
    '专业{role}，爱好是把爱好变成工作。',
  ],
  creative: [
    '用代码编织创意，用设计连接世界的{role}。',
    '在像素与代码之间寻找诗意的{role}。',
    '创意无界 · {role} · 把想象力变成可触摸的产品',
  ],
  minimal: [
    '{role}。创造中。',
    'Build things. {role}.',
    '{role} | 做有意思的事',
  ],
};

const Bio: React.FC<BioProps> = ({ user, bio, stats, isFollowing, onFollowChange }) => {
  const { colors } = useTheme();
  const { isAuthenticated, user: currentUser, updateAvatar } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isOwner = isAuthenticated && currentUser?.id === user.id;

  const handleFollow = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follows/${user.username}`);
      } else {
        await api.post(`/follows/${user.username}`, {});
      }
      onFollowChange?.();
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件（JPG/PNG/GIF）');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const success = await updateAvatar(file);
      if (success) {
        setPreviewUrl(null);
        setShowModal(false);
      } else {
        setUploadError('上传失败，请重试');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('请选择图片文件（JPG/PNG/GIF）');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('图片大小不能超过 5MB');
        return;
      }
      setPendingFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
        setUploadError(null);
        setShowModal(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = () => {
    if (pendingFile) {
      handleFileChange(pendingFile);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setPendingFile(null);
    setShowModal(false);
    setUploadError(null);
  };

  const skills = bio?.skills || [];
  const socialLinks = bio?.social_links || {};

  // Avatar display URL (preview takes precedence only in modal)
  const avatarSrc = user.avatar_url;

  return (
    <section
      aria-labelledby="bio-heading"
      style={{
        background: colors.bgSecondary,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${colors.borderLight}`,
        padding: '2rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Avatar with upload for owner */}
        <div style={{ position: 'relative' }}>
          <div
            className="avatar avatar-lg"
            style={{
              border: `3px solid ${colors.primaryLight}`,
              width: '6rem',
              height: '6rem',
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.primary,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '50%',
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={`${user.display_name}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span aria-hidden="true">
                {user.display_name?.[0] || user.username[0].toUpperCase()}
              </span>
            )}

            {/* Upload overlay for owner */}
            {isOwner && !uploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            )}

            {/* Uploading spinner */}
            {uploading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <div className="spinner" style={{ width: '24px', height: '24px' }}>
                  <span className="sr-only">Uploading...</span>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            aria-label="Upload avatar"
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 id="bio-heading" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {user.display_name || user.username}
            {user.is_verified === 1 && (
              <span
                title="Verified user"
                aria-label="Verified"
                style={{ color: colors.success, marginLeft: '0.5rem', fontSize: '1.1rem' }}
              >
                ✓
              </span>
            )}
          </h2>

          {bio?.headline && (
            <p style={{ color: colors.textSecondary, margin: '0.25rem 0' }}>
              {bio.headline}
            </p>
          )}

          {bio?.occupation && (
            <p style={{ color: colors.textMuted, fontSize: '0.9rem', margin: '0.25rem 0' }}>
              {bio.occupation}
            </p>
          )}

          {user.location && (
            <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
              📍 {user.location}
            </p>
          )}

          {/* Social links */}
          {Object.keys(socialLinks).length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {Object.entries(socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${platform} profile`}
                  style={{ color: colors.textSecondary, fontSize: '0.85rem' }}
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Follow / Message buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          {isAuthenticated && (
            <>
              <button
                onClick={handleFollow}
                disabled={loading}
                className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                aria-label={isFollowing ? 'Unfollow' : 'Follow'}
              >
                {loading ? '...' : isFollowing ? '已关注' : '+ 关注'}
              </button>
              <Link to={`/messages/${user.username}`} className="btn btn-secondary">
                私信
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bio text */}
      {user.bio && (
        <p
          style={{
            marginTop: '1.25rem',
            color: colors.textSecondary,
            lineHeight: 1.7,
            fontSize: '0.95rem',
          }}
        >
          {user.bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div
          role="list"
          aria-label="Skills"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}
        >
          {skills.map((skill: string) => (
            <span key={skill} className="badge" role="listitem">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${colors.borderLight}`,
        }}
        role="list"
        aria-label="User statistics"
      >
        {[
          { label: '作品', value: stats.projects },
          { label: '文章', value: stats.posts },
          { label: '关注者', value: stats.followers },
          { label: '关注中', value: stats.following },
        ].map(stat => (
          <div key={stat.label} role="listitem" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.primary }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {isOwner && showModal && previewUrl && (
        <div
          onClick={handleCancelPreview}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: colors.bgSecondary,
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              maxWidth: '360px',
              width: '90%',
              textAlign: 'center',
              boxShadow: colors.shadowLg,
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: colors.text }}>
              预览新头像
            </h3>
            <img
              src={previewUrl}
              alt="Avatar preview"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '0 auto 1rem',
                display: 'block',
                border: `3px solid ${colors.primaryLight}`,
              }}
            />
            {uploadError && (
              <p style={{ fontSize: '0.8rem', color: colors.error, marginBottom: '0.75rem' }}>
                {uploadError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {uploading ? '上传中...' : '确认'}
              </button>
              <button
                onClick={handleCancelPreview}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={uploading}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Bio;
