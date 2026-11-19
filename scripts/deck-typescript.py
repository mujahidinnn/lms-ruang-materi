#!/usr/bin/env python3
"""Generate the 24-slide TypeScript support deck, in the style of the other class
decks (white slides, kicker, soft cards, round icons, dark callout bar, own diagrams).
Usage: python scripts/deck-typescript.py <asset-dir> [out.pptx]
<asset-dir> comes from: node scripts/deck-typescript-assets.mjs <asset-dir>
Needs python-pptx. Slide count and order are fixed: chapter slide ranges in the draft point at them."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image
import deck_theme as DT

C = lambda h: RGBColor.from_string(h)
T = DT.load("typescript")
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = T.ink, T.accent, T.amber, T.card, T.grey, C("FFFFFF"), T.line
TITLE_PT = round(32 * T.scale)
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/TypeScript.pptx"
DECK = "TypeScript  |  Ruang Materi"

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


def text(s, x, y, w, h, lines, size, bold=False, color=INK, gap=6, anchor=MSO_ANCHOR.TOP, align=None, font="Calibri", spc=None):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if align: p.alignment = align
        r = p.add_run(); r.text = ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = font
        if spc: r._r.get_or_add_rPr().set("spc", str(spc))
        p.space_after = Pt(gap)
    return tb


def icon(s, name, x, y, d, bg=GREEN):
    shape(s, MSO_SHAPE.OVAL, x, y, d, d, bg)
    k = d * 0.54
    s.shapes.add_picture(os.path.join(ASSET, "icons", name + "-w.png"), Inches(x + (d - k) / 2), Inches(y + (d - k) / 2), Inches(k), Inches(k))


def num(s, x, y, d, label, bg=GREEN, size=18):
    shape(s, MSO_SHAPE.OVAL, x, y, d, d, bg)
    text(s, x, y, d, d, label, size, True, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)


def base(title, n, kicker):
    s = prs.slides.add_slide(BLANK)
    text(s, 0.6, 0.34, 10, 0.3, kicker, 11, True, GREEN, gap=0, spc=250)
    text(s, 0.6, 0.68, 11.0, 0.8, title, TITLE_PT, True, gap=0, font=T.font)
    shape(s, MSO_SHAPE.OVAL, 12.1, 0.3, 0.62, 0.62, INK)
    s.shapes.add_picture(os.path.join(ASSET, "icons", "file-code-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
    text(s, 0.6, 7.03, 8, 0.25, DECK, 10, color=GREY, gap=0)
    text(s, 12.2, 7.03, 0.6, 0.25, str(n), 10, color=GREY, gap=0, align=PP_ALIGN.RIGHT)
    return s


def bar(s, y, msg, ic="lightbulb", label=None):
    card(s, 0.6, y, 12.1, 0.85, INK)
    s.shapes.add_picture(os.path.join(ASSET, "icons", ic + "-k.png"), Inches(0.85), Inches(y + 0.22), Inches(0.42), Inches(0.42))
    r = text(s, 1.5, y, 11.0, 0.85, msg, 14, False, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE)
    if label:
        p = r.text_frame.paragraphs[0]; p.runs[0].text = msg
        first = p.runs[0]; first.text = label + "  "; first.font.bold = True; first.font.color.rgb = AMBER
        rr = p.add_run(); rr.text = msg; rr.font.size = Pt(14); rr.font.color.rgb = WHITE; rr.font.name = "Calibri"


def picture(s, name, x, y, w, h):
    path = os.path.join(ASSET, name + ".png")
    iw, ih = Image.open(path).size
    sc = min((w - 0.3) / iw, (h - 0.3) / ih)
    pw, ph = iw * sc, ih * sc
    card(s, x, y, w, h, WHITE).line.color.rgb = LINE
    s.shapes.add_picture(path, Inches(x + (w - pw) / 2), Inches(y + (h - ph) / 2), Inches(pw), Inches(ph))


# ---- layouts ----
import re

SKY, SUN, MUTE = C("7DD3FC"), C("FCD34D"), C("64748B")
KW = set("const let var function type interface class extends implements return if else switch case default import export from as keyof typeof in is async await new readonly private public protected abstract enum unknown any never void string number boolean true false".split())
TOK = re.compile(r'(//.*$)|("[^"]*"|`[^`]*`)|([A-Za-z_#$][\w$]*)|(\s+|.)')


def code_runs(line):
    runs = []
    for m in TOK.finditer(line):
        com, st, word, other = m.groups()
        if com: runs.append((com, MUTE, False))
        elif st: runs.append((st, SUN, False))
        elif word: runs.append((word, SKY if word in KW else WHITE, word in KW))
        else: runs.append((other, WHITE, False))
    return runs


def L_cards(title, n, k, b, ic, bar_msg, label=None):
    s = base(title, n, k)
    for i, ln in enumerate(b[:4]):
        x, y = 0.6 + (i % 2) * 6.15, 1.85 + (i // 2) * 2.0
        card(s, x, y, 5.95, 1.85)
        icon(s, ic[i], x + 0.3, y + 0.3, 0.7)
        text(s, x + 1.25, y + 0.2, 4.45, 1.45, ln, 16, gap=0, anchor=MSO_ANCHOR.MIDDLE)
    bar(s, 5.95, bar_msg, "lightbulb", label)


def L_steps(title, n, k, b, ic, bar_msg, label=None):
    s = base(title, n, k)
    rect(s, 1.6, 2.37, 9.9, 0.04, LINE)
    for i, ln in enumerate(b[:4]):
        x = 0.6 + i * 3.08
        num(s, x + 1.12, 2.05, 0.65, str(i + 1), GREEN if i < 3 else INK, 20)
        card(s, x, 3.0, 2.9, 2.75, WHITE).line.color.rgb = LINE
        icon(s, ic[i], x + 0.25, 3.2, 0.5, INK)
        text(s, x + 0.25, 3.95, 2.45, 1.7, ln, 15.5, gap=0)
    bar(s, 5.95, bar_msg, "lightbulb", label)


def L_pic(right):
    def f(title, n, k, b, ic, pic, label=None):
        s = base(title, n, k)
        px, tx = (0.6, 6.85) if right else (6.85, 0.6)
        picture(s, pic, px, 1.85, 5.85, 4.9)
        for i, ln in enumerate(b[:4]):
            y = 1.85 + i * 1.25
            rect(s, tx, y + 0.05, 0.07, 1.0, [GREEN, C("0EA5E9"), AMBER, INK][i])
            text(s, tx + 0.3, y, 5.4, 1.1, ln, 15, gap=0, anchor=MSO_ANCHOR.MIDDLE)
    return f


def L_code(title, n, k, b, ic, code, label=None):
    s = base(title, n, k)
    card(s, 0.6, 1.85, 6.3, 4.9, C("0B1220"))
    rect(s, 0.6, 2.2, 6.3, 0.04, C("1E293B"))
    for j, col in enumerate(("EF4444", "F59E0B", "10B981")):
        shape(s, MSO_SHAPE.OVAL, 0.85 + j * 0.27, 2.0, 0.15, 0.15, C(col))
    text(s, 1.85, 1.97, 4.8, 0.25, "contoh.ts", 10, color=MUTE, gap=0, font="DejaVu Sans Mono")
    tb = s.shapes.add_textbox(Inches(0.9), Inches(2.5), Inches(5.8), Inches(4.1)); tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(code.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); p.space_after = Pt(2)
        for t_, col, bold in code_runs(ln) or [("", WHITE, False)]:
            r = p.add_run(); r.text = t_; r.font.size = Pt(12); r.font.name = "DejaVu Sans Mono"; r.font.color.rgb = col; r.font.bold = bold
    for i, ln in enumerate(b[:4]):
        y = 1.85 + i * 1.25
        card(s, 7.15, y, 5.55, 1.1)
        icon(s, ic[i], 7.35, y + 0.25, 0.6)
        text(s, 8.15, y, 4.4, 1.1, ln, 13.5, gap=0, anchor=MSO_ANCHOR.MIDDLE)


# (chapter title, agenda icon, slide A, slide B); a slide is (title, layout, bullets, icons, extra)
CH = [
 ("Mengenal TypeScript", "file-code",
  ("Apa itu TypeScript", "cards", ["JavaScript ditambah sistem tipe statis", "Kesalahan tipe ketahuan di editor, sebelum kode berjalan", "Semua JavaScript valid juga TypeScript valid", "Hasil kompilasi tetap JavaScript biasa"], ["file-code", "bug", "check", "zap"], "Tipe hanya ada saat compile time. Di runtime yang berjalan murni JavaScript."),
  ("Dari .ts ke .js", "pic", ["npm install -D typescript lalu npx tsc --init", "npx tsc memeriksa tipe dan menulis berkas .js", "Node baru bisa menjalankan .ts dengan menghapus tipe", "Pengecekan tipe tetap lewat tsc --noEmit atau editor"], ["terminal", "wrench", "rocket", "search"], "ts-ke-js")),
 ("Tipe Dasar dan Inferensi", "type",
  ("Tipe primitif dan array", "code", ["string, number, boolean, bigint, symbol", "Array ditulis number[] atau Array<number>", "Tuple: panjang dan tipe tiap posisi tetap", "Anotasi paling berguna di batas fungsi"], ["type", "list-checks", "box", "target"], 'const nama: string = "Sari";\nconst nilai: number[] = [80, 90];\nconst pasangan: [string, number] =\n  ["Sari", 17];\n\nnilai.push("seratus");\n// Error: string tidak bisa masuk\n// number[]'),
  ("Inferensi dan tipe khusus", "cards", ["let menyimpulkan string, const menyimpulkan tipe literal", "unknown aman: wajib dipersempit sebelum dipakai", "any mematikan pengecekan, hindari sebisanya", "void untuk tanpa nilai, never untuk tak pernah selesai"], ["sparkles", "lock", "ban", "circle"], "Butuh data yang bentuknya belum pasti? Pilih unknown, bukan any.")),
 ("Fungsi dan Object Bertipe", "braces",
  ("Fungsi bertipe", "code", ["Parameter wajib dianotasi, return boleh disimpulkan", "Parameter opsional memakai ?, default ikut menentukan tipe", "Callback mendapat tipe lewat contextual typing", "Rest parameter bertipe array"], ["braces", "funnel", "refresh-cw", "layers"], 'function sapa(\n  nama: string,\n  salam = "Halo"\n): string {\n  return `${salam}, ${nama}`;\n}\n\nsapa("Sari");   // aman\nsapa(42);       // Error'),
  ("Bentuk object", "steps", ["Tipe object menjelaskan properti dan tipenya", "Properti opsional memakai ?, nilainya bisa undefined", "readonly mencegah penugasan ulang, hanya saat kompilasi", "Index signature untuk kunci dinamis"], ["boxes", "circle", "lock", "key-round"], "TypeScript menilai bentuk, bukan nama tipe (structural typing).")),
 ("Interface dan Type Alias", "layers",
  ("Interface", "code", ["Mendeskripsikan bentuk object dan method", "extends mewarisi bentuk interface lain", "Deklarasi bernama sama digabung (merging)", "Class memakai implements untuk memenuhi kontrak"], ["layers", "git-branch", "puzzle", "clipboard-check"], 'interface Pengguna {\n  id: number;\n  nama: string;\n}\n\ninterface Admin extends Pengguna {\n  peran: "admin";\n}\n\ntype Id = string | number;'),
  ("Interface atau type?", "cards", ["type bisa menamai union, tuple, dan primitif", "Intersection A & B menggabungkan dua bentuk", "Untuk bentuk object keduanya cocok dipakai", "Interface unggul bila tipe perlu diperluas pihak lain"], ["tag", "link", "scale", "puzzle"], "Pilih satu gaya dan konsisten di seluruh proyek.")),
 ("Union, Literal, dan Narrowing", "split",
  ("Union dan literal", "code", ["A | B berarti nilainya salah satu", "Literal menjadikan nilai persis sebagai tipe", "Gabungan literal sering menggantikan enum", "as const membekukan object menjadi literal"], ["split", "target", "check", "lock"], 'type Status = "baru" | "selesai";\n\nlet s: Status = "baru";\ns = "batal";\n// Error: "batal" bukan anggota Status\n\nconst opsi = { arah: "kiri" } as const;'),
  ("Narrowing", "pic", ["typeof, in, instanceof, dan === mempersempit tipe", "Type guard buatan memakai predikat x is Tipe", "Discriminated union: switch pada properti literal", "Cabang default dengan never menangkap kasus terlewat"], ["search", "shield-check", "split", "bug"], "narrowing")),
 ("Generics", "boxes",
  ("Mengapa generics", "pic", ["Satu fungsi untuk banyak tipe", "Parameter tipe ditulis dalam kurung sudut <T>", "Tipe hasil mengikuti tipe masukan", "Lebih aman daripada any"], ["boxes", "code", "link", "shield-check"], "generics"),
  ("Constraint dan keyof", "code", ["extends membatasi tipe yang diterima", "keyof menghasilkan gabungan nama kunci", "T[K] adalah tipe nilai pada kunci K", "Tipe generik: Kotak<T>, Promise<T>"], ["funnel", "key-round", "database", "package"], 'function ambil<T, K extends keyof T>(\n  obj: T,\n  kunci: K\n): T[K] {\n  return obj[kunci];\n}\n\nconst s = { nama: "Sari", umur: 17 };\nambil(s, "umur");   // number\nambil(s, "alamat"); // Error')),
 ("Utility Types", "puzzle",
  ("Utility bawaan", "pic", ["Partial, Required, dan Readonly mengubah modifier", "Pick dan Omit memilih atau membuang properti", "Record<K, V> membuat kamus bertipe", "ReturnType, Parameters, dan Awaited mengambil tipe fungsi"], ["puzzle", "funnel", "database", "wrench"], "utility-types"),
  ("Operator tipe", "code", ["keyof typeof menurunkan kunci dari object konstanta", "T[\"kunci\"] mengambil tipe satu properti", "Mapped type mengulang atas kunci sebuah tipe", "Satu sumber kebenaran, tanpa tipe ditulis dua kali"], ["key-round", "target", "refresh-cw", "check"], 'const warna = { merah: 1, biru: 2 };\ntype Kunci = keyof typeof warna;\n// "merah" | "biru"\n\ntype Peta<T> = {\n  [K in keyof T]?: T[K];\n};\n\ntype Skor = Record<string, number>;')),
 ("Class dan Modul", "package",
  ("Class bertipe", "code", ["public, private, protected, dan readonly", "Parameter properties meringkas constructor", "private TypeScript hilang di runtime, #nama privat sungguhan", "abstract class jadi kerangka bagi turunan"], ["box", "lock", "shield-check", "layers"], 'class Akun {\n  #pin = 1234;\n  constructor(\n    public readonly id: number,\n    private saldo = 0\n  ) {}\n\n  setor(n: number) {\n    this.saldo += n;\n  }\n}'),
  ("Modul dan tipe", "steps", ["import dan export bekerja seperti JavaScript modern", "import type dihapus sepenuhnya saat kompilasi", "Berkas .d.ts menjelaskan tipe tanpa kode", "Union literal dari as const sering lebih baik dari enum"], ["package", "file-code", "file-text", "tag"], "Paket @types/nama menyediakan tipe bagi pustaka JavaScript murni.")),
 ("tsconfig dan Mode Strict", "settings",
  ("Opsi tsconfig", "code", ["target dan module menentukan JavaScript hasil", "lib memuat tipe bawaan, mis. DOM", "outDir dan rootDir mengatur folder", "skipLibCheck melewati pengecekan berkas .d.ts"], ["settings", "code", "package", "zap"], '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "NodeNext",\n    "strict": true,\n    "noUncheckedIndexedAccess": true,\n    "outDir": "dist"\n  },\n  "include": ["src"]\n}'),
  ("Isi mode strict", "pic", ["strictNullChecks memisahkan null dan undefined", "noImplicitAny menolak any yang tersirat", "noUncheckedIndexedAccess membuat indeks T | undefined", "Hidupkan strict sejak awal proyek"], ["shield-check", "ban", "search", "rocket"], "strict")),
 ("Async, DOM, dan Node", "globe",
  ("Async dan data dari luar", "pic", ["async function mengembalikan Promise<T>", "Hasil json() bertipe any, validasi dulu", "Variabel catch bertipe unknown di mode strict", "Tipe tidak ada di runtime, validasi harus berupa kode"], ["refresh-cw", "database", "bug", "shield-check"], "validasi"),
  ("DOM dan Node", "code", ["querySelector bisa mengembalikan null", "Persempit elemen dengan instanceof HTMLInputElement", "Event bertipe: MouseEvent, SubmitEvent", "Node: pasang @types/node, process.env bisa undefined"], ["globe", "search", "zap", "server"], 'const el = document.querySelector("#cari");\nif (el instanceof HTMLInputElement) {\n  console.log(el.value);\n}\n\nconst port = Number(process.env.PORT ?? 3000);\n// process.env.PORT: string | undefined')),
]


def put(layout, title, n, k, b, ic, extra):
    if layout == "cards": L_cards(title, n, k, b, ic, extra)
    elif layout == "steps": L_steps(title, n, k, b, ic, extra)
    elif layout == "pic": L_pic(n % 2 == 1)(title, n, k, b, ic, extra)
    else: L_code(title, n, k, b, ic, extra)


# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
DT.motif(s, shape, rect, T)
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "logo-typescript-w.png"), Inches(10.0), Inches(2.8), Inches(1.3), Inches(1.3))
text(s, 0.9, 1.9, 7, 0.4, "KELAS PEMROGRAMAN", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "TypeScript", round(54 * T.scale), True, WHITE, gap=0, font=T.font)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 10 bab, dari tipe dasar dan narrowing sampai generics, tsconfig strict, dan async", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda + disclaimer
s = base("Peta Materi", 2, "AGENDA")
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 5) * 2.45, 1.7 + (i // 5) * 1.8
    card(s, x, y, 2.3, 1.6)
    icon(s, c[1], x + 0.2, y + 0.2, 0.55)
    text(s, x + 1.4, y + 0.2, 0.7, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.9, 1.95, 0.65, c[0], 13, True, gap=0)
bar(s, 5.55, "Kelas ini disusun sendiri oleh Ruang Materi dan tidak berafiliasi dengan pihak mana pun. Fitur TypeScript berkembang tiap versi, jadi cek dokumentasi resmi bila ragu.", "lightbulb", "Catatan:")

# 3-22 chapters
n = 3
for i, (ch, _ic, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  •  {ch.upper()}"
    for sl in (a, b):
        put(sl[1], sl[0], n, k, sl[2], sl[3], sl[4]); n += 1

# 23 rangkuman, 24 penutup
L_steps("Rangkuman", 23, "RANGKUMAN", ["Tipe dasar, inferensi, fungsi, object, interface, dan type alias", "Union, literal, dan narrowing membuat kode jujur pada data tak pasti",
    "Generics dan utility types menghindari tipe yang ditulis berulang", "tsconfig strict, async, DOM, dan Node membawa TypeScript ke proyek nyata"],
    ["type", "split", "puzzle", "settings"], "Tipe dihapus saat kompilasi: data dari luar tetap perlu divalidasi dengan kode.", "Ingat:")
L_cards("Langkah berikutnya", 24, "PENUTUP", ["Ketik ulang contoh kode di editor dan lihat tipe lewat hover", "Kerjakan latihan, kuis, dan ujian di akhir kelas", "Aktifkan strict di proyek JavaScript kecilmu sendiri", "Selesaikan proyek akhir Toko Mini"],
    ["terminal", "clipboard-check", "shield-check", "rocket"], "Terima kasih, tetap rajin praktik.")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
