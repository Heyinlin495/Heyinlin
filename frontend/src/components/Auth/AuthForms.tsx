// Login / Register forms
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

interface CaptchaData {
  sessionId: string;
  image: string;
}

export function LoginForm() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState(false);

  // Fetch captcha on mount
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      setCaptcha(null);
      setCaptchaLoading(true);
      setCaptchaError(false);
      const res = await api.get<CaptchaData>('/auth/captcha');
      if (res.success && res.data) {
        setCaptcha(res.data);
      } else {
        setCaptchaError(true);
      }
    } catch (err) {
      console.warn('验证码加载失败:', err);
      setCaptchaError(true);
    } finally {
      setCaptchaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, captcha?.sessionId, captchaAnswer);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      loadCaptcha();
      setCaptchaAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '420px',
        margin: '2rem auto',
        padding: '2rem',
        borderRadius: '12px',
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
      noValidate
    >
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>
        登录
      </h1>

      {error && (
        <div
          role="alert"
          style={{
            background: `${colors.error}15`,
            color: colors.error,
            padding: '0.75rem',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="login-email" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          邮箱 / 用户名
        </label>
        <input
          id="login-email"
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="username"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        <label htmlFor="login-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          密码
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
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
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? (
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

      {/* Captcha */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          验证码
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            id="login-captcha"
            type="text"
            value={captchaAnswer}
            onChange={e => setCaptchaAnswer(e.target.value)}
            required
            autoComplete="off"
            placeholder="输入验证码"
            style={{ width: '120px' }}
          />
          {/* Captcha image area */}
          <div style={{ position: 'relative', height: '36px', display: 'flex', alignItems: 'center' }}>
            {captchaLoading && (
              <div style={{
                width: '80px', height: '36px', borderRadius: 'var(--radius)',
                background: `${colors.textSecondary}10`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', color: colors.textSecondary,
              }}>
                加载中...
              </div>
            )}
            {captchaError && !captchaLoading && (
              <div style={{
                width: '80px', height: '36px', borderRadius: 'var(--radius)',
                border: '1px dashed ' + colors.textSecondary, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', color: colors.textSecondary, cursor: 'pointer',
              }} onClick={loadCaptcha} title="点击重试">
                加载失败，点击重试
              </div>
            )}
            {captcha && !captchaLoading && (
              <img
                src={captcha.image}
                alt="验证码"
                onClick={loadCaptcha}
                style={{ cursor: 'pointer', borderRadius: 'var(--radius)', height: '36px' }}
                title="点击刷新"
              />
            )}
          </div>
          {captcha && !captchaLoading && (
            <button
              type="button"
              onClick={loadCaptcha}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
              }}
            >
              ↻ 换一张
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        {loading ? '登录中...' : '登录'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: colors.textSecondary }}>
        还没有账号？ <Link to="/register">注册</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '420px',
        margin: '2rem auto',
        padding: '2rem',
        borderRadius: '12px',
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
      noValidate
    >
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>
        注册
      </h1>

      {error && (
        <div role="alert" style={{
          background: `${colors.error}15`, color: colors.error,
          padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="reg-username" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          用户名
        </label>
        <input
          id="reg-username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="username"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="reg-email" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          邮箱
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="reg-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          密码（至少 6 位）
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            style={{ width: '100%', paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
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
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? (
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

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
        {loading ? '注册中...' : '注册'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: colors.textSecondary }}>
        已有账号？ <Link to="/login">登录</Link>
      </p>
    </form>
  );
}
