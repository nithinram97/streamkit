import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useHistory } from '../hooks/useHistory.jsx';

export default function History() {
  const { user } = useAuth();
  const { history, loading, fetchHistory } = useHistory();
  const navigate = useNavigate();

  useEffect(() => { fetchHistory(); }, []);

  if (!user) return (
    <div className="container page">
      <div className="empty-state">
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        Sign in to see your watch history.<br />
        <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div className="container page">
      <h1 className="page-title">Watch History ({history.length})</h1>
      {history.length === 0
        ? <div className="empty-state">No history yet. Start watching!</div>
        : (
          <div className="history-list">
            {history.map(h => (
              <div key={h.id} className="history-item" onClick={() => navigate(`/movies/${h.movie_id}`)}>
                <img className="history-thumb" src={h.thumb_url} alt={h.title} onError={e => e.target.style.opacity=0.3} />
                <div className="history-info">
                  <div className="history-title">{h.title}</div>
                  <div className="history-date">
                    {new Date(h.watched_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                  <div className="progress-bar-wrap" style={{ width: 160 }}>
                    <div className="progress-bar" style={{ width: `${h.progress || 0}%` }} />
                  </div>
                </div>
                <div style={{ marginLeft:'auto', color:'var(--muted)' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
