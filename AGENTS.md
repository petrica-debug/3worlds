# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Three Worlds is a static HTML/CSS/JS website and Chemical Intelligence Platform (REACH registration tool). There is no build step, no framework, and no bundler. The frontend runs entirely in the browser.

### Architecture

- **Static pages**: `index.html` (marketing), `platform.html` (product), `auth.html` (authentication), `app.html` (REACH Engine dashboard)
- **Client-side JS**: `js/` — app logic, REACH engine, IUCLID/eSDS generators, AI copilot, Supabase config
- **Vercel serverless API**: `api/` — `chat.js` (OpenAI proxy), `auth.js` (Supabase config), `admin.js` (admin panel)
- **Chemical data**: `data/chemicals.js` — hardcoded data for 11 substances powering the demo
- **Planned Python backend**: `app/backend/` — FastAPI stubs (not implemented)

### Running locally

Serve the project root with any static file server:

```bash
npx serve -l 3000
```

All core REACH functionality (5-step wizard, substance search, CLP classification, IUCLID XML generation, eSDS generation) works offline in the browser. The Vercel API routes (`/api/*`) require `vercel dev` and environment variables (see below).

### Environment variables (optional, for API routes)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | AI Copilot chat proxy |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin operations |

### Lint / Test / Build

- **No ESLint, Prettier, TypeScript, or test framework** is configured in this repo.
- Syntax-check JS files with: `node --check js/*.js api/*.js data/*.js`
- There is no build step; the site is plain HTML/CSS/JS.

### Gotchas

- The `package.json` has no dependencies listed. The `@supabase/supabase-js` import in `api/auth.js` and `api/admin.js` uses dynamic `import()` and is resolved at runtime by the Vercel platform.
- The Python backend (`app/backend/`) is entirely stubs — all endpoints return `"not_implemented"`. Do not attempt to run it for testing.
- The `app/docker-compose.yml` references Dockerfiles that do not exist in the repo.
