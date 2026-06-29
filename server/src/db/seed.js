import pool from './pool.js';
import bcrypt from 'bcryptjs';

const MOVIES = [
  { yt_id: 'BfB92CZ0nZ8', title: 'The Inheritance',       genre: 'Drama',     year: 2020, rating: 7.1, duration: '1h 42m', description: 'A family gathers after a patriarch death, uncovering long-buried secrets.' },
  { yt_id: 'Nt-pCYJFJ2g', title: 'Phantom Raiders',       genre: 'Action',    year: 2021, rating: 6.8, duration: '1h 38m', description: 'An elite unit takes on a rogue arms syndicate across three continents.' },
  { yt_id: 'kCFEBDipJaY', title: 'Midnight Serenade',     genre: 'Romance',   year: 2019, rating: 7.4, duration: '1h 55m', description: 'Two strangers meet at a jazz club and fall in love over one magical night.' },
  { yt_id: 'HM2G4O5DqQg', title: 'The Lost Signal',       genre: 'Sci-Fi',    year: 2022, rating: 7.9, duration: '2h 03m', description: 'A deep-space crew intercepts an alien transmission with dire consequences.' },
  { yt_id: 'fnKNmEpHCRQ', title: 'Shadows of the Valley', genre: 'Thriller',  year: 2020, rating: 6.5, duration: '1h 47m', description: 'A detective returns to her hometown to solve a cold case that destroyed her family.' },
  { yt_id: 'dPxv4-H-eTY', title: 'Broken Compass',        genre: 'Adventure', year: 2021, rating: 7.2, duration: '1h 50m', description: 'A disgraced explorer ventures into the Amazon jungle one last time.' },
  { yt_id: 'O2Y56BFMRZE', title: 'Ember Falls',           genre: 'Drama',     year: 2019, rating: 8.0, duration: '2h 10m', description: 'A small-town firefighter confronts his past when the forest ignites once more.' },
  { yt_id: '5EoWMBRgqZ8', title: 'Neon Requiem',          genre: 'Crime',     year: 2022, rating: 7.6, duration: '1h 58m', description: 'A jazz musician in 1950s New Orleans gets entangled in a deadly mob turf war.' },
  { yt_id: '3JF2fS3m8xM', title: 'The Quiet Storm',       genre: 'Romance',   year: 2020, rating: 6.9, duration: '1h 44m', description: 'Two rival scientists compete for a grant while falling unexpectedly in love.' },
  { yt_id: 'H1EYi5IXTEM', title: 'Iron Meridian',         genre: 'Action',    year: 2021, rating: 7.3, duration: '2h 01m', description: 'A retired soldier is pulled back into action to protect a whistleblower.' },
  { yt_id: 'CwIM2YYbMtw', title: 'Glass Horizon',         genre: 'Sci-Fi',    year: 2023, rating: 8.2, duration: '2h 15m', description: 'Earth last ark ship encounters a habitable planet with a chilling secret.' },
  { yt_id: 'SkgTxQm9DWM', title: 'The Forgotten Road',    genre: 'Drama',     year: 2018, rating: 7.7, duration: '1h 52m', description: 'A road trip forces estranged siblings to confront years of silence.' },
  { yt_id: 'g7H8MsSmLxE', title: 'Dark Frequency',        genre: 'Thriller',  year: 2022, rating: 7.0, duration: '1h 39m', description: 'A radio host receives transmissions from the future and the killer who knows it.' },
  { yt_id: 'mYfJxlgR2jw', title: 'Crimson Tide Rising',   genre: 'Crime',     year: 2020, rating: 6.7, duration: '1h 57m', description: 'A rookie detective uncovers a conspiracy that reaches the highest levels of power.' },
  { yt_id: '2WwM4NknFFs', title: 'Wildfire Season',       genre: 'Adventure', year: 2021, rating: 7.5, duration: '2h 04m', description: 'Two smokejumpers battle an unprecedented wildfire in the Rockies.' },
  { yt_id: 'E7lKnJJlrjw', title: 'Parallel Lives',        genre: 'Sci-Fi',    year: 2019, rating: 7.8, duration: '1h 56m', description: 'A physicist discovers she can communicate with an alternate version of herself.' },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@streamkit.com', $1, 'Admin', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [adminHash]);

    const userHash = await bcrypt.hash('viewer123', 10);
    await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('viewer@streamkit.com', $1, 'Alex Viewer', 'user')
      ON CONFLICT (email) DO NOTHING;
    `, [userHash]);

    for (const m of MOVIES) {
      const thumbUrl = `https://img.youtube.com/vi/${m.yt_id}/hqdefault.jpg`;
      await client.query(`
        INSERT INTO movies (yt_id, title, genre, year, rating, duration, description, thumb_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING;
      `, [m.yt_id, m.title, m.genre, m.year, m.rating, m.duration, m.description, thumbUrl]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete');
    console.log('   admin@streamkit.com / admin123');
    console.log('   viewer@streamkit.com / viewer123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
