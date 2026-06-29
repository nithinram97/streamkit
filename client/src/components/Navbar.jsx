import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useWatchlist } from '../hooks/useWatchlist.jsx';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const { watchlist } = useWatchlist();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e) => {
    setQ(e.target.value);
    if (e.target.value.trim()) {
      onSearch(e.target.value.trim());
      navigate('/search');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">Stream<span>Kit</span></Link>

        <div className="nav-links">
          <Link to="/"          className="nav-link">Home</Link>
          <Link to="/movies"    className="nav-link">Movies</Link>
          {user && <Link to="/watchlist" className="nav-link">Watchlist{watchlist.length > 0 ? ` (${watchlist.length})` : ''}</Link>}
          {user && <Link to="/history"   className="nav-link">History</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
        </div>

        <div className="nav-right">
          <div className="nav-search-wrap">
            <span className="nav-search-icon">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
              </svg>
            </span>
            <input
              className="nav-search"
              placeholder="Search movies…"
              value={q}
              onChange={handleSearch}
            />
          </div>

          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <div className="nav-avatar" onClick={() => setMenuOpen(o => !o)}>
                {user.name[0].toUpperCase()}
              </div>
              {menuOpen && (
                <div className="nav-menu">
                  <div className="nav-menu-header">
                    <div className="nav-menu-name">{user.name}</div>
                    <div className="nav-menu-email">{user.email}</div>
                  </div>
                  <Link to="/watchlist" className="nav-menu-item" onClick={() => setMenuOpen(false)}>🔖 My Watchlist</Link>
                  <Link to="/history"   className="nav-menu-item" onClick={() => setMenuOpen(false)}>🕐 Watch History</Link>
                  {user.role === 'admin' && <Link to="/admin" className="nav-menu-item" onClick={() => setMenuOpen(false)}>🛡 Admin Panel</Link>}
                  <div className="nav-menu-item danger" onClick={handleLogout}>Sign Out</div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
