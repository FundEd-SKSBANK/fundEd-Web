"""
FundEd Project Report — PDF Exporter
Converts FundEd_Project_Report.md into a styled PDF using fpdf2.
Output: FundEd_Project_Report.pdf (in Downloads folder)
"""

import re
import os
from fpdf import FPDF

# ── Paths ────────────────────────────────────────────────────────────────────
REPORT_MD = r"C:\Users\ASUS\.gemini\antigravity\brain\5108d7a8-27e1-4f38-afe7-587fd39f823e\FundEd_Project_Report.md"
OUTPUT_PDF = r"C:\Users\ASUS\Downloads\FundEd_Project_Report.pdf"

# ── Colours (R, G, B) ────────────────────────────────────────────────────────
C_BG        = (7,   7,   7)    # near-black page bg
C_WHITE     = (245, 245, 245)  # body text
C_EMERALD   = (5,  150, 105)   # h1/h2 headings
C_LIME      = (101, 163,  13)  # h3 headings
C_TEAL      = (20, 184, 166)   # h4 headings
C_MUTED     = (156, 163, 175)  # grey text / table header labels
C_BORDER    = (38,  38,  38)   # table borders
C_ROW_ALT   = (18,  18,  18)   # alternating table row
C_CODE_BG   = (24,  24,  27)   # code block bg
C_CODE_FG   = (134, 239, 172)  # code text (light green)
C_ACCENT    = (52,  211, 153)  # inline code, list bullets
C_COVER_BG  = (3,   7,   18)   # cover page dark bg
C_HR        = (39,  39,  42)   # horizontal rule

FONT_FAMILY  = "helvetica"
FONT_MONO    = "courier"

PAGE_W = 210
MARGIN = 18
CONTENT_W = PAGE_W - 2 * MARGIN


class ReportPDF(FPDF):

    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self._in_code_block = False
        self._code_lines = []
        self._in_table = False
        self._table_rows = []
        self._table_header = None

    # ── Page decorations ─────────────────────────────────────────────────────
    def header(self):
        if self.page_no() == 1:
            return  # cover page has its own design
        # Top accent bar
        self.set_fill_color(*C_EMERALD)
        self.rect(0, 0, PAGE_W, 1.2, 'F')
        # Background
        self.set_fill_color(*C_BG)
        self.rect(0, 1.2, PAGE_W, 297, 'F')
        # Small brand label
        self.set_xy(MARGIN, 5)
        self.set_font(FONT_MONO, '', 7)
        self.set_text_color(*C_MUTED)
        self.cell(0, 5, self.safe_text("FundEd — Project Report  |  Classroom OS / SKS DM"), align='L')
        self.set_xy(MARGIN, 5)
        self.cell(CONTENT_W, 5, f"Page {self.page_no()}", align='R')
        self.ln(8)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_fill_color(*C_EMERALD)
        self.rect(0, self.get_y() + 6, PAGE_W, 0.5, 'F')

    # ── Cover page ───────────────────────────────────────────────────────────
    def cover_page(self):
        self.add_page()
        # Full dark background
        self.set_fill_color(*C_COVER_BG)
        self.rect(0, 0, PAGE_W, 297, 'F')

        # Left accent stripe
        self.set_fill_color(*C_EMERALD)
        self.rect(0, 0, 4, 297, 'F')

        # Top gradient band
        self.set_fill_color(5, 46, 22)  # dark emerald
        self.rect(4, 0, PAGE_W - 4, 60, 'F')

        # Logo area dots
        for i, y in enumerate(range(15, 55, 8)):
            self.set_fill_color(*C_EMERALD)
            self.ellipse(PAGE_W - 30 + (i % 3) * 8, y, 5, 5, 'F')

        # FundEd title
        self.set_xy(18, 18)
        self.set_font(FONT_FAMILY, 'B', 42)
        self.set_text_color(*C_EMERALD)
        self.cell(0, 16, "FundEd", ln=True)

        self.set_x(18)
        self.set_font(FONT_FAMILY, '', 13)
        self.set_text_color(*C_WHITE)
        self.cell(0, 7, "Student Payment & Event Management System", ln=True)

        self.set_x(18)
        self.set_font(FONT_MONO, '', 9)
        self.set_text_color(*C_MUTED)
        self.cell(0, 6, "A sub-product of SKS DM  |  Classroom OS", ln=True)

        # Divider
        self.set_draw_color(*C_EMERALD)
        self.set_line_width(0.5)
        self.line(18, 66, PAGE_W - 18, 66)

        # Subtitle card
        self.set_xy(18, 74)
        self.set_fill_color(10, 25, 18)
        self.rect(18, 74, CONTENT_W, 38, 'F')
        self.set_draw_color(*C_EMERALD)
        self.rect(18, 74, CONTENT_W, 38)

        self.set_xy(24, 80)
        self.set_font(FONT_FAMILY, 'B', 11)
        self.set_text_color(*C_EMERALD)
        self.cell(0, 7, "COMPREHENSIVE PROJECT REPORT", ln=True)

        self.set_x(24)
        self.set_font(FONT_FAMILY, '', 9)
        self.set_text_color(200, 200, 200)
        self.multi_cell(CONTENT_W - 12, 6,
            "Complete technical documentation covering architecture, features, "
            "database schema, API design, security, deployment, and design decisions.")

        # Meta info grid
        meta = [
            ("Framework", "Next.js 15 (App Router)"),
            ("Language", "TypeScript"),
            ("Database", "PostgreSQL via Prisma ORM"),
            ("Hosting", "Netlify + Neon"),
            ("Auth", "Custom JWT (jose) + httpOnly Cookies"),
            ("Payments", "Razorpay + QR + Cash"),
        ]

        col_w = CONTENT_W / 2
        start_y = 122
        for i, (label, value) in enumerate(meta):
            col = i % 2
            row = i // 2
            x = MARGIN + col * col_w
            y = start_y + row * 16

            self.set_xy(x, y)
            self.set_fill_color(14, 30, 22)
            self.rect(x, y, col_w - 3, 13, 'F')
            self.set_draw_color(40, 80, 60)
            self.rect(x, y, col_w - 3, 13)

            self.set_xy(x + 3, y + 1.5)
            self.set_font(FONT_MONO, '', 7)
            self.set_text_color(*C_MUTED)
            self.cell(0, 4, label.upper(), ln=True)

            self.set_x(x + 3)
            self.set_font(FONT_FAMILY, 'B', 9)
            self.set_text_color(*C_WHITE)
            self.cell(0, 5, value)

        # Stack badges
        badge_y = 178
        self.set_xy(MARGIN, badge_y)
        self.set_font(FONT_MONO, '', 7.5)
        badges = ["React 19", "Tailwind CSS", "Shadcn UI", "Radix UI", "Prisma", "bcryptjs", "jsPDF", "Recharts", "Razorpay"]
        x_cur = MARGIN
        for badge in badges:
            w = self.get_string_width(badge) + 6
            if x_cur + w > PAGE_W - MARGIN:
                x_cur = MARGIN
                badge_y += 10
            self.set_xy(x_cur, badge_y)
            self.set_fill_color(5, 40, 25)
            self.rect(x_cur, badge_y, w, 7, 'F')
            self.set_draw_color(*C_EMERALD)
            self.rect(x_cur, badge_y, w, 7)
            self.set_text_color(*C_ACCENT)
            self.cell(w, 7, badge, align='C')
            x_cur += w + 3

        # Report date
        self.set_xy(MARGIN, 260)
        self.set_font(FONT_MONO, '', 8)
        self.set_text_color(*C_MUTED)
        self.cell(0, 6, "Generated: 2026-03-31  |  Branch: dev  |  github.com/FundEd-SKSBANK/fundEd-Web")

        # Bottom emerald bar
        self.set_auto_page_break(False)
        self.set_fill_color(*C_EMERALD)
        self.rect(0, 288, PAGE_W, 9, 'F')
        self.set_xy(0, 289)
        self.set_font(FONT_FAMILY, 'B', 8)
        self.set_text_color(255, 255, 255)
        self.cell(PAGE_W, 6, self.safe_text("CONFIDENTIAL — INTERNAL DOCUMENTATION"), align='C')
        self.set_auto_page_break(True, margin=20)

    # ── Content rendering helpers ────────────────────────────────────────────
    def set_bg(self):
        self.set_fill_color(*C_BG)
        self.rect(0, 0, PAGE_W, 297, 'F')

    def render_h1(self, text):
        if self.get_y() > 255:
            self.add_page()
        self.ln(6)
        # Section accent bar
        self.set_fill_color(*C_EMERALD)
        self.rect(MARGIN, self.get_y(), 3, 10, 'F')
        self.set_x(MARGIN + 6)
        self.set_font(FONT_FAMILY, 'B', 18)
        self.set_text_color(*C_EMERALD)
        self.multi_cell(CONTENT_W - 6, 10, text)
        # Underline
        y = self.get_y()
        self.set_draw_color(*C_EMERALD)
        self.set_line_width(0.4)
        self.line(MARGIN, y, MARGIN + CONTENT_W, y)
        self.ln(4)

    def render_h2(self, text):
        if self.get_y() > 255:
            self.add_page()
        self.ln(5)
        self.set_fill_color(*C_EMERALD)
        self.rect(MARGIN, self.get_y(), 2.5, 8, 'F')
        self.set_x(MARGIN + 5)
        self.set_font(FONT_FAMILY, 'B', 14)
        self.set_text_color(*C_EMERALD)
        self.multi_cell(CONTENT_W - 5, 8, text)
        self.ln(2)

    def render_h3(self, text):
        if self.get_y() > 255:
            self.add_page()
        self.ln(4)
        self.set_font(FONT_FAMILY, 'B', 11.5)
        self.set_text_color(*C_LIME)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, 7, text)
        self.ln(1)

    def render_h4(self, text):
        if self.get_y() > 260:
            self.add_page()
        self.ln(3)
        self.set_font(FONT_FAMILY, 'B', 10)
        self.set_text_color(*C_TEAL)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, 6, text)
        self.ln(1)

    def render_blockquote(self, text):
        if self.get_y() > 255:
            self.add_page()
        self.set_fill_color(10, 36, 24)
        y = self.get_y()
        self.rect(MARGIN, y, CONTENT_W, 9, 'F')
        self.set_fill_color(*C_EMERALD)
        self.rect(MARGIN, y, 2, 9, 'F')
        self.set_x(MARGIN + 5)
        self.set_font(FONT_FAMILY, 'I', 9)
        self.set_text_color(*C_ACCENT)
        self.cell(CONTENT_W - 5, 9, text.lstrip('> ').strip())
        self.ln(3)

    def render_hr(self):
        self.ln(3)
        if self.get_y() > 260:
            self.add_page()
        self.set_fill_color(*C_EMERALD)
        self.rect(MARGIN, self.get_y(), CONTENT_W, 0.5, 'F')
        self.ln(5)

    def render_paragraph(self, text):
        # Strip markdown bold/italic/code markers for clean output
        # Bold: **text** or __text__
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'__(.+?)__', r'\1', text)
        # Italic: *text* or _text_
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'_(.+?)_', r'\1', text)
        # Inline code: `code`
        text = re.sub(r'`(.+?)`', r'[\1]', text)
        # Links: [text](url) → text
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)

        if not text.strip():
            return

        self.set_x(MARGIN)
        self.set_font(FONT_FAMILY, '', 9.5)
        self.set_text_color(*C_WHITE)
        self.multi_cell(CONTENT_W, 5.5, text)
        self.ln(1.5)

    def render_bullet(self, text, level=0):
        if self.get_y() > 260:
            self.add_page()
        indent = MARGIN + level * 6
        bw = CONTENT_W - level * 6
        # strip markdown formatting
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'[\1]', text)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'_(.+?)_', r'\1', text)

        # bullet dot
        self.set_fill_color(*C_EMERALD)
        self.ellipse(indent + 1, self.get_y() + 2.2, 1.8, 1.8, 'F')

        self.set_xy(indent + 5, self.get_y())
        self.set_font(FONT_FAMILY, '', 9.5)
        self.set_text_color(*C_WHITE)
        self.multi_cell(bw - 5, 5.2, text)
        self.ln(0.5)

    def start_code_block(self):
        self._in_code_block = True
        self._code_lines = []

    def end_code_block(self):
        self._in_code_block = False
        if not self._code_lines:
            return
        line_h = 4.5
        padding = 4
        block_h = len(self._code_lines) * line_h + padding * 2

        # Check page break
        if self.get_y() + block_h > 270:
            self.add_page()

        y_start = self.get_y()
        self.set_fill_color(*C_CODE_BG)
        self.rect(MARGIN, y_start, CONTENT_W, block_h, 'F')
        self.set_draw_color(50, 50, 60)
        self.set_line_width(0.3)
        self.rect(MARGIN, y_start, CONTENT_W, block_h)

        self.set_y(y_start + padding)
        for line in self._code_lines:
            line = line.rstrip()
            # Truncate very long lines
            max_chars = 95
            if len(line) > max_chars:
                line = line[:max_chars] + '...'
            self.set_x(MARGIN + 4)
            self.set_font(FONT_MONO, '', 7.5)
            self.set_text_color(*C_CODE_FG)
            self.cell(CONTENT_W - 8, line_h, line)
            self.ln(line_h)

        self.set_y(y_start + block_h + 3)

    def render_table(self, rows):
        if not rows:
            return
        self.ln(2)
        col_count = max(len(r) for r in rows)
        if col_count == 0:
            return

        col_w = CONTENT_W / col_count
        row_h = 6.5
        header = rows[0]
        data = rows[1:]  # skip separator row (---) which we filter already

        # Header row
        if self.get_y() + row_h > 260:
            self.add_page()
        self.set_x(MARGIN)
        self.set_fill_color(5, 60, 35)
        self.set_text_color(*C_ACCENT)
        self.set_font(FONT_FAMILY, 'B', 8)
        for i, cell in enumerate(header):
            self.set_x(MARGIN + i * col_w)
            self.cell(col_w, row_h, cell.strip()[:30], border=1, fill=True, align='C')
        self.ln(row_h)

        # Data rows
        for r_idx, row in enumerate(data):
            if self.get_y() + row_h > 260:
                self.add_page()
            bg = C_ROW_ALT if r_idx % 2 == 0 else C_BG
            self.set_fill_color(*bg)
            self.set_text_color(*C_WHITE)
            self.set_font(FONT_FAMILY, '', 8)
            row_start_y = self.get_y()
            self.set_x(MARGIN)
            for i, cell in enumerate(row):
                cell_text = cell.strip()
                cell_text = re.sub(r'\*\*(.+?)\*\*', r'\1', cell_text)
                cell_text = re.sub(r'`(.+?)`', r'[\1]', cell_text)
                self.set_xy(MARGIN + i * col_w, row_start_y)
                self.cell(col_w, row_h, cell_text[:50], border=1, fill=True)
            self.ln(row_h)

        self.ln(3)

    def safe_text(self, txt):
        replacements = {
            "—": "-", "“": '"', "”": '"', "’": "'", "•": "-", "–": "-",
            "┌": "+", "┐": "+", "└": "+", "┘": "+", "│": "|", "─": "-",
            "├": "+", "┤": "+", "┬": "+", "┴": "+", "┼": "+", "▼": "v", "·": "."
        }
        for k, v in replacements.items():
            txt = txt.replace(k, v)
        # remove any remaining non-ascii chars to be totally safe
        return txt.encode('ascii', 'ignore').decode('ascii')

    # ── Main parser ──────────────────────────────────────────────────────────
    def parse_markdown(self, md_path):
        with open(md_path, 'r', encoding='utf-8') as f:
            lines = [self.safe_text(line) for line in f.readlines()]

        i = 0
        pending_table = []

        while i < len(lines):
            line = lines[i].rstrip('\n')

            # ── Code blocks ──────────────────────────────────────────────────
            if line.strip().startswith('```'):
                if self._in_code_block:
                    self.end_code_block()
                else:
                    self.start_code_block()
                i += 1
                continue

            if self._in_code_block:
                self._code_lines.append(line)
                i += 1
                continue

            # ── Flush pending table if no longer in table ─────────────────
            if pending_table and not line.startswith('|'):
                self.render_table(pending_table)
                pending_table = []

            # ── Table rows ───────────────────────────────────────────────────
            if line.startswith('|'):
                cells = [c for c in line.split('|') if c.strip()]
                # Skip separator rows (---|--- pattern)
                if not all(re.match(r'^[-: ]+$', c.strip()) for c in cells):
                    pending_table.append(cells)
                i += 1
                continue

            # ── Headings ─────────────────────────────────────────────────────
            if line.startswith('#### '):
                self.render_h4(line[5:].strip())
            elif line.startswith('### '):
                self.render_h3(line[4:].strip())
            elif line.startswith('## '):
                self.render_h2(line[3:].strip())
            elif line.startswith('# '):
                self.render_h1(line[2:].strip())

            # ── Horizontal rule ───────────────────────────────────────────────
            elif line.strip() in ('---', '***', '___'):
                self.render_hr()

            # ── Blockquote ────────────────────────────────────────────────────
            elif line.startswith('> '):
                self.render_blockquote(line)

            # ── List items ────────────────────────────────────────────────────
            elif re.match(r'^(\s*)[-*+] ', line):
                m = re.match(r'^(\s*)[-*+] (.*)', line)
                level = len(m.group(1)) // 2
                self.render_bullet(m.group(2), level)

            elif re.match(r'^(\s*)\d+\. ', line):
                m = re.match(r'^(\s*)\d+\. (.*)', line)
                level = len(m.group(1)) // 2
                self.render_bullet(m.group(2), level)

            # ── Blank line ────────────────────────────────────────────────────
            elif line.strip() == '':
                self.ln(1.5)

            # ── Regular paragraph ─────────────────────────────────────────────
            else:
                self.render_paragraph(line)

            i += 1

        # Flush any remaining table
        if pending_table:
            self.render_table(pending_table)


# ── Run ─────────────────────────────────────────────────────────────────────
def main():
    print("Building FundEd Project Report PDF...")
    pdf = ReportPDF()

    # Cover page (page 1, no header/footer)
    pdf.cover_page()

    # Content pages
    pdf.add_page()
    pdf.set_bg()
    pdf.parse_markdown(REPORT_MD)

    try:
        pdf.output(OUTPUT_PDF)
        print(f"Done! Saved to: {OUTPUT_PDF}")
    except Exception as e:
        print("ERROR:", str(e))


if __name__ == "__main__":
    main()
