import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.jsx';

const EMPTY = { yt_id:'', title:'', genre:'', year:'', rating:'', duration:'', description:'', thumb_url:'' };
const GENRES = ['Action','Adventure','Crime','Drama','Romance','Sci-Fi','Thriller'];

export default function Admin({ onToast }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('catalog');
  const [movies, setMovies] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm]     = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user || user.role !== 'admin') navigate('/'); }, [user]);

  const loadMovies  = () => api.getMovies({ limit: 100 }).then(d => setMovies(d.movies));
  const loadHistory = () => api.getHistory().then(setHistory).catch(() => setHistory([]));
  useEffect(() => { loadMovies(); loadHistory(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.yt_id || !form.title) { setError('YouTube ID and title are required.'); return; }
    setSaving(true); setError('');
    try {
      const data = { ...form, year: parseInt(form.year)||null, rating: parseFloat(form.rating)||null };
      if (editing) await api.updateMovie(editing, data);
      else         await api.createMovie(data);
      setForm(EMPTY); setEditing(null);
      await loadMovies();
      onToast(editing ? 'Movie updated' : 'Movie added', '✓');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this movie?')) return;
    await api.deleteMovie(id);
    await loadMovies();
    onToast('Movie deleted', '🗑');
  };

  const editMovie = (m) => {
    setEditing(m.id);
    setForm({ yt_id: m.yt_id, title: m.title, genre: m.genre||'', year: String(m.year||''), rating: String(m.rating||''), duration: m.duration||'', description: m.description||'', thumb_url: m.thumb_url||'' });
    setTab('catalog');
    window.scrollTo(0,0);
  };

  const genreClass = g => `badge badge-${(g||'').toLowerCase().replace(' ','-').replace('-fi','fi')}`;

  // Analytics
  const totalWatches = history.length;
  const genreStats = GENRES.map(g => ({ genre: g, count: movies.filter(m => m.genre===g).length, watches: history.filter(h => movies.find(m=>m.id===h.movie_id)?.genre===g).length }));

  return (
    <div className="container page">
      <h1 className="page-title">Admin Panel</h1>
      <div className="admin-tabs">
        {['catalog','analytics','history'].map(t => (
          <button key={t} className={`admin-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t==='catalog' ? '🎬 Catalog' : t==='analytics' ? '📊 Analytics' : '🕐 Watch History'}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
        <>
          {/* FORM */}
          <div className="admin-card">
            <h2>{editing ? 'Edit Movie' : 'Add New Movie'}</h2>
            <div className="form-grid">
              {[['yt_id','YouTube Video ID',''], ['title','Title','full'], ['year','Year',''], ['rating','Rating (e.g. 7.5)',''], ['duration','Duration (e.g. 1h 42m)',''], ['thumb_url','Thumbnail URL (auto-generated if blank)','full']].map(([k,l,cls]) => (
                <div key={k} className={`form-field${cls ? ' '+cls : ''}`}>
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={form[k]} onChange={set(k)} placeholder={l} />
                </div>
              ))}
              <div className="form-field">
                <label className="form-label">Genre</label>
                <select className="form-input" value={form.genre} onChange={set('genre')}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-field full">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={set('description')} rows={2} style={{ resize:'vertical' }} />
              </div>
            </div>
            {error && <div className="error-msg" style={{ marginBottom:8 }}>{error}</div>}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Movie'}</button>
              {editing && <button className="btn btn-outline" onClick={() => { setEditing(null); setForm(EMPTY); setError(''); }}>Cancel</button>}
            </div>
          </div>

          {/* TABLE */}
          <div className="admin-card">
            <h2>Movie Catalog ({movies.length} titles)</h2>
            <div style={{ overflowX:'auto' }}>
              <table className="admin-table">
                <thead><tr><th>Thumbnail</th><th>Title</th><th>Genre</th><th>Year</th><th>Rating</th><th>Actions</th></tr></thead>
                <tbody>
                  {movies.map(m => (
                    <tr key={m.id}>
                      <td><img src={m.thumb_url} alt="" style={{ width:60, aspectRatio:'16/9', objectFit:'cover', borderRadius:4, background:'var(--surface2)' }} onError={e=>e.target.style.opacity=0.2} /></td>
                      <td style={{ fontWeight:500, maxWidth:200 }}>{m.title}</td>
                      <td>{m.genre && <span className={genreClass(m.genre)}>{m.genre}</span>}</td>
                      <td style={{ color:'var(--muted)' }}>{m.year}</td>
                      <td><span style={{ color:'var(--gold)', fontWeight:600 }}>★ {m.rating}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => editMovie(m)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'analytics' && (
        <div className="admin-card">
          <h2>Platform Analytics</h2>
          <div className="stat-grid">
            {[
              { label:'Total Movies',  value: movies.length,  icon:'🎬' },
              { label:'Total Watches', value: totalWatches,   icon:'▶' },
              { label:'Genres',        value: GENRES.length,  icon:'🏷' },
              { label:'Avg Rating',    value: movies.length ? (movies.reduce((s,m)=>s+(+m.rating||0),0)/movies.length).toFixed(1) : '—', icon:'⭐' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Genre Breakdown</h3>
          <table className="admin-table">
            <thead><tr><th>Genre</th><th>Movies</th><th>Watches</th></tr></thead>
            <tbody>
              {genreStats.map(g => (
                <tr key={g.genre}>
                  <td><span className={genreClass(g.genre)}>{g.genre}</span></td>
                  <td>{g.count}</td>
                  <td>{g.watches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="admin-card">
          <h2>All Watch Events ({history.length})</h2>
          {history.length === 0
            ? <div style={{ color:'var(--muted)', padding:'24px 0' }}>No watch events yet.</div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Title</th><th>Viewer</th><th>Watched At</th><th>Progress</th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight:500 }}>{h.title}</td>
                        <td style={{ color:'var(--muted)' }}>{h.viewer_name || '—'} {h.email ? `(${h.email})` : ''}</td>
                        <td style={{ color:'var(--muted)', fontSize:12 }}>{new Date(h.watched_at).toLocaleString()}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div className="progress-bar-wrap" style={{ width:80 }}>
                              <div className="progress-bar" style={{ width:`${h.progress||0}%` }} />
                            </div>
                            <span style={{ fontSize:12, color:'var(--muted)' }}>{h.progress||0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
