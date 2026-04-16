// Messages page — conversation list and chat
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Message } from '../../types';

const Messages: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { username: targetUser } = useParams<{ username: string }>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    api.get<any[]>('/messages/conversations').then(res => {
      if (res.success) setConversations(res.data || []);
    });
  }, []);

  // Load conversation when target user changes
  useEffect(() => {
    if (targetUser) {
      setLoading(true);
      api.get<Message[]>(`/messages/${targetUser}`).then(res => {
        if (res.success) setMessages(res.data || []);
        setLoading(false);
      });
    }
  }, [targetUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser || sending) return;

    setSending(true);
    try {
      const res = await api.post<Message>('/messages/send', {
        targetUsername: targetUser,
        content: newMessage.trim(),
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data!]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: targetUser ? '240px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Conversation list */}
        <aside aria-label="Conversations">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            对话列表
          </h2>
          {conversations.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>暂无对话</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {conversations.map(conv => (
                <Link
                  key={conv.other_user_id}
                  to={`/messages/${conv.username}`}
                  className="card"
                  style={{
                    padding: '0.75rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderLeft: targetUser === conv.username ? `3px solid ${colors.primary}` : 'none',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {conv.display_name || conv.username}
                  </div>
                  {conv.last_message && (
                    <div style={{ fontSize: '0.8rem', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message}
                    </div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="badge" style={{ background: colors.primary, color: '#fff', marginLeft: '0.5rem' }}>
                      {conv.unread_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* Chat area */}
        {targetUser && (
          <section aria-label={`Chat with ${targetUser}`}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              与 {targetUser} 的对话
            </h2>

            <div
              style={{
                height: '400px',
                overflowY: 'auto',
                border: `1px solid ${colors.borderLight}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                marginBottom: '0.75rem',
                background: colors.bgSecondary,
              }}
              role="log"
              aria-live="polite"
            >
              {loading ? (
                <div className="empty-state"><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="empty-state"><p>开始你们的对话吧</p></div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: '0.75rem',
                        display: 'flex',
                        flexDirection: isMine ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          background: isMine ? `${colors.primary}20` : colors.bgTertiary,
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius)',
                          marginTop: '0.25rem',
                          display: 'inline-block',
                          maxWidth: '80%',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                aria-label="Message input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
                {sending ? '发送中' : '发送'}
              </button>
            </form>
          </section>
        )}

        {!targetUser && (
          <div className="empty-state">
            <p>选择一个对话，或从用户主页发起私信</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
