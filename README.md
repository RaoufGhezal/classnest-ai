# ClassNest AI starter

Minimal monorepo: Next.js frontend, NestJS API (Google OAuth + JWT cookie + TypeORM/PostgreSQL), and FastAPI document-processing service.

## Requirements

- Node.js 20+
- Python 3.11+
- PostgreSQL
- Google OAuth web client credentials

## 1. Configure

Copy `.env.example` to `.env` at the repository root and fill in values. For Google Cloud Console, add this authorized redirect URI:
`http://localhost:4000/auth/google/callback`

## 2. Start database

`docker compose up -d postgres`

## 3. Start Nest API

```bash
cd apps/api
npm install
npm run start:dev
```

## 4. Start Next.js

```bash
cd apps/web
npm install
npm run dev
```

## 5. Start FastAPI

```bash
cd apps/processor
python -m venv .venv
# Windows: .venv\\Scripts\\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend: http://localhost:3000 · Nest API: http://localhost:4000 · FastAPI docs: http://localhost:8000/docs

## Auth flow

1. Next.js links to `GET /auth/google`.
2. Google returns to NestJS callback.
3. NestJS verifies the Google profile, creates/finds the user, signs short-lived access and longer-lived refresh JWTs and sets them in HttpOnly cookies.
4. NestJS redirects back to Next.js.
5. Browser sends cookie on same-site API calls; `GET /auth/me` is protected by the JWT guard.

## File processing flow (starter boundary)

The FastAPI service exposes `POST /process` for a file and extracts text from text-based PDFs, text files and images (OCR requires optional Tesseract/Pillow setup). In production, originals should be stored in object storage and jobs should run asynchronously. Do not expose the processor publicly; secure it with a service token or private network.

## Important before production

- Use HTTPS and set `COOKIE_SECURE=true`.
- Set separate strong random `JWT_SECRET` and `JWT_REFRESH_SECRET` values (32+ bytes each).
- Configure exact CORS origins; never use `*` with credentials.
- Add CSRF protection for cookie-authenticated mutations.
- Add file size/type validation, rate limits, account deletion, logging, and tests.
- Do not assume Google login gives Gemini/API access. AI provider credentials are separate.
- This starter provides the authentication foundation; application features can be added separately.
"# classnest-ai" 
