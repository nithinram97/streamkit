import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { useAuth } from './useAuth.jsx';

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) { setHistory([]); return; }
    setLoading(true);
    try { setHistory(await api.getHistory()); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const recordWatch = async (movie_id) => {
    await api.recordWatch(movie_id, 0);
    await fetchHistory();
  };

  const updateProgress = async (movie_id, progress) => {
    await api.updateProgress(movie_id, progress);
    setHistory(prev => prev.map(h => h.movie_id === movie_id ? { ...h, progress } : h));
  };

  return (
    <HistoryContext.Provider value={{ history, loading, recordWatch, updateProgress, fetchHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export const useHistory = () => useContext(HistoryContext);
