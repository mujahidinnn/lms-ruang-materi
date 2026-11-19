#!/usr/bin/env python3
"""Lean class deck from a JSON spec, in the look of the other class decks.
Usage: python scripts/deck-simple.py <spec.json> <out.pptx>
spec: {"theme": <key in deck-themes.json>, "deck": "Nama kelas", "kicker": "KELAS", "subtitle": "...",
       "slides": [{"title": "...", "kicker": "BAGIAN", "bullets": ["..."], "code": "...", "note": "..."}]}
Slide 1 is always the cover (title + subtitle); each slide may have bullets (max 5,
~90 chars each), code (monospace block, max ~12 lines), or both, plus a dark note bar.
Slide order and count are fixed: chapter slide_from/slide_to in the draft point at them."""
import json, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
import deck_theme as DT

spec = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
T = DT.load(spec["theme"])
C = RGBColor.from_string
INK, GREEN, CARD, LINE, GREY, WHITE = T.ink, T.accent, T.card, T.line, T.grey, C("FFFFFF")
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def shape(s, kind, x, y, w, h, color):
    r = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    r.fill.solid(); r.fill.fore_color.rgb = color; r.line.fill.background()
    return r


def rect(s, x, y, w, h, color):
    return shape(s, MSO_SHAPE.RECTANGLE, x, y, w, h, color)


def card(s, x, y, w, h, color=CARD):
    r = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, color)
    r.adjustments[0] = 0.07
    return r


def text(s, x, y, w, h, lines, size, bold=False, color=INK, gap=6, anchor=MSO_ANCHOR.TOP, font="Calibri", spc=None):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run(); r.text = ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = font
        if spc: r._r.get_or_add_rPr().set("spc", str(spc))
        p.space_after = Pt(gap)
    return tb


def base(n, title, kicker):
    s = prs.slides.add_slide(BLANK)
    text(s, 0.6, 0.34, 10, 0.3, kicker, 11, True, GREEN, gap=0, spc=250)
    text(s, 0.6, 0.68, 11.0, 0.8, title, round(32 * T.scale), True, gap=0, font=T.font)
    shape(s, MSO_SHAPE.OVAL, 12.1, 0.3, 0.62, 0.62, INK)
    text(s, 12.1, 0.3, 0.62, 0.62, str(n), 14, True, GREEN, gap=0, anchor=MSO_ANCHOR.MIDDLE, font=T.font).text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    text(s, 0.6, 7.03, 8, 0.25, spec["deck"], 10, color=GREY, gap=0)
    return s


def cover(sl):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 13.333, 7.5, INK)
    DT.motif(s, shape, rect, T)
    text(s, 0.8, 2.1, 7, 0.3, spec.get("kicker", "KELAS"), 12, True, T.amber, gap=0, spc=300)
    text(s, 0.8, 2.55, 7.2, 2.2, sl["title"], round(48 * T.scale), True, WHITE, gap=0, font=T.font)
    text(s, 0.8, 5.0, 6.8, 1.2, spec.get("subtitle", ""), 18, False, C("CBD5E1"), gap=0)


def content(n, sl):
    s = base(n, sl["title"], sl.get("kicker", spec.get("kicker", "KELAS")))
    bullets, code, note = sl.get("bullets", []), sl.get("code"), sl.get("note")
    top, bottom = 1.8, (5.9 if note else 6.75)
    if bullets and code:
        card(s, 0.6, top, 5.6, bottom - top)
        for i, b in enumerate(bullets):
            shape(s, MSO_SHAPE.OVAL, 0.9, top + 0.38 + i * 0.86, 0.14, 0.14, GREEN)
            text(s, 1.2, top + 0.25 + i * 0.86, 4.8, 0.8, b, 16, gap=0)
        cx, cw = 6.45, 6.25
    elif bullets:
        card(s, 0.6, top, 12.1, bottom - top)
        step = min(0.95, (bottom - top - 0.4) / max(len(bullets), 1))
        for i, b in enumerate(bullets):
            shape(s, MSO_SHAPE.OVAL, 0.95, top + 0.42 + i * step, 0.16, 0.16, GREEN)
            text(s, 1.3, top + 0.28 + i * step, 11.1, step, b, 19, gap=0)
        cx = None
    else:
        cx, cw = 0.6, 12.1
    if code:
        w = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, cx, top, cw, bottom - top, INK); w.adjustments[0] = 0.04
        size = 15 if len(code.splitlines()) <= 9 else 13
        text(s, cx + 0.3, top + 0.25, cw - 0.6, bottom - top - 0.4, code.splitlines(), size, False, C("E2E8F0"), gap=2, font="DejaVu Sans Mono")
    if note:
        card(s, 0.6, 6.0, 12.1, 0.8, INK)
        text(s, 0.9, 6.0, 11.5, 0.8, note, 14, False, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE)


for i, sl in enumerate(spec["slides"], 1):
    cover(sl) if i == 1 else content(i, sl)
prs.save(OUT)
print(f"{len(spec['slides'])} slides -> {OUT}")
