import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useWatchlist } from '../hooks/useWatchlist.jsx';
import { api } from '../api/index.js';
import analytics from '../analytics.js';

const WELCOME = "Hi! 👋 I'm your StreamKit assistant. Ask me about movies, your watchlist, or what to watch tonight!";

export default function ChatWidget({ movie = null }) {
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    analytics.track('chat_message', { movie_id: movie?.id || movie?.movie_id });

    const context = {
      movie: movie || null,
      watchlistTitles: watchlist.map(m => m.title),
      recentHistory: null,
    };

    try {
      const data = await api.chat(history.filter(m => m.role !== 'system'), context);
      const reply = data.reply ?? "Sorry, I couldn't respond right now.";
      setMessages(prev => { const n = [...prev]; n[n.length-1] = { role: 'assistant', content: reply }; return n; });
    } catch {
      setMessages(prev => { const n = [...prev]; n[n.length-1] = { role: 'assistant', content: "Sorry, I couldn't connect to the AI right now." }; return n; });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, movie, watchlist]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const clearChat = () => { abortRef.current?.abort(); setMessages([{ role: 'assistant', content: WELCOME }]); setLoading(false); };

  const suggestions = movie
    ? [`Tell me about ${movie.title}`, 'Recommend something similar', "What's in my watchlist?"]
    : ["What should I watch tonight?", 'Recommend a thriller', 'Best sci-fi movies?'];

  return (
    <div className="chat-widget">
      <button className="chat-bubble" onClick={() => setOpen(o => !o)} aria-label="Toggle chat">
        {open ? (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
        ) : (
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
        {!open && messages.length > 1 && (
          <span className="chat-bubble__badge">{messages.filter(m => m.role === 'assistant' && m.content).length}</span>
        )}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header__info">
              <div className="chat-header__avatar">🎬</div>
              <div>
                <div className="chat-header__name">StreamKit AI</div>
                <div className="chat-header__status">
                  <span className="chat-header__dot" />
                  {loading ? 'Typing…' : 'Online'}
                </div>
              </div>
            </div>
            <button className="chat-clear" onClick={clearChat} title="Clear conversation">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
            </button>
          </div>

          {movie && (
            <div className="chat-context">
              🎬 Talking about <strong>{movie.title}</strong>
            </div>
          )}

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                {msg.role === 'assistant' && <div className="chat-msg__avatar">🎬</div>}
                <div className="chat-msg__bubble">
                  {msg.content
                    ? msg.content
                    : <span className="chat-typing"><span/><span/><span/></span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="chat-suggestions">
              {suggestions.map(s => (
                <button key={s} className="chat-suggestion" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="btn btn-primary btn-icon"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1={22} y1={2} x2={11} y2={13}/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
