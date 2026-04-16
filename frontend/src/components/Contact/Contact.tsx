// Contact section — contact info and social links
import React from 'react';
import { User, ProfileBio } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ContactProps {
  user: User;
  bio: ProfileBio | null;
}

const Contact: React.FC<ContactProps> = ({ user, bio }) => {
  const { colors } = useTheme();
  const socialLinks = bio?.social_links || {};

  const contactItems = [
    ...(user.website ? [{ icon: '🌐', label: '网站', value: user.website, url: user.website }] : []),
    ...(user.location ? [{ icon: '📍', label: '位置', value: user.location }] : []),
  ];

  return (
    <section
      aria-labelledby="contact-heading"
      className="card"
      style={{ marginBottom: '1.5rem' }}
    >
      <h2 id="contact-heading" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        联系方式
      </h2>

      {contactItems.length > 0 && (
        <ul
          role="list"
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {contactItems.map(item => (
            <li key={item.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ color: colors.textMuted, fontSize: '0.85rem', minWidth: '3rem' }}>
                {item.label}
              </span>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.primary, wordBreak: 'break-all' }}
                >
                  {item.value}
                </a>
              ) : (
                <span style={{ color: colors.textSecondary, wordBreak: 'break-all' }}>
                  {item.value}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {Object.keys(socialLinks).length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.borderLight}` }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: colors.textMuted }}>
            社交媒体
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline"
                aria-label={`Visit ${platform} profile`}
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Contact;
