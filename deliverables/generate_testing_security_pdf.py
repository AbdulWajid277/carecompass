"""Generate Testing & Security Report PDF + Reflection PDF for CareCompass."""
from pathlib import Path
from fpdf import FPDF

ROOT = Path(r"D:\Projects\carecompass")
OUT_DIR = ROOT / "deliverables"
OUT_REPORT = OUT_DIR / "CareCompass-Testing-Security-Report.pdf"
OUT_REFLECTION = OUT_DIR / "CareCompass-Reflection.pdf"


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(80, 100, 90)
        self.cell(0, 8, "CareCompass Testing & Security", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, text):
        self.ln(2)
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(15, 92, 76)
        self.multi_cell(0, 7, text)
        self.ln(1)

    def body(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(30, 40, 36)
        self.multi_cell(0, 5.5, text)
        self.ln(1.5)

    def bullet(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(30, 40, 36)
        self.multi_cell(0, 5.5, f"- {text}")


def build_report():
    pdf = PDF(format="Letter")
    pdf.set_margins(16, 14, 16)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(15, 92, 76)
    pdf.multi_cell(0, 9, "CareCompass - Testing & Security Report")
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(60, 70, 65)
    for line in [
        "Workshop Assignment: Secure, Reliable, and Responsible Design",
        "Application: CareCompass | Path: D:\\Projects\\carecompass | Date: August 9, 2026",
    ]:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5.5, line)
    pdf.ln(2)

    pdf.section_title("1. Complete Testing Checklist (summary)")
    pdf.body(
        "Every major feature and button was tested manually and with an automated API smoke suite "
        "(13/13 passed). Covered flows include home CTAs, navigation, search filters, resource "
        "details, favorites, registration/login (valid and invalid), AI guide (valid/invalid/"
        "hostile input), admin dashboard authorization, mobile layout, keyboard focus, skip link, "
        "unknown routes, and API-offline messaging."
    )
    for item in [
        "Home CTAs and all primary nav links - PASS",
        "Search keyword/category/city/language + detail pages - PASS",
        "Favorites save/list/remove - PASS (UI bug fixed)",
        "Register/Login valid + invalid inputs - PASS",
        "AI guide answers + validation + disclaimer - PASS",
        "Admin stats/create/edit with role checks - PASS",
        "Keyboard focus rings, skip link, 404 page - PASS",
        "SQL-injection-style search and XSS-like AI input - PASS (no crash / sanitized)",
    ]:
        pdf.bullet(item)

    pdf.section_title("2. Bugs Found and Fixed")
    for item in [
        "Missing Favorites UI despite API support - added Favorites page and nav link",
        "React crashes could blank the UI - added ErrorBoundary with recovery",
        "Unclear offline/network errors - api.js now explains API must be on port 4000",
        "Login form prefilled demo passwords - removed autofill; demo text only",
        "Unknown routes had no fallback - added catch-all 404 page",
        "Admin writes lacked robust try/catch - routed through error handler",
        "Weak new-password policy - require letter + number (client and server)",
    ]:
        pdf.bullet(item)

    pdf.section_title("3. Security Vulnerabilities Identified and Resolved")
    for item in [
        "Weak/default JWT secret risk - stronger secret + startup length validation/warnings",
        "Missing security headers - added Helmet; disabled X-Powered-By",
        "Auth brute-force risk - rate limit login/register (30 / 15 min) + global API limit",
        "Large JSON DoS risk - body limit reduced to 100kb with 413 handling",
        "CORS too permissive - allow-list restricted to CLIENT_ORIGIN",
        "Stored XSS risk - sanitize HTML/control chars on auth, AI, and admin inputs",
        "SQL injection probes - confirmed parameterized queries; hostile search test passed",
        "Secret exposure - .env gitignored; example file uses placeholders only",
        "Admin privilege checks re-verified - unauthenticated admin calls return 401",
        "Verbose production errors - hide internals when NODE_ENV=production",
    ]:
        pdf.bullet(item)

    pdf.body(
        "Responsible AI: retrieval-first answers from verified records, eligibility disclaimer, "
        "source/last-verified emphasis, AI rate limits, and input length limits."
    )

    pdf.section_title("4. Accessibility Features")
    for item in [
        "Skip link to main content",
        "Semantic landmarks and labeled navigation",
        "Visible keyboard focus outlines",
        "aria-invalid / role=alert on forms; aria-live status updates",
        "prefers-reduced-motion support",
        "Plain-language content and high-contrast brand styling",
    ]:
        pdf.bullet(item)

    pdf.section_title("5. Security Checklist (in place)")
    for item in [
        "[x] Secrets in .env (not committed)",
        "[x] bcrypt password hashing (cost 12 for new users)",
        "[x] JWT auth with expiration + role-based admin access",
        "[x] Zod validation + text sanitization",
        "[x] Parameterized SQL",
        "[x] Helmet, CORS allow-list, rate limits, request size limits",
        "[x] Central Express error handler + React error boundary",
        "[x] Responsible AI disclaimers and retrieval grounding",
        "[x] Automated smoke tests in deliverables/security-testing/run-tests.mjs",
    ]:
        pdf.bullet(item)

    pdf.section_title("6. Re-run commands")
    for item in [
        "Backend: npm run start (backend folder)",
        "Frontend: npm run dev (frontend folder)",
        "Tests: node deliverables/security-testing/run-tests.mjs",
        "App: http://localhost:5173 | API health: http://localhost:4000/api/health",
    ]:
        pdf.bullet(item)

    pdf.output(str(OUT_REPORT))
    print("Wrote", OUT_REPORT)


def build_reflection():
    pdf = PDF(format="Letter")
    pdf.set_margins(18, 16, 18)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(15, 92, 76)
    pdf.multi_cell(0, 8, "CareCompass - Reflection")
    pdf.ln(2)

    paragraphs = [
        "The most critical bug I found and fixed was that favorites existed in the API but not in the user interface. Users could save a resource from the detail page, yet there was no reliable place to review or remove saved items afterward. That broke an important part of the MVP user flow. I fixed it by adding a Favorites page, wiring it into navigation for signed-in users, and confirming save/list/remove behavior through both manual checks and automated API tests.",
        "The most important security issue resolved was weak request and authentication hardening. Before this pass, the app relied mainly on basic JWT checks and prepared SQL statements, but it lacked strong rate limiting on login/register, Helmet security headers, stricter CORS handling, tighter JSON body limits, and consistent sanitization of user-supplied text. Those gaps increase brute-force and injection risk if the app were exposed beyond a local workshop environment. I addressed them by adding security middleware, sanitizing auth/AI/admin inputs, strengthening password rules for new accounts, using a stronger JWT secret pattern, and verifying that injection-style and script-like inputs no longer crash the system or return unsafe markup.",
        "AI helped significantly with testing and security. Instead of manually inventing every edge case, I asked Cursor to inventory features and buttons, propose a full security audit checklist, implement fixes across frontend and backend files, and generate an automated smoke-test script. That let me validate health, search, auth failures, admin authorization, AI validation, SQL-injection-style queries, and XSS-like prompts quickly and repeatedly after each change.",
        "This process was different from my first app because I tested and secured deliberately, not as an afterthought. In App #1, I focused mostly on getting features to appear. For CareCompass, I used clearer requirements, systematic feature testing, responsible AI checks, and security hardening before calling the work complete. The biggest lesson is that production readiness comes from verifying failure paths - invalid forms, unauthorized access, hostile input, and offline errors - as carefully as the happy path.",
    ]
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(30, 40, 36)
    for para in paragraphs:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, para)
        pdf.ln(3)

    pdf.output(str(OUT_REFLECTION))
    print("Wrote", OUT_REFLECTION)


if __name__ == "__main__":
    build_report()
    build_reflection()
