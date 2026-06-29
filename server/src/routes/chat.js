import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import log from '../utils/logger.js';

const router = Router();

const GOOGLE_KEY = process.env.GOOGLE_KEY;
const MODEL      = process.env.LIBRECHAT_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildSystemPrompt(context = {}, user = null) {
  const lines = [
    'You are StreamKit\'s friendly AI assistant — a helpful movie guide for a free streaming platform.',
    'Help viewers discover movies, manage their watchlist, and navigate the platform.',
    'Be concise and warm. Never make up movie details — only use the context provided below.',
  ];
  if (user) lines.push(`Viewer name: ${user.name}. Email: ${user.email}.`);
  if (context.movie) {
    const m = context.movie;
    lines.push(`\nCurrently watching: "${m.title}" (${m.genre}, ${m.year}) — ${m.description || ''}`);
  }
  if (context.watchlistTitles?.length) {
    lines.push('\nViewer\'s watchlist: ' + context.watchlistTitles.join(', '));
  }
  if (context.recentHistory?.length) {
    lines.push('Recently watched: ' + context.recentHistory.slice(0,5).map(h => h.title).join(', '));
  }
  lines.push('\nOnly answer streaming/movie-related questions. Decline unrelated topics politely.');
  return lines.join('\n');
}

// POST /api/chat
router.post('/', optionalAuth, async (req, res) => {
  const { messages = [], context = {} } = req.body;

  if (!GOOGLE_KEY) {
    return res.status(503).json({ error: 'GOOGLE_KEY not configured. Set it in .env to enable the AI assistant.' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const systemPrompt = buildSystemPrompt(context, req.user ?? null);

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  };

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GOOGLE_KEY },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      log.error('Gemini API error', { status: upstream.status, data });
      return res.status(502).json({ error: data.error?.message || 'AI service error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.json({ reply });
  } catch (err) {
    log.error('Chat error', { message: err.message });
    res.status(502).json({ error: 'AI service unavailable' });
  }
});

export default router;
