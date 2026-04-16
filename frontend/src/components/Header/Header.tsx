// Header component — navigation bar with auth status
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, colors } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!themeOpen && !createOpen) return;
    const handler = () => { setThemeOpen(false); setCreateOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [themeOpen, createOpen]);

  const themeOptions: { value: string; label: string; color: string }[] = [
    { value: 'creative', label: '创意', color: '#6C5CE7' },
    { value: 'tech', label: '技术', color: '#0984E3' },
    { value: 'photography', label: '摄影', color: '#E17055' },
    { value: 'writing', label: '写作', color: '#2C3E50' },
  ];

  // Fetch unread message count
  React.useEffect(() => {
    if (isAuthenticated) {
      api.get<{ unread: number }>('/feed/unread/count').then(res => {
        if (res.success && res.data) setUnreadCount(res.data.unread);
      });
    }
  }, [isAuthenticated]);

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.borderLight}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <nav
        className="container"
        role="navigation"
        aria-label="Main navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '3.5rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: colors.primary,
            textDecoration: 'none',
          }}
          aria-label="Home"
        >
          Personal Space
        </Link>

        {/* Desktop nav */}
        <div
          className="nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          {isAuthenticated ? (
            <>
              <Link to={`/u/${user?.username}`} style={{ color: colors.textSecondary }}>
                我的空间
              </Link>

              {/* Create dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setCreateOpen(!createOpen); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.25rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  创作
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
                </button>

                {createOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '0.25rem',
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      boxShadow: colors.shadowLg,
                      overflow: 'hidden',
                      zIndex: 200,
                      minWidth: '140px',
                    }}
                  >
                    <Link
                      to="/new-post"
                      onClick={() => setCreateOpen(false)}
                      style={{
                        display: 'block',
                        padding: '0.6rem 1rem',
                        color: colors.text,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.bgTertiary)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      写文章
                    </Link>
                    <Link
                      to="/new-project"
                      onClick={() => setCreateOpen(false)}
                      style={{
                        display: 'block',
                        padding: '0.6rem 1rem',
                        color: colors.text,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.bgTertiary)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      发布作品
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/messages" style={{ color: colors.textSecondary, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                私信
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: colors.error,
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/edit-profile" style={{ color: colors.textSecondary }}>
                编辑
              </Link>

              {/* Theme switcher - custom dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setThemeOpen(!themeOpen); }}
                  aria-label="Select theme"
                  style={{
                    background: colors.bgTertiary,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: themeOptions.find(o => o.value === theme)?.color,
                    display: 'inline-block',
                  }} />
                  {themeOptions.find(o => o.value === theme)?.label}
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
                </button>

                {themeOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.25rem',
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      boxShadow: colors.shadowLg,
                      overflow: 'hidden',
                      zIndex: 200,
                      minWidth: '120px',
                    }}
                  >
                    {themeOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(opt.value as any);
                          setThemeOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          background: theme === opt.value ? `${opt.color}15` : 'transparent',
                          color: colors.text,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${opt.color}10`)}
                        onMouseLeave={e => (e.currentTarget.style.background = theme === opt.value ? `${opt.color}15` : 'transparent')}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: opt.color,
                          flexShrink: 0,
                        }} />
                        {opt.label}
                        {theme === opt.value && (
                          <span style={{ marginLeft: 'auto', color: opt.color, fontSize: '0.75rem' }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to={`/u/${user?.username}`}
                  className="avatar avatar-sm"
                  aria-label="My profile"
                  style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" />
                  ) : (
                    <span>{user?.display_name?.[0] || user?.username?.[0]?.toUpperCase()}</span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline"
                  aria-label="Logout"
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                登录
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                注册
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          style={{ display: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="mobile-menu mobile-menu-active"
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem 1rem 1rem',
            background: colors.bgSecondary,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          {isAuthenticated ? (
            <>
              <Link to={`/u/${user?.username}`} onClick={() => setMenuOpen(false)} style={{ color: colors.text, textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
                我的空间
              </Link>
              <Link to="/new-post" onClick={() => setMenuOpen(false)} style={{ color: colors.text, textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
                写文章
              </Link>
              <Link to="/new-project" onClick={() => setMenuOpen(false)} style={{ color: colors.text, textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
                发布作品
              </Link>
              <Link to="/messages" onClick={() => setMenuOpen(false)} style={{ color: colors.text, textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
                私信
              </Link>
              <Link to="/edit-profile" onClick={() => setMenuOpen(false)} style={{ color: colors.text, textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
                编辑
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                登录
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                注册
              </Link>
            </>
          )}
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; align-items: center; }
          .mobile-menu-active { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
