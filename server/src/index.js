import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes    from './routes/auth.js';
import movieRoutes   from './routes/movies.js';
import watchlistRoutes from './routes/watchlist.js';
import historyRoutes from './routes/history.js';
import eventRoutes   from './routes/events.js';
import chatRoutes    from './routes/chat.js';

import { requestLogger } from './middleware/requestLogger.js';
import log               from './utils/logger.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth',      authRoutes);
app.use('/api/movies',    movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/history',   historyRoutes);
app.use('/api/events',    eventRoutes);
app.use('/api/chat',      chatRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, _next) => {
  log.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    request_id: req.requestId,
  });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  log.info('StreamKit server started', { port: PORT, env: process.env.NODE_ENV });
});

export default app;
