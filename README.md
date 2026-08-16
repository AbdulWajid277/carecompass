# CareCompass

AI-powered community resource navigator (React + Express + SQLite).

## Local development

```bash
npm run install:all
npm run seed --prefix backend
npm run dev --prefix backend
npm run dev --prefix frontend
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

## Production / AWS App Runner

```bash
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix frontend
NODE_ENV=production PORT=8080 npm start --prefix backend
```

Configured via `apprunner.yaml` (Node.js 22, port 8080).

### Demo accounts

- User: maria@example.com / password123
- Admin: admin@carecompass.org / admin123

## Environment

Copy `backend/.env.example` to `backend/.env` for local use. On App Runner, set:

- `JWT_SECRET` (required recommended)
- `NODE_ENV=production`
- `PORT=8080`
- `CLIENT_ORIGIN=*` (same-origin static UI)
- `OPENAI_API_KEY` (optional)
