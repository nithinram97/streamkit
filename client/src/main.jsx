import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { WatchlistProvider } from './hooks/useWatchlist.jsx';
import { HistoryProvider } from './hooks/useHistory.jsx';
import Navbar from './components/Navbar.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Home from './pages/Home.jsx';
import Movies from './pages/Movies.jsx';
import Search from './pages/Search.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Watchlist from './pages/Watchlist.jsx';
import History from './pages/History.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import { trackPageView } from './analytics.js';
import './index.css';

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname); }, [location.pathname]);
  return null;
}

function App() {
  const [searchQ, setSearchQ] = useState('');
  const [toast, setToast]     = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, icon = '✓') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSearch = (q) => {
    setSearchQ(q);
    if (q) navigate('/search');
  };

  return (
    <>
      <PageViewTracker />
      <Navbar onSearch={handleSearch} />

      <Routes>
        <Route path="/"           element={<Home onToast={showToast} />} />
        <Route path="/movies"     element={<Movies onToast={showToast} />} />
        <Route path="/movies/:id" element={<MovieDetail onToast={showToast} />} />
        <Route path="/search"     element={<Search q={searchQ} onToast={showToast} />} />
        <Route path="/watchlist"  element={<Watchlist onToast={showToast} />} />
        <Route path="/history"    element={<History />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/admin"      element={<Admin onToast={showToast} />} />
      </Routes>

      {/* Global chat widget — MovieDetail renders its own with movie context */}
      <ChatWidget />

      {toast && (
        <div className="toast">
          <span className="toast-icon">{toast.icon}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WatchlistProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </WatchlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
