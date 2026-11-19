#!/usr/bin/env python3
"""Generate the 28-slide Algoritma dan Struktur Data support deck, in the style of the
other class decks (white slides, kicker, soft cards, round icons, dark callout bar).
Usage: python scripts/deck-mikrotik.py <asset-dir> [out.pptx]
Needs python-pptx (assets: node scripts/deck-algoritma-assets.mjs <dir> <simple-icons path>). <asset-dir>/<diagram>.png: diagrams from scripts/deck-algoritma-assets.mjs;
<asset-dir>/icons/<lucide-name>-w.png (white) and -k.png (green) 256px icons.
Slide count and order are fixed: chapter slide ranges in the draft point at them."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image
import deck_theme as DT

C = lambda h: RGBColor.from_string(h)
T = DT.load("algoritma")
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = T.ink, T.accent, T.amber, T.card, T.grey, C("FFFFFF"), T.line
TITLE_PT = round(32 * T.scale)
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/Algoritma_dan_Struktur_Data.pptx"
DECK = "Algoritma dan Struktur Data  |  Python"

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
    s.shapes.add_picture(os.path.join(ASSET, "icons", "workflow-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
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


# ---- layouts: (title, n, bullets, kicker, pic, icons, term) ----
def L_row5(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    for i, ln in enumerate(b):
        x = 0.6 + i * 2.47
        card(s, x, 1.95, 2.3, 3.9)
        icon(s, ic[i], x + 0.7, 2.3, 0.9)
        text(s, x + 0.2, 3.5, 1.9, 2.9, ln, 17 if len(ln) < 90 else 15, gap=0, align=PP_ALIGN.CENTER)
    return s


def L_steps(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    rect(s, 1.3, 2.37, 10.7, 0.04, LINE)
    for i, ln in enumerate(b):
        x = 0.6 + i * 2.47
        num(s, x + 0.85, 2.05, 0.65, str(i + 1), GREEN if i < 4 else INK, 20)
        card(s, x, 3.0, 2.3, 3.4, WHITE).line.color.rgb = LINE
        icon(s, ic[i], x + 0.2, 3.2, 0.5, INK)
        text(s, x + 0.2, 3.95, 1.9, 2.4, ln, 16 if len(ln) < 90 else 14.5, gap=0)
    return s


def L_grid4(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    for i, ln in enumerate(b[:4]):
        x, y = 0.6 + (i % 2) * 6.15, 1.85 + (i // 2) * 2.0
        card(s, x, y, 5.95, 1.85)
        icon(s, ic[i], x + 0.3, y + 0.3, 0.7)
        text(s, x + 1.25, y + 0.2, 4.45, 1.45, ln, 16, gap=0, anchor=MSO_ANCHOR.MIDDLE)
    bar(s, 5.95, b[4], "lightbulb" if term is None else "rocket", "Ingat:" if term is None else None)
    return s



SKY, SUN, MUTE = C("7DD3FC"), C("FCD34D"), C("64748B")
KW = {"def", "return", "for", "while", "if", "else", "elif", "in", "not", "and", "or", "import", "from", "class", "None", "True", "False", "is"}


def code_runs(line):
    """One Python line -> (text, color, bold) runs: comments grey, strings amber, keywords sky."""
    import re
    if line.strip().startswith("#"):
        return [(line, MUTE, False)]
    runs = []
    for tok in re.findall(r'"[^"]*"|\w+|\s+|.', line):
        if tok.startswith('"'):
            runs.append((tok, SUN, False))
        elif tok in KW:
            runs.append((tok, SKY, True))
        else:
            runs.append((tok, WHITE, False))
    return runs


def L_code(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    card(s, 0.6, 1.85, 6.3, 4.9, C("0B1220"))
    rect(s, 0.6, 2.2, 6.3, 0.04, C("1E293B"))
    for j, col in enumerate(("EF4444", "F59E0B", "10B981")):
        shape(s, MSO_SHAPE.OVAL, 0.85 + j * 0.27, 2.0, 0.15, 0.15, C(col))
    text(s, 1.85, 1.97, 4.8, 0.25, "contoh.py - Python 3", 10, color=MUTE, gap=0, font="DejaVu Sans Mono")
    tb = s.shapes.add_textbox(Inches(0.9), Inches(2.5), Inches(5.8), Inches(4.1)); tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, ln in enumerate(term):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(3)
        for t, col, bold in code_runs(ln):
            r = p.add_run(); r.text = t; r.font.size = Pt(13); r.font.name = "DejaVu Sans Mono"; r.font.color.rgb = col; r.font.bold = bold
    for i, ln in enumerate(b):
        y = 1.85 + i * 1.0
        card(s, 7.15, y, 5.55, 0.9)
        icon(s, ic[i], 7.35, y + 0.17, 0.56)
        text(s, 8.1, y, 4.45, 0.9, ln, 12.5, gap=0, anchor=MSO_ANCHOR.MIDDLE)
    return s


def L_pic(right):
    def f(title, n, b, k, pic, ic, term):
        s = base(title, n, k)
        px, tx = (0.6, 6.85) if right else (6.85, 0.6)
        picture(s, pic, px, 1.85, 5.85, 4.9)
        for i, ln in enumerate(b):
            y = 1.85 + i * 1.0
            rect(s, tx, y + 0.05, 0.07, 0.8, [GREEN, C("0EA5E9"), AMBER, INK, GREEN][i])
            text(s, tx + 0.3, y, 5.4, 0.9, ln, 14.5, gap=0, anchor=MSO_ANCHOR.MIDDLE)
        return s
    return f


# (chapter title, [slide A: title, bullets], [slide B: title, bullets, diagram])
CH = [
 ("Kompleksitas dan Big O",
  ("Mengapa kecepatan penting", ["Algoritma adalah langkah terurut untuk memecahkan satu masalah", "Struktur data menyimpan data agar langkah itu murah", "Dua program benar bisa beda ribuan kali lipat pada data besar", "Kita menghitung langkah terhadap ukuran data n, bukan detik", "Kelas ini memakai Python 3"]),
  ("Membaca Big O", ["Buang konstanta: 3n + 50 menjadi O(n)", "Ambil suku terbesar: n^2 + n menjadi O(n^2)", "Loop bersarang dikalikan, loop berurutan dijumlahkan", "Biasanya yang dihitung adalah kasus terburuk", "Memori tambahan juga diukur dan sering ditukar dengan waktu"], "algo-bigo")),
 ("Array dan List",
  ("Array dan list Python", ["Elemen tersimpan berurutan sehingga a[i] bernilai O(1)", "List Python adalah array dinamis yang bisa tumbuh", "append dan pop() di ujung murah, insert dan pop(0) O(n)", "Slicing membuat salinan sepanjang irisan", "Indeks negatif menghitung dari belakang"]),
  ("Dua pola utama", ["Dua penunjuk: bergerak dari kedua ujung menuju tengah", "Membalik di tempat memakai memori tambahan O(1)", "Prefix sum: hitung sekali, jawab tiap rentang dalam O(1)", "Jumlah indeks i..j adalah prefix[j + 1] - prefix[i]", "Waspadai off-by-one dan mengubah list saat dilewati"], None)),
 ("String",
  ("String itu immutable", ["String adalah deretan karakter yang tidak bisa diubah", "Setiap perubahan membuat string baru", "Kumpulkan potongan di list lalu pakai join", "split, strip, lower, dan slicing semuanya O(n)", "Gunakan ord dan chr untuk bekerja dengan kode karakter"]),
  ("Pola string klasik", ["Palindrom: dua penunjuk, abaikan karakter bukan huruf", "Anagram: bandingkan hitungan huruf dengan Counter", "Kompresi huruf berulang: aaabcc menjadi a3b1c2", "Uji string kosong dan kelompok terakhir", "Hitung huruf dengan dict atau list 26 slot"], None)),
 ("Hash Map dan Set",
  ("Cara kerja hash map", ["Fungsi hash mengubah kunci menjadi indeks tabel", "Cari, sisip, dan hapus O(1) rata-rata", "Tabrakan terjadi saat dua kunci berbagi indeks", "Kunci harus hashable: string, angka, dan tuple", "set menyimpan kunci saja untuk keanggotaan cepat"]),
  ("Pola dengan dict", ["Frekuensi: hitung kemunculan tiap nilai dalam satu lewat", "Dua jumlah: simpan nilai yang sudah terlihat beserta indeksnya", "Pengelompokan dengan setdefault dan kunci majemuk", "Operasi himpunan: irisan, gabungan, selisih", "Menukar memori dengan waktu, O(1) hanya rata-rata"], "algo-hash")),
 ("Linked List",
  ("Node dan penunjuk", ["Node menyimpan nilai dan penunjuk ke node berikutnya", "Kepala adalah node pertama, ujungnya None", "Akses ke-k O(n), tidak ada indeks", "Sisip dan hapus pada node yang dipegang O(1)", "Doubly linked list punya penunjuk dua arah"]),
  ("Membalik dan siklus", ["Membalik: simpan berikut, balik arah, geser, tiga penunjuk", "Menyimpan penunjuk ekor membuat tambah di ujung O(1)", "Floyd: penunjuk lambat dan cepat mendeteksi siklus", "Waktu O(n) dan memori O(1)", "List Python biasanya lebih praktis untuk sehari-hari"], "algo-linked")),
 ("Stack dan Queue",
  ("LIFO dan FIFO", ["Stack: yang masuk terakhir keluar pertama", "Queue: yang masuk pertama keluar pertama", "Stack di Python: list dengan append dan pop()", "Queue di Python: deque dengan append dan popleft()", "list.pop(0) O(n) sehingga buruk sebagai antrean"]),
  ("Pemakaian", ["Kurung seimbang memakai stack untuk pembuka", "Evaluasi postfix: operator mengambil dua angka teratas", "Undo dan riwayat peramban adalah stack", "Antrean tugas dan BFS memakai queue", "Selalu tangani struktur kosong sebelum mengambil"], "algo-stackqueue")),
 ("Rekursi",
  ("Kasus dasar dan rekursif", ["Kasus dasar menghentikan rekursi dengan jawaban langsung", "Kasus rekursif memanggil diri dengan masalah lebih kecil", "Tanpa kasus dasar terjadi RecursionError", "Percayai pemanggilan yang lebih kecil sudah benar", "Divide and conquer memangkas kedalaman menjadi log n"]),
  ("Call stack dan memoization", ["Tiap pemanggilan membuat frame di call stack", "Memori rekursi sebanding kedalamannya", "Fibonacci naif eksponensial karena hitung ulang", "Memoization menyimpan hasil dan menjadi O(n)", "lru_cache dari functools siap pakai"], "algo-callstack")),
 ("Pencarian Linear dan Biner",
  ("Dua cara mencari", ["Linear: periksa satu per satu, O(n), data apa pun", "Biner: data terurut, O(log n)", "Tiap langkah membuang separuh ruang pencarian", "Satu miliar elemen hanya sekitar 30 perbandingan", "Untuk kunci tanpa urutan, dict dan set lebih cepat"]),
  ("Batas bawah dan bisect", ["Geser batas selalu ke tengah + 1 atau tengah - 1", "Batas bawah memberi kemunculan pertama dan posisi sisip", "bisect_left dan bisect_right siap pakai", "Cacah kemunculan: bisect_right - bisect_left", "Pencarian biner juga bisa pada rentang jawaban"], "algo-binary")),
 ("Pengurutan",
  ("Algoritma sederhana", ["Insertion sort menyisipkan elemen ke bagian yang rapi", "Waktu O(n^2), hampir linear pada data hampir terurut", "Algoritma stabil menjaga urutan elemen yang kuncinya sama", "Bubble dan selection sort juga O(n^2)", "Memori tambahan O(1) pada insertion sort"]),
  ("Merge sort dan Timsort", ["Merge sort: bagi, urutkan rekursif, gabungkan", "Waktu O(n log n) di semua kasus, memori O(n)", "Quick sort rata-rata cepat, terburuk O(n^2)", "sorted dan list.sort memakai Timsort yang stabil", "Parameter key mengatur urutan khusus dan berlapis"], "algo-merge")),
 ("Tree dan Binary Search Tree",
  ("Tree dan binary tree", ["Tree menyimpan data hierarkis: akar, anak, dan daun", "Binary tree punya paling banyak dua anak per simpul", "Fungsi tree ditulis rekursif dengan kasus dasar None", "Tinggi dihitung 1 + max tinggi kiri dan kanan", "DOM dan sistem berkas berbentuk tree"]),
  ("Penelusuran dan BST", ["Preorder, inorder, postorder adalah depth-first", "Level-order memakai queue", "BST: kiri lebih kecil, kanan lebih besar", "Inorder pada BST menghasilkan urutan naik", "Cari dan sisip O(log n) bila seimbang, O(n) bila miring"], "algo-tree")),
 ("Graph Dasar: BFS dan DFS",
  ("Graf dan adjacency list", ["Graf terdiri dari simpul dan sisi, boleh berarah", "Boleh bersiklus dan tidak punya akar", "Adjacency list berupa dict, memori O(V + E)", "Tambahkan sisi dua arah untuk graf tak berarah", "Grid dapat dipandang sebagai graf"]),
  ("BFS dan DFS", ["BFS memakai queue dan mengunjungi menurut jarak", "BFS memberi jalur terpendek pada graf tanpa bobot", "DFS memakai stack atau rekursi", "Himpunan visited mencegah putaran tak berujung", "Komponen terhubung: mulai dari tiap simpul yang belum dikunjungi"], "algo-graph")),
 ("Pola Pemecahan Masalah",
  ("Alur lima langkah", ["Pahami soal dan ukuran datanya", "Buat contoh kecil dan kasus tepi", "Tulis brute force yang pasti benar", "Optimalkan bagian yang berulang", "Uji dan bandingkan dengan brute force"]),
  ("Mengenali pola", ["Pasangan atau ujung terurut: dua penunjuk", "Rentang berurutan: sliding window", "Pernah terlihat atau hitung: hash map atau set", "Bersarang atau berpasangan: stack", "Jarak terpendek tanpa bobot: BFS"], None)),
]

A_LAY = [L_row5, L_code, L_steps, L_code, L_code, L_row5, L_code, L_code, L_code, L_code, L_code, L_grid4]
B_NOPIC = {2: L_grid4, 3: L_row5, 12: L_grid4}
ICA = ["workflow gauge clock list-checks database", "list ruler search layers repeat", "type file-text package search puzzle",
       "hash database search lightbulb layers", "link arrow-left-right split refresh-cw eye", "layers arrow-up-down list-checks refresh-cw check",
       "refresh-cw box lightbulb scale split", "search target zap list-checks check", "shuffle clock layers settings sparkles",
       "tree-pine code split search network", "network network route users globe", "target list-checks code search rocket"]
ICB = {2: "arrow-left-right ruler repeat list-checks lightbulb", 3: "check type search code database", 12: "split search hash layers route"}
CODE = {
 2: ["a = [10, 20, 30, 40]", "a[-1]            # 40, O(1)", "a[1:3]           # [20, 30], salinan", "", "def balik(a):", "    k, r = 0, len(a) - 1", "    while k < r:", "        a[k], a[r] = a[r], a[k]", "        k += 1", "        r -= 1"],
 4: ["stok = {\"apel\": 5}", "stok[\"jeruk\"] = 2      # O(1)", "\"apel\" in stok         # True", "", "def dua_jumlah(a, target):", "    terlihat = {}", "    for i, x in enumerate(a):", "        if target - x in terlihat:", "            return terlihat[target - x], i", "        terlihat[x] = i"],
 5: ["class Node:", "    def __init__(self, nilai, berikut=None):", "        self.nilai = nilai", "        self.berikut = berikut", "", "kepala = Node(1, Node(2, Node(3)))", "# 1 -> 2 -> 3 -> None"],
 7: ["def faktorial(n):", "    if n <= 1:          # kasus dasar", "        return 1", "    return n * faktorial(n - 1)", "", "faktorial(5)   # 120"],
 8: ["def cari_biner(a, x):", "    kiri, kanan = 0, len(a) - 1", "    while kiri <= kanan:", "        tengah = (kiri + kanan) // 2", "        if a[tengah] == x:", "            return tengah", "        if a[tengah] < x:", "            kiri = tengah + 1", "        else:", "            kanan = tengah - 1", "    return -1"],
 9: ["def gabung(kiri, kanan):", "    hasil, i, j = [], 0, 0", "    while i < len(kiri) and j < len(kanan):", "        if kiri[i] <= kanan[j]:", "            hasil.append(kiri[i])", "            i += 1", "        else:", "            hasil.append(kanan[j])", "            j += 1", "    return hasil + kiri[i:] + kanan[j:]"],
 10: ["class Simpul:", "    def __init__(self, nilai, kiri=None, kanan=None):", "        self.nilai = nilai", "        self.kiri = kiri", "        self.kanan = kanan", "", "def tinggi(akar):", "    if akar is None:", "        return 0", "    return 1 + max(tinggi(akar.kiri), tinggi(akar.kanan))"],
 11: ["from collections import deque", "", "def bfs(graf, mulai):", "    terlihat = {mulai}", "    antrean = deque([mulai])", "    while antrean:", "        s = antrean.popleft()", "        for t in graf[s]:", "            if t not in terlihat:", "                terlihat.add(t)", "                antrean.append(t)"],
}

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
DT.motif(s, shape, rect, T)
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "logo-python-w.png"), Inches(9.95), Inches(2.75), Inches(1.4), Inches(1.4))
text(s, 0.9, 1.9, 7, 0.4, "PYTHON 3", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "Algoritma dan Struktur Data", round(46 * T.scale), True, WHITE, gap=0, font=T.font)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 12 bab, dari Big O dan hash map sampai graf dan pola pemecahan masalah", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda
s = base("Peta Materi", 2, "AGENDA")
AG = ["gauge", "list", "type", "hash", "link", "layers", "refresh-cw", "search", "shuffle", "tree-pine", "network", "target"]
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 4) * 3.05, 1.7 + (i // 4) * 1.45
    card(s, x, y, 2.9, 1.3)
    icon(s, AG[i], x + 0.2, y + 0.18, 0.55)
    text(s, x + 2.0, y + 0.2, 0.75, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.82, 2.55, 0.45, c[0], 13, True, gap=0)
bar(s, 6.1, "Setiap bab punya contoh Python yang bisa dijalankan di browser, kuis, dan latihan otomatis. Slide ini hanya ringkasan, penjelasan lengkap ada di bab.", "lightbulb", "Cara memakai:")

# 3-26 chapters
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  •  {ch.upper()}"
    ica = ICA[i - 1].split()
    A_LAY[i - 1](a[0], n, a[1], k, None, ica, CODE.get(i)); n += 1
    if b[2]:
        L_pic(i % 2 == 1)(b[0], n, b[1], k, b[2], None, None)
    else:
        B_NOPIC[i](b[0], n, b[1], k, None, ICB[i].split(), None)
    n += 1

L_steps("Rangkuman", 27, ["Ukur dengan Big O: buang konstanta, ambil suku terbesar", "Pilih struktur data: array, hash map, linked list, stack, queue, tree, graf",
    "Pakai teknik inti: rekursi, pencarian biner, merge sort, BFS dan DFS", "Kenali pola: dua penunjuk, sliding window, hash map, prefix sum",
    "Mulai dari brute force, optimalkan, lalu uji kasus tepi"], "RANGKUMAN", None, "gauge database refresh-cw target check".split(), None)
L_grid4("Langkah berikutnya", 28, ["Ketik ulang setiap contoh kode lalu ubah masukannya", "Kerjakan latihan, kuis, dan ujian di akhir kelas",
    "Selesaikan proyek akhir Navigator Kampus", "Latih satu pola setiap beberapa hari dengan soal kecil",
    "Terima kasih - tetap rajin berlatih!"], "PENUTUP", None, "terminal clipboard-check book-open rocket".split(), "")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
