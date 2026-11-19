"""Per-deck look for scripts/deck-*.py: palette, title font, cover motif.
Values live in deck-themes.json (also read by the deck-*-assets.mjs scripts)."""
import json, os
from types import SimpleNamespace
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

_C = RGBColor.from_string


def _mix(a, b, t):
    ra, rb = bytes.fromhex(a), bytes.fromhex(b)
    return RGBColor(*(round(x + (y - x) * t) for x, y in zip(ra, rb)))


def load(key):
    d = json.load(open(os.path.join(os.path.dirname(__file__), "deck-themes.json")))[key]
    return SimpleNamespace(
        ink=_C(d["ink"]), accent=_C(d["accent"]), light=_C(d["accentLight"]), card=_C(d["card"]), line=_C(d["line"]),
        amber=_mix(d["accent"], "FFFFFF", 0.5), deep=_mix(d["ink"], d["accent"], 0.22), mid=_mix(d["ink"], d["accent"], 0.45),
        grey=_C("64748B"), font=d["font"], scale=d["scale"], motif=d["motif"],
    )


def motif(s, shape, rect, T):
    """Cover art behind the round icon (disc at 9.35,2.15, 2.6 wide)."""
    O, R = MSO_SHAPE.OVAL, MSO_SHAPE.ROUNDED_RECTANGLE

    def outline(r, color, w=2.5):
        r.fill.background(); r.line.color.rgb = color; r.line.width = Pt(w)
        return r

    if T.motif == "arcs":
        for d, c in ((5.2, T.deep), (4.2, T.mid), (3.3, T.deep)):
            outline(shape(s, O, 10.65 - d / 2, 3.45 - d / 2, d, d, T.deep), c, 3)
    elif T.motif == "hex":
        H = MSO_SHAPE.HEXAGON
        for i, (dx, dy) in enumerate(((0, 0), (-1.55, -0.9), (1.55, -0.9), (-1.55, 0.9), (1.55, 0.9), (0, -1.8), (0, 1.8))):
            r = shape(s, H, 10.65 + dx - 0.9, 3.45 + dy - 0.78, 1.8, 1.56, T.deep if i else T.mid)
            r.line.color.rgb = T.mid; r.line.width = Pt(2)
    elif T.motif == "grid":
        hot = {(1, 5), (2, 4), (3, 4), (3, 3), (4, 2), (5, 1), (5, 0), (6, 0)}
        for i in range(7):
            for j in range(7):
                r = shape(s, R, 8.8 + j * 0.56, 1.5 + i * 0.56, 0.44, 0.44, T.accent if (i, j) in hot else T.deep)
                r.adjustments[0] = 0.25
    elif T.motif == "terminal":
        w = shape(s, R, 8.3, 1.55, 4.6, 3.9, T.deep); w.adjustments[0] = 0.06
        shape(s, R, 8.3, 1.55, 4.6, 0.5, T.mid).adjustments[0] = 0.3
        for k in range(3):
            shape(s, O, 8.55 + k * 0.28, 1.72, 0.16, 0.16, T.accent if k == 0 else T.ink)
        for k, ww in enumerate((2.2, 3.0, 1.6, 2.6)):
            shape(s, R, 8.6, 2.4 + k * 0.45, ww, 0.14, T.mid).adjustments[0] = 0.5
    elif T.motif == "stack":
        for k, c in enumerate((T.deep, T.mid, T.deep)):
            r = shape(s, R, 8.8 + k * 0.3, 1.5 + k * 1.25, 3.9, 1.05, c); r.adjustments[0] = 0.2
            for m in range(4):
                shape(s, R, 9.05 + k * 0.3 + m * 0.48, 1.75 + k * 1.25, 0.36, 0.55, T.ink)
    elif T.motif == "brackets":
        tb = s.shapes.add_textbox(Inches(8.3), Inches(0.9), Inches(5), Inches(5.2))
        tf = tb.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = "{ }"; r.font.size = Pt(230); r.font.bold = True; r.font.name = T.font; r.font.color.rgb = T.deep
