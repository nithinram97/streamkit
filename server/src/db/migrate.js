import pool from './pool.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'user',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        yt_id       TEXT NOT NULL,
        title       TEXT NOT NULL,
        genre       TEXT,
        year        INTEGER,
        rating      NUMERIC(3,1),
        duration    TEXT,
        description TEXT,
        thumb_url   TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS watchlist_items (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id   UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, movie_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_history (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id    UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        progress    INTEGER NOT NULL DEFAULT 0,
        watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
