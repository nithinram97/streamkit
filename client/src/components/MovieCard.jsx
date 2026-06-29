import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import analytics from '../analytics.js';

export default function MovieCard({ movie, badge, onToast }) {
  const { user } = useAuth();
  const { inList, add, remove } = useWatchlist();
  const listed = inList(movie.movie_id || movie.id);
  const movieId = movie.movie_id || movie.id;

  const toggleList = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { onToast?.('Sign in to save to your watchlist', '🔒'); return; }
    if (listed) {
      await remove(movieId);
      onToast?.('Removed from watchlist');
      analytics.track('remove_from_watchlist', { movie_id: movieId });
    } else {
      await add(movieId);
      onToast?.('Added to watchlist', '🎬');
      analytics.track('add_to_watchlist', { movie_id: movieId, title: movie.title });
    }
  };

  return (
    <Link to={`/movies/${movieId}`} className="movie-card">
      {badge && <div className="card-badge">{badge}</div>}
      <img
        className="movie-thumb"
        src={movie.thumb_url}
        alt={movie.title}
        loading="lazy"
        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
      />
      <div className="movie-thumb-placeholder" style={{ display: 'none' }}>🎬</div>
      <div className="card-actions">
        <Link to={`/movies/${movieId}`} className="card-action-btn" title="Play" onClick={e => e.stopPropagation()}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
        </Link>
        <button className="card-action-btn" onClick={toggleList} title={listed ? 'Remove' : 'Add to watchlist'}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill={listed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      <div className="card-body">
        <div className="card-title">{movie.title}</div>
        <div className="card-meta">
          <span className="card-rating">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="#f5c518" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {movie.rating}
          </span>
          <span className="card-genre">{movie.genre}</span>
          <span className="card-year">{movie.year}</span>
        </div>
      </div>
    </Link>
  );
}
