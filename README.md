# StreamKit — Free Movie Streaming Platform

A Sony LIV-style streaming platform built on the ShopKit stack.
Full-length movies iframed from YouTube. No subscription required.

## Stack

| Layer        | Tech                                              |
|--------------|---------------------------------------------------|
| Frontend     | Vite, React 18, React Router 6                    |
| Backend      | Node.js, Express 4                                |
| Database     | PostgreSQL (users, movies, watchlist, history)    |
| Analytics    | ClickHouse (click_events, server_logs, app_logs)  |
| Observability| ClickStack / HyperDX (OTLP)                       |
| AI Assistant | Gemini 2.5 Flash (via LibreChat + MCP)            |
| Auth         | JWT + bcrypt                                      |

## Project Layout

```
streamkit/
├── client/                   # Vite React app
│   └── src/
│       ├── api/              # Typed API client
│       ├── analytics.js      # Browser event SDK (batched, sendBeacon)
│       ├── components/       # Navbar, MovieCard, ChatWidget
│       ├── hooks/            # useAuth, useWatchlist, useHistory
│       └── pages/            # Home, Movies, MovieDetail, Watchlist,
│                             #   History, Login, Admin, Search
└── server/                   # Express API
    └── src/
        ├── db/               # pool.js, ch-client.js, migrate.js, seed.js,
        │                     #   ch-migrate.js
        ├── middleware/       # auth.js (JWT), requestLogger.js (CH + OTLP)
        ├── routes/           # auth, movies, watchlist, history, events, chat
        └── utils/            # logger.js, otel.js
```

## Quick Start (local dev)

### Prerequisites
- Node 20+
- PostgreSQL running locally
- ClickHouse (optional — events are no-ops if unreachable)

### Install & run

```bash
git clone <repo> && cd streamkit
npm install          # installs root + workspaces

# Copy and edit env
cp .env.example .env   # add GOOGLE_KEY for AI chat (optional)

# Postgres
createdb streamkit
npm run db:migrate   # creates tables
npm run db:seed      # loads 16 movies + 2 users

# ClickHouse (if running locally)
npm run ch:migrate

# Start both servers
npm run dev
```

Open http://localhost:5173

**Seed credentials:**
- `admin@streamkit.com` / `admin123`  ← Admin panel access
- `viewer@streamkit.com` / `viewer123`

## Docker (recommended)

```bash
docker compose up --build
```

Services started:
| Service      | URL                        | Notes                        |
|-------------|----------------------------|------------------------------|
| Client       | http://localhost:5173      | React SPA                    |
| Server       | http://localhost:3000      | Express API                  |
| HyperDX UI   | http://localhost:8080      | Observability dashboard       |
| LibreChat    | http://localhost:3080      | AI assistant backend          |

## API Reference

### Auth
| Method | Path                  | Auth   | Description           |
|--------|-----------------------|--------|-----------------------|
| POST   | `/api/auth/register`  | —      | Register              |
| POST   | `/api/auth/login`     | —      | Login → JWT           |
| GET    | `/api/auth/me`        | Bearer | Current user          |

### Movies
| Method | Path                  | Auth   | Description                     |
|--------|-----------------------|--------|---------------------------------|
| GET    | `/api/movies`         | —      | List (`genre`, `q`, `page`)     |
| GET    | `/api/movies/genres`  | —      | Genre list                      |
| GET    | `/api/movies/:id`     | —      | Single movie                    |
| POST   | `/api/movies`         | Admin  | Create                          |
| PATCH  | `/api/movies/:id`     | Admin  | Update                          |
| DELETE | `/api/movies/:id`     | Admin  | Delete                          |

### Watchlist
| Method | Path                        | Auth   | Description        |
|--------|-----------------------------|--------|--------------------|
| GET    | `/api/watchlist`            | Bearer | Get watchlist      |
| PUT    | `/api/watchlist`            | Bearer | Add `{ movie_id }` |
| DELETE | `/api/watchlist/:movie_id`  | Bearer | Remove             |

### Watch History
| Method | Path                              | Auth   | Description                           |
|--------|-----------------------------------|--------|---------------------------------------|
| POST   | `/api/history`                    | Bearer | Record watch `{ movie_id, progress }` |
| PATCH  | `/api/history/:movie_id/progress` | Bearer | Update progress %                     |
| GET    | `/api/history`                    | Bearer | My history (admin: all viewers)       |

### Events & Chat
| Method | Path           | Auth     | Description                       |
|--------|----------------|----------|-----------------------------------|
| POST   | `/api/events`  | Optional | Ingest analytics batch            |
| POST   | `/api/chat`    | Optional | AI assistant (Gemini)             |

## ClickHouse Queries

```sql
-- Most-watched movies
SELECT properties, count() AS plays
FROM streamkit.click_events
WHERE event_type = 'play'
GROUP BY properties ORDER BY plays DESC LIMIT 10;

-- Top genres by watchlist adds
SELECT JSONExtractString(properties,'genre') AS genre, count() AS adds
FROM streamkit.click_events
WHERE event_type = 'add_to_watchlist'
GROUP BY genre ORDER BY adds DESC;

-- API p50/p95 latency
SELECT target,
  quantile(0.5)(duration_ms)  AS p50_ms,
  quantile(0.95)(duration_ms) AS p95_ms,
  count() AS calls
FROM streamkit.click_events
WHERE event_type = 'api_call' AND ts > now() - INTERVAL 1 DAY
GROUP BY target ORDER BY calls DESC;

-- Server errors
SELECT path, status, count() AS n
FROM streamkit.server_logs
WHERE status >= 400 AND ts > now() - INTERVAL 1 DAY
GROUP BY path, status ORDER BY n DESC;
```

## AI Assistant (Chat)

The floating chat widget on every page calls `/api/chat`, which proxies
to Gemini via the `GOOGLE_KEY` in your `.env`.  The system prompt
automatically includes:
- The movie currently being viewed (on the detail page)
- The user's watchlist titles
- Their recent watch history

Set `GOOGLE_KEY` in `.env` (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
to activate it. The widget degrades gracefully if no key is set.

## ShopKit → StreamKit Feature Map

| ShopKit              | StreamKit                  |
|----------------------|----------------------------|
| `products` table     | `movies` table             |
| `cart_items` table   | `watchlist_items` table    |
| `orders` table       | `watch_history` table      |
| `/api/products`      | `/api/movies`              |
| `/api/cart`          | `/api/watchlist`           |
| `/api/orders`        | `/api/history`             |
| `useCart` hook       | `useWatchlist` hook        |
| Products page        | Movies page (genre filter) |
| Cart page            | Watchlist page             |
| Orders page          | History page               |
| Admin: product CRUD  | Admin: movie CRUD          |
| Admin: order status  | Admin: watch analytics     |
| ChatWidget           | ChatWidget (movie context) |
| analytics.js         | analytics.js (unchanged)   |
