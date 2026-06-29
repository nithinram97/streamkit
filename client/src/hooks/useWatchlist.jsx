import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { useAuth } from './useAuth.jsx';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) { setWatchlist([]); return; }
    setLoading(true);
    try { setWatchlist(await api.getWatchlist()); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const add = async (movie_id) => {
    await api.addToWatchlist(movie_id);
    await fetchWatchlist();
  };

  const remove = async (movie_id) => {
    await api.removeFromWatchlist(movie_id);
    await fetchWatchlist();
  };

  const inList = (movie_id) => watchlist.some(m => m.movie_id === movie_id);

  return (
    <WatchlistContext.Provider value={{ watchlist, loading, add, remove, inList, fetchWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
