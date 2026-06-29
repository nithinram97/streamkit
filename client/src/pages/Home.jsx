import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import MovieCard from '../components/MovieCard.jsx';
import { useWatchlist } from '../hooks/useWatchlist.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import analytics from '../analytics.js';

export default function Home({ onToast }) {
  const [featured, setFeatured] = useState(null);
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const { user } = useAuth();
  const { inList, add, remove } = useWatchlist();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.getMovies({ limit: 40 }),
      api.getGenres(),
    ]).then(([data, genres]) => {
      const movies = data.movies;
      setFeatured(movies.find(m => m.rating >= 8.0) || movies[0]);
      const rowData = [
        { label: '🔥 Trending Now', movies: [...movies].sort((a,b) => b.rating - a.rating).slice(0,10), badge: true },
        ...genres.slice(0,5).map(g => ({ label: g, movies: movies.filter(m => m.genre === g).slice(0,10) })),
      ];
      setRows(rowData);
    }).finally(() => setLoading(false));
  }, []);

  const toggleFeatured = async () => {
    if (!user) { onToast('Sign in to save to your watchlist', '🔒'); return; }
    if (!featured) return;
    const movieId = featured.movie_id || featured.id;
    if (inList(movieId)) {
      await remove(movieId);
      onToast('Removed from watchlist');
    } else {
      await add(movieId);
      onToast('Added to watchlist', '🎬');
      analytics.track('add_to_watchlist', { movie_id: movieId, title: featured.title, source: 'hero' });
    }
  };

  if (loading) return <div className="spinner">Loading…</div>;
  if (!featured) return null;

  const fId = featured.movie_id || featured.id;

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-eyebrow">🔥 Featured Film</div>
          <h1 className="hero-title">{featured.title}</h1>
          <div className="hero-meta">
            <span className="hero-rating">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="#f5c518" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {featured.rating}
            </span>
            <span className="hero-chip">{featured.genre}</span>
            <span className="hero-chip">{featured.year}</span>
            {featured.duration && <span className="hero-chip">{featured.duration}</span>}
          </div>
          <p className="hero-desc">{featured.description}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/movies/${fId}`)}>
              ▶ Play Now
            </button>
            <button className="btn btn-outline" onClick={toggleFeatured}>
              {inList(fId) ? '✓ In Watchlist' : '+ My List'}
            </button>
            <button className="btn btn-outline" onClick={() => navigate(`/movies/${fId}`)}>
              More Info
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* PROMO */}
        <div style={{ marginTop: 32 }} className="promo-banner">
          <div className="promo-text">
            <h2>🎬 Free Full-Length Movies — No Subscription</h2>
            <p>Streamed directly from YouTube. New titles added every day.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/movies')}>Browse All</button>
        </div>

        {/* ROWS */}
        {rows.map(row => (
          row.movies.length > 0 && (
            <div className="section" key={row.label}>
              <div className="section-header">
                <div className="section-title">{row.label}</div>
                <span className="see-all" onClick={() => navigate('/movies')}>See all →</span>
              </div>
              <div className="movie-row">
                {row.movies.map((m, i) => (
                  <MovieCard
                    key={m.id}
                    movie={m}
                    badge={row.badge && i < 3 ? `#${i+1}` : null}
                    onToast={onToast}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
