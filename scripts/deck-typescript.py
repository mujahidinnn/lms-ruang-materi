#!/usr/bin/env python3
"""Generate the 20-slide TypeScript support deck (2 slides per chapter, in chapter order).
Usage: python scripts/deck-typescript.py [out.pptx]   (needs python-pptx)
Slide count and order are fixed: chapter slide ranges in content/drafts/typescript.json point at them."""
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR

C = RGBColor.from_string
INK, GREEN, CARD, GREY, WHITE, CODE = C("0F172A"), C("10B981"), C("F1F5F9"), C("64748B"), C("FFFFFF"), C("0B1220")
OUT = sys.argv[1] if len(sys.argv) > 1 else "TypeScript.pptx"
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)


def box(s, kind, x, y, w, h, color):
    r = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    r.fill.solid(); r.fill.fore_color.rgb = color; r.line.fill.background()
    if kind == MSO_SHAPE.ROUNDED_RECTANGLE: r.adjustments[0] = 0.06
    return r


def text(s, x, y, w, h, lines, size, bold=False, color=INK, font="Calibri", gap=6, anchor=MSO_ANCHOR.TOP):
    tf = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)).text_frame
    tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run(); r.text = ln
        r.font.size, r.font.bold, r.font.color.rgb, r.font.name = Pt(size), bold, color, font
        p.space_after = Pt(gap)


def slide(n, kicker, title, bullets, code):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    text(s, 0.6, 0.34, 10, 0.3, kicker.upper(), 11, True, GREEN)
    text(s, 0.6, 0.68, 12, 0.8, title, 32, True)
    box(s, MSO_SHAPE.ROUNDED_RECTANGLE, 0.6, 1.85, 6.0, 4.9, CARD)
    text(s, 0.95, 2.15, 5.3, 4.4, ["- " + b for b in bullets], 17, gap=12)
    box(s, MSO_SHAPE.ROUNDED_RECTANGLE, 6.85, 1.85, 5.85, 4.9, CODE)
    text(s, 7.15, 2.15, 5.3, 4.4, code.split("\n"), 14, color=C("E2E8F0"), font="DejaVu Sans Mono", gap=2)
    text(s, 0.6, 7.03, 8, 0.25, "TypeScript  |  Kelas Ruang Materi", 10, color=GREY, gap=0)
    text(s, 12.2, 7.03, 0.6, 0.25, str(n), 10, color=GREY, gap=0)


S = [
 ("Mengenal TypeScript", [
  ("Apa itu TypeScript", ["JavaScript ditambah sistem tipe statis", "Dicek saat menulis kode, bukan saat dijalankan", "Dikompilasi menjadi JavaScript biasa", "Tipe hanya ada di editor dan compiler"], "let umur: number = 17;\numur = \"tujuh belas\";\n// Error: Type 'string' is not\n// assignable to type 'number'"),
  ("Alur kerja tsc", ["Pasang dengan npm install -D typescript", "tsc --init membuat tsconfig.json", "tsc memeriksa tipe dan menulis berkas .js", "Node baru bisa menjalankan .ts dengan menghapus tipe"], "npm install -D typescript\nnpx tsc --init\nnpx tsc\nnode dist/app.js")]),
 ("Tipe Dasar dan Inferensi", [
  ("Tipe primitif dan array", ["string, number, boolean, bigint, symbol", "Array: number[] atau Array<number>", "Tuple: [string, number] dengan panjang tetap", "null dan undefined punya tipe sendiri"], "const nama: string = \"Sari\";\nconst nilai: number[] = [80, 90];\nconst pasangan: [string, number] =\n  [\"Sari\", 17];"),
  ("Inferensi dan tipe khusus", ["TypeScript menebak tipe dari nilai awal", "const menghasilkan tipe literal", "unknown aman, any mematikan pengecekan", "void untuk tanpa nilai, never untuk tak pernah selesai"], "let kota = \"Bogor\"; // string\nconst tetap = \"Bogor\"; // \"Bogor\"\nlet x: unknown = 5;\nx.toFixed(); // Error")]),
 ("Fungsi dan Object Bertipe", [
  ("Fungsi bertipe", ["Anotasi parameter wajib, return boleh disimpulkan", "Parameter opsional memakai ?", "Default value ikut menentukan tipe", "Rest parameter bertipe array"], "function sapa(\n  nama: string,\n  salam = \"Halo\"\n): string {\n  return `${salam}, ${nama}`;\n}"),
  ("Bentuk object", ["Tipe object menjelaskan properti dan tipenya", "Properti opsional dan readonly", "Index signature untuk kunci dinamis", "Pengecekan properti berlebih pada object literal"], "type Siswa = {\n  readonly id: number;\n  nama: string;\n  email?: string;\n};")]),
 ("Interface dan Type Alias", [
  ("Interface", ["Mendeskripsikan bentuk object", "extends untuk mewarisi interface lain", "Deklarasi bernama sama digabung (merging)", "Class bisa implements interface"], "interface Hewan { nama: string }\ninterface Kucing extends Hewan {\n  suara: \"meong\";\n}"),
  ("Type alias dan interface", ["type bisa untuk union, tuple, primitif", "Gabungkan type dengan & (intersection)", "Untuk bentuk object, keduanya cocok", "Pilih satu gaya dan konsisten di proyek"], "type Id = string | number;\ntype Admin = Pengguna & {\n  peran: \"admin\";\n};")]),
 ("Union, Literal, dan Narrowing", [
  ("Union dan literal", ["A | B: nilainya salah satu", "Literal: nilai persis sebagai tipe", "Gabungan literal menggantikan enum sederhana", "Hanya anggota bersama yang boleh dipakai langsung"], "type Status = \"baru\" | \"selesai\";\nlet s: Status = \"baru\";\ns = \"batal\"; // Error"),
  ("Narrowing", ["typeof, in, instanceof, dan === mempersempit tipe", "Type guard buatan: x is Tipe", "Discriminated union dengan properti kind", "Pengecekan lengkap lewat never"], "function luas(b: Bentuk) {\n  switch (b.kind) {\n    case \"bulat\": return Math.PI * b.r ** 2;\n    case \"kotak\": return b.s ** 2;\n  }\n}")]),
 ("Generics", [
  ("Mengapa generics", ["Fungsi dan tipe yang bekerja untuk banyak tipe", "Parameter tipe ditulis dalam <T>", "Tipe hasil mengikuti tipe masukan", "Lebih aman daripada any"], "function pertama<T>(a: T[]): T {\n  return a[0];\n}\npertama([1, 2]); // number\npertama([\"a\"]); // string"),
  ("Constraint dan default", ["extends membatasi tipe yang diterima", "keyof untuk kunci object yang valid", "Tipe generik: Kotak<T>, Promise<T>", "Parameter tipe boleh punya default"], "function ambil<T, K extends keyof T>(\n  o: T, k: K\n): T[K] {\n  return o[k];\n}")]),
 ("Utility Types", [
  ("Utility bawaan", ["Partial, Required, Readonly", "Pick dan Omit memilih atau membuang properti", "Record<K, V> untuk kamus bertipe", "ReturnType, Parameters, Awaited"], "type Draf = Partial<Siswa>;\ntype Ringkas = Pick<Siswa, \"id\" | \"nama\">;\ntype Skor = Record<string, number>;"),
  ("Operator tipe", ["keyof menghasilkan gabungan nama kunci", "typeof mengambil tipe dari nilai", "Indexed access: T[\"kunci\"]", "Mapped type menurunkan tipe baru"], "const warna = { merah: 1, biru: 2 };\ntype Kunci = keyof typeof warna;\ntype Peta<T> = {\n  [K in keyof T]?: T[K];\n};")]),
 ("Class dan Modul", [
  ("Class bertipe", ["public, private, protected, readonly", "Parameter properties meringkas constructor", "abstract class sebagai kerangka", "private (#) berbeda dengan private TypeScript"], "class Akun {\n  constructor(\n    public readonly id: number,\n    private saldo = 0\n  ) {}\n}"),
  ("Modul dan tipe", ["import dan export bekerja seperti JavaScript", "import type menghapus impor saat kompilasi", "Berkas .d.ts menjelaskan tipe tanpa kode", "Enum ada, tetapi union literal sering cukup"], "import type { Siswa } from \"./siswa\";\nexport function cetak(s: Siswa) {\n  console.log(s.nama);\n}")]),
 ("tsconfig dan Mode Strict", [
  ("Opsi penting", ["strict menyalakan satu paket pengecekan ketat", "target, module, dan lib menentukan keluaran", "outDir dan rootDir mengatur folder", "skipLibCheck melewati pengecekan berkas .d.ts"], "{\n  \"compilerOptions\": {\n    \"strict\": true,\n    \"target\": \"ES2022\",\n    \"outDir\": \"dist\"\n  }\n}"),
  ("Isi mode strict", ["strictNullChecks: null dan undefined dipisah", "noImplicitAny: any tersirat jadi error", "noUncheckedIndexedAccess: indeks bisa undefined", "Hidupkan sejak awal proyek"], "const a: string[] = [];\nconst x = a[0];\n// string | undefined\n// bila noUncheckedIndexedAccess")]),
 ("Async, DOM, dan Node", [
  ("Async bertipe", ["async function mengembalikan Promise<T>", "await membuka Promise menjadi T", "Hasil JSON dari fetch bertipe any: validasi dulu", "catch menghasilkan unknown di mode strict"], "async function muat(): Promise<Siswa[]> {\n  const r = await fetch(\"/api\");\n  return (await r.json()) as Siswa[];\n}"),
  ("DOM dan Node", ["querySelector bisa mengembalikan null", "Persempit elemen ke HTMLInputElement", "Event bertipe: MouseEvent, SubmitEvent", "Node: pasang @types/node"], "const el = document.querySelector(\"#cari\");\nif (el instanceof HTMLInputElement) {\n  console.log(el.value);\n}")]),
]


n = 0
for kicker, pair in S:
    for title, bullets, code in pair:
        n += 1
        slide(n, kicker, title, bullets, code)
prs.save(OUT)
print(OUT, n, "slides")
