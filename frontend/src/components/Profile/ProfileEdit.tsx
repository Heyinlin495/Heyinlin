// Profile edit page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

const ProfileEdit: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { colors, theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [occupation, setOccupation] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setAvatarUrl(user.avatar_url || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setLocation(user.location || '');

      // Load bio (only need this extra data not in AuthContext)
      api.get<any>(`/users/me/profile`).then(res => {
        if (res.success && res.data?.bio) {
          setHeadline(res.data.bio.headline || '');
          setOccupation(res.data.bio.occupation || '');
          const skills = res.data.bio.skills;
          setSkillsText(Array.isArray(skills) ? skills.join(', ') : (skills ? JSON.parse(skills).join(', ') : ''));
        }
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateProfile({
        display_name: displayName,
        avatar_url: avatarUrl.trim() || null,
        bio,
        website,
        location,
        theme,
      } as any);

      // Update bio
      await api.put('/users/me/bio', {
        headline,
        occupation,
        skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
      });

      setMessage('保存成功！');
    } catch (err) {
      setMessage('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('请填写所有密码字段');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('新密码至少需要6个字符');
      return;
    }

    setPasswordLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordMessage(result.message || '密码修改成功');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage(result.error || '密码修改失败');
      }
    } catch (err) {
      setPasswordMessage('密码修改失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return <div className="empty-state">请先登录</div>;

  return (
    <div className="container" style={{ maxWidth: '640px', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>编辑个人资料</h1>

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
        <fieldset style={{ border: `1px solid ${colors.border}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>基本信息</legend>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="edit-display-name" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                显示名称
              </label>
              <input id="edit-display-name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label htmlFor="edit-avatar" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                头像 URL
              </label>
              <input id="edit-avatar" type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" style={{ width: '100%' }} />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem' }}
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div>
              <label htmlFor="edit-headline" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                一句话介绍
              </label>
              <input id="edit-headline" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="用代码编织创意" style={{ width: '100%' }} />
            </div>

            <div>
              <label htmlFor="edit-occupation" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                职业 / 身份
              </label>
              <input id="edit-occupation" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="全栈开发者" style={{ width: '100%' }} />
            </div>

            <div>
              <label htmlFor="edit-bio" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                个人简介
              </label>
              <textarea
                id="edit-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="介绍一下自己..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="edit-website" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  网站
                </label>
                <input id="edit-website" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" style={{ width: '100%' }} />
              </div>
              <div>
                <label htmlFor="edit-location" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  位置
                </label>
                <input id="edit-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="上海" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label htmlFor="edit-skills" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                技能（逗号分隔）
              </label>
              <input id="edit-skills" value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="React, TypeScript, Node.js" style={{ width: '100%' }} />
            </div>
          </div>
        </fieldset>

        {/* Theme selection */}
        <fieldset style={{ border: `1px solid ${colors.border}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>主题风格</legend>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(['creative', 'tech', 'photography', 'writing'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`btn ${theme === t ? 'btn-primary' : 'btn-outline'}`}
              >
                {t === 'creative' ? '创意' : t === 'tech' ? '技术' : t === 'photography' ? '摄影' : '写作'}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? '保存中...' : '保存更改'}
        </button>
      </form>

      {/* Password change section */}
      <div style={{ marginTop: '2rem' }}>
        <fieldset style={{ border: `1px solid ${colors.border}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>修改密码</legend>

          {passwordMessage && (
            <div
              role="status"
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                background: passwordMessage.includes('成功') ? `${colors.success}15` : `${colors.error}15`,
                color: passwordMessage.includes('成功') ? colors.success : colors.error,
              }}
            >
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="current-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  当前密码
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: colors.textSecondary,
                    }}
                    aria-label={showCurrentPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showCurrentPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  新密码
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="至少6个字符"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: colors.textSecondary,
                    }}
                    aria-label={showNewPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showNewPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  确认新密码
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: colors.textSecondary,
                    }}
                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={passwordLoading}
                style={{ width: '100%' }}
              >
                {passwordLoading ? '修改中...' : '修改密码'}
              </button>
            </div>
          </form>
        </fieldset>
      </div>
    </div>
  );
};

export default ProfileEdit;
