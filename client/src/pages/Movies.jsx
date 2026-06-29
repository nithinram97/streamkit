import { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import MovieCard from '../components/MovieCard.jsx';

export default function Movies({ onToast }) {
  const [movies, setMovies]     = useState([]);
  const [genres, setGenres]     = useState([]);
  const [genre, setGenre]       = useState('');
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const limit = 20;

  useEffect(() => { api.getGenres().then(setGenres).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    api.getMovies({ ...(genre && { genre }), page, limit })
      .then(d => { setMovies(d.movies); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre, page]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="container page">
      <h1 className="page-title">All Movies</h1>
      <div className="filter-bar">
        <button className={`filter-chip${!genre ? ' active' : ''}`} onClick={() => { setGenre(''); setPage(1); }}>All</button>
        {genres.map(g => (
          <button key={g} className={`filter-chip${genre===g ? ' active' : ''}`} onClick={() => { setGenre(g); setPage(1); }}>{g}</button>
        ))}
      </div>

      {loading
        ? <div className="spinner">Loading…</div>
        : movies.length === 0
          ? <div className="empty-state">No movies found.</div>
          : <div className="movies-grid">{movies.map(m => <MovieCard key={m.id} movie={m} onToast={onToast} />)}</div>
      }

      {pages > 1 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginTop:32 }}>
          <button className="btn btn-outline" onClick={() => setPage(p=>p-1)} disabled={page===1}>← Prev</button>
          <span style={{ color:'var(--muted)', fontSize:14 }}>{page} / {pages}</span>
          <button className="btn btn-outline" onClick={() => setPage(p=>p+1)} disabled={page===pages}>Next →</button>
        </div>
      )}
    </div>
  );
}
