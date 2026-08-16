# CareCompass — Deployment Report
**Workshop:** Deploy Second App to AWS App Runner  
**Date:** August 16, 2026  
**App:** CareCompass  
**GitHub:** https://github.com/AbdulWajid277/carecompass

---

## Live Application URL

**https://a3bb2ztgm5.us-east-1.awsapprunner.com**

(Service name: `carecompass` · Region: `us-east-1` · Auto-deploy: enabled)

---

## Deployment Summary

1. Prepared CareCompass for production: Express serves the Vite build, seeds SQLite on startup, listens on `PORT`/`0.0.0.0`, health check at `/api/health`.
2. Added `apprunner.yaml` and production build/start commands.
3. Created a new public GitHub repository and pushed the CareCompass codebase (separate from App #1).
4. Re-authenticated AWS CLI (`aws login`).
5. Created a **new** App Runner service `carecompass` connected to the GitHub repo via the existing GitHub connection (`claimclear-github`).
6. Configured Node.js 22 build (`npm install` backend/frontend + `npm run build`), start (`npm start --prefix backend`), port `8080`, free-tier-friendly instance size (1 vCPU / 2 GB), and automatic deployments.
7. Verified service reaches **RUNNING** and the public URL loads.

---

## Screenshots Checklist (capture with date/time visible)

1. Browser open to **https://a3bb2ztgm5.us-east-1.awsapprunner.com** showing CareCompass UI  
2. AWS App Runner console listing **both** services as Running (e.g. `claimclear-ai-app` and `carecompass`)  
3. GitHub repository page: https://github.com/AbdulWajid277/carecompass  

---

## How This Deployment Was Faster/Easier Than App #1

- Reused an existing AWS account login pattern and GitHub App Runner connection instead of creating infrastructure from scratch.
- Started with a clearer full-stack layout and a single deployable Node service (API + built React UI).
- Used one scripted App Runner create with known-good settings from lessons learned (health check path, env vars, auto-deploy).
- AI handled repo creation, production server changes, and AWS CLI commands, so less manual console clicking.

---

## Challenges and How AI Helped

1. **AWS session expired** — AI prompted `aws login` and continued after re-auth.  
2. **Full-stack (not SPA-only)** — AI adapted the server to serve `frontend/dist` in production so one App Runner service is enough.  
3. **App #1 used ECR images** — AI still followed the assignment path (GitHub source + auto-deploy) using the available GitHub connection.  
4. **Native SQLite module** — kept `better-sqlite3` with Linux-compatible install during App Runner build; seed-on-startup ensures demo data exists on a fresh instance.

---

## Both App Runner Services

| Service | URL | Role |
|---------|-----|------|
| claimclear-ai-app (App #1) | https://trwi9izm63.us-east-1.awsapprunner.com | First workshop app |
| carecompass (App #2) | https://a3bb2ztgm5.us-east-1.awsapprunner.com | CareCompass |

---

## Demo Accounts (live)

- User: `maria@example.com` / `password123`  
- Admin: `admin@carecompass.org` / `admin123`
