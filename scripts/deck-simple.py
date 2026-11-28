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


# ---------- 20. Nuxt: Vue single-file component tags ----------
class Sfc(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.1, 0.5

    def tag(self, s, x, y, t, col, size=14):
        text(s, x, y, 8, 0.35, t, size, True, col, font=MONO, gap=0)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        self.tag(s, 0.9, 0.9, "<template>", T.accent, 16)
        text(s, 1.4, 1.6, 7.3, 1.6, sl["title"], 72, True, WHITE, gap=0, font=self.head)
        text(s, 1.4, 3.3, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        self.tag(s, 1.4, 4.7, "<NuxtPage />", T.amber, 15)
        self.tag(s, 0.9, 5.4, "</template>", T.accent, 16)
        oval(s, 8.9, 1.6, 3.4, 3.4, mix(T.ink, T.accent, 0.2))
        logo(s, "accent", 9.45, 2.15, 2.3)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "-", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("-")
        self.tag(s, 0.6, 0.38, f'<template>  <!-- pages/{k}.vue -->', T.accent, 12)
        self.title(s, 0.6, 0.8, 11, sl["title"])
        logo(s, "accent", 12.05, 0.35, 0.65)
        self.tag(s, 0.6, 6.62, "</template>", T.accent, 12)
        rect(s, 0.68, 1.75, 0.03, 4.8, T.light)
        return (0.95, 1.85, 11.75, 4.7)

    def foot(self, s, n, sl):
        text(s, 3.0, 7.03, 7, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def mark(self, s, x, cy, i): poly(s, [(x, cy + 0.1), (x + 0.11, cy - 0.1), (x + 0.22, cy + 0.1)], T.accent, 2.5, close=True)
    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("DCFCE7"), gap=2, font=MONO)


# ---------- 21. Redis: redis-cli prompt and numbered replies ----------
class Cli(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.7
    dark = True

    @property
    def bg(self): return T.ink

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        rect(s, 0, H - 0.25, W, 0.25, T.accent)
        text(s, 0.9, 0.9, 9, 0.4, "127.0.0.1:6379> PING", 16, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 1.35, 9, 0.4, "PONG", 16, color=SLATE, font=MONO, gap=0)
        text(s, 0.9, 2.1, 7.5, 1.6, sl["title"], 76, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.8, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 5.4, 9, 0.4, '127.0.0.1:6379> GET kelas:redis', 15, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 5.85, 9, 0.4, '"siap dipelajari"', 15, color=SLATE, font=MONO, gap=0)
        rrect(s, 8.9, 1.6, 3.4, 3.4, T.accent, adj=0.15)
        logo(s, "white", 9.5, 2.2, 2.2)

    def chrome(self, s, n, sl):
        k = re.sub(r"[^a-z0-9]+", "_", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("_")
        text(s, 0.6, 0.4, 10, 0.35, f"127.0.0.1:6379> HGETALL slide:{n}:{k}", 13, color=T.amber, font=MONO, gap=0)
        self.title(s, 0.6, 0.85, 11, sl["title"], color=WHITE)
        logo(s, "white", 12.1, 0.4, 0.6)
        return (0.6, 1.95, 12.1, 4.85)

    def note(self, s, note, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.accent, adj=0.12)
        text(s, x + 0.3, y, w - 0.6, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)

    def mark(self, s, x, cy, i):
        text(s, x, cy - 0.2, 0.7, 0.4, f"{i + 1})", 15, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.deep)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, mix(T.ink, BLACK, 0.35), line=T.deep, adj=0.04)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("FDE2DF"), gap=2, font=MONO)


# ---------- 22. REST: HTTP response line, status-code chips ----------
class Http(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.95
    CODES = ("200", "201", "204", "400", "404", "422", "429")

    def chip(self, s, x, y, code, w=0.75, h=0.36, size=12):
        ok = code.startswith("2")
        rrect(s, x, y, w, h, T.light if ok else T.card, line=None if ok else T.line, lw=1, adj=0.35)
        text(s, x, y, w, h, code, size, True, T.accent if ok else T.grey, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 0.9, 9, 0.4, "GET /v1/kelas/desain-rest-api HTTP/1.1", 15, color=SLATE, font=MONO, gap=0)
        text(s, 0.9, 1.35, 9, 0.4, "HTTP/1.1 200 OK", 15, True, T.amber, font=MONO, gap=0)
        text(s, 0.9, 2.0, 7.6, 2.4, sl["title"], 60, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.25, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        for k, code in enumerate(self.CODES[:5]):
            x = 0.9 + k * 0.95
            rrect(s, x, 5.6, 0.8, 0.4, T.accent if code.startswith("2") else T.deep, adj=0.35)
            text(s, x, 5.6, 0.8, 0.4, code, 13, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        oval(s, 8.9, 1.6, 3.4, 3.4, mix(T.ink, T.accent, 0.3))
        logo(s, "white", 9.5, 2.2, 2.2)

    def chrome(self, s, n, sl):
        text(s, 0.6, 0.4, 9, 0.35, f"HTTP/1.1 200 OK  ·  slide {n}", 12, True, T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.8, 11, sl["title"])
        logo(s, "accent", 12.05, 0.35, 0.65)
        rect(s, 0.6, 1.72, 12.1, 0.02, T.line)
        return (0.6, 1.95, 12.1, 4.85)

    # Plain numbers: a status code beside a bullet would read as that bullet's code.
    def mark(self, s, x, cy, i): self.chip(s, x, cy - 0.18, f"[{i + 1}]")
    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x, y, w, 0.45, T.deep)
        text(s, x + 0.3, y, w - 0.6, 0.45, "application/json", 11, color=SLATE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.65, w - 0.6, h - 0.8, lines, sz, color=C("EDE9FE"), gap=2, font=MONO)


# ---------- 23. Deep learning: layers of neurons ----------
class Network(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.1, 0.55

    def net(self, s, x, y, w, h, node, edge, r=0.22, layers=(3, 4, 4, 2)):
        cols = [[(x + i * w / (len(layers) - 1), y + (j + 0.5) * h / n) for j in range(n)] for i, n in enumerate(layers)]
        for a, b in zip(cols, cols[1:]):
            for p in a:
                for q in b: poly(s, [p, q], edge, 0.75)
        for i, col in enumerate(cols):
            for (cx, cy) in col: oval(s, cx - r / 2, cy - r / 2, r, r, node if i in (0, len(cols) - 1) else WHITE, line=node, lw=1.5)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 1.0, 8, 0.4, "loss.backward()", 16, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 1.7, 7.4, 2.4, sl["title"], 58, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.2, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        self.net(s, 8.5, 1.3, 3.8, 4.4, T.accent, T.mid, r=0.32)
        logo(s, "white", 0.9, 5.7, 0.8)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).capitalize()
        text(s, 0.6, 0.42, 8, 0.3, f"Lapisan {n}  ·  {k}", 12, True, T.accent, gap=0)
        self.title(s, 0.6, 0.8, 10.2, sl["title"])
        self.net(s, 11.0, 0.35, 1.6, 1.2, T.accent, T.line, r=0.13, layers=(2, 3, 1))
        return (0.6, 1.95, 12.1, 4.85)

    def mark(self, s, x, cy, i): oval(s, x, cy - 0.11, 0.22, 0.22, WHITE, line=T.accent, lw=2.5)
    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("FDE7E1"), gap=2, font=MONO)


# ---------- 24. GraphQL: schema type blocks ----------
class Schema(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.75

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        text(s, 0.9, 0.9, 9, 0.4, "type Kelas {", 16, True, T.amber, font=MONO, gap=0)
        text(s, 1.4, 1.6, 7.0, 1.6, sl["title"], 70, True, WHITE, gap=0, font=self.head)
        text(s, 1.4, 3.3, 6.4, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 1.4, 4.7, 7, 0.35, "bab: [Bab!]!", 15, color=T.light, font=MONO, gap=0)
        text(s, 0.9, 5.3, 2, 0.4, "}", 16, True, T.amber, font=MONO, gap=0)
        oval(s, 8.9, 1.6, 3.4, 3.4, mix(T.ink, T.accent, 0.3))
        logo(s, "white", 9.5, 2.2, 2.2)

    def chrome(self, s, n, sl):
        k = "".join(w.capitalize() for w in re.split(r"[^A-Za-z0-9]+", sl.get("kicker", spec.get("kicker", "KELAS"))) if w)
        text(s, 0.6, 0.4, 10, 0.35, f"type {k} {{  # slide {n}", 13, True, T.accent, font=MONO, gap=0)
        self.title(s, 1.0, 0.85, 10.6, sl["title"])
        logo(s, "accent", 12.05, 0.35, 0.65)
        text(s, 0.6, 6.55, 1, 0.35, "}", 13, True, T.accent, font=MONO, gap=0)
        return (1.0, 1.95, 11.7, 4.6)

    def mark(self, s, x, cy, i):
        text(s, x, cy - 0.2, 0.75, 0.4, f"f{i + 1}:", 13, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.42
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.card, line=T.line, adj=0.04)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=T.ink, gap=2, font=MONO)


# ---------- 25. Web security: audit report rows ----------
class Audit(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.0, 0.9

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        for k in range(0, 14): rect(s, 0, 0.3 + k * 0.52, 0.12, 0.26, T.accent if k % 3 == 0 else T.deep)
        text(s, 0.9, 0.9, 9, 0.4, "LAPORAN AUDIT  ·  RAHASIA", 14, True, T.amber, font=MONO, gap=0, spc=200)
        text(s, 0.9, 1.6, 7.6, 2.4, sl["title"], 58, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.9, 6.6, 1.2, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        for k, (lv, c) in enumerate((("TINGGI", T.accent), ("SEDANG", T.mid), ("RENDAH", T.deep))):
            rrect(s, 0.9 + k * 1.45, 5.5, 1.3, 0.38, c, adj=0.3)
            text(s, 0.9 + k * 1.45, 5.5, 1.3, 0.38, lv, 11, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        oval(s, 8.9, 1.6, 3.4, 3.4, WHITE)
        logo(s, "ink", 9.45, 2.15, 2.3)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).upper()
        text(s, 0.6, 0.4, 10, 0.35, f"TEMUAN #{n:02d}  ·  {k}", 12, True, T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.8, 11, sl["title"])
        logo(s, "ink", 12.05, 0.35, 0.65)
        rect(s, 0.6, 1.72, 12.1, 0.03, T.ink)
        return (0.6, 1.95, 12.1, 4.85)

    def mark(self, s, x, cy, i):
        rrect(s, x, cy - 0.16, 0.7, 0.32, T.light, adj=0.3)
        text(s, x, cy - 0.16, 0.7, 0.32, f"{i + 1:02d}", 11, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x, y + 0.2, 0.08, h - 0.4, T.accent)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.35, y + 0.25, w - 0.6, h - 0.4, lines, sz, color=C("F5E8D3"), gap=2, font=MONO)


# ---------- 31. Astro: islands of JS in a sea of static HTML, frontmatter fences ----------
class Island(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.3, 0.5
    ORANGE = C("FF5D01")

    def fence(self, s, x, y, code, size=12, dark=False):
        text(s, x, y, 0.5, 0.3, "---", size, True, self.ORANGE, font=MONO, gap=0)
        text(s, x + 0.55, y, 8, 0.3, code, size, color=SLATE if dark else T.grey, font=MONO, gap=0)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        sea = mix(T.ink, "FFFFFF", 0.08)
        for bx, by, bw in ((7.9, 1.0, 2.4), (10.5, 1.0, 1.9), (7.9, 5.1, 1.5), (9.6, 5.1, 2.8), (7.9, 5.9, 4.5)):
            rrect(s, bx, by, bw, 0.5, sea, adj=0.3)
        for k in range(8):  # static HTML lines
            rrect(s, 7.9, 1.8 + k * 0.4, 0.5 + (k * 37 % 5) * 0.2, 0.12, sea, adj=0.5)
        oval(s, 9.3, 1.75, 3.1, 3.1, mix(T.ink, T.accent, 0.25), line=T.accent, lw=3)
        logo(s, "white", 10.15, 2.55, 1.4)
        oval(s, 12.1, 1.55, 0.42, 0.42, self.ORANGE)
        oval(s, 9.05, 4.3, 0.3, 0.3, T.accent)
        self.fence(s, 0.9, 1.0, 'const kelas = "Ruang Materi";', 15, True)
        text(s, 0.9, 1.75, 6.6, 1.5, sl["title"], 80, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.35, 6.3, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 4.9, 1, 0.3, "---", 15, True, self.ORANGE, font=MONO, gap=0)
        text(s, 0.9, 5.45, 6, 0.3, "<Island client:visible />", 14, True, T.accent, font=MONO, gap=0)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower()
        self.fence(s, 0.6, 0.32, f'const bagian = "{k}";  ---')
        self.title(s, 0.6, 0.72, 10.8, sl["title"])
        logo(s, "accent", 12.1, 0.32, 0.6)
        rect(s, 0, 6.88, W, 0.62, T.card)
        for k2 in range(3): oval(s, 0.6 + k2 * 0.22, 7.11, 0.12, 0.12, self.ORANGE if k2 == 0 else T.line)
        return (0.6, 1.7, 12.1, 4.95)

    def foot(self, s, n, sl):
        text(s, 1.4, 7.05, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.05, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def rowbg(self, s, x, y, w, h, i):
        rrect(s, x, y + 0.06, w, h - 0.12, T.card, adj=0.25, line=T.line, lw=1)

    def mark(self, s, x, cy, i):
        oval(s, x - 0.04, cy - 0.12, 0.24, 0.24, T.light)
        oval(s, x + 0.02, cy - 0.06, 0.12, 0.12, self.ORANGE if i % 2 == 0 else T.accent)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.44
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x + 0.3, y + 0.18, 0.4, 0.05, self.ORANGE)
        rect(s, x + 0.78, y + 0.18, 0.2, 0.05, T.accent)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.4, w - 0.6, h - 0.5, lines, sz, color=C("EDE4FB"), gap=2, font=MONO)


# ---------- Event-driven: event log with partitions and offsets ----------
class Stream(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.25, 0.62
    AMBER = C("F59E0B")

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        lane = mix(T.ink, "FFFFFF", 0.07)
        hot = {(0, 3): T.accent, (0, 6): self.AMBER, (1, 1): T.accent, (1, 5): T.accent, (2, 2): self.AMBER, (2, 4): T.accent}
        for p in range(3):
            y = 1.55 + p * 1.45
            rrect(s, 7.6, y - 0.12, 5.2, 0.86, mix(T.ink, "FFFFFF", 0.03), adj=0.15)
            text(s, 7.75, y + 0.18, 0.5, 0.3, f"P{p}", 12, True, SLATE, font=MONO, gap=0)
            for k in range(7):
                r = rrect(s, 8.3 + k * 0.6, y, 0.5, 0.62, hot.get((p, k), lane), adj=0.15)
                text(s, 8.3 + k * 0.6, y + 0.16, 0.5, 0.3, str(k), 11, True, WHITE if (p, k) in hot else SLATE, font=MONO, gap=0, align=PP_ALIGN.CENTER)
            cx = 8.3 + (4 + p) % 7 * 0.6 + 0.13
            shape(s, M.ISOSCELES_TRIANGLE, cx, y + 0.72, 0.24, 0.2, self.AMBER)
        logo(s, "white", 12.0, 0.45, 0.75)
        text(s, 0.9, 1.0, 6.4, 0.3, "topic: ruang-materi.kelas.v1", 15, True, self.AMBER, font=MONO, gap=0)
        text(s, 0.9, 1.6, 6.5, 2.2, sl["title"].split(" ", 1), 52, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 3.95, 6.3, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 5.75, 6.4, 0.3, "order.placed -> stock.reserved -> paid", 13, True, T.light, font=MONO, gap=0)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower().replace(" ", "-")
        text(s, 0.6, 0.32, 9, 0.3, f"topic: {k}.v1", 12, True, T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.68, 10.8, sl["title"])
        logo(s, "accent", 12.1, 0.32, 0.6)
        rect(s, 0, 6.88, W, 0.62, T.card)
        for i in range(N):  # offset log doubles as progress
            rect(s, 7.1 + i * 0.14, 7.1, 0.1, 0.18, T.accent if i < n else T.line)
        return (0.6, 1.62, 12.1, 5.05)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.07, 6, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.07, 1.0, 0.25, f"{n} / {N}", 10, True, T.grey, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        rect(s, x, y + 0.06, w, h - 0.12, T.card)
        rect(s, x, y + 0.06, 0.05, h - 0.12, self.AMBER if i % 2 else T.accent)

    def mark(self, s, x, cy, i):
        rrect(s, x - 0.08, cy - 0.15, 0.46, 0.3, T.ink, adj=0.2)
        text(s, x - 0.08, cy - 0.11, 0.46, 0.25, f"{i:02d}", 10, True, WHITE, font=MONO, gap=0, align=PP_ALIGN.CENTER)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.46
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x, y + 0.45, w, 0.02, T.mid)
        text(s, x + 0.3, y + 0.13, 3, 0.25, "message", 11, True, self.AMBER, font=MONO, gap=0)
        for k in range(3): oval(s, x + w - 0.75 + k * 0.18, y + 0.18, 0.11, 0.11, T.accent if k == 0 else T.mid)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.62, w - 0.6, h - 0.7, lines, sz, color=C("E0E7FF"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.light)
        rect(s, x, y, 0.08, h, self.AMBER)
        text(s, x + 0.35, y, w - 0.6, h, note, 14, True, T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


# ---------- Web scraping: DevTools element inspector ----------
class Inspector(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.25, 0.75
    TABS = ("Elements", "Console", "Sources", "Network")

    def dashed(self, r, color, lw=1.5):
        from pptx.enum.dml import MSO_LINE
        r.line.color.rgb = color; r.line.width = Pt(lw); r.line.dash_style = MSO_LINE.DASH
        return r

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        win, bar2 = mix(T.ink, "FFFFFF", 0.07), mix(T.ink, "FFFFFF", 0.14)
        rrect(s, 7.6, 0.9, 5.0, 5.2, win, adj=0.04)
        rrect(s, 7.85, 1.1, 4.5, 0.38, bar2, adj=0.5)
        text(s, 8.05, 1.1, 4.2, 0.38, "books.toscrape.com/catalogue/page-2.html", 10, color=SLATE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        for k in range(8):  # product cards
            cx, cy = 7.9 + (k % 4) * 1.1, 1.8 + (k // 4) * 2.0
            rrect(s, cx, cy, 0.95, 1.75, bar2, adj=0.08)
            rect(s, cx + 0.15, cy + 0.15, 0.65, 0.8, mix(T.ink, T.accent, 0.35 if k == 5 else 0.15))
            rrect(s, cx + 0.12, cy + 1.08, 0.7, 0.1, win, adj=0.5)
            rrect(s, cx + 0.12, cy + 1.3, 0.4, 0.12, T.accent if k == 5 else win, adj=0.5)
        self.dashed(rrect(s, 8.95, 3.72, 1.05, 1.95, None, adj=0.08), T.accent, 2.25)
        rrect(s, 8.25, 5.78, 2.6, 0.38, T.accent, adj=0.3)
        text(s, 8.25, 5.78, 2.6, 0.38, "article.product_pod", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)
        oval(s, 11.35, 4.95, 1.7, 1.7, mix(T.ink, T.accent, 0.3), line=T.accent, lw=2.5)
        logo(s, "white", 11.7, 5.3, 1.0)
        text(s, 0.9, 1.0, 6.4, 0.4, "GET /catalogue/page-2.html  200 OK", 14, True, T.accent, font=MONO, gap=0)
        text(s, 0.9, 1.6, 6.4, 2.6, sl["title"], 54, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.35, 6.2, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 6.0, 6.4, 0.3, 'soup.select("h3 a")', 14, color=mix(T.accent, "FFFFFF", 0.35), font=MONO, gap=0)

    def chrome(self, s, n, sl):
        rect(s, 0, 0, W, 0.44, T.card)
        rect(s, 0, 0.44, W, 0.015, T.line)
        x = 0.6
        for k, t in enumerate(self.TABS):
            w = 0.18 + len(t) * 0.095
            text(s, x, 0.0, w, 0.44, t, 11, k == 0, T.ink if k == 0 else T.grey, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
            if k == 0: rect(s, x, 0.40, w - 0.18, 0.04, T.accent)
            x += w + 0.25
        logo(s, "accent", 12.4, 0.07, 0.3)
        k = re.sub(r"[^a-z0-9]+", "-", sl.get("kicker", spec.get("kicker", "KELAS")).lower()).strip("-")
        text(s, 0.6, 0.66, 11, 0.3, f"body > main > section.{k}", 12, color=T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.98, 11.6, sl["title"])
        return (0.6, 1.95, 12.1, 4.8)

    def foot(self, s, n, sl):
        rect(s, 0, 6.98, W, 0.52, T.card)
        rect(s, 0, 6.98, W, 0.015, T.line)
        text(s, 0.6, 7.1, 8, 0.25, f"{spec['deck']}  |  {n} / {N} requests", 10, color=T.grey, gap=0, font=MONO)
        text(s, 10.2, 7.1, 2.5, 0.25, "200 OK", 10, True, T.accent, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def mark(self, s, x, cy, i):
        text(s, x, cy - 0.15, 0.7, 0.3, "<li>", 12, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i == 0:
            self.dashed(rrect(s, x, y + 0.05, w, h - 0.1, T.light, adj=0.12), T.accent, 1.25)
        else:
            rect(s, x, y + 0.02, w, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.45
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.03)
        rect(s, x + 0.3, y + 0.42, w - 0.6, 0.012, T.deep)
        text(s, x + 0.3, y + 0.08, 2, 0.32, "Response", 11, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        rect(s, x + 0.3, y + 0.38, 0.85, 0.04, T.accent)
        text(s, x + 1.45, y + 0.08, 2, 0.32, "Headers", 11, color=SLATE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.62, w - 0.6, h - 0.75, lines, sz, color=C("F5E6DC"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.12)
        text(s, x + 0.3, y, 0.4, h, ">", 16, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        text(s, x + 0.7, y, w - 1.0, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


# ---------- Ekstensi browser: toolbar + popup panel hanging from the extension icon ----------
class Popup(St):
    head = "Liberation Sans"; body = "Liberation Sans"; tsize = 28; size = 18
    pad, gap = 0.25, 0.75
    HUES = ("DB4437", "F4B400", "0F9D58", "4285F4")

    @property
    def bg(self): return mix(WHITE, T.accent, 0.06)

    def icon(self, s, x, y, badge, dark=False, size=0.5):
        rrect(s, x, y, size, size, T.deep if dark else WHITE, line=None if dark else T.line, lw=1, adj=0.25)
        logo(s, "white" if dark else "accent", x + size * 0.15, y + size * 0.15, size * 0.7)
        if badge:
            bw = 0.18 + 0.1 * len(badge)
            rrect(s, x + size - bw * 0.55, y - 0.1, bw, 0.26, C(self.HUES[0]), adj=0.5)
            text(s, x + size - bw * 0.55, y - 0.1, bw, 0.26, badge, 10, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=self.body)

    def toolbar(self, s, y, dark, badge, label):
        rect(s, 0, y, W, 0.72, T.ink if dark else T.card)
        rect(s, 0, y + 0.72, W, 0.02, T.deep if dark else T.line)
        rrect(s, 0.45, y + 0.17, 0.1 + 0.115 * len(label), 0.38, T.accent, adj=0.5)
        text(s, 0.45, y + 0.17, 0.1 + 0.115 * len(label), 0.38, label, 11, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO, spc=50)
        for k in range(3):  # other extensions, greyed out
            rrect(s, 10.15 + k * 0.62, y + 0.14, 0.44, 0.44, T.deep if dark else T.line, adj=0.25)
        self.icon(s, 12.05, y + 0.11, badge, dark)

    def toggle(self, s, x, cy, on=True):
        rrect(s, x, cy - 0.11, 0.42, 0.22, T.accent if on else T.line, adj=0.5)
        oval(s, x + (0.23 if on else 0.03), cy - 0.08, 0.16, 0.16, WHITE)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        self.toolbar(s, 0, True, "25m", "EKSTENSI")
        for k, hue in enumerate(self.HUES): rect(s, k * W / 4, H - 0.12, W / 4, 0.12, C(hue))
        text(s, 0.9, 1.45, 6.8, 0.35, "chrome://extensions  >  Load unpacked", 14, color=T.amber, font=MONO, gap=0)
        text(s, 0.9, 1.95, 7.3, 1.9, sl["title"], 50, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.2, 6.6, 1.6, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        px, py, pw, ph = 8.55, 1.25, 4.15, 5.3   # popup under the icon
        shape(s, M.ISOSCELES_TRIANGLE, 12.15, py - 0.22, 0.3, 0.24, WHITE)
        rrect(s, px, py, pw, ph, WHITE, adj=0.05)
        text(s, px + 0.35, py + 0.3, 3, 0.35, "FOKUS DULU", 12, True, T.accent, gap=0, font=MONO, spc=80)
        text(s, px + 0.35, py + 0.8, pw - 0.7, 1.2, "25:00", 66, True, T.ink, gap=0, font=self.head)
        for k, (lab, on) in enumerate((("Tutup situs pengganggu", True), ("Notifikasi", True), ("Mode istirahat", False))):
            yy = py + 2.45 + k * 0.6
            text(s, px + 0.35, yy - 0.18, 2.9, 0.36, lab, 13, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)
            self.toggle(s, px + pw - 0.8, yy, on)
            rect(s, px + 0.35, yy + 0.3, pw - 0.7, 0.01, T.line)
        rrect(s, px + 0.35, py + ph - 0.95, pw - 0.7, 0.55, T.accent, adj=0.5)
        text(s, px + 0.35, py + ph - 0.95, pw - 0.7, 0.55, "Mulai fokus", 15, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=self.body)

    def chrome(self, s, n, sl):
        self.toolbar(s, 0, False, str(n), sl.get("kicker", spec.get("kicker", "KELAS")))
        shape(s, M.ISOSCELES_TRIANGLE, 12.15, 0.78, 0.3, 0.2, WHITE)
        rrect(s, 0.45, 0.97, 12.43, 5.9, WHITE, line=T.line, lw=1, adj=0.03)
        self.title(s, 0.85, 1.17, 11.0, sl["title"], h=0.7)
        rect(s, 0.85, 1.9, 0.9, 0.05, T.accent)
        return (0.85, 2.1, 11.65, 4.55)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.03, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.03, 1.0, 0.25, f"{n} / {N}", 10, color=T.grey, gap=0, align=PP_ALIGN.RIGHT)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x, y, w, 0.01, T.line)

    def mark(self, s, x, cy, i): self.toggle(s, x, cy)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.45
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        for k, hue in enumerate(self.HUES): rect(s, x + 0.3 + k * 0.32, y + 0.2, 0.26, 0.05, C(hue))
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.42, w - 0.6, h - 0.5, lines, sz, color=C("E3ECFB"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.light, adj=0.2)
        rect(s, x, y + 0.12, 0.07, h - 0.24, T.accent)
        text(s, x + 0.3, y, w - 0.6, h, note, 14, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


# ---------- WebSocket dan realtime: sequence diagram + chat bubbles ----------
class Wire(St):
    head = "Liberation Sans"; tsize = 30; size = 18
    pad, gap = 0.25, 0.6
    CORAL = C("FF7A59")

    def arrow(self, s, x1, x2, y, label, color):
        rect(s, min(x1, x2), y, abs(x2 - x1), 0.03, color)
        shape(s, M.ISOSCELES_TRIANGLE, (x2 - 0.2) if x2 > x1 else x2, y - 0.09, 0.2, 0.21, color, rot=90 if x2 > x1 else 270)
        text(s, min(x1, x2) + 0.15, y - 0.36, abs(x2 - x1) - 0.3, 0.3, label, 12, True, SLATE, font=MONO, gap=0, align=PP_ALIGN.CENTER)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        a, b = 8.0, 12.1
        for x, name in ((a, "browser"), (b, "server")):
            rrect(s, x - 0.75, 0.75, 1.5, 0.5, mix(T.ink, "FFFFFF", 0.1), adj=0.3)
            text(s, x - 0.75, 0.75, 1.5, 0.5, name, 13, True, WHITE, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
            for k in range(13):  # dashed lifeline
                rect(s, x - 0.015, 1.4 + k * 0.38, 0.03, 0.2, mix(T.ink, "FFFFFF", 0.25))
        steps = (("GET /chat  Upgrade", True, SLATE), ("101 Switching", False, SLATE), ('{"type":"join"}', True, T.accent),
                 ('{"type":"message"}', False, T.accent), ("ping", False, self.CORAL), ("pong", True, self.CORAL))
        for k, (lab, right, col) in enumerate(steps):
            y = 1.95 + k * 0.75
            if right: self.arrow(s, a, b, y, lab, col)
            else: self.arrow(s, b, a, y, lab, col)
        oval(s, b - 0.45, 6.3, 0.9, 0.9, T.accent)
        logo(s, "white", b - 0.3, 6.45, 0.6)
        text(s, 0.9, 1.0, 6, 0.3, "wss://ruangmateri/kelas", 15, True, T.accent, font=MONO, gap=0)
        text(s, 0.9, 1.6, 6.2, 2.6, sl["title"], 50, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.35, 5.9, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        rrect(s, 0.9, 5.95, 1.35, 0.42, T.accent, adj=0.5)
        text(s, 0.9, 5.95, 1.35, 0.42, "OPEN", 13, True, T.ink, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        text(s, 2.45, 5.95, 4.5, 0.42, "readyState === 1", 13, color=SLATE, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower().replace(" ", "-")
        oval(s, 0.6, 0.4, 0.16, 0.16, T.accent)
        text(s, 0.88, 0.33, 9, 0.3, f"OPEN  wss://kelas/{k}", 12, True, T.accent, font=MONO, gap=0)
        self.title(s, 0.6, 0.7, 10.8, sl["title"])
        logo(s, "accent", 12.1, 0.32, 0.6)
        rect(s, 0, 6.88, W, 0.62, T.ink)
        return (0.6, 1.62, 12.1, 5.05)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.07, 6, 0.25, spec["deck"], 10, color=SLATE, gap=0)
        text(s, 10.2, 7.07, 2.5, 0.25, f"frame {n}/{N}", 10, True, T.accent, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def bullets(self, s, items, box, size=None):  # chat bubbles: client rows left, server rows right
        x, y, w, h = box
        step = min(1.0, h / len(items))
        for i, b in enumerate(items):
            yy, srv = y + i * step, i % 2 == 1
            bx, bw = x + (0.5 if srv else 0), w - 0.5
            rrect(s, bx, yy + 0.07, bw, step - 0.14, T.light if srv else T.card, adj=0.3, line=None if srv else T.line, lw=1)
            text(s, bx + self.pad, yy, 0.4, step, "<-" if srv else "->", 13, True, self.CORAL if srv else T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
            text(s, bx + self.pad + self.gap, yy, bw - self.pad - self.gap - 0.2, step, b, size or self.size, color=self.fg, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.46
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        for k, (lab, col) in enumerate((("FIN 1", T.accent), ("op 0x1", T.mid), ("MASK", self.CORAL))):
            rrect(s, x + 0.3 + k * 0.95, y + 0.15, 0.85, 0.3, col, adj=0.4)
            text(s, x + 0.3 + k * 0.95, y + 0.15, 0.85, 0.3, lab, 10, True, WHITE, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.65, w - 0.6, h - 0.75, lines, sz, color=C("DDF7EF"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.3)
        rrect(s, x + 0.25, y + h / 2 - 0.17, 0.7, 0.34, self.CORAL, adj=0.5)
        text(s, x + 0.25, y + h / 2 - 0.17, 0.7, 0.34, "ack", 11, True, WHITE, font=MONO, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        text(s, x + 1.15, y, w - 1.4, h, note, 14, color=WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


# ---------- A/B testing: two variants side by side, bucket bar, CI whiskers ----------
class Variant(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.25, 0.7
    BLUE = C("1C7ED6")

    def ab(self, i): return self.BLUE if i % 2 == 0 else T.accent

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        panel = mix(T.ink, "FFFFFF", 0.06)
        for k, (lab, col, hgt, lo, hi, pct) in enumerate((("A", self.BLUE, 2.1, 1.85, 2.35, "5,00%"), ("B", T.accent, 2.6, 2.3, 2.9, "5,88%"))):
            x = 8.2 + k * 2.3
            rrect(s, x, 1.3, 2.0, 4.3, panel, adj=0.08)
            base = 5.0
            rect(s, x + 0.55, base - hgt, 0.9, hgt, col)
            rect(s, x + 0.98, base - hi, 0.04, hi - lo, WHITE)
            for yy in (base - hi, base - lo): rect(s, x + 0.82, yy - 0.02, 0.36, 0.04, WHITE)
            rect(s, x + 0.25, base, 1.5, 0.03, SLATE)
            text(s, x, 1.45, 2.0, 0.5, lab, 26, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
            text(s, x, 5.1, 2.0, 0.35, pct, 15, True, SLATE, font=MONO, gap=0, align=PP_ALIGN.CENTER)
        for b in range(20):  # hash buckets
            on_b = "10011010110010110100"[b] == "1"
            rrect(s, 8.2 + b * 0.217, 6.0, 0.17, 0.3, T.accent if on_b else self.BLUE, adj=0.2)
        logo(s, "white", 12.25, 0.45, 0.6)
        text(s, 0.9, 1.0, 6.6, 0.3, 'flag("checkout-v2") -> "B"', 15, True, T.light, font=MONO, gap=0)
        text(s, 0.9, 1.6, 6.8, 2.4, sl["title"], 50, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.15, 6.3, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        rrect(s, 0.9, 5.85, 0.5, 0.42, self.BLUE, adj=0.3)
        rrect(s, 1.45, 5.85, 0.5, 0.42, T.accent, adj=0.3)
        text(s, 0.9, 5.92, 0.5, 0.3, "A", 14, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
        text(s, 1.45, 5.92, 0.5, 0.3, "B", 14, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
        text(s, 2.15, 5.92, 5, 0.3, "z = 2,44   p = 0,015", 14, True, SLATE, font=MONO, gap=0)

    def chrome(self, s, n, sl):
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower()
        rrect(s, 0.6, 0.3, 0.32, 0.3, self.BLUE, adj=0.3)
        rrect(s, 0.95, 0.3, 0.32, 0.3, T.accent, adj=0.3)
        text(s, 0.6, 0.33, 0.32, 0.25, "A", 11, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
        text(s, 0.95, 0.33, 0.32, 0.25, "B", 11, True, WHITE, gap=0, align=PP_ALIGN.CENTER)
        text(s, 1.45, 0.33, 9, 0.3, f"eksperimen: {k}", 12, True, T.grey, font=MONO, gap=0)
        self.title(s, 0.6, 0.72, 10.8, sl["title"])
        logo(s, "accent", 12.1, 0.32, 0.6)
        rect(s, 0, 6.88, W, 0.62, T.card)
        x0, w0 = 7.3, 4.2  # 50/50 traffic split doubles as progress
        rect(s, x0, 7.12, w0 / 2, 0.14, self.BLUE)
        rect(s, x0 + w0 / 2, 7.12, w0 / 2, 0.14, T.accent)
        shape(s, M.ISOSCELES_TRIANGLE, x0 + w0 * (n - 1) / (N - 1) - 0.09, 6.93, 0.18, 0.15, T.ink, rot=180)
        return (0.6, 1.7, 12.1, 4.95)

    def foot(self, s, n, sl):
        text(s, 0.6, 7.07, 6, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 11.7, 7.07, 1.0, 0.25, f"{n} / {N}", 10, True, T.grey, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        rrect(s, x, y + 0.06, w, h - 0.12, T.card, adj=0.15, line=T.line, lw=1)

    def mark(self, s, x, cy, i):
        rrect(s, x - 0.06, cy - 0.17, 0.4, 0.34, self.ab(i), adj=0.3)
        text(s, x - 0.06, cy - 0.12, 0.4, 0.25, "AB"[i % 2], 11, True, WHITE, gap=0, align=PP_ALIGN.CENTER)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.45
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.04)
        rect(s, x + 0.3, y + 0.2, 0.45, 0.07, self.BLUE)
        rect(s, x + 0.8, y + 0.2, 0.45, 0.07, T.accent)
        text(s, x + w - 1.5, y + 0.12, 1.2, 0.25, "ab.py", 11, True, SLATE, font=MONO, gap=0, align=PP_ALIGN.RIGHT)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.5, w - 0.6, h - 0.6, lines, sz, color=C("F3E8EE"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.light)
        rect(s, x, y, 0.07, h / 2, self.BLUE)
        rect(s, x, y + h / 2, 0.07, h / 2, T.accent)
        text(s, x + 0.35, y, w - 0.6, h, note, 14, True, T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


# ---------- Pencarian full-text: search engine results page with highlighted hits ----------
class Serp(St):
    head = "Liberation Sans"; tsize = 30; size = 19
    pad, gap = 0.2, 0.75
    MARK = C("FDE047")

    def lens(self, s, x, y, d, color, lw=2.5):
        oval(s, x, y, d, d, None, line=color, lw=lw)
        poly(s, [(x + d * 0.85, y + d * 0.85), (x + d * 1.3, y + d * 1.3)], color, lw + 1)

    def cover(self, s, sl):
        rect(s, 0, 0, W, H, T.ink)
        card, bar2 = mix(T.ink, "FFFFFF", 0.07), mix(T.ink, "FFFFFF", 0.16)
        rrect(s, 7.5, 0.95, 5.2, 0.7, WHITE, adj=0.5)
        self.lens(s, 7.78, 1.12, 0.3, T.accent)
        text(s, 8.35, 0.95, 3.2, 0.7, "lupa sandi kantin", 16, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        rrect(s, 11.55, 1.07, 0.95, 0.46, T.accent, adj=0.5)
        text(s, 11.55, 1.07, 0.95, 0.46, "Cari", 13, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        for k, (hx, hw) in enumerate(((0.55, 0.9), (1.6, 0.75), (0.3, 1.1))):
            y = 2.0 + k * 1.3
            rrect(s, 7.5, y, 5.2, 1.1, card, adj=0.1)
            rrect(s, 7.75, y + 0.2, 2.6 - k * 0.4, 0.16, mix(T.ink, T.accent, 0.6), adj=0.5)
            rrect(s, 7.75, y + 0.52, 4.6, 0.1, bar2, adj=0.5)
            rrect(s, 7.75, y + 0.75, 3.4, 0.1, bar2, adj=0.5)
            rect(s, 7.75 + hx, y + 0.48, hw, 0.18, self.MARK)
            text(s, 12.15, y + 0.15, 0.4, 0.3, f"#{k + 1}", 11, True, SLATE, gap=0, font=MONO)
        oval(s, 11.3, 5.55, 1.4, 1.4, mix(T.ink, T.accent, 0.35), line=T.accent, lw=2.5)
        logo(s, "white", 11.6, 5.85, 0.8)
        text(s, 0.9, 1.0, 6.4, 0.4, "tsv @@ websearch_to_tsquery(...)", 14, True, self.MARK, font=MONO, gap=0)
        text(s, 0.9, 1.6, 6.3, 2.8, sl["title"], 50, True, WHITE, gap=0, font=self.head)
        text(s, 0.9, 4.55, 6.0, 1.4, spec.get("subtitle", ""), 17, color=SLATE, gap=0)
        text(s, 0.9, 6.3, 6.4, 0.3, "ORDER BY ts_rank(tsv, q) DESC", 13, color=mix(T.accent, "FFFFFF", 0.45), font=MONO, gap=0)

    def chrome(self, s, n, sl):
        logo(s, "accent", 0.6, 0.33, 0.5)
        rrect(s, 1.3, 0.3, 9.5, 0.56, WHITE, adj=0.5, line=T.line, lw=1.25)
        self.lens(s, 1.52, 0.47, 0.18, T.grey, 1.75)
        k = sl.get("kicker", spec.get("kicker", "KELAS")).lower()
        text(s, 1.95, 0.3, 8.6, 0.56, k, 14, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        rrect(s, 10.95, 0.34, 0.95, 0.48, T.accent, adj=0.5)
        text(s, 10.95, 0.34, 0.95, 0.48, "Cari", 12, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        text(s, 1.35, 0.98, 8, 0.25, f"Hasil {n} dari {N} untuk \"{k}\"", 10, color=T.grey, gap=0)
        self.title(s, 0.6, 1.25, 11.8, sl["title"], h=0.7)
        rect(s, 0.6, 1.95, 1.4, 0.07, self.MARK)
        return (0.6, 2.2, 12.1, 4.6)

    def foot(self, s, n, sl):
        rect(s, 0, 6.95, W, 0.012, T.line)
        text(s, 0.6, 7.07, 8, 0.25, spec["deck"], 10, color=T.grey, gap=0)
        text(s, 10.7, 7.07, 2.0, 0.25, f"<  {n} / {N}  >", 10, True, T.accent, gap=0, align=PP_ALIGN.RIGHT, font=MONO)

    def mark(self, s, x, cy, i):
        rect(s, x - 0.05, cy - 0.17, 0.5, 0.34, T.light)
        text(s, x - 0.05, cy - 0.17, 0.5, 0.34, f"{i + 1}", 13, True, T.accent, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, font=MONO)

    def rowbg(self, s, x, y, w, h, i):
        if i: rect(s, x + self.pad + self.gap, y, w - self.pad - self.gap, 0.012, T.line)

    def split(self, box):
        x, y, w, h = box
        a = w * 0.45
        return (x, y, a, h), (x + a + 0.25, y, w - a - 0.25, h)

    def code(self, s, code, box):
        x, y, w, h = box
        rrect(s, x, y, w, h, T.ink, adj=0.03)
        text(s, x + 0.3, y + 0.1, 3, 0.3, "kantin=#", 11, True, self.MARK, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=MONO)
        rect(s, x + 0.3, y + 0.45, w - 0.6, 0.012, T.deep)
        lines = code.splitlines()
        sz = 14 if len(lines) <= 9 and max(map(len, lines)) <= 46 else 12
        text(s, x + 0.3, y + 0.6, w - 0.6, h - 0.7, lines, sz, color=C("F3EBDD"), gap=2, font=MONO)

    def note(self, s, note, box):
        x, y, w, h = box
        rect(s, x, y, w, h, T.light)
        rect(s, x, y, 0.08, h, T.accent)
        text(s, x + 0.35, y, w - 0.6, h, note, 14, color=T.ink, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=self.body)


STYLES = {"search": Serp, "abtest": Variant, "realtime": Wire, "extension": Popup, "scraping": Inspector, "events": Stream,"astro": Island, "dl": Network, "graphql": Schema, "websec": Audit, "nuxt": Sfc, "redis": Cli, "rest": Http, "nextjs": FileTree, "mongodb": Document, "ml": Plot, "laravel": Artisan, "mysql": Console, "php": Browser, "analisis-data": Notebook, "mobile-lanjut": Phone, "flutter": Phone, "autentikasi-api": Keycard, "cicd": Pipeline, "uiux": Artboard,
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
