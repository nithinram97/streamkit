import { useAuth } from '../hooks/useAuth.jsx';
import { useWatchlist } from '../hooks/useWatchlist.jsx';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard.jsx';

export default function Watchlist({ onToast }) {
  const { user } = useAuth();
  const { watchlist, remove, loading } = useWatchlist();
  const navigate = useNavigate();

  if (!user) return (
    <div className="container page">
      <div className="empty-state">
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        Sign in to see your watchlist.<br />
        <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div className="container page">
      <h1 className="page-title">My Watchlist ({watchlist.length})</h1>
      {watchlist.length === 0
        ? <div className="empty-state">Your watchlist is empty.<br /><button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/movies')}>Browse Movies</button></div>
        : (
          <div className="watchlist-grid">
            {watchlist.map(m => (
              <div key={m.id} className="watchlist-card-wrap">
                <MovieCard movie={m} onToast={onToast} />
                <button className="btn btn-outline btn-sm" style={{ width:'100%', borderRadius:6 }} onClick={async () => { await remove(m.movie_id); onToast('Removed from watchlist'); }}>
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
