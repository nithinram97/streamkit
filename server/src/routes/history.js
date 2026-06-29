import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /history — record or update a viewing session
router.post('/', authenticate, async (req, res) => {
  const { movie_id, progress = 0 } = req.body;
  if (!movie_id) return res.status(400).json({ error: 'movie_id required' });

  const { rows: movie } = await pool.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
  if (!movie[0]) return res.status(404).json({ error: 'Movie not found' });

  // Upsert: update progress + watched_at if already watched today
  const { rows } = await pool.query(`
    INSERT INTO watch_history (user_id, movie_id, progress)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
    RETURNING *
  `, [req.user.id, movie_id, progress]);

  if (!rows[0]) {
    // Already has an entry — update the most recent one
    await pool.query(`
      UPDATE watch_history SET progress = $1, watched_at = NOW()
      WHERE id = (
        SELECT id FROM watch_history
        WHERE user_id = $2 AND movie_id = $3
        ORDER BY watched_at DESC LIMIT 1
      )
    `, [progress, req.user.id, movie_id]);
  }

  res.status(201).json({ message: 'History recorded' });
});

// PATCH /history/:movie_id/progress
router.patch('/:movie_id/progress', authenticate, async (req, res) => {
  const { progress } = req.body;
  if (progress == null) return res.status(400).json({ error: 'progress required' });
  await pool.query(`
    UPDATE watch_history SET progress = $1
    WHERE id = (
      SELECT id FROM watch_history
      WHERE user_id = $2 AND movie_id = $3
      ORDER BY watched_at DESC LIMIT 1
    )
  `, [progress, req.user.id, req.params.movie_id]);
  res.json({ message: 'Progress updated' });
});

// GET /history — current user's history (admin sees all)
router.get('/', authenticate, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { rows } = await pool.query(
    isAdmin
      ? `SELECT wh.*, m.yt_id, m.title, m.genre, m.thumb_url, u.name as viewer_name, u.email
         FROM watch_history wh
         JOIN movies m ON m.id = wh.movie_id
         JOIN users u ON u.id = wh.user_id
         ORDER BY wh.watched_at DESC`
      : `SELECT wh.*, m.yt_id, m.title, m.genre, m.thumb_url
         FROM watch_history wh
         JOIN movies m ON m.id = wh.movie_id
         WHERE wh.user_id = $1
         ORDER BY wh.watched_at DESC`,
    isAdmin ? [] : [req.user.id]
  );
  res.json(rows);
});

export default router;
