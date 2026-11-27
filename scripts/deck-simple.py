#!/usr/bin/env python3
"""Class deck from a JSON spec. Every theme in deck-themes.json has its own layout (class below),
so no two class decks look alike; logos are Simple Icons PNGs from scripts/logos (deck-logos.mjs).
Usage: python scripts/deck-simple.py <spec.json> <out.pptx>
spec: {"theme": <key in deck-themes.json>, "deck": "Nama kelas", "kicker": "KELAS", "subtitle": "...",
       "slides": [{"title": "...", "kicker": "BAGIAN", "bullets": ["..."], "code": "...", "note": "..."}]}
Slide 1 is always the cover (title + subtitle); each slide may have bullets (max 5,
~90 chars each), code (monospace block, max ~12 lines), or both, plus a note bar.
Slide order and count are fixed: chapter slide_from/slide_to in the draft point at them."""
import json, math, os, re, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE as M
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
import deck_theme as DT

spec = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
T = DT.load(spec["theme"])
C = RGBColor.from_string
WHITE, BLACK = C("FFFFFF"), C("000000")
SLATE = C("CBD5E1")
W, H = 13.333, 7.5
N = len(spec["slides"])
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(W), Inches(H)
BLANK = prs.slide_layouts[6]
MONO = "DejaVu Sans Mono"


def mix(a, b, t):
    return DT._mix(str(a), str(b), t)


def shape(s, kind, x, y, w, h, fill=None, line=None, lw=1.5, adj=None, rot=0):
    r = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None: r.fill.background()
    else: r.fill.solid(); r.fill.fore_color.rgb = fill
    if line is None: r.line.fill.background()
    else: r.line.color.rgb = line; r.line.width = Pt(lw)
    r.shadow.inherit = False
    if adj is not None: r.adjustments[0] = adj
    if rot: r.rotation = rot
    return r


def rect(s, x, y, w, h, fill=None, **k): return shape(s, M.RECTANGLE, x, y, w, h, fill, **k)
def rrect(s, x, y, w, h, fill=None, adj=0.1, **k): return shape(s, M.ROUNDED_RECTANGLE, x, y, w, h, fill, adj=adj, **k)
def oval(s, x, y, w, h, fill=None, **k): return shape(s, M.OVAL, x, y, w, h, fill, **k)


def text(s, x, y, w, h, lines, size, bold=False, color=None, gap=6, anchor=MSO_ANCHOR.TOP, font="Carlito", spc=None, align=None, italic=False):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if align: p.alignment = align
        r = p.add_run(); r.text = ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic; r.font.name = font
        r.font.color.rgb = color or T.ink
        if spc: r._r.get_or_add_rPr().set("spc", str(spc))
        p.space_after = Pt(gap)
    return tb


def logo(s, tone, x, y, size):
    f = os.path.join(os.path.dirname(__file__), "logos", f"{T.logo}-{tone}-{T.accent_hex}.png")
    s.shapes.add_picture(f, Inches(x), Inches(y), Inches(size), Inches(size))


def poly(s, pts, color, w=3, close=False):
    fb = s.shapes.build_freeform(Inches(pts[0][0]), Inches(pts[0][1]))
    fb.add_line_segments([(Inches(x), Inches(y)) for x, y in pts[1:]], close=close)
    r = fb.convert_to_shape(); r.fill.background(); r.line.color.rgb = color; r.line.width = Pt(w)
    return r


def bar(s, x, y, w, h, color):  # hairline helper
    return rect(s, x, y, w, h, color)


class St:
    """Base layout. A subclass sets colours/fonts and overrides cover(), chrome() and the row hooks."""
    dark = False
    bg = WHITE
    head = "Carlito"      # title font
    body = "Carlito"
    tsize = 30
    size = 19             # bullet size
    pad, gap = 0.3, 0.55  # marker inset and text offset inside a row
    gutter = 0.12         # vertical space between rows

    @property
    def fg(self): return WHITE if self.dark else T.ink
    @property
    def sub(self): return SLATE if self.dark else T.grey

    def page(self):
        s = prs.slides.add_slide(BLANK)
        rect(s, 0, 0, W, H, self.bg)
        return s

    def title(self, s, x, y, w, t, h=0.8, **k):
        return text(s, x, y, w, h, t, k.pop("size", self.tsize), True, k.pop("color", self.fg), gap=0, font=self.head, **k)

    def cover(self, s, sl): raise NotImplementedError
    def chrome(self, s, n, sl): raise NotImplementedError   # returns content box (x, y, w, h)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.03, 8, 0.25, spec["deck"], 10, color=self.sub, gap=0)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=self.sub, gap=0, align=PP_ALIGN.RIGHT)

    def mark(self, s, x, cy, i): oval(s, x, cy - 0.08, 0.16, 0.16, T.accent)
    def rowbg(self, s, x, y, w, h, i): pass

    def bullets(self, s, items, box, size=None):
        x, y, w, h = box
        step = min(1.0, h / len(items))
        for i, b in enumerate(items):
            yy = y + i * step
            self.rowbg(s, x, yy, w, step, i)
            self.mark(s, x + self.pad, yy + step / 2, i)
            text(s, x + self.pad + self.gap, yy, w - self.pad - self.gap - 0.25, step, b, size or self.size, color=self.fg, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink if not self.dark else T.deep, adj=0.12)
        text(s, x + 0.3, y, w - 0.6, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.47
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)


# ---------- 1. Analisis data: Jupyter notebook ----------
class Notebook(St):
    head = "DejaVu Sans"; tsize = 29

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rrect(s, 0.9, 1.2, 11.5, 5.1, T.deep, adj=0.03)
        rrect(s, 0.9, 1.2, 1.9, 5.1, T.ink, adj=0.08)
        text(s, 1.05, 1.5, 1.6, 0.4, "In [1]:", 17, color=T.accent, font=MONO, gap=0)
        text(s, 3.2, 1.55, 6, 0.3, "# " + spec.get("kicker", "KELAS").capitalize(), 14, color=T.amber, font=MONO, gap=0)
        text(s, 3.2, 2.1, 7.4, 2.4, sl["title"], 44, True, WHITE, gap=0, font=self.head)
        text(s, 3.2, 4.6, 7.2, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        logo(s, "white", 10.6, 1.5, 1.4)

    def chrome(self, s, n, sl):
        text(s, 0.45, 0.62, 1.2, 0.3, f"In [{n}]:", 14, color=T.accent, font=MONO, gap=0)
        rect(s, 1.75, 0.5, 0.025, 6.4, T.line)
        text(s, 2.05, 0.4, 8, 0.3, "# " + sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 12, color=T.grey, font=MONO, gap=0)
        self.title(s, 2.05, 0.72, 9.4, sl["title"])
        logo(s, "accent", 12.0, 0.4, 0.7)
        return (2.05, 1.7, 10.6, 5.1)

    def foot(self, s, n, sl): text(s, 2.05, 7.03, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0, font=MONO)

    def mark(self, s, x, cy, i): rect(s, x, cy - 0.03, 0.22, 0.06, T.accent)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.card, line=T.line, adj=0.03)
        rect(s, x, y + 0.1, 0.09, h - 0.2, T.accent)
        lines = code.splitlines()
        text(s, x + 0.35, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=T.ink, gap=2, font=MONO)


# ---------- 2. Mobile: phone mockup, list rows, tab bar ----------
class Phone(St):
    bg = None
    tsize = 30
    pad, gap = 0.25, 0.75

    def page(self):
        s = prs.slides.add_slide(BLANK)
        rect(s, 0, 0, W, H, T.card)
        return s

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rrect(s, 9.0, 0.7, 3.6, 6.1, T.deep, line=T.mid, lw=4, adj=0.12)
        rrect(s, 9.2, 0.9, 3.2, 5.7, mix(T.ink, T.accent, 0.12), adj=0.09)
        rrect(s, 10.20, 1.0, 1.2, 0.2, T.ink, adj=0.5)
        logo(s, "white", 10.15, 1.8, 1.3)
        for k in range(3):
            rrect(s, 9.5, 3.55 + k * 0.9, 2.6, 0.66, T.deep if k else T.accent, adj=0.3)
            oval(s, 9.65, 3.7 + k * 0.9, 0.36, 0.36, T.ink if k else WHITE)
        rrect(s, 0.8, 1.95, 1.9, 0.4, T.accent, adj=0.5)
        text(s, 0.8, 1.95, 1.9, 0.4, spec.get("kicker", "KELAS").capitalize(), 13, True, T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        text(s, 0.8, 2.6, 7.6, 2.4, sl["title"], 46, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 5.1, 7.0, 1.2, spec.get("subtitle", ""), 18, color=SLATE, gap=0)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).capitalize()
        rrect(s, 0.7, 0.4, 0.3 + len(k) * 0.1, 0.34, T.light, adj=0.5)
        text(s, 0.7, 0.4, 0.3 + len(k) * 0.1, 0.34, k, 12, True, T.deep, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        self.title(s, 0.7, 0.88, 10, sl["title"])
        oval(s, 11.9, 0.3, 0.85, 0.85, WHITE, line=T.line)
        logo(s, "accent", 12.07, 0.47, 0.5)
        rrect(s, 5.1, 6.88, 3.1, 0.4, WHITE, line=T.line, adj=0.5)
        for j in range(4):
            oval(s, 5.55 + j * 0.7, 6.98, 0.2, 0.2, T.accent if j == (n - 2) % 4 else T.line)
        return (0.7, 1.75, 11.9, 4.9)

    def foot(self, s, n, sl):
        text(s, 0.7, 7.03, 4, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def mark(self, s, x, cy, i):
        oval(s, x, cy - 0.19, 0.38, 0.38, T.accent); oval(s, x + 0.12, cy - 0.07, 0.14, 0.14, WHITE)

    def rowbg(self, s, x, y, w, h, i): rrect(s, x, y + 0.06, w, h - 0.12, WHITE, line=T.line, adj=0.3)


# ---------- 3. Autentikasi: dark, token band, keys ----------
class Keycard(St):
    dark = True; head = "Liberation Mono"; body = "Carlito"; tsize = 27
    pad, gap = 0.1, 0.9

    @property
    def bg(self): return T.ink

    def band(self, s):
        rect(s, 0, 0, W * 0.4, 0.16, T.accent); rect(s, W * 0.4, 0, W * 0.35, 0.16, T.amber); rect(s, W * 0.75, 0, W * 0.25, 0.16, T.mid)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink); self.band(s)
        rrect(s, 9.6, 1.4, 2.2, 3.0, None, line=T.amber, lw=20, adj=0.5)
        rrect(s, 9.1, 3.2, 3.2, 3.0, T.accent, adj=0.1)
        oval(s, 10.45, 4.2, 0.5, 0.5, T.ink); rect(s, 10.62, 4.6, 0.16, 0.9, T.ink)
        text(s, 0.8, 1.9, 7, 0.3, "// " + spec.get("kicker", "KELAS").lower(), 14, color=T.amber, font="Liberation Mono", gap=0)
        text(s, 0.8, 2.4, 7.8, 2.6, sl["title"], 38, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 5.2, 7.2, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        logo(s, "white", 0.8, 0.6, 0.7)

    def chrome(self, s, n, sl):
        self.band(s)
        text(s, 0.8, 0.45, 8, 0.3, "// " + sl.get("kicker", spec.get("kicker", "KELAS")).lower(), 12, color=T.amber, font="Liberation Mono", gap=0)
        self.title(s, 0.8, 0.85, 10.8, sl["title"])
        logo(s, "white", 12.0, 0.5, 0.7)
        return (0.8, 1.85, 11.9, 4.85)

    def mark(self, s, x, cy, i):
        oval(s, x, cy - 0.15, 0.3, 0.3, None, line=T.accent, lw=3)
        rect(s, x + 0.3, cy - 0.03, 0.3, 0.06, T.accent); rect(s, x + 0.5, cy, 0.05, 0.12, T.accent)

    def rowbg(self, s, x, y, w, h, i): rect(s, x, y + h - 0.02, w, 0.015, T.deep)

    def code(self, s, code, box):
        x, y, w, h = box
        rect(s, x, y, w, h, mix(T.ink, BLACK, 0.45), line=T.accent, lw=1)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=T.light, gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.deep); rect(s, x, y, 0.1, h, T.amber)
        text(s, x + 0.35, y, w - 0.6, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE)


# ---------- 4. CI/CD: pipeline stepper, job cards ----------
class Pipeline(St):
    bg = C("F8FAF3"); tsize = 30; head = "DejaVu Sans"
    pad, gap = 0.3, 0.75

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        logo(s, "white", 10.0, 0.8, 2.4)
        text(s, 0.8, 1.2, 7, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 1.7, 8.2, 2.4, sl["title"], 42, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 3.9, 7.4, 1.0, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        for k, name in enumerate(("build", "test", "deploy")):
            x = 0.8 + k * 3.55
            rrect(s, x, 5.5, 2.6, 0.9, T.accent if k == 2 else T.deep, line=T.mid, adj=0.18)
            text(s, x, 5.5, 2.6, 0.9, ("✓ " if k == 2 else "") + name, 18, True, T.ink if k == 2 else WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font="DejaVu Sans Mono")
            if k < 2: rect(s, x + 2.7, 5.93, 0.75, 0.06, T.mid)

    def chrome(self, s, n, sl):
        act = (n - 2) % 5
        for k in range(5):
            x = 0.75 + k * 1.5
            if k < 4: rect(s, x + 0.17, 0.63, 1.33, 0.05, T.accent if k < act else T.line)
            oval(s, x, 0.48, 0.34, 0.34, T.accent if k <= act else WHITE, line=T.deep if k == act else T.accent, lw=3 if k == act else 1.5)
        text(s, 7.6, 0.5, 4, 0.3, "job: " + sl.get("kicker", spec.get("kicker", "KELAS")).lower(), 13, True, T.deep, gap=0, font="DejaVu Sans Mono")
        self.title(s, 0.6, 1.05, 11, sl["title"])
        logo(s, "accent", 12.0, 0.35, 0.7)
        return (0.6, 1.95, 12.1, 4.75)

    def rowbg(self, s, x, y, w, h, i): rrect(s, x, y + 0.07, w, h - 0.14, WHITE, line=T.line, adj=0.12)

    def mark(self, s, x, cy, i):
        oval(s, x, cy - 0.2, 0.4, 0.4, T.accent)
        text(s, x, cy - 0.2, 0.4, 0.4, "✓", 15, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font="DejaVu Sans")

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x, y + 0.1, w, 0.42, T.deep)
        text(s, x + 0.3, y + 0.1, 3, 0.42, "run", 12, True, T.amber, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.75, w - 0.6, h - 0.9, lines, 15 if len(lines) <= 8 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 5. UI/UX: design-tool artboard ----------
class Artboard(St):
    tsize = 30
    pad, gap = 0.1, 0.55
    SW = ()

    @property
    def bg(self): return mix(WHITE, T.accent, 0.08)

    def handles(self, s, x, y, w, h):
        rect(s, x, y, w, h, WHITE, line=T.accent, lw=1.5)
        for hx, hy in ((x, y), (x + w, y), (x, y + h), (x + w, y + h)):
            rect(s, hx - 0.07, hy - 0.07, 0.14, 0.14, WHITE, line=T.accent, lw=1.5)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, self.bg)
        text(s, 1.4, 0.65, 6, 0.3, spec.get("kicker", "KELAS").capitalize(), 13, True, T.accent, gap=0)
        self.handles(s, 1.4, 1.1, 7.2, 5.4)
        logo(s, "accent", 1.9, 1.5, 1.1)
        text(s, 1.9, 3.0, 6.3, 2.2, sl["title"], 42, True, T.ink, gap=0)
        text(s, 1.9, 5.25, 6.2, 1.0, spec.get("subtitle", ""), 16, color=T.grey, gap=0)
        oval(s, 9.4, 1.2, 3.0, 3.0, T.accent)
        rect(s, 10.9, 3.4, 2.0, 2.0, T.ink)
        shape(s, M.ISOSCELES_TRIANGLE, 9.5, 3.9, 1.9, 1.7, T.mid)
        shape(s, M.ISOSCELES_TRIANGLE, 9.0, 5.7, 0.4, 0.45, T.ink, rot=-25)
        rrect(s, 9.45, 6.05, 0.9, 0.34, T.accent, adj=0.5)
        text(s, 9.45, 6.05, 0.9, 0.34, "Kamu", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)

    def chrome(self, s, n, sl):
        text(s, 0.6, 0.55, 8, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 12, True, T.accent, gap=0)
        self.handles(s, 0.6, 0.95, 12.1, 5.85)
        self.title(s, 1.0, 1.25, 9.8, sl["title"])
        logo(s, "accent", 11.6, 1.2, 0.7)
        rrect(s, 5.2, 6.93, 2.9, 0.38, T.ink, adj=0.5)
        for j in range(5): oval(s, 5.65 + j * 0.55, 7.04, 0.16, 0.16, T.accent if j == n % 5 else T.mid)
        return (1.0, 2.2, 11.3, 4.4)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.05, 4.5, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.05, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def mark(self, s, x, cy, i):
        oval(s, x, cy - 0.15, 0.3, 0.3, (T.accent, T.mid, T.amber, T.deep, T.light)[i % 5], line=T.accent if i % 5 == 4 else None)


# ---------- 6. Basis data: table rows with row ids ----------
class Table(St):
    tsize = 30; head = "Liberation Sans"
    pad, gap = 0.0, 1.15
    gutter = 0

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        for (x, y, w, name, rows) in ((8.2, 1.4, 2.5, "id", 4), (10.5, 3.7, 2.4, "ref", 3)):
            rect(s, x, y, w, 0.55 + rows * 0.5, WHITE)
            rect(s, x, y, w, 0.55, T.accent)
            for r in range(rows):
                rect(s, x + 0.2, y + 0.8 + r * 0.5, w * (0.4 + 0.12 * ((r * 3) % 4)), 0.14, T.line)
                rect(s, x, y + 0.55 + (r + 1) * 0.5 - 0.01, w, 0.012, T.line)
        logo(s, "white", 8.4, 1.43, 0.5)
        poly(s, [(10.7, 2.4), (11.7, 2.4), (11.7, 3.7)], T.amber, 4)
        oval(s, 10.62, 2.32, 0.16, 0.16, T.amber)
        shape(s, M.ISOSCELES_TRIANGLE, 11.58, 3.45, 0.24, 0.26, T.amber, rot=180)
        text(s, 0.8, 1.9, 6, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 2.4, 6.9, 2.4, sl["title"], 44, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 4.9, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)

    def chrome(self, s, n, sl):
        rect(s, 0, 0, W, 1.4, T.ink)
        text(s, 0.6, 0.28, 8, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 12, color=T.amber, gap=0)
        self.title(s, 0.6, 0.62, 10.8, sl["title"], color=WHITE)
        logo(s, "white", 12.0, 0.42, 0.65)
        rect(s, 0.6, 1.75, 12.1, 0.42, T.accent)
        text(s, 0.6, 1.75, 0.8, 0.42, "id", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        text(s, 1.75, 1.75, 4, 0.42, "poin", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        return (0.6, 2.17, 12.1, 4.55)

    def bullets(self, s, items, box, size=None):
        x, y, w, h = box
        step = min(0.95, h / len(items))
        for i, b in enumerate(items):
            yy = y + i * step
            rect(s, x, yy, w, step, T.card if i % 2 == 0 else WHITE, line=T.line, lw=0.75)
            rect(s, x, yy, 0.8, step, T.light, line=T.line, lw=0.75)
            text(s, x, yy, 0.8, step, str(i + 1), 16, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
            text(s, x + self.gap, yy, w - self.gap - 0.25, step, b, size or self.size, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE)

    def code(self, s, code, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.ink)
        rect(s, x, y, w, 0.12, T.accent)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.35, w - 0.6, h - 0.5, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.ink); rect(s, x, y, 0.8, h, T.accent)
        text(s, x, y, 0.8, h, "!", 22, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        text(s, x + 1.15, y, w - 1.4, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE)


# ---------- 7. Kubernetes: dark, node rail, hexagon pods ----------
class Cluster(St):
    dark = True; head = "Liberation Sans"; tsize = 30
    pad, gap = 0.1, 0.65

    @property
    def bg(self): return T.ink

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        cx, cy, R = 10.0, 3.75, 2.55
        oval(s, cx - R, cy - R, 2 * R, 2 * R, None, line=T.mid, lw=3)
        for k in range(7):
            a = 2 * math.pi * k / 7 - math.pi / 2
            px, py = cx + R * math.cos(a), cy + R * math.sin(a)
            shape(s, M.HEXAGON, px - 0.4, py - 0.35, 0.8, 0.7, T.accent if k == 0 else T.deep, line=T.mid, lw=2)
        logo(s, "white", cx - 1.1, cy - 1.1, 2.2)
        text(s, 0.8, 2.0, 7, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 2.5, 6.6, 2.4, sl["title"], 50, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 4.9, 6.4, 1.3, spec.get("subtitle", ""), 17, color=SLATE, gap=0)

    def chrome(self, s, n, sl):
        rect(s, 0, 0, 1.15, H, T.deep)
        logo(s, "white", 0.3, 0.4, 0.55)
        for k in range(3):
            shape(s, M.HEXAGON, 0.32, 1.5 + k * 0.7, 0.52, 0.46, T.accent if k == n % 3 else T.mid)
        text(s, 0, 6.7, 1.15, 0.4, str(n), 16, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
        text(s, 1.7, 0.45, 8, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 12, color=T.amber, gap=0)
        self.title(s, 1.7, 0.8, 10.8, sl["title"])
        return (1.7, 1.85, 10.9, 4.85)

    def foot(self, s, n, sl): text(s, 1.7, 7.03, 8, 0.25, spec["deck"], 10, color=self.sub, gap=0)
    def mark(self, s, x, cy, i): shape(s, M.HEXAGON, x, cy - 0.16, 0.36, 0.32, T.accent)
    def rowbg(self, s, x, y, w, h, i): rect(s, x, y + h - 0.02, w, 0.015, T.deep)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, mix(T.ink, BLACK, 0.4), line=T.accent, lw=1.5, adj=0.03)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 8. Monitoring: dashboard panels ----------
class Dashboard(St):
    dark = True; head = "DejaVu Sans"; tsize = 27
    pad, gap = 0.4, 0.8

    @property
    def bg(self): return T.ink

    def topbar(self, s, n, label):
        rect(s, 0, 0, W, 0.6, T.deep)
        oval(s, 0.6, 0.22, 0.16, 0.16, C("22C55E"))
        text(s, 0.9, 0.15, 7, 0.3, label, 12, True, WHITE, gap=0, font="DejaVu Sans")
        rrect(s, 10.6, 0.13, 1.7, 0.34, T.ink, line=T.mid, adj=0.3)
        text(s, 10.6, 0.13, 1.7, 0.34, "Last 24h", 11, color=SLATE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        logo(s, "accent", 12.45, 0.1, 0.4)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink); self.topbar(s, 1, spec["deck"])
        for (x, y, w, h) in ((7.9, 1.2, 2.55, 2.4), (10.65, 1.2, 2.2, 2.4), (7.9, 3.8, 2.55, 2.5), (10.65, 3.8, 2.2, 2.5)):
            rrect(s, x, y, w, h, T.deep, adj=0.05); rect(s, x, y, w, 0.06, T.accent)
        poly(s, [(8.1, 3.1), (8.6, 2.5), (9.0, 2.8), (9.4, 1.9), (9.8, 2.3), (10.25, 1.6)], T.accent, 4)
        for k, v in enumerate((0.5, 0.8, 0.4, 0.95, 0.6, 0.75)):
            rect(s, 10.9 + k * 0.31, 3.35 - v * 1.7, 0.2, v * 1.7, T.amber if k == 3 else T.mid)
        text(s, 8.1, 4.2, 2.2, 0.8, "99.9%", 34, True, T.accent, gap=0, font="DejaVu Sans")
        text(s, 8.1, 5.0, 2.2, 0.4, "uptime", 13, color=SLATE, gap=0)
        oval(s, 10.95, 4.15, 1.7, 1.7, None, line=T.mid, lw=10)
        oval(s, 11.3, 4.5, 1.0, 1.0, None, line=T.accent, lw=1)
        text(s, 0.8, 1.9, 6, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 2.4, 6.8, 2.6, sl["title"], 42, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 5.0, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)

    def chrome(self, s, n, sl):
        self.topbar(s, n, spec["deck"])
        text(s, 9.3, 0.15, 1.1, 0.3, f"slide {n}", 11, color=SLATE, gap=0, align=PP_ALIGN.RIGHT)
        text(s, 0.6, 0.82, 8, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 12, color=T.amber, gap=0)
        self.title(s, 0.6, 1.15, 12, sl["title"])
        return (0.6, 2.0, 12.1, 4.7)

    def foot(self, s, n, sl): pass

    def rowbg(self, s, x, y, w, h, i):
        rrect(s, x, y + 0.06, w, h - 0.12, T.deep, adj=0.1); rect(s, x, y + 0.14, 0.08, h - 0.28, T.accent if i % 3 else T.amber)

    def mark(self, s, x, cy, i):
        for k, v in enumerate((0.14, 0.26, 0.2)): rect(s, x + k * 0.12, cy + 0.13 - v, 0.08, v, T.accent)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, mix(T.ink, BLACK, 0.4), line=T.mid, adj=0.04); rect(s, x, y, w, 0.06, T.accent)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.3, w - 0.6, h - 0.45, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 9. OOP: UML class box ----------
class Uml(St):
    head = "Caladea"; body = "Carlito"; tsize = 32
    pad, gap = 0.1, 0.55

    @property
    def bg(self): return mix(WHITE, T.accent, 0.06)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        def cls(x, y, w, h, hot=False):
            rect(s, x, y, w, h, T.card, line=WHITE, lw=2)
            rect(s, x, y, w, 0.5, T.accent if hot else T.light, line=WHITE, lw=2)
            for r in range(2): rect(s, x + 0.2, y + 0.75 + r * 0.3, w * (0.6 - 0.2 * r), 0.1, T.line)
        cls(8.7, 0.9, 3.4, 1.6, True); cls(7.5, 4.3, 2.7, 1.5); cls(10.6, 4.3, 2.4, 1.5)
        shape(s, M.ISOSCELES_TRIANGLE, 10.2, 2.5, 0.4, 0.38, T.card, line=WHITE, lw=2)
        for pts in ([(10.4, 2.9), (10.4, 3.6)], [(8.85, 3.6), (11.8, 3.6)], [(8.85, 3.6), (8.85, 4.3)], [(11.8, 3.6), (11.8, 4.3)]):
            poly(s, pts, WHITE, 2)
        logo(s, "white", 8.85, 1.05, 0.38)
        text(s, 0.8, 1.9, 6, 0.3, "«" + spec.get("kicker", "KELAS").lower() + "»", 15, color=T.amber, gap=0, italic=True, font=self.head)
        text(s, 0.8, 2.4, 6.4, 2.6, sl["title"], 44, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 5.0, 6.2, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)

    def chrome(self, s, n, sl):
        rect(s, 0.6, 0.5, 12.1, 1.5, WHITE, line=T.ink, lw=2)
        rect(s, 0.6, 2.0, 12.1, 4.8, WHITE, line=T.ink, lw=2)
        text(s, 0.6, 0.62, 12.1, 0.3, "«" + sl.get("kicker", spec.get("kicker", "KELAS")).lower() + "»", 14, color=T.accent, gap=0, italic=True, align=PP_ALIGN.CENTER, font=self.head)
        self.title(s, 1.6, 1.0, 10.1, sl["title"], align=PP_ALIGN.CENTER)
        logo(s, "accent", 0.85, 0.75, 0.6)
        return (0.95, 2.2, 11.4, 4.4)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.03, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0, italic=True)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def mark(self, s, x, cy, i): text(s, x, cy - 0.2, 0.4, 0.4, "+", 24, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.03)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 10. PostgreSQL: editorial, serif, two columns ----------
class Editorial(St):
    head = "DejaVu Serif"; tsize = 28; size = 20
    pad, gap = 0.0, 0.0

    @property
    def bg(self): return mix(WHITE, T.accent, 0.06)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, WHITE)
        rect(s, 0, 0, 5.6, H, T.accent)
        logo(s, "white", 1.5, 2.45, 2.6)
        text(s, 6.3, 2.0, 6.4, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, color=T.accent, gap=0)
        text(s, 6.3, 2.5, 6.5, 2.4, sl["title"], 46, True, T.ink, gap=0, font=self.head)
        rect(s, 6.3, 4.85, 1.2, 0.05, T.accent)
        text(s, 6.3, 5.15, 6.2, 1.2, spec.get("subtitle", ""), 17, color=T.grey, gap=0)

    def chrome(self, s, n, sl):
        text(s, 0.6, 0.75, 4.2, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 13, color=T.accent, gap=0)
        self.title(s, 0.6, 1.2, 4.1, sl["title"], h=3.2)
        logo(s, "accent", 0.6, 4.9, 0.8)
        text(s, 0.6, 5.85, 3, 1.0, str(n), 54, True, mix(WHITE, T.accent, 0.3), gap=0, font=self.head)
        rect(s, 5.1, 0.7, 0.02, 6.1, T.line)
        return (5.5, 0.9, 7.2, 5.6)

    def foot(self, s, n, sl): text(s, 5.5, 7.03, 7, 0.25, spec["deck"], 10, color=T.grey, gap=0)

    def split(self, box):
        x, y, w, h = box
        a = h * 0.5
        return (x, y, w, a), (x, y + a + 0.2, w, h - a - 0.2)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)
    def mark(self, s, x, cy, i): pass
    def bullets(self, s, items, box, size=None): super().bullets(s, items, box, size)


# ---------- 11. Tailwind: utility chips, pills ----------
class Chips(St):
    head = "Liberation Sans"; tsize = 36; size = 19
    pad, gap = 0.3, 0.75

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        oval(s, 9.0, 0.7, 3.8, 3.8, mix(T.ink, T.accent, 0.5))
        oval(s, 10.7, 3.3, 2.9, 2.9, T.mid)
        oval(s, 8.4, 3.5, 1.7, 1.7, T.deep)
        logo(s, "white", 9.9, 2.0, 2.0)
        text(s, 0.8, 1.9, 6, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 2.4, 7.3, 2.2, sl["title"], 54, True, WHITE, gap=0, font=self.head, spc=-100)
        text(s, 0.8, 4.4, 6.8, 1.0, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        for k, cls in enumerate(("flex", "gap-4", "rounded-xl")):
            x = 0.8 + k * 1.75
            rrect(s, x, 5.7, 0.4 + len(cls) * 0.14, 0.42, T.deep, line=T.accent, adj=0.5)
            text(s, x, 5.7, 0.4 + len(cls) * 0.14, 0.42, cls, 12, True, T.light, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower()
        wd = 0.4 + len(k) * 0.11
        rrect(s, 0.6, 0.45, wd, 0.38, T.light, adj=0.5)
        text(s, 0.6, 0.45, wd, 0.38, k, 12, True, T.deep, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        self.title(s, 0.6, 0.98, 11, sl["title"], spc=-60)
        logo(s, "accent", 12.0, 0.4, 0.75)
        return (0.6, 2.0, 12.1, 4.7)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.03, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        rrect(s, 12.1, 6.98, 0.6, 0.3, T.light, adj=0.5)
        text(s, 12.1, 6.98, 0.6, 0.3, str(n), 11, True, T.deep, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def rowbg(self, s, x, y, w, h, i): rrect(s, x, y + 0.07, w, h - 0.14, T.card if i % 2 == 0 else WHITE, line=T.line, adj=0.5)
    def mark(self, s, x, cy, i): oval(s, x + 0.1, cy - 0.15, 0.3, 0.3, T.accent); oval(s, x + 0.19, cy - 0.06, 0.12, 0.12, WHITE)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, mix(T.ink, BLACK, 0.25), adj=0.05)
        for k, c in enumerate((C("F87171"), C("FBBF24"), C("4ADE80"))): oval(s, x + 0.3 + k * 0.28, y + 0.22, 0.16, 0.16, c)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.65, w - 0.6, h - 0.8, lines, 15 if len(lines) <= 8 else 13, color=T.light, gap=2, font=MONO)


# ---------- 12. Testing: test-runner output ----------
class Test(St):
    head = MONO; tsize = 26; size = 19
    pad, gap = 0.1, 0.6

    @property
    def bg(self): return mix(WHITE, T.accent, 0.05)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rrect(s, 0.8, 1.55, 0.9, 0.42, T.accent, adj=0.15)
        text(s, 0.8, 1.55, 0.9, 0.42, "RUN", 14, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        text(s, 1.9, 1.55, 6, 0.42, "v1.0  " + spec.get("kicker", "KELAS").lower(), 14, color=SLATE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        text(s, 0.8, 2.3, 7.4, 2.6, sl["title"], 40, True, WHITE, gap=0, font=MONO)
        text(s, 0.8, 4.9, 7.0, 1.0, spec.get("subtitle", ""), 16, color=SLATE, gap=0)
        rect(s, 0.8, 6.3, 7.0, 0.2, T.deep); rect(s, 0.8, 6.3, 7.0, 0.2, T.accent)
        oval(s, 9.0, 1.4, 3.8, 3.8, None, line=T.accent, lw=16)
        logo(s, "white", 10.1, 2.1, 1.6)
        text(s, 9.0, 3.8, 3.8, 0.6, "100%", 28, True, WHITE, gap=0, align=PP_ALIGN.CENTER, font=MONO)

    def chrome(self, s, n, sl):
        rrect(s, 0.6, 0.5, 0.9, 0.38, T.accent, adj=0.15)
        text(s, 0.6, 0.5, 0.9, 0.38, "PASS", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower().replace(" ", "-")
        text(s, 1.7, 0.5, 8, 0.38, f"tests/{k}.test", 13, color=T.grey, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        self.title(s, 0.6, 1.05, 11, sl["title"])
        logo(s, "accent", 12.0, 0.4, 0.7)
        self.count = len(sl.get("bullets", []))
        return (0.6, 1.95, 12.1, 4.55)

    def foot(self, s, n, sl):
        k = len(sl.get("bullets", [])) or 1
        rect(s, 0.6, 6.62, 12.1, 0.012, T.line)
        tb = text(s, 0.6, 6.75, 11, 0.3, "Tests:  ", 13, True, T.grey, gap=0, font=MONO)
        p = tb.text_frame.paragraphs[0]
        r = p.add_run(); r.text = f"{k} passed"; r.font.size = Pt(13); r.font.bold = True; r.font.name = MONO; r.font.color.rgb = T.accent
        r = p.add_run(); r.text = f", {k} total    slide {n}/{N}    {spec['deck']}"; r.font.size = Pt(13); r.font.name = MONO; r.font.color.rgb = T.grey

    def mark(self, s, x, cy, i): text(s, x, cy - 0.2, 0.4, 0.4, "✓", 20, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font="DejaVu Sans")
    def rowbg(self, s, x, y, w, h, i): rect(s, x, y + h - 0.02, w, 0.012, T.line)

    def code(self, s, code, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.ink); rect(s, x, y, 0.1, h, T.accent)
        lines = code.splitlines()
        text(s, x + 0.35, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 13. Cloud: sky, clouds, floating cards, service layers ----------
class Sky(St):
    head = "Carlito"; tsize = 32; size = 19
    pad, gap = 0.25, 0.65

    @property
    def bg(self): return mix(WHITE, T.accent, 0.12)

    def clouds(self, s, x, y, k, color):
        for dx, dy, w, h in ((0, 0.35, 1.6, 0.7), (0.5, 0, 1.4, 0.9), (1.1, 0.3, 1.6, 0.75)):
            oval(s, x + dx * k, y + dy * k, w * k, h * k, color)

    def layers(self, s):
        for k, c in enumerate((mix(T.accent, WHITE, 0.55), mix(T.accent, WHITE, 0.25), T.accent)):
            rect(s, 0, H - 0.5 + k * 0.17, W, 0.17, c)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        self.clouds(s, 7.9, 1.3, 2.2, T.deep); self.clouds(s, 9.3, 3.5, 1.4, T.mid)
        logo(s, "white", 9.4, 2.2, 1.6)
        text(s, 0.8, 1.8, 6, 0.3, spec.get("kicker", "KELAS").capitalize(), 14, True, T.amber, gap=0)
        text(s, 0.8, 2.3, 6.9, 2.6, sl["title"], 48, True, WHITE, gap=0, font=self.head)
        text(s, 0.8, 4.9, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        self.layers(s)

    def chrome(self, s, n, sl):
        self.clouds(s, 10.0, 0.05, 0.8, WHITE)
        logo(s, "accent", 11.2, 0.3, 0.6)
        text(s, 0.7, 0.45, 8, 0.3, sl.get("kicker", spec.get("kicker", "KELAS")).capitalize(), 13, True, T.deep, gap=0)
        self.title(s, 0.7, 0.85, 9.5, sl["title"], color=T.ink)
        self.layers(s)
        return (0.7, 1.85, 11.9, 4.8)

    def foot(self, s, n, sl):
        text(s, 0.7, 6.8, 8, 0.25, spec["deck"], 10, color=T.deep, gap=0)
        text(s, 11.6, 6.8, 1.0, 0.25, f"{n} / {N}", 10, color=T.deep, gap=0, align=PP_ALIGN.RIGHT)

    def rowbg(self, s, x, y, w, h, i):
        rrect(s, x + 0.06, y + 0.12, w, h - 0.14, T.line, adj=0.25)
        rrect(s, x, y + 0.06, w, h - 0.14, WHITE, adj=0.25)

    def mark(self, s, x, cy, i): oval(s, x, cy - 0.16, 0.32, 0.32, T.accent)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x + 0.06, y + 0.06, w, h, T.line, adj=0.04)
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, 15 if len(lines) <= 9 else 13, color=C("E2E8F0"), gap=2, font=MONO)


# ---------- 14. PHP: browser window, address bar, page served by the server ----------
class Browser(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.2, 0.6

    @property
    def bg(self): return mix(WHITE, T.accent, 0.07)

    def bar(self, s, x, y, w, url, dark):
        top = T.deep if dark else T.card
        rrect(s, x, y, w, 0.62, top, adj=0.25)
        rect(s, x, y + 0.31, w, 0.31, top)
        for k, c in enumerate((C("F87171"), C("FBBF24"), C("4ADE80"))): oval(s, x + 0.25 + k * 0.27, y + 0.23, 0.16, 0.16, c)
        rrect(s, x + 1.25, y + 0.13, w - 1.55, 0.36, T.ink if dark else WHITE, line=None if dark else T.line, lw=1, adj=0.5)
        text(s, x + 1.45, y + 0.13, w - 2, 0.36, url, 12, color=SLATE if dark else T.grey, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rrect(s, 0.8, 0.75, 11.7, 6.0, mix(T.ink, BLACK, 0.2), adj=0.03)
        self.bar(s, 0.8, 0.75, 11.7, "localhost:8000/index.php", True)
        text(s, 1.4, 1.85, 6, 0.3, "<?php echo", 15, color=T.amber, font=MONO, gap=0)
        text(s, 1.4, 2.35, 7.2, 1.6, sl["title"], 72, True, WHITE, gap=0, font=self.head)
        text(s, 1.4, 4.0, 6.6, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 1.4, 5.85, 6, 0.3, "?>", 15, color=T.amber, font=MONO, gap=0)
        oval(s, 8.9, 2.0, 3.0, 3.0, T.accent)
        logo(s, "white", 9.25, 2.35, 2.3)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "-", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("-")
        self.bar(s, 0.45, 0.3, 12.43, f"localhost:8000/{k}.php", False)
        rect(s, 0.45, 0.92, 12.43, 0.02, T.line)
        self.title(s, 0.6, 1.15, 10.8, sl["title"])
        logo(s, "accent", 12.05, 1.1, 0.65)
        return (0.6, 2.1, 12.1, 4.7)

    def mark(self, s, x, cy, i):
        text(s, x - 0.05, cy - 0.2, 0.5, 0.4, "→", 18, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        sz = 15 if len(lines) <= 9 and max(map(len, lines)) <= 48 else 13
        text(s, x + 0.2, y + 0.25, 0.4, h - 0.4, [str(i + 1) for i in range(len(lines))], sz, color=T.mid, gap=2, font=MONO, align=PP_ALIGN.RIGHT)
        text(s, x + 0.75, y + 0.25, w - 1.0, h - 0.4, lines, sz, color=C("E2E8F0"), gap=2, font=MONO)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.4
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)


# ---------- 15. Laravel: artisan route:list, method badges ----------
class Artisan(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.15, 1.15

    @property
    def bg(self): return mix(WHITE, T.accent, 0.04)

    def badge(self, s, x, y, label, fill, fg, w=0.9, h=0.34, size=11):
        rrect(s, x, y, w, h, fill, adj=0.3)
        text(s, x, y, w, h, label, size, True, fg, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rect(s, 0, 0, 0.18, H, T.accent)
        text(s, 0.9, 1.0, 8, 0.4, "$ php artisan serve", 16, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 1.8, 7.5, 1.6, sl["title"], 72, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.5, 6.8, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        for k, (m, path) in enumerate((("GET", "/"), ("GET", "/produk/{id}"), ("POST", "/produk"), ("PUT", "/produk/{id}"))):
            y = 5.0 + k * 0.42
            self.badge(s, 0.9, y, m, T.accent if m == "GET" else T.mid, WHITE, w=0.8, h=0.3, size=10)
            text(s, 1.85, y, 4, 0.3, path, 13, color=SLATE, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE)
        oval(s, 8.9, 1.6, 3.4, 3.4, mix(T.ink, T.accent, 0.25))
        logo(s, "white", 9.6, 2.3, 2.0)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "-", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("-")
        self.badge(s, 0.6, 0.45, "GET", T.accent, WHITE, w=0.75)
        text(s, 1.5, 0.45, 8, 0.34, f"/{k}", 14, color=T.grey, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE)
        text(s, 9.2, 0.45, 2.6, 0.34, f"slide.{n}", 12, color=T.grey, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.RIGHT)
        self.title(s, 0.6, 1.0, 11, sl["title"])
        logo(s, "accent", 12.05, 0.35, 0.65)
        rect(s, 0.6, 1.85, 12.1, 0.03, T.accent)
        return (0.6, 2.15, 12.1, 4.65)

    def mark(self, s, x, cy, i):
        self.badge(s, x, cy - 0.15, f"{i + 1:02d}", T.light, T.accent, w=0.7, h=0.3, size=11)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x, y + 0.2, 0.08, h - 0.4, T.accent)
        lines = code.splitlines()
        sz = 15 if len(lines) <= 9 and max(map(len, lines)) <= 48 else 13
        text(s, x + 0.4, y + 0.25, w - 0.65, h - 0.4, lines, sz, color=C("F1E4E2"), gap=2, font=MONO)


# ---------- 16. MySQL: mysql> prompt, result grid ----------
class Console(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.85

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 0.9, 9, 0.4, "mysql> SELECT judul FROM kelas;", 16, color=T.amber, font=MONO, gap=0)
        for k, ln in enumerate(("+-----------+", "| judul     |", "+-----------+")):
            text(s, 0.9, 1.4 + k * 0.3, 6, 0.3, ln, 14, color=T.mid, font=MONO, gap=0)
        text(s, 0.9, 2.45, 7.5, 1.6, sl["title"], 72, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.95, 6.8, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 5.5, 6, 0.3, "+-----------+", 14, color=T.mid, font=MONO, gap=0)
        text(s, 0.9, 5.85, 6, 0.3, "1 row in set (0.00 sec)", 14, color=SLATE, font=MONO, gap=0)
        rrect(s, 8.8, 1.5, 3.6, 3.6, T.accent, adj=0.12)
        logo(s, "white", 9.3, 2.0, 2.6)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "_", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("_")
        text(s, 0.6, 0.4, 10, 0.35, f"mysql> USE {k};", 14, color=T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.85, 11, sl["title"])
        logo(s, "accent", 12.05, 0.35, 0.65)
        return (0.6, 1.95, 12.1, 4.85)

    def foot(self, s, n, sl):
        rows = len(sl.get("bullets", []))
        text(s, 0.6, 7.03, 8, 0.25, f"{rows} rows in set" if rows else spec["deck"], 10, color=T.grey, gap=0, font=MONO)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        rect(s, x, y + 0.04, w, h - 0.08, T.card if i % 2 == 0 else WHITE, line=T.line, lw=0.75)
        rect(s, x + 0.65, y + 0.04, 0.012, h - 0.08, T.line)

    def mark(self, s, x, cy, i):
        text(s, x, cy - 0.2, 0.65, 0.4, str(i + 1), 14, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.03)
        lines = code.splitlines()
        sz = 15 if len(lines) <= 9 and max(map(len, lines)) <= 48 else 13
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("DDEFF3"), gap=2, font=MONO)


# ---------- 17. Next.js: app/ file tree beside the page ----------
class FileTree(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.1, 0.5

    def tree(self, s, x, y, seg, dark):
        fg, hi = (SLATE, WHITE) if dark else (T.grey, T.ink)
        rows = [("app/", 0, fg), ("layout.tsx", 1, fg), (f"{seg}/", 1, fg), ("page.tsx", 2, hi)]
        for k, (name, d, col) in enumerate(rows):
            yy = y + k * 0.36
            if k == 3: rrect(s, x + d * 0.28 - 0.1, yy - 0.02, 1.9, 0.34, T.accent if dark else T.light, adj=0.3)
            text(s, x + d * 0.28, yy, 2.4, 0.3, name, 12, k == 3, WHITE if (k == 3 and dark) else col, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        for k in range(14): rect(s, 0, k * 0.55, W, 0.004, mix(T.ink, WHITE, 0.08))
        text(s, 0.9, 1.0, 8, 0.4, "npx create-next-app@latest", 15, color=SLATE, font=MONO, gap=0)
        text(s, 0.9, 1.8, 7.5, 1.6, sl["title"], 72, True, WHITE, gap=0, font=self.head, spc=-200)
        text(s, 0.9, 3.5, 6.8, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        self.tree(s, 0.9, 5.0, "belajar", True)
        oval(s, 8.9, 1.7, 3.4, 3.4, WHITE)
        logo(s, "ink", 9.35, 2.15, 2.5)

    def chrome(self, s, n, sl):
        seg = re.sub(r"[^a-z0-9]+", "-", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("-")
        rect(s, 0, 0, 2.9, H, T.card)
        rect(s, 2.9, 0, 0.012, H, T.line)
        self.tree(s, 0.45, 0.55, seg[:16], False)
        logo(s, "ink", 0.45, 6.15, 0.55)
        self.title(s, 3.3, 0.5, 9.4, sl["title"])
        return (3.3, 1.55, 9.45, 5.25)

    def foot(self, s, n, sl):
        text(s, 3.3, 7.03, 7, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def mark(self, s, x, cy, i): rect(s, x, cy - 0.12, 0.05, 0.24, T.accent)
    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.03)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 44 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("E5E7EB"), gap=2, font=MONO)


# ---------- 18. MongoDB: a document in braces ----------
class Document(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.75

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 0.9, 9, 0.4, 'db.kelas.findOne({ nama: "MongoDB" })', 15, color=T.amber, font=MONO, gap=0)
        text(s, 0.75, 1.5, 0.6, 4.5, "{", 120, color=T.accent, font=MONO, gap=0)
        text(s, 1.6, 2.0, 7.0, 1.6, sl["title"], 68, True, WHITE, gap=0, font=self.head)
        text(s, 1.6, 3.6, 6.4, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 1.6, 4.9, 6, 0.3, '_id: ObjectId("…"),  bab: 9', 13, color=SLATE, font=MONO, gap=0)
        text(s, 0.75, 5.0, 0.6, 1.6, "}", 120, color=T.accent, font=MONO, gap=0)
        oval(s, 8.9, 1.6, 3.4, 3.4, T.accent)
        logo(s, "white", 9.5, 2.2, 2.2)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "_", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("_")
        text(s, 0.6, 0.4, 10, 0.35, f'db.{k}.find({{ slide: {n} }})', 13, color=T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.85, 11, sl["title"])
        logo(s, "accent", 12.1, 0.4, 0.6)
        text(s, 0.45, 1.75, 0.4, 0.5, "{", 26, True, T.accent, font=MONO, gap=0)
        text(s, 0.45, 6.4, 0.4, 0.5, "}", 26, True, T.accent, font=MONO, gap=0)
        return (0.85, 2.0, 11.85, 4.6)

    def mark(self, s, x, cy, i):
        text(s, x, cy - 0.2, 0.7, 0.4, f'"{i + 1}":', 13, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def rowbg(self, s, x, y, w, h, i): rrect(s, x - 0.05, y + 0.05, w, h - 0.1, T.card if i % 2 == 0 else WHITE, adj=0.2)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("D7F5E9"), gap=2, font=MONO)


# ---------- 19. Machine learning: scatter plot and fitted line ----------
class Plot(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.1, 0.55
    PTS = [(0.3, 0.75), (0.8, 0.62), (1.2, 0.66), (1.7, 0.45), (2.1, 0.5), (2.6, 0.3), (3.0, 0.33), (3.4, 0.15)]

    def scatter(self, s, x, y, w, h, dot, line, axis):
        rect(s, x, y + h, w, 0.025, axis); rect(s, x, y, 0.025, h, axis)
        for px, py in self.PTS: oval(s, x + px / 3.6 * w, y + py * h, 0.16, 0.16, dot)
        poly(s, [(x + 0.1, y + 0.82 * h), (x + w - 0.1, y + 0.1 * h)], line, 2.5)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 1.0, 8, 0.4, "model.fit(X, y)", 16, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 1.7, 7.4, 2.4, sl["title"], 58, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.2, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        self.scatter(s, 8.4, 1.4, 4.0, 3.8, T.accent, WHITE, T.mid)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).capitalize()
        text(s, 0.6, 0.42, 8, 0.3, f"{k}  ·  langkah {n}", 12, True, T.accent, gap=0)
        self.title(s, 0.6, 0.8, 10.2, sl["title"])
        self.scatter(s, 11.0, 0.35, 1.6, 1.15, T.accent, T.ink, T.line)
        return (0.6, 1.95, 12.1, 4.85)

    def mark(self, s, x, cy, i): oval(s, x, cy - 0.1, 0.2, 0.2, T.accent)
    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.card, line=T.line, adj=0.03)
        rect(s, x, y + 0.15, 0.07, h - 0.3, T.accent)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.35, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=T.ink, gap=2, font=MONO)


STYLES = {"nextjs": FileTree, "mongodb": Document, "ml": Plot, "laravel": Artisan, "mysql": Console, "php": Browser, "analisis-data": Notebook, "mobile-lanjut": Phone, "autentikasi-api": Keycard, "cicd": Pipeline, "uiux": Artboard,
          "basis-data": Table, "kubernetes": Cluster, "monitoring": Dashboard, "oop": Uml, "postgresql": Editorial,
          "tailwind": Chips, "testing": Test, "cloud": Sky}
st = STYLES[spec["theme"]]()


def content(n, sl):
    s = st.page()
    box = st.chrome(s, n, sl)
    bullets, code, note = sl.get("bullets", []), sl.get("code"), sl.get("note")
    x, y, w, h = box
    if note:
        nh = 0.8
        h -= nh + 0.2
        st.note(s, note, (x, y + h + 0.2, w, nh))
        box = (x, y, w, h)
    if bullets and code:
        a, b = st.split(box)
        st.bullets(s, bullets, a, 16); st.code(s, code, b)
    elif bullets: st.bullets(s, bullets, box)
    elif code: st.code(s, code, box)
    st.foot(s, n, sl)


for i, sl in enumerate(spec["slides"], 1):
    if i == 1: st.cover(st.page(), sl)
    else: content(i, sl)
prs.save(OUT)
print(f"{N} slides -> {OUT}")
