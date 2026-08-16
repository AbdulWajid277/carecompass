"""Generate CareCompass Development Report PDF with screenshots."""
from pathlib import Path
from fpdf import FPDF

ROOT = Path(r"D:\Projects\carecompass")
OUT = ROOT / "deliverables" / "CareCompass-Development-Report.pdf"
IMG_APP = ROOT / "deliverables" / "screenshot-app-localhost.png"
IMG_IDE = ROOT / "deliverables" / "screenshot-ide-code.png"


class ReportPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(80, 100, 90)
        self.cell(0, 8, "CareCompass Development Report", align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def ensure_space(self, h=40):
        if self.get_y() + h > self.h - self.b_margin:
            self.add_page()

    def section_title(self, text):
        self.ensure_space(30)
        self.set_x(self.l_margin)
        self.ln(3)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(15, 92, 76)
        self.multi_cell(0, 8, text)
        self.ln(1)

    def body(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(30, 40, 36)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def bullet(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(30, 40, 36)
        self.multi_cell(0, 6, f"- {text}")

    def labeled(self, title, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 40, 36)
        self.multi_cell(0, 6, title)
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 11)
        self.multi_cell(0, 6, text)
        self.ln(1)

    def add_image_block(self, path, caption, max_h=100):
        self.ensure_space(max_h + 20)
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(15, 92, 76)
        self.multi_cell(0, 6, caption)
        self.ln(1)
        page_w = self.epw
        self.image(str(path), x=self.l_margin, w=page_w, h=max_h, keep_aspect_ratio=True)
        self.ln(6)


def build():
    pdf = ReportPDF(format="Letter")
    pdf.set_margins(18, 16, 18)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(15, 92, 76)
    pdf.multi_cell(0, 10, "CareCompass - Development Report")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 70, 65)
    meta_lines = [
        "Workshop Assignment: Second Full-Stack Application",
        "Application: CareCompass (Community Resource Navigator)",
        "Project path: D:\\Projects\\carecompass",
        "Use case: Nonprofit community organization - helping people find verified local resources for food, housing, healthcare, employment, transportation, education, and legal support.",
    ]
    for line in meta_lines:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, line)
    pdf.ln(4)

    pdf.section_title("Screenshots (Required Deliverables)")
    pdf.body(
        "The following screenshots show (1) CareCompass running on localhost in the browser and (2) the completed project code open in the Cursor IDE. System date/time is visible in each capture."
    )
    pdf.add_image_block(
        IMG_APP,
        "Screenshot 1: CareCompass running at http://localhost:5173",
        max_h=92,
    )
    pdf.add_page()
    pdf.add_image_block(
        IMG_IDE,
        "Screenshot 2: Project code in Cursor IDE (D:\\Projects\\carecompass)",
        max_h=100,
    )

    pdf.section_title("1. AI Assistant and Prompts Used")
    pdf.body(
        "I built CareCompass with Cursor (AI-powered IDE) using an agentic coding workflow. Instead of writing most of the code by hand, I described the product goals and let the AI generate the project structure, backend, frontend, database seed data, and documentation."
    )
    pdf.body(
        'Main prompt used to start the app: "Build a full-stack web application based on these specifications: [5.2 use case including company/problem, AI solution, technical stack, key features, target users]. Create a complete project with proper folder structure, frontend, backend, database setup, and AI integration. Use the D: drive."'
    )
    pdf.body("Follow-up prompts included:")
    pdf.bullet("Suggest a unique app name (finalized as CareCompass)")
    pdf.bullet("Run the application locally and show how to start the development servers")
    pdf.bullet("Add authentication, admin dashboard, search filters, and AI Q&A")
    pdf.bullet(
        "Organize the project with clean folder structure, professional README, environment variables, and error handling"
    )

    pdf.section_title("2. How This Approach Differed from My First App")
    pdf.body(
        "For App #1, I started coding sooner with looser requirements and tried to solve too many features at once. That led to more trial-and-error, unclear architecture, and slower debugging."
    )
    pdf.body("For App #2 (CareCompass), I applied lessons learned:")
    pdf.bullet(
        "I began with a clearer use case, technical plan, and feature list from Workshop 5.2"
    )
    pdf.bullet(
        "I asked the AI for a full project structure up front (frontend, backend, database, env files, README)"
    )
    pdf.bullet(
        "I requested best practices early: validation, loading/error states, accessibility, and source/disclaimer messaging for AI answers"
    )
    pdf.bullet("I built around a defined MVP instead of adding everything late")
    pdf.body("This made prompting more precise and reduced rework.")

    pdf.section_title("3. Most Helpful AI Prompts")
    pdf.body("These prompts produced the best results:")
    pdf.bullet(
        "Specification-first build prompt - pasting the full 5.2 use case helped Cursor generate a coherent full-stack app."
    )
    pdf.bullet(
        '"Run this application locally for me..." - useful for startup commands, seeding the database, and confirming localhost was working.'
    )
    pdf.bullet(
        '"Build [feature] with error handling and loading states" - improved search, auth forms, and the AI assistant UI.'
    )
    pdf.bullet(
        '"Add input validation to all forms" - strengthened registration/login and admin resource entry.'
    )
    pdf.bullet(
        '"Organize my project with clean folder structure, professional README, environment variables, and error handling" - made the project submission-ready.'
    )
    pdf.bullet(
        '"Fix this error: [paste error]" - fast recovery when scaffolding/tooling issues appeared (for example, Vite template setup on Windows).'
    )

    pdf.section_title("4. Key Features Implemented and How AI Helped")
    features = [
        (
            "User registration / login (JWT)",
            "How AI helped: Generated auth routes, password hashing, protected endpoints, and React auth context.",
        ),
        (
            "Resource search with filters",
            "How AI helped: Created API search logic and a responsive search UI for category, city, and language.",
        ),
        (
            "Resource detail pages",
            "How AI helped: Built eligibility notes, document checklists, contact info, sources, and last-verified dates.",
        ),
        (
            "AI Q&A assistant",
            "How AI helped: Implemented retrieval-first answers from verified records, optional OpenAI support, and safety disclaimers.",
        ),
        (
            "Administrator dashboard",
            "How AI helped: Added stats, resource create/edit forms, and role-based access for admin/volunteer users.",
        ),
        (
            "Local database + seed data",
            "How AI helped: Generated schema, seed script, and demo accounts so the app runs immediately.",
        ),
        (
            "README + .env setup",
            "How AI helped: Produced setup instructions suitable for workshop submission and local development.",
        ),
    ]
    for title, help_text in features:
        pdf.labeled(title, help_text)

    pdf.body(
        "Tech stack delivered: React (Vite) frontend, Node.js/Express backend, SQLite for reliable local development (schema designed to mirror a PostgreSQL-style relational model), and AI integration with a retrieval fallback when no API key is present."
    )

    pdf.section_title("5. Challenges Encountered and How They Were Solved")
    challenges = [
        (
            "1. Disk space on C: drive",
            "Solution: Created the entire project on D:\\Projects\\carecompass as requested.",
        ),
        (
            "2. Initial Vite scaffold did not create a React app correctly",
            "Solution: Asked Cursor to diagnose and rebuild the frontend with React, React Router, and the correct Vite config.",
        ),
        (
            "3. Running a full stack locally (API + UI + database)",
            "Solution: Used AI-guided setup: seed the database, start Express on port 4000, start Vite on port 5173, and verify /api/health plus search/AI endpoints.",
        ),
        (
            "4. Keeping AI answers trustworthy",
            "Solution: Designed the assistant to retrieve verified resources first, cite sources/last-verified dates, and clearly state that CareCompass does not make final eligibility decisions.",
        ),
    ]
    for title, text in challenges:
        pdf.labeled(title, text)

    pdf.section_title("6. Comparison: Building App #1 vs. App #2")
    pdf.body("App #2 was easier and faster overall.")
    pdf.bullet("Clearer requirements meant fewer vague prompts and fewer discarded drafts.")
    pdf.bullet(
        "Better prompting (structure, validation, error handling, README) produced higher-quality output on the first major pass."
    )
    pdf.bullet("Local run instructions were requested earlier, so testing started sooner.")
    pdf.bullet(
        "Reusing lessons from App #1 helped me ask for a complete MVP instead of piecing features together late."
    )
    pdf.body(
        "In short: App #1 taught me how to work with AI coding tools; App #2 showed that stronger planning and better prompts significantly improve speed and quality."
    )

    pdf.section_title("7. Time Spent on Development")
    pdf.body(
        "Approximate total development time for CareCompass: about 3-4 hours, aligned with the workshop's local development window."
    )
    pdf.bullet("Requirements review, naming, and project setup: about 30-45 minutes")
    pdf.bullet(
        "Full-stack generation (API, database, frontend pages, AI assistant): about 1.5-2 hours"
    )
    pdf.bullet(
        "Local testing, fixes, README/env polish, and demo verification: about 45-60 minutes"
    )

    pdf.section_title("Closing Reflection")
    pdf.body(
        "CareCompass demonstrates that an AI coding IDE can generate a complete, locally running full-stack application when given a strong use case and clear quality expectations. The most important improvement from App #1 to App #2 was not only using AI more - it was using AI more intentionally, with better specifications, staged goals, and prompts that asked for structure, validation, and safety from the start."
    )

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
