# CareCompass — Testing & Security Report
**Workshop Assignment: Secure, Reliable, and Responsible Design**  
**Application:** CareCompass  
**Project path:** `D:\Projects\carecompass`  
**Date:** August 9, 2026

---

## 1. Complete Testing Checklist

| # | Feature / Button | Normal input | Invalid / edge input | Result | Notes |
|---|------------------|--------------|----------------------|--------|-------|
| 1 | Home hero — Search resources | Click CTA | N/A | PASS | Routes to `/search` |
| 2 | Home hero — Ask the AI guide | Click CTA | N/A | PASS | Routes to `/assistant` |
| 3 | Nav — Find help | Click | N/A | PASS | Active state shown |
| 4 | Nav — AI guide | Click | N/A | PASS | |
| 5 | Nav — Sign in / Register | Click | N/A | PASS | |
| 6 | Nav — Favorites (signed in) | Click | Signed out redirect message | PASS | Added during hardening |
| 7 | Nav — Dashboard (admin) | Click | Non-admin blocked | PASS | Role check works |
| 8 | Nav — Sign out | Click | N/A | PASS | Clears token |
| 9 | Search — keyword | `food pantry` | `'; DROP TABLE resources;--` | PASS | Prepared statements; no crash |
| 10 | Search — category chips | Food, Housing, etc. | Toggle off | PASS | |
| 11 | Search — city filter | Austin | Empty / nonsense city | PASS | Empty list, no crash |
| 12 | Search — language filter | Spanish | Any | PASS | |
| 13 | Resource detail page | Open resource #1 | Invalid id | PASS | 400/404 handled |
| 14 | Save favorite | Signed in | Signed out prompt | PASS | |
| 15 | Favorites list / remove | Remove button | N/A | PASS | |
| 16 | Register form | Valid name/email/password123 | Short password, missing `@` | PASS | Client + server validation |
| 17 | Login form | Demo accounts | Wrong password, blank | PASS | Clear error alerts |
| 18 | AI guide ask | Food help question | `hi`, `<script>alert(1)</script>...` | PASS | Validation + sanitization |
| 19 | AI language toggle | English / Spanish | N/A | PASS | |
| 20 | Admin stats | Admin login | No token → 401 | PASS | |
| 21 | Admin create/edit resource | Valid fields | Missing required / bad URL | PASS | Zod validation |
| 22 | Mobile layout | Narrow viewport | N/A | PASS | Responsive CSS |
| 23 | Keyboard / skip link | Tab + Skip to main | N/A | PASS | Focus rings + skip link |
| 24 | Unknown route | `/does-not-exist` | N/A | PASS | Friendly 404 page |
| 25 | API offline handling | Stop API briefly | N/A | PASS | Friendly network error message |

**Automated smoke tests:** `node deliverables/security-testing/run-tests.mjs` → **13 passed, 0 failed**.

---

## 2. Bugs Found and Fixed

1. **Missing Favorites UI** — API supported favorites, but users had no page to view/remove them.  
   **Fix:** Added `/favorites` page + nav link for signed-in users.

2. **Weak frontend crash recovery** — Uncaught React errors could blank the UI.  
   **Fix:** Added a global `ErrorBoundary` with reload/home recovery.

3. **Network failures showed generic errors** — Fetch failures were unclear.  
   **Fix:** `api.js` now detects offline/unreachable API and shows an actionable message.

4. **Login form prefilled credentials** — Demo email/password were auto-filled (bad security habit).  
   **Fix:** Fields start empty; demo accounts shown as text only.

5. **Unknown URLs had no UI fallback** — Bad routes fell through silently.  
   **Fix:** Added a catch-all 404 route.

6. **Admin create/update lacked try/catch** — Unexpected DB errors could bubble poorly.  
   **Fix:** Wrapped admin write routes with error handling via `next(err)`.

7. **Password policy too weak for new accounts** — Only minimum length was enforced.  
   **Fix:** New registrations require letter + number (client and server).

---

## 3. Security Vulnerabilities Identified and Resolved

| Issue | Risk | Resolution |
|-------|------|------------|
| Default/weak JWT secret warning | Token forgery if deployed as-is | Stronger local secret + startup length check + warning for default values |
| Missing security headers | Clickjacking / sniffing risks | Added `helmet` |
| No auth rate limiting | Brute-force login/register | Added `authLimiter` (30 / 15 min) + global API limiter |
| Oversized JSON bodies | DoS via large payloads | Reduced body limit to `100kb`; 413 handling |
| Open CORS trust | Unexpected origins | Strict CORS allow-list for `CLIENT_ORIGIN` |
| Stored XSS via resource/AI text | Script injection in DB/UI | HTML tag stripping sanitizer on auth/AI/admin inputs |
| SQL injection probes | Data loss / breach | Confirmed parameterized queries; injection-style search test PASS |
| Exposed secrets in repo | Credential leak | `.env` gitignored; `.env.example` has placeholders only; no real OpenAI key stored |
| Admin endpoints without auth | Privilege escalation | Already JWT + role guarded; re-tested 401 without token |
| Verbose errors in production | Info disclosure | Error handler hides internal details when `NODE_ENV=production` |
| `X-Powered-By` header | Fingerprinting | Disabled via security middleware |

**Responsible AI controls verified:**
- Retrieval-first answers from verified resource records
- Eligibility disclaimer required in responses
- Source / last-verified emphasis in assistant design
- AI input length limits + rate limiting
- No eligibility “decisions” claimed by the system

---

## 4. Accessibility Features Added / Confirmed

- Skip link to `#main`
- Semantic landmarks (`header`, `nav`, `main`, `footer`)
- Visible `:focus-visible` outlines for keyboard users
- `aria-label` on brand/home link; `aria-invalid` / `role="alert"` on forms
- `aria-live` regions for assistant and status messages
- `prefers-reduced-motion` support
- Clear language and high-contrast brand palette
- Keyboard-reachable buttons/links throughout primary flows

---

## 5. Security Checklist (Measures in Place)

- [x] Secrets kept in `.env` (not committed)
- [x] Passwords hashed with bcrypt (cost factor 12 for new users)
- [x] JWT authentication with expiration
- [x] Role-based access for admin/volunteer dashboard
- [x] Input validation (Zod) on auth, AI, admin APIs
- [x] Input sanitization (HTML/control-character stripping)
- [x] Parameterized SQL (no string-concat queries)
- [x] Helmet security headers
- [x] Rate limiting (auth + AI + global API)
- [x] CORS allow-list
- [x] Request size limits
- [x] Centralized Express error handler
- [x] React error boundary
- [x] Responsible AI disclaimers + retrieval grounding
- [x] Automated security/feature smoke tests

---

## 6. How to Re-run Tests Locally

```bash
# Terminal 1
cd D:\Projects\carecompass\backend
npm run start

# Terminal 2
cd D:\Projects\carecompass\frontend
npm run dev

# Terminal 3
node D:\Projects\carecompass\deliverables\security-testing\run-tests.mjs
```

App: http://localhost:5173 · API: http://localhost:4000/api/health
