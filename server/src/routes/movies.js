import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /movies — list with optional genre filter & search
router.get('/', async (req, res) => {
  const { genre, q, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (genre) { params.push(genre); conditions.push(`genre = $${params.length}`); }
  if (q)     { params.push(`%${q}%`); conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length} OR genre ILIKE $${params.length})`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM movies ${where} ORDER BY rating DESC, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM movies ${where}`, params.slice(0, -2));

  res.json({ movies: rows, total: parseInt(countRows[0].count), page: +page, limit: +limit });
});

// GET /movies/genres
router.get('/genres', async (_req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL ORDER BY genre');
  res.json(rows.map(r => r.genre));
});

// GET /movies/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Movie not found' });
  res.json(rows[0]);
});

// POST /movies — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { yt_id, title, genre, year, rating, duration, description, thumb_url } = req.body;
  if (!yt_id || !title) return res.status(400).json({ error: 'yt_id and title are required' });
  const thumbUrl = thumb_url || `https://img.youtube.com/vi/${yt_id}/hqdefault.jpg`;
  const { rows } = await pool.query(
    `INSERT INTO movies (yt_id, title, genre, year, rating, duration, description, thumb_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [yt_id, title, genre, year || null, rating || null, duration, description, thumbUrl]
  );
  res.status(201).json(rows[0]);
});

// PATCH /movies/:id — admin only
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const fields = ['yt_id', 'title', 'genre', 'year', 'rating', 'duration', 'description', 'thumb_url'];
  const updates = fields.filter(f => req.body[f] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  const params = updates.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...updates.map(f => req.body[f]), req.params.id];

  const { rows } = await pool.query(
    `UPDATE movies SET ${params} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'Movie not found' });
  res.json(rows[0]);
});

// DELETE /movies/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM movies WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Movie not found' });
  res.status(204).send();
});

export default router;
