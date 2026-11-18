#!/usr/bin/env python3
"""Generate the 20-slide Keamanan Siber Dasar support deck, in the style of the
other class decks (white slides, kicker, soft cards, round icons, dark callout bar).
Usage: python scripts/deck-keamanan.py <asset-dir> [out.pptx]
Needs python-pptx. <asset-dir>/<diagram>.png: diagrams from scripts/deck-keamanan-assets.mjs;
<asset-dir>/icons/<lucide-name>-w.png (white) and -k.png (green) 256px icons.
Slide count and order are fixed: chapter slide ranges in the draft point at them."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image

C = lambda h: RGBColor.from_string(h)
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = C("0F172A"), C("10B981"), C("F59E0B"), C("F1F5F9"), C("64748B"), C("FFFFFF"), C("CBD5E1")
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/Keamanan_Siber_Dasar.pptx"
DECK = "Keamanan Siber Dasar  |  Ruang Materi"

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
    text(s, 0.6, 0.68, 11.0, 0.8, title, 32, True, gap=0)
    shape(s, MSO_SHAPE.OVAL, 12.1, 0.3, 0.62, 0.62, INK)
    s.shapes.add_picture(os.path.join(ASSET, "icons", "shield-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
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


CH = [
 ("Cara Berpikir Keamanan",
  ("Segitiga CIA", ["Confidentiality: hanya yang berhak boleh membaca", "Integrity: data tidak berubah diam-diam", "Availability: sistem bisa dipakai saat dibutuhkan", "AAA: authentication, authorization, accounting", "Tiga pilar sering saling tarik, seimbangkan sesuai konteks"]),
  ("Risiko dan model ancaman", ["Risiko = kemungkinan x dampak pada sebuah aset", "Respons: kurangi, hindari, pindahkan, atau terima", "Least privilege: akses seminimal yang dibutuhkan", "Defense in depth: banyak lapisan, bukan satu pagar", "Model ancaman: apa dilindungi, apa bisa salah, apa tindakannya"], "ks-risiko")),
 ("Ancaman dan Serangan Umum",
  ("Jenis ancaman", ["Malware: virus, worm, trojan, ransomware, spyware", "Phishing dan penipuan lewat surel, SMS, telepon, QR", "Serangan akun: brute force dan credential stuffing", "DoS dan DDoS membuat layanan tidak tersedia", "Serangan rantai pasok dan orang dalam menyasar pihak yang dipercaya"]),
  ("Alur serangan", ["Kill chain: pengintaian sampai hapus jejak", "Penyerang harus lolos di setiap tahap", "Bertahan cukup memutus satu tahap", "MFA, segmentasi, backup, dan log memutus tahap berbeda", "Kontrol dasar menutup sebagian besar serangan oportunistik"], "ks-ancaman")),
 ("Kriptografi Dasar",
  ("Hash dan enkripsi", ["Hash: sidik jari data, satu arah, untuk keutuhan", "Simpan sandi sebagai hash lambat bersalt (Argon2id, bcrypt)", "Enkripsi simetris (AES): satu kunci, cepat", "Enkripsi asimetris: kunci publik dan privat", "Jangan membuat kripto sendiri, dan jaga kuncinya"]),
  ("Tanda tangan dan sertifikat", ["Tanda tangan digital: keutuhan dan asal pesan", "Sertifikat mengikat domain ke kunci publik lewat CA", "HTTPS memakai asimetris untuk kunci sesi, simetris untuk data", "Gembok berarti terenkripsi, bukan situsnya jujur", "Rahasia jangan di kode atau repositori"], "ks-kripto")),
 ("Autentikasi dan Kata Sandi",
  ("Sandi yang kuat", ["Panjang mengalahkan rumit: entropi = panjang x log2(kumpulan)", "Unik per layanan, bukan satu sandi untuk semua", "Pengelola sandi membuat dan mengisi sandi acak", "Passphrase panjang untuk sandi utama", "Sandi berpola buatan manusia lebih lemah dari hitungan"]),
  ("MFA dan passkey", ["Tiga faktor: diketahui, dimiliki, dan adalah", "SMS bisa dialihkan, TOTP masih bisa ditipu", "Passkey terikat ke domain, tahan phishing", "Nyalakan MFA di surel utama lebih dulu", "Amankan jalur pemulihan akun"], "ks-auth")),
 ("Keamanan Aplikasi Web",
  ("Prinsip pencegahan", ["Jangan percaya input dari klien, cek ulang di server", "Kueri berparameter menutup SQL injection", "Escaping output menutup XSS", "Otorisasi di server pada setiap permintaan", "Pesan error umum ke pengguna, detail di log internal"]),
  ("OWASP Top 10 2025", ["Broken Access Control di urutan pertama", "Rantai pasok perangkat lunak jadi kategori sendiri", "Penanganan kondisi pengecualian masuk daftar baru", "Daftar ini peta kesadaran, bukan standar resmi", "Uji keamanan hanya pada sistem milik sendiri"], "ks-owasp")),
 ("Keamanan Jaringan",
  ("Zona dan firewall", ["Bagi jaringan menjadi zona dengan aturan antarzona", "Default deny: izinkan hanya yang dibutuhkan", "First match wins: urutan aturan adalah logika", "Stateful firewall mengingat koneksi yang berjalan", "Filter juga lalu lintas keluar"]),
  ("VPN, Wi-Fi, dan zero trust", ["VPN mengenkripsi terowongan, tidak membuat anonim", "WPA3 atau WPA2 AES, matikan WPS", "Pisahkan jaringan tamu dan IoT", "IDS memperingatkan, IPS memblokir", "Zero trust: selalu verifikasi, jangan percaya otomatis"], "ks-zona")),
 ("Social Engineering",
  ("Cara kerja penipu", ["Urgensi, otoritas, rasa takut, kepercayaan, kelaziman", "Phishing, spear phishing, smishing, vishing, quishing", "Pretexting dan BEC: cerita meyakinkan demi uang atau data", "Deepfake: wajah dan suara bisa ditiru", "Rasa terburu-buru adalah sinyal untuk melambat"]),
  ("Pemeriksaan sebelum klik", ["Lihat alamat pengirim sebenarnya", "Periksa domain utama pada tautan", "Verifikasi lewat kanal kedua yang kamu kenal", "OTP dan sandi tidak pernah diminta lembaga sah", "Lapor cepat tanpa menyalahkan"], "ks-social")),
 ("Respons Insiden dan Kebiasaan",
  ("Empat fase", ["Persiapan: rencana, kontak, backup teruji", "Deteksi dan analisis: apa yang terjadi dan seberapa parah", "Penahanan, pemberantasan, pemulihan", "Pasca-insiden: belajar tanpa menyalahkan", "Catat, laporkan, batasi, ganti sandi dari perangkat bersih"]),
  ("Kebiasaan harian", ["Perbarui sistem dan aplikasi otomatis", "Sandi unik, MFA, dan passkey di akun penting", "Backup 3-2-1 dan uji pemulihan", "Enkripsi perangkat dan least privilege", "UU PDP: beri tahu paling lambat 3 x 24 jam"], "ks-insiden")),
]

A_LAY = [L_row5, L_grid4, L_steps, L_row5, L_grid4, L_steps, L_row5, L_grid4]
ICA = ["eye scale shield-check lock users", "bug mail key-round activity users", "hash lock layers badge-check file-lock",
       "key-round database user-check smartphone lock", "code eye lock users bell", "layers shield-check eye wifi users",
       "mail smartphone users search bell", "clipboard-check search siren book-open refresh-cw"]
ICB = None

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
shape(s, MSO_SHAPE.OVAL, 8.6, 1.4, 4.1, 4.1, C("16253D"))
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "shield-check-w.png"), Inches(9.95), Inches(2.75), Inches(1.4), Inches(1.4))
text(s, 0.9, 1.9, 7, 0.4, "KONSEP DAN KEBIASAAN", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "Keamanan Siber Dasar", 50, True, WHITE, gap=0)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 8 bab, dari CIA dan risiko sampai kripto, OWASP, social engineering, dan respons insiden", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda
s = base("Peta Materi", 2, "AGENDA")
AG = ["scale", "bug", "hash", "key-round", "code", "network", "mail", "siren"]
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 4) * 3.05, 1.7 + (i // 4) * 1.75
    card(s, x, y, 2.9, 1.55)
    icon(s, AG[i], x + 0.2, y + 0.2, 0.6)
    text(s, x + 2.0, y + 0.25, 0.75, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.98, 2.55, 0.5, c[0], 14, True, gap=0)
bar(s, 5.4, "Semua materi bersifat defensif: mengenali ancaman supaya tahu apa yang harus ditutup. Menguji sistem milik orang lain tanpa izin tertulis melanggar hukum.", "shield-check", "Catatan penting:")

# 3-18: chapters. Chapter slide ranges in the draft: bab 1 = 1-4, then pairs (5-6 ... 15-16), bab 8 = 17-20.
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  \u2022  {ch.upper()}"
    ica = ICA[i - 1].split()
    A_LAY[i - 1](a[0], n, a[1], k, None, ica, None); n += 1
    L_pic(i % 2 == 1)(b[0], n, b[1], k, b[2], None, None); n += 1

# 19 rangkuman, 20 closing
L_steps("Rangkuman", 19, ["Pikirkan risiko: aset, ancaman, kerentanan, dampak", "Lindungi akun: sandi unik, MFA, passkey",
    "Bangun aman: kripto standar, OWASP, firewall dan segmentasi", "Waspadai manusia: verifikasi sebelum klik atau transfer",
    "Siap menghadapi insiden: catat, laporkan, batasi, pulihkan"], "RANGKUMAN", None, "scale key-round code mail siren".split(), None)
L_grid4("Langkah berikutnya", 20, ["Kerjakan latihan kode, ujian, dan proyek pemeriksa kata sandi", "Aktifkan MFA di surel utama hari ini",
    "Pelajari konfigurasi server dan firewall di kelas Administrasi Server", "Latih tiga pertanyaan saat membaca berita kebocoran",
    "Terima kasih - tetap waspada dan rajin berlatih!"], "PENUTUP", None, "clipboard-check lock book-open search".split(), "")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
