import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /watchlist
router.get('/', authenticate, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT wi.id, wi.added_at, m.id as movie_id, m.yt_id, m.title, m.genre,
           m.year, m.rating, m.duration, m.thumb_url, m.description
    FROM watchlist_items wi
    JOIN movies m ON m.id = wi.movie_id
    WHERE wi.user_id = $1
    ORDER BY wi.added_at DESC
  `, [req.user.id]);
  res.json(rows);
});

// PUT /watchlist — add movie (idempotent)
router.put('/', authenticate, async (req, res) => {
  const { movie_id } = req.body;
  if (!movie_id) return res.status(400).json({ error: 'movie_id required' });
  const { rows: movie } = await pool.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
  if (!movie[0]) return res.status(404).json({ error: 'Movie not found' });
  await pool.query(`
    INSERT INTO watchlist_items (user_id, movie_id)
    VALUES ($1, $2) ON CONFLICT (user_id, movie_id) DO NOTHING
  `, [req.user.id, movie_id]);
  res.json({ message: 'Added to watchlist' });
});

// DELETE /watchlist/:movie_id
router.delete('/:movie_id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM watchlist_items WHERE user_id = $1 AND movie_id = $2',
    [req.user.id, req.params.movie_id]);
  res.status(204).send();
});

export default router;
