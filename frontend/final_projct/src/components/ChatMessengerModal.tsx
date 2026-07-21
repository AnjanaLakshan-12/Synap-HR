import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, RefreshCw, X, Briefcase, GraduationCap, UserCheck } from 'lucide-react';

interface ChatMessage {
  id: number;
  applicationId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

interface ChatMessengerModalProps {
  token: string;
  applicationId: number;
  jobTitle: string;
  candidateName: string;
  currentUserId?: number;
  onClose: () => void;
}

export const ChatMessengerModal: React.FC<ChatMessengerModalProps> = ({
  token,
  applicationId,
  jobTitle,
  candidateName,
  currentUserId,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Live poll every 4 seconds
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5163/api/chat/application/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching chat messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await fetch('http://localhost:5163/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId,
          messageText
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
      } else {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'recruiter') return <Briefcase className="w-3 h-3 text-sky-400" />;
    if (r === 'hiringmanager') return <UserCheck className="w-3 h-3 text-purple-300" />;
    return <GraduationCap className="w-3 h-3 text-emerald-400" />;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '620px',
        height: '82vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
        background: '#ffffff',
        borderRadius: '16px'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: 'rgba(167, 243, 208, 0.2)',
              border: '1px solid rgba(167, 243, 208, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare className="w-5 h-5" style={{ color: '#a7f3d0' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Application Messenger Thread
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0', opacity: 0.9 }}>
                Position: <strong>{jobTitle}</strong> • Candidate: <strong>{candidateName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread Body */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          background: '#f2f9f4',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#4b5563' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ margin: '0 auto 0.5rem' }} />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <MessageSquare className="w-10 h-10 opacity-30 mx-auto mb-2" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0', color: '#064e3b' }}>No messages exchanged yet</p>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>Start the conversation by typing your message below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = currentUserId ? msg.senderId === currentUserId : false;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.2rem',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    padding: '0 0.25rem'
                  }}>
                    <span style={{ fontWeight: 700, color: isMine ? '#059669' : '#064e3b' }}>
                      {msg.senderName}
                    </span>
                    <span style={{
                      background: isMine ? '#ecfdf5' : '#f1f5f9',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: isMine ? '#047857' : '#475569',
                      border: isMine ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      {getRoleIcon(msg.senderRole)}
                      {msg.senderRole}
                    </span>
                    <span>• {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine ? 'linear-gradient(135deg, #047857 0%, #065f46 100%)' : '#ffffff',
                    color: isMine ? '#ffffff' : '#0f172a',
                    border: isMine ? 'none' : '1px solid #d1fae5',
                    boxShadow: isMine ? '0 4px 12px rgba(4, 120, 87, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    fontSize: '0.88rem',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word'
                  }}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <form onSubmit={handleSendMessage} style={{
          padding: '1rem 1.25rem',
          background: '#ffffff',
          borderTop: '1px solid #d1fae5',
          display: 'flex',
          gap: '0.65rem',
          alignItems: 'center'
        }}>
          <input
            type="text"
            className="form-control"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              borderRadius: '9999px',
              padding: '0.65rem 1.2rem',
              border: '1px solid #a7f3d0',
              fontSize: '0.88rem'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !inputText.trim()}
            style={{
              borderRadius: '9999px',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none'
            }}
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
