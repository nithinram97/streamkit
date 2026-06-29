import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useWatchlist } from '../hooks/useWatchlist.jsx';
import { useHistory } from '../hooks/useHistory.jsx';
import ChatWidget from '../components/ChatWidget.jsx';
import analytics from '../analytics.js';

export default function MovieDetail({ onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inList, add, remove } = useWatchlist();
  const { recordWatch } = useHistory();
  const [movie, setMovie]     = useState(null);
  const [related, setRelated] = useState([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.getMovie(id).then(m => {
      setMovie(m);
      analytics.track('movie_view', { movie_id: m.id, title: m.title, genre: m.genre });
      // fetch related
      api.getMovies({ genre: m.genre, limit: 6 })
        .then(d => setRelated(d.movies.filter(r => r.id !== m.id).slice(0,5)));
    }).catch(() => navigate('/movies'));
  }, [id]);

  if (!movie) return <div className="spinner">Loading…</div>;

  const listed = inList(movie.id);

  const handlePlay = async () => {
    if (user) { await recordWatch(movie.id); }
    setPlaying(true);
    analytics.track('play', { movie_id: movie.id, title: movie.title });
  };

  const toggleList = async () => {
    if (!user) { onToast('Sign in to save to your watchlist', '🔒'); return; }
    if (listed) { await remove(movie.id); onToast('Removed from watchlist'); }
    else { await add(movie.id); onToast('Added to watchlist', '🎬'); analytics.track('add_to_watchlist', { movie_id: movie.id, title: movie.title }); }
  };

  const genreClass = movie.genre ? `badge badge-${movie.genre.toLowerCase().replace(' ','-').replace('-fi','fi')}` : 'badge';

  return (
    <div className="player-page">
      {/* PLAYER */}
      <div className="player-wrap">
        {playing ? (
          <iframe
            className="player-iframe"
            src={`https://www.youtube.com/embed/${movie.yt_id}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={movie.title}
          />
        ) : (
          <div
            style={{ width:'100%', height:'100%', cursor:'pointer', position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={handlePlay}
          >
            <img
              src={movie.thumb_url}
              alt={movie.title}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.6 }}
              onError={e => e.target.style.display='none'}
            />
            <div style={{ position:'relative', zIndex:1, width:72, height:72, borderRadius:'50%', background:'rgba(230,57,70,0.9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(230,57,70,0.5)', transition:'transform 0.15s' }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
            </div>
          </div>
        )}
      </div>

      <div className="container player-info">
        <button className="btn btn-ghost" style={{ padding:'6px 0', marginBottom:16, fontSize:14 }} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1 className="player-title">{movie.title}</h1>
        <div className="player-meta">
          <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--gold)', fontWeight:600 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="#f5c518" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {movie.rating}
          </span>
          {movie.genre && <span className={genreClass}>{movie.genre}</span>}
          {movie.year && <span className="hero-chip">{movie.year}</span>}
          {movie.duration && <span className="hero-chip">{movie.duration}</span>}
        </div>

        {movie.description && <p className="player-desc">{movie.description}</p>}

        <div className="player-actions">
          {!playing && (
            <button className="btn btn-primary" onClick={handlePlay}>▶ Play Now</button>
          )}
          <button className="btn btn-outline" onClick={toggleList}>
            {listed ? '✓ In Watchlist' : '+ Watchlist'}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${movie.yt_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Open in YouTube ↗
          </a>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-title">More {movie.genre}</div>
            </div>
            <div className="movie-row">
              {related.map(m => (
                <a key={m.id} href={`/movies/${m.id}`} style={{ flexShrink:0, width:200, borderRadius:10, overflow:'hidden', background:'var(--surface)', border:'1px solid var(--border)' }}>
                  <img src={m.thumb_url} alt={m.title} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover' }} onError={e=>e.target.style.opacity=0.3} />
                  <div style={{ padding:'8px 12px' }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{m.genre} · {m.year}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatWidget movie={movie} />
    </div>
  );
}
