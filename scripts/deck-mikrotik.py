#!/usr/bin/env python3
"""Generate the 28-slide MikroTik RouterOS Dasar support deck (varied layouts).
Usage: python scripts/deck-mikrotik.py <png-dir> [out.pptx]
Needs python-pptx. PNGs: <png-dir>/<name>.png (SVGs of public/praktik rendered at 2x).
Slide count and order are fixed: chapter slide ranges in the draft point at them."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image

INK, ACC, SOFT, GREY, WHITE, PALE = (RGBColor.from_string(c) for c in ("0F100D", "B5D36F", "E3EDC8", "5A5C54", "FFFFFF", "F4F7EA"))
PNG = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/MikroTik_RouterOS_Dasar.pptx"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def shape(s, kind, x, y, w, h, color):
    r = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    r.fill.solid(); r.fill.fore_color.rgb = color; r.line.fill.background()
    return r


def rect(s, x, y, w, h, color):
    return shape(s, MSO_SHAPE.RECTANGLE, x, y, w, h, color)


def card(s, x, y, w, h, color):
    r = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, color)
    r.adjustments[0] = 0.06
    return r


def text(s, x, y, w, h, lines, size, bold=False, color=INK, bullet=False, gap=8, anchor=MSO_ANCHOR.TOP, align=None):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if align: p.alignment = align
        r = p.add_run(); r.text = ("•  " + ln) if bullet else ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = "Calibri"
        p.space_after = Pt(gap)
    return tb


def badge(s, x, y, d, label, size=20):
    shape(s, MSO_SHAPE.OVAL, x, y, d, d, ACC)
    text(s, x, y, d, d, label, size, True, INK, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, gap=0)


def base(title, n, kicker=None):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 13.333, 0.18, ACC)
    if kicker:
        text(s, 0.6, 0.35, 9, 0.4, kicker, 16, True, GREY)
    text(s, 0.6, 0.7, 12.1, 0.9, title, 38, True)
    rect(s, 0.6, 1.62, 1.4, 0.07, ACC)
    text(s, 12.0, 7.0, 1.0, 0.35, str(n), 14, color=GREY)
    return s


def picture(s, name, x, y, w, h):
    path = os.path.join(PNG, name + ".png")
    iw, ih = Image.open(path).size
    sc = min(w / iw, h / ih)
    pw, ph = iw * sc, ih * sc
    card(s, x, y, w, h, SOFT)
    s.shapes.add_picture(path, Inches(x + (w - pw) / 2), Inches(y + (h - ph) / 2), Inches(pw), Inches(ph))


# ---- layouts: each takes (title, n, bullets, kicker, num, pic) ----
def L_cards(title, n, b, k, num, pic):
    s = base(title, n, k)
    xs, ys, w, h = (0.6, 4.75, 8.9), (1.95, 4.4), 3.85, 2.3
    for i, ln in enumerate(b):
        x, y = xs[i % 3], ys[i // 3]
        card(s, x, y, w, h, SOFT if i % 2 == 0 else PALE)
        badge(s, x + 0.25, y + 0.2, 0.55, str(i + 1), 18)
        text(s, x + 0.25, y + 0.85, w - 0.5, h - 0.95, ln, 17 if len(ln) < 95 else 15, gap=0)
    x, y = xs[2], ys[1]
    card(s, x, y, w, h, INK)
    text(s, x, y + 0.1, w, 1.4, f"{num:02d}", 64, True, ACC, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, gap=0)
    text(s, x + 0.2, y + 1.45, w - 0.4, 0.8, k.split(" - ", 1)[1], 15, False, SOFT, align=PP_ALIGN.CENTER, gap=0)
    return s


def L_steps(title, n, b, k, num, pic):
    s = base(title, n, k)
    for i, ln in enumerate(b):
        y = 1.95 + i * 0.97
        badge(s, 0.6, y, 0.62, str(i + 1), 20)
        text(s, 1.5, y - 0.03, 11.2, 0.75, ln, 21, gap=0, anchor=MSO_ANCHOR.MIDDLE)
        if i < len(b) - 1:
            rect(s, 0.88, y + 0.66, 0.05, 0.3, SOFT)
    return s


def L_callout(title, n, b, k, num, pic):
    s = base(title, n, k)
    card(s, 0.6, 1.95, 5.8, 4.8, INK)
    rect(s, 0.9, 2.3, 0.9, 0.08, ACC)
    text(s, 0.9, 2.55, 5.2, 4.0, b[0], 30, True, WHITE, gap=0)
    text(s, 6.9, 1.95, 5.9, 4.8, b[1:], 20, bullet=True, gap=14, anchor=MSO_ANCHOR.MIDDLE)
    return s


def L_split(title, n, b, k, num, pic):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 4.6, 7.5, INK); rect(s, 4.6, 0, 8.733, 0.18, ACC)
    text(s, 0.5, 0.5, 3.8, 1.5, f"{num:02d}", 72, True, ACC, gap=0)
    text(s, 0.5, 2.2, 3.7, 3.6, title, 32, True, WHITE, gap=0)
    text(s, 0.5, 6.4, 3.7, 0.6, k.split(" - ", 1)[1], 14, False, SOFT, gap=0)
    text(s, 5.2, 0.9, 7.6, 5.9, b, 22, bullet=True, gap=16, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 12.2, 7.0, 0.8, 0.35, str(n), 14, color=GREY)
    return s


def L_pic(right):
    def f(title, n, b, k, num, pic):
        s = base(title, n, k)
        tx, px = (0.6, 7.1) if right else (6.9, 0.6)
        text(s, tx, 1.95, 6.0, 4.9, b, 21, bullet=True, gap=10)
        picture(s, pic, px, 1.95, 5.8, 4.8)
        return s
    return f


# (chapter title, [slide A: title, bullets], [slide B: title, bullets, diagram])
CH = [
 ("Mengenal RouterOS dan Winbox",
  ("Apa itu RouterOS", ["RouterOS adalah sistem operasi router milik MikroTik", "Berjalan di RouterBOARD dan umumnya juga di PC atau mesin virtual (CHR)", "Fungsi utama: routing, firewall, bridge, wireless, VPN, bandwidth", "Mudah diatur lewat GUI, CLI, atau web", "Perangkat tipikal: hEX, hAP, RB951, CCR"]),
  ("Winbox dan port router", ["Winbox: aplikasi GUI untuk mengatur RouterOS", "Terhubung lewat IP atau MAC address dari tab Neighbors", "Akun bawaan admin; perangkat baru memakai password acak di stiker, perangkat lama kosong. Segera ganti password", "Router punya port ether dan satu port bisa jadi uplink", "Cek nama interface sebelum menyusun konfigurasi"], "router-5-port")),
 ("CLI dan Konfigurasi Awal Internet",
  ("Dasar CLI", ["Akses CLI lewat terminal Winbox, SSH, atau serial", "Struktur perintah berbentuk menu, mis. /ip address", "Perintah umum: print, add, set, remove, disable", "Tombol Tab melengkapi perintah, tanda ? menampilkan bantuan", "Gunakan export untuk membaca konfigurasi dalam teks"]),
  ("Konfigurasi internet awal", ["Beri IP ke interface LAN dan ke sisi WAN", "WAN umumnya memakai dhcp-client atau IP statis dari ISP", "Tambahkan default route 0.0.0.0/0 ke gateway ISP", "Set DNS dan aktifkan NAT masquerade pada sisi WAN", "Uji dengan ping ke IP, lalu ke nama domain"], "kantor-kecil-mikrotik")),
 ("Pemeliharaan RouterOS",
  ("Paket, upgrade, backup", ["Fitur RouterOS dibagi menjadi paket yang bisa ditambah", "Upgrade lewat menu System, Packages, lalu reboot", "Backup berisi seluruh konfigurasi, ditujukan untuk perangkat yang sama, dan memuat data sensitif", "Export berupa skrip teks yang bisa dibaca dan diedit", "Simpan salinan backup di luar router"]),
  ("Reset, Netinstall, layanan", ["Reset configuration mengembalikan router ke kondisi awal", "Netinstall memasang ulang RouterOS lewat kabel dari PC", "Lisensi terikat ke perangkat dan menentukan level fitur", "Matikan layanan yang tidak dipakai di IP, Services", "Pakai password kuat dan batasi akses login ke jaringan tepercaya"], None)),
 ("DHCP dan ARP",
  ("DHCP server", ["DHCP membagikan IP, gateway, dan DNS secara otomatis", "Komponen: pool alamat, jaringan DHCP, dan server di interface", "Wizard DHCP Setup mempercepat konfigurasi", "Lease dapat dibuat statis untuk perangkat tertentu", "Pastikan hanya satu DHCP server aktif per segmen"]),
  ("Alur DHCP dan ARP", ["Alur DHCP: Discover, Offer, Request, Acknowledge", "ARP memetakan alamat IP ke alamat MAC", "Tabel ARP bisa dilihat di IP, ARP", "Mode arp=reply-only membatasi klien yang dikenal saja", "DHCP lease dan ARP dapat dipadukan sebagai pembatasan ringan di LAN"], "dhcp-dora")),
 ("Bridge",
  ("Konsep bridge", ["Bridge menggabungkan beberapa port dalam satu segmen L2", "Perangkat di port bridge saling terhubung seperti satu switch", "Satu IP dipasang di interface bridge, bukan di tiap port", "Cocok untuk LAN dan menyatukan Wi-Fi dengan kabel", "Port yang masuk bridge sebaiknya tidak punya IP sendiri"]),
  ("Bridge dibanding router", ["Bridge bekerja di L2, router di L3 (berbasis IP)", "Antar port bridge tidak melewati routing", "Antar jaringan berbeda tetap perlu routing", "Bridge belajar MAC lewat tabel host", "Hindari loop L2; bridge memakai RSTP secara bawaan, jangan dimatikan bila ada jalur ganda"], "bridge-vs-router")),
 ("Routing Statik",
  ("Dasar routing", ["Routing menentukan ke mana paket dikirim berikutnya", "Tabel route berisi tujuan, gateway, dan jarak (distance)", "Route connected muncul otomatis saat IP dipasang", "Route statik ditambah manual di IP, Routes", "Default route 0.0.0.0/0 dipakai bila tujuan tak dikenal"]),
  ("Routing antar jaringan", ["Router hanya tahu jaringan yang terhubung langsung", "Jaringan di balik router lain perlu route statik", "Rute balik juga harus ada di router tujuan", "Jarak lebih kecil dipilih lebih dulu, berguna untuk jalur cadangan", "Periksa dengan ping dan traceroute"], "kantor-kecil-mikrotik")),
 ("Wireless Dasar",
  ("Konsep wireless", ["Wi-Fi bekerja di pita 2.4 GHz dan 5 GHz", "Pada paket wireless klasik, mode umum: ap-bridge untuk access point, station untuk klien", "SSID adalah nama jaringan yang tampil di klien", "Pilih channel dan lebar channel yang tidak ramai", "Kekuatan sinyal diukur dalam dBm, makin dekat nol makin kuat"]),
  ("Konfigurasi dan keamanan", ["Pada paket wireless klasik, buat security profile dengan WPA2 dan password kuat (paket wifi di RouterOS 7 memakai menu berbeda)", "Atur country agar frekuensi sesuai aturan setempat", "Masukkan interface wireless ke bridge LAN", "Gunakan Registration Table untuk melihat klien dan sinyalnya", "Jangan biarkan jaringan terbuka tanpa enkripsi"], None)),
 ("Firewall Filter",
  ("Konsep firewall", ["Firewall filter memeriksa paket menurut aturan", "Chain utama: input, forward, dan output", "Input untuk lalu lintas ke router, forward untuk yang melewatinya", "Aturan dibaca berurutan dari atas ke bawah", "Aksi umum: accept, drop, dan reject"]),
  ("Praktik firewall", ["Izinkan koneksi established dan related lebih dulu", "Buang koneksi dengan status invalid", "Batasi akses ke router hanya dari LAN", "Aturan drop sisanya ditaruh paling bawah", "Uji dulu di jaringan percobaan agar tidak terkunci"], "firewall-chain-flow")),
 ("NAT dan FastTrack",
  ("NAT", ["NAT mengubah alamat paket saat melewati router", "srcnat dengan masquerade menyembunyikan IP LAN di balik IP WAN", "dstnat dipakai untuk meneruskan port ke server di LAN", "Masquerade memakai IP interface keluar secara otomatis", "Tanpa NAT, IP privat umumnya tidak bisa menuju internet"]),
  ("NAT dan FastTrack", ["Alur: klien LAN, router masquerade, internet, lalu balik", "Router mengingat koneksi lewat tabel connection tracking", "FastTrack mempercepat koneksi yang sudah established", "Paket FastTrack umumnya melewati sebagian fitur seperti queue", "Pertimbangkan efek FastTrack bila memakai manajemen bandwidth"], "nat-masquerade")),
 ("QoS dan Queue",
  ("Konsep QoS", ["QoS mengatur pembagian bandwidth antar pengguna", "Tujuan: adil, stabil, atau memprioritaskan layanan tertentu", "Simple Queue paling mudah: target, batas upload dan download", "Max-limit menentukan batas atas kecepatan", "Limit-at adalah jatah minimal yang diharapkan"]),
  ("Simple Queue", ["Target bisa satu IP atau satu subnet", "Urutan queue berpengaruh, yang paling atas dicocokkan dulu", "Queue Tree dan mangle dipakai untuk kebutuhan lanjut", "Pantau penggunaan lewat tab Queues", "Uji dengan unduhan nyata untuk memastikan batasnya"], "queue-simple-limit")),
 ("Tunnel PPP dan VPN",
  ("Dasar PPP dan tunnel", ["PPP menyediakan koneksi point-to-point dengan autentikasi", "Tunnel membungkus lalu lintas lewat jaringan lain", "Profil PPP mengatur IP lokal, IP remote, dan DNS", "Secret berisi nama pengguna dan password", "Contoh: PPPoE, PPTP, L2TP, SSTP, dan OpenVPN"]),
  ("VPN untuk kantor", ["Server VPN dipasang di router yang punya IP publik", "Klien memakai username dan password dari secret", "Setelah tersambung, klien dapat mengakses LAN kantor", "Beberapa protokol lama punya kelemahan keamanan", "Pilih protokol sesuai kebutuhan dan kebijakan keamanan"], "ppp-tunnel")),
 ("Alat Bantu dan Monitoring",
  ("Alat bantu jaringan", ["Ping menguji keterjangkauan, traceroute melihat jalur paket", "Torch memantau lalu lintas di interface secara langsung", "Bandwidth test mengukur kecepatan antar router", "Log mencatat kejadian router, atur topik yang dipantau", "Gunakan Neighbors untuk menemukan perangkat sekitar"]),
  ("Monitoring dan diagnosa", ["Graphing menampilkan riwayat CPU dan trafik", "SNMP dapat dipakai bila ada sistem monitoring terpusat", "Cek Resources untuk beban CPU dan memori", "Mulai diagnosa dari kabel, lalu IP, route, dan firewall", "Catat perubahan konfigurasi agar mudah ditelusuri"], None)),
]


A_CYCLE = [L_cards, L_split, L_steps, L_callout]
B_NOPIC = [L_callout, L_steps, L_split, L_cards]

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, SOFT); rect(s, 0, 0, 0.5, 7.5, ACC)
card(s, 8.6, 1.2, 4.0, 5.1, INK)
text(s, 8.6, 1.5, 4.0, 2.4, "12", 120, True, ACC, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, gap=0)
text(s, 8.9, 4.0, 3.4, 1.8, "bab, dari Winbox sampai monitoring", 20, False, SOFT, align=PP_ALIGN.CENTER, gap=0)
text(s, 1.2, 2.0, 7.2, 1.8, "MikroTik RouterOS Dasar", 54, True)
text(s, 1.2, 3.9, 7.0, 0.8, "Kerangka MTCNA - dek pendukung kelas", 26, color=GREY)
text(s, 1.2, 5.0, 7.0, 0.8, "Ruang Materi", 22, True)

# 2: agenda + disclaimer
s = base("Agenda dan catatan penting", 2)
for i, c in enumerate(CH):
    col, row = i // 6, i % 6
    x, y = 0.6 + col * 3.55, 1.95 + row * 0.78
    badge(s, x, y, 0.5, str(i + 1), 15)
    text(s, x + 0.62, y - 0.03, 2.85, 0.6, c[0], 15, gap=0, anchor=MSO_ANCHOR.MIDDLE)
card(s, 7.9, 1.95, 4.9, 4.8, INK)
text(s, 8.2, 2.1, 4.3, 0.5, "Catatan penting", 16, True, ACC, gap=0)
text(s, 8.2, 2.7, 4.3, 3.9, [
    "Kelas ini tidak resmi dan tidak berafiliasi dengan MikroTik.",
    "Susunannya mengikuti kerangka MTCNA publik bertanggal 22 Januari 2016, yang bisa berubah.",
    "Sebelum ujian resmi, cek outline terbaru di situs resmi MikroTik."], 18, True, WHITE, gap=12)

# 3-26 modules: two slides per chapter, layouts rotate so neighbours differ
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"Bab {i} - {ch}"
    A_CYCLE[i % 4](a[0], n, a[1], k, i, None); n += 1
    lay = L_pic(i % 2 == 1) if b[2] else B_NOPIC[i % 4]
    lay(b[0], n, b[1], k, i, b[2]); n += 1

# 27 rangkuman: five cards
s = base("Rangkuman", 27)
R = [("Mulai", "Mulai dari Winbox, CLI, dan konfigurasi internet awal"),
     ("Rawat", "Rawat router: backup, export, upgrade, dan amankan layanan"),
     ("Jaringan lokal", "Jaringan lokal: DHCP, ARP, bridge, routing statik, dan wireless"),
     ("Lindungi", "Lindungi dan atur lalu lintas: firewall, NAT, queue"),
     ("Hubungkan", "Hubungkan lokasi dengan VPN dan pantau dengan alat bantu")]
for i, (h, ln) in enumerate(R):
    x = 0.6 + i * 2.47
    card(s, x, 1.95, 2.3, 4.8, SOFT if i % 2 == 0 else PALE)
    badge(s, x + 0.2, 2.15, 0.55, str(i + 1), 18)
    text(s, x + 0.2, 2.95, 1.95, 0.5, h, 18, True, gap=0)
    text(s, x + 0.2, 3.6, 1.95, 3.0, ln, 16, gap=0)

# 28 closing
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK); rect(s, 0, 0, 13.333, 0.18, ACC)
text(s, 0.8, 0.7, 11.5, 1.0, "Langkah berikutnya", 40, True, WHITE)
rect(s, 0.8, 1.72, 1.4, 0.07, ACC)
for i, ln in enumerate(["Praktikkan tiap bab di router asli, simulator, atau CHR",
                        "Kerjakan latihan dan ujian di akhir kelas",
                        "Cek outline MTCNA terbaru sebelum ujian resmi MikroTik",
                        "Lanjut belajar ke topik jaringan berikutnya di Ruang Materi"]):
    y = 2.1 + i * 0.85
    badge(s, 0.8, y, 0.55, str(i + 1), 18)
    text(s, 1.65, y - 0.03, 11, 0.7, ln, 22, False, WHITE, gap=0, anchor=MSO_ANCHOR.MIDDLE)
card(s, 0.8, 5.8, 11.7, 1.0, ACC)
text(s, 1.0, 5.85, 11.3, 0.9, "Terima kasih - tetap rajin praktik!", 28, True, anchor=MSO_ANCHOR.MIDDLE)
text(s, 12.2, 7.0, 0.8, 0.35, "28", 14, color=GREY)

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
