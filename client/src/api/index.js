const BASE = '/api';
const getToken = () => localStorage.getItem('token');
const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});
const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: headers(),
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  register:            (body)          => request('POST',   '/auth/register', body),
  login:               (body)          => request('POST',   '/auth/login', body),
  me:                  ()              => request('GET',    '/auth/me'),
  getMovies:           (params = {})   => { const qs = new URLSearchParams(params).toString(); return request('GET', `/movies${qs ? '?'+qs : ''}`); },
  getMovie:            (id)            => request('GET',    `/movies/${id}`),
  getGenres:           ()              => request('GET',    '/movies/genres'),
  createMovie:         (body)          => request('POST',   '/movies', body),
  updateMovie:         (id, body)      => request('PATCH',  `/movies/${id}`, body),
  deleteMovie:         (id)            => request('DELETE', `/movies/${id}`),
  getWatchlist:        ()              => request('GET',    '/watchlist'),
  addToWatchlist:      (movie_id)      => request('PUT',    '/watchlist', { movie_id }),
  removeFromWatchlist: (movie_id)      => request('DELETE', `/watchlist/${movie_id}`),
  getHistory:          ()              => request('GET',    '/history'),
  recordWatch:         (movie_id, p)   => request('POST',   '/history', { movie_id, progress: p || 0 }),
  updateProgress:      (movie_id, p)   => request('PATCH',  `/history/${movie_id}/progress`, { progress: p }),
  chat:                (messages, ctx) => request('POST',   '/chat', { messages, context: ctx }),
};
