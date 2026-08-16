# CareCompass — Video Demonstration Script (3–5 minutes)

Use this script while screen-recording (Windows Win+G, or OBS). Keep the system clock visible.

## Setup before recording
1. Start backend: `cd D:\Projects\carecompass\backend && npm run start`
2. Start frontend: `cd D:\Projects\carecompass\frontend && npm run dev`
3. Open http://localhost:5173
4. Optionally open Cursor beside the browser briefly to show the project

## Script

**0:00–0:20 — Intro**
- “This is CareCompass, my second full-stack app.”
- Show localhost URL and briefly the project folder in Cursor.

**0:20–0:50 — Home + navigation**
- Click **Search resources** and **Ask the AI guide**.
- Use top nav: Find help, AI guide, Sign in, Register.
- Press Tab to show keyboard focus rings; mention Skip to main content.

**0:50–1:40 — Search + details**
- Search `food`, choose category Food, city Austin.
- Open a resource detail page.
- Point out eligibility notes, documents checklist, source, last verified, disclaimer.

**1:40–2:20 — Forms: valid + invalid**
- Go to Register: submit empty/invalid password → show error.
- Register or sign in with demo user `maria@example.com` / `password123`.
- Sign in with wrong password → show error alert.
- Sign in correctly → show Favorites link appears.

**2:20–3:00 — Favorites + AI guide**
- Save a favorite from a resource page.
- Open Favorites; remove one.
- Ask AI: “I need food help in Austin.”
- Show matched resources + disclaimer that CareCompass does not decide eligibility.
- Try invalid AI input “hi” → validation error.

**3:00–3:50 — Admin + security talk-track**
- Sign out; sign in as `admin@carecompass.org` / `admin123`.
- Open Dashboard; show stats and resource table; edit/create briefly.
- Mention security: JWT auth, role checks, rate limits, sanitized inputs, parameterized SQL, Helmet, `.env` secrets.

**3:50–4:30 — Error handling + wrap-up**
- Visit a fake URL like `/nope` → 404 message.
- Summarize: all major features tested, bugs fixed, security hardened, accessibility supported.
- End on homepage.

## Demo accounts
- User: maria@example.com / password123
- Admin: admin@carecompass.org / admin123
