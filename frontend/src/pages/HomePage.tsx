// Home page — landing with featured users and intro
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header/Header';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  return (
    <>
      <Header />

      {/* Hero section */}
      <section
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          color: '#FFFFFF',
          padding: '4rem 1rem',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1rem' }}>
            欢迎来到何湘芸梓的快乐星球！
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem' }}>
            这是我的地盘，我做主——展示热爱的一切，记录灵光一闪的瞬间
          </p>

          {isAuthenticated ? (
            <Link
              to={`/u/${user?.username}`}
              className="btn btn-lg"
              style={{ background: '#FFFFFF', color: colors.primary, fontWeight: 700 }}
            >
              逛逛我的地盘 →
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-lg" style={{ background: '#FFFFFF', color: colors.primary, fontWeight: 700 }}>
                打造专属空间
              </Link>
              <Link to="/login" className="btn btn-lg" style={{ border: '2px solid #fff', color: '#fff' }}>
                回来看看
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container" style={{ padding: '3rem 1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>
          把这里变成你的样子
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            { icon: '🎨', title: '随心展示', desc: '你的作品你说了算，照片、视频、设计稿——怎么放你开心就好' },
            { icon: '✍️', title: '写点自己的', desc: '随笔、日记、碎碎念，用喜欢的排版自由书写' },
            { icon: '🤝', title: '找到同好', desc: '和懂你的人交流，关注与被关注，有趣自然会靠近' },
            { icon: '🎭', title: '换装不换人', desc: '创意、技术、摄影、写作四种风格，今天想用哪个皮肤？' },
          ].map(feature => (
            <div key={feature.title} className="card" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true">
                {feature.icon}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo account CTA */}
      <section
        style={{
          background: colors.bgTertiary,
          padding: '2rem 1rem',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <p style={{ color: colors.textSecondary, marginBottom: '0.5rem', fontSize: '1.1rem', fontStyle: 'italic' }}>
            春风得意马蹄疾，一日看尽长安花
          </p>
          <code style={{
            background: colors.bgSecondary,
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            color: colors.textSecondary,
          }}>
            heyinlin / demo1234
          </code>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${colors.borderLight}`,
          padding: '1.5rem 1rem',
          textAlign: 'center',
          color: colors.textMuted,
          fontSize: '0.85rem',
        }}
      >
        <p>何湘芸梓的快乐星球 © 2026 — 用 ❤️ 和代码构建</p>
      </footer>
    </>
  );
};

export default HomePage;
