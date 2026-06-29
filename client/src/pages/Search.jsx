import { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import MovieCard from '../components/MovieCard.jsx';

export default function Search({ q, onToast }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.getMovies({ q, limit: 40 })
      .then(d => setResults(d.movies))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="container page">
      <h1 className="page-title">Results for "{q}"</h1>
      {loading
        ? <div className="spinner">Searching…</div>
        : results.length === 0
          ? <div className="empty-state">No results found.<br/>Try a different title, genre, or year.</div>
          : <div className="movies-grid">{results.map(m => <MovieCard key={m.id} movie={m} onToast={onToast} />)}</div>
      }
    </div>
  );
}
