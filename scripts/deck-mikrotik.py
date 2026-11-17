#!/usr/bin/env python3
"""Generate the 28-slide MikroTik RouterOS Dasar support deck.
Usage: python scripts/deck-mikrotik.py <png-dir> [out.pptx]
Needs python-pptx. PNGs: <png-dir>/<name>.png (SVGs of public/praktik rendered at 2x)."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR
from PIL import Image

INK, ACC, SOFT, GREY = (RGBColor.from_string(c) for c in ("0F100D", "B5D36F", "E3EDC8", "5A5C54"))
PNG = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/MikroTik_RouterOS_Dasar.pptx"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def rect(s, x, y, w, h, color):
    r = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    r.fill.solid(); r.fill.fore_color.rgb = color; r.line.fill.background()
    return r


def text(s, x, y, w, h, lines, size, bold=False, color=INK, bullet=False, gap=8, anchor=MSO_ANCHOR.TOP):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run(); r.text = ("•  " + ln) if bullet else ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = "Calibri"
        p.space_after = Pt(gap)
    return tb


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
    rect(s, x, y, w, h, SOFT)
    s.shapes.add_picture(path, Inches(x + (w - pw) / 2), Inches(y + (h - ph) / 2), Inches(pw), Inches(ph))


def content(title, n, bullets, kicker, pic=None):
    s = base(title, n, kicker)
    if pic:
        text(s, 0.6, 1.95, 6.2, 4.9, bullets, 21, bullet=True, gap=10)
        picture(s, pic, 7.1, 1.95, 5.7, 4.8)
    else:
        text(s, 0.6, 1.95, 12.1, 4.9, bullets, 24, bullet=True, gap=14)
    return s


# (chapter title, [slide A: title, bullets], [slide B: title, bullets, diagram])
CH = [
 ("Mengenal RouterOS dan Winbox",
  ("Apa itu RouterOS", ["RouterOS adalah sistem operasi router milik MikroTik", "Berjalan di RouterBOARD dan umumnya juga di PC atau mesin virtual (CHR)", "Fungsi utama: routing, firewall, bridge, wireless, VPN, bandwidth", "Mudah diatur lewat GUI, CLI, atau web", "Perangkat tipikal: hEX, hAP, RB951, CCR"]),
  ("Winbox dan port router", ["Winbox: aplikasi GUI untuk mengatur RouterOS", "Terhubung lewat IP atau MAC address dari tab Neighbors", "Akun bawaan umumnya admin tanpa password, segera beri password", "Router punya port ether dan satu port bisa jadi uplink", "Cek nama interface sebelum menyusun konfigurasi"], "router-5-port")),
 ("CLI dan Konfigurasi Awal Internet",
  ("Dasar CLI", ["Akses CLI lewat terminal Winbox, SSH, atau serial", "Struktur perintah berbentuk menu, mis. /ip address", "Perintah umum: print, add, set, remove, disable", "Tombol Tab melengkapi perintah, tanda ? menampilkan bantuan", "Gunakan export untuk membaca konfigurasi dalam teks"]),
  ("Konfigurasi internet awal", ["Beri IP ke interface LAN dan ke sisi WAN", "WAN umumnya memakai dhcp-client atau IP statis dari ISP", "Tambahkan default route 0.0.0.0/0 ke gateway ISP", "Set DNS dan aktifkan NAT masquerade pada sisi WAN", "Uji dengan ping ke IP, lalu ke nama domain"], "kantor-kecil-mikrotik")),
 ("Pemeliharaan RouterOS",
  ("Paket, upgrade, backup", ["Fitur RouterOS dibagi menjadi paket yang bisa ditambah", "Upgrade lewat menu System, Packages, lalu reboot", "Backup berisi seluruh konfigurasi dan terikat ke perangkat", "Export berupa skrip teks yang bisa dibaca dan diedit", "Simpan salinan backup di luar router"]),
  ("Reset, Netinstall, layanan", ["Reset configuration mengembalikan router ke kondisi awal", "Netinstall memasang ulang RouterOS lewat kabel dari PC", "Lisensi terikat ke perangkat dan menentukan level fitur", "Matikan layanan yang tidak dipakai di IP, Services", "Pakai password kuat dan batasi akses login ke jaringan tepercaya"], None)),
 ("DHCP dan ARP",
  ("DHCP server", ["DHCP membagikan IP, gateway, dan DNS secara otomatis", "Komponen: pool alamat, jaringan DHCP, dan server di interface", "Wizard DHCP Setup mempercepat konfigurasi", "Lease dapat dibuat statis untuk perangkat tertentu", "Pastikan hanya satu DHCP server aktif per segmen"]),
  ("Alur DHCP dan ARP", ["Alur DHCP: Discover, Offer, Request, Acknowledge", "ARP memetakan alamat IP ke alamat MAC", "Tabel ARP bisa dilihat di IP, ARP", "Mode arp=reply-only membatasi klien yang dikenal saja", "DHCP lease dan ARP dapat dipadukan untuk keamanan LAN"], "dhcp-dora")),
 ("Bridge",
  ("Konsep bridge", ["Bridge menggabungkan beberapa port dalam satu segmen L2", "Perangkat di port bridge saling terhubung seperti satu switch", "Satu IP dipasang di interface bridge, bukan di tiap port", "Cocok untuk LAN dan menyatukan Wi-Fi dengan kabel", "Port yang masuk bridge sebaiknya tidak punya IP sendiri"]),
  ("Bridge dibanding router", ["Bridge bekerja di L2, router di L3 (berbasis IP)", "Antar port bridge tidak melewati routing", "Antar jaringan berbeda tetap perlu routing", "Bridge belajar MAC lewat tabel host", "Hindari loop L2, aktifkan STP bila ada jalur ganda"], "bridge-vs-router")),
 ("Routing Statik",
  ("Dasar routing", ["Routing menentukan ke mana paket dikirim berikutnya", "Tabel route berisi tujuan, gateway, dan jarak (distance)", "Route connected muncul otomatis saat IP dipasang", "Route statik ditambah manual di IP, Routes", "Default route 0.0.0.0/0 dipakai bila tujuan tak dikenal"]),
  ("Routing antar jaringan", ["Router hanya tahu jaringan yang terhubung langsung", "Jaringan di balik router lain perlu route statik", "Rute balik juga harus ada di router tujuan", "Jarak lebih kecil dipilih lebih dulu, berguna untuk jalur cadangan", "Periksa dengan ping dan traceroute"], "kantor-kecil-mikrotik")),
 ("Wireless Dasar",
  ("Konsep wireless", ["Wi-Fi bekerja di pita 2.4 GHz dan 5 GHz", "Mode umum: ap-bridge untuk access point, station untuk klien", "SSID adalah nama jaringan yang tampil di klien", "Pilih channel dan lebar channel yang tidak ramai", "Kekuatan sinyal diukur dalam dBm, makin dekat nol makin kuat"]),
  ("Konfigurasi dan keamanan", ["Buat security profile dengan WPA2 dan password kuat", "Atur country agar frekuensi sesuai aturan setempat", "Masukkan interface wireless ke bridge LAN", "Gunakan Registration Table untuk melihat klien dan sinyalnya", "Jangan biarkan jaringan terbuka tanpa enkripsi"], None)),
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

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, SOFT); rect(s, 0, 0, 0.5, 7.5, ACC)
text(s, 1.2, 2.0, 11, 1.6, "MikroTik RouterOS Dasar", 54, True)
text(s, 1.2, 3.4, 11, 0.8, "Kerangka MTCNA - dek pendukung kelas", 28, color=GREY)
text(s, 1.2, 4.6, 11, 0.8, "Ruang Materi - 12 bab, dari Winbox sampai monitoring", 22)

# 2: agenda + disclaimer
s = base("Agenda dan catatan penting", 2)
text(s, 0.6, 1.9, 6.0, 5, [f"{i}. {c[0]}" for i, c in enumerate(CH, 1)], 20, gap=4)
rect(s, 7.0, 1.95, 5.8, 4.7, SOFT)
text(s, 7.25, 2.05, 5.3, 4.5, [
    "Kelas ini tidak resmi dan tidak berafiliasi dengan MikroTik.",
    "Susunannya mengikuti kerangka MTCNA publik bertanggal 22 Januari 2016, yang bisa berubah.",
    "Sebelum ujian resmi, cek outline terbaru di situs resmi MikroTik."], 20, True, gap=12)

# 3-26 modules
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    content(a[0], n, a[1], f"Bab {i} - {ch}"); n += 1
    content(b[0], n, b[1], f"Bab {i} - {ch}", b[2]); n += 1

# 27 rangkuman
s = base("Rangkuman", 27)
text(s, 0.6, 1.95, 12.1, 5, [
    "Mulai dari Winbox, CLI, dan konfigurasi internet awal",
    "Rawat router: backup, export, upgrade, dan amankan layanan",
    "Jaringan lokal: DHCP, ARP, bridge, dan routing statik",
    "Lindungi dan atur lalu lintas: firewall, NAT, queue",
    "Hubungkan lokasi dengan VPN dan pantau dengan alat bantu"], 24, bullet=True, gap=14)

# 28 closing
s = base("Langkah berikutnya", 28)
text(s, 0.6, 1.95, 12.1, 4, [
    "Praktikkan tiap bab di router asli, simulator, atau CHR",
    "Kerjakan latihan dan ujian di akhir kelas",
    "Cek outline MTCNA terbaru sebelum ujian resmi MikroTik",
    "Lanjut belajar ke topik jaringan berikutnya di Ruang Materi"], 24, bullet=True, gap=14)
rect(s, 0.6, 5.9, 12.1, 0.9, ACC)
text(s, 0.8, 5.95, 11.7, 0.8, "Terima kasih - tetap rajin praktik!", 28, True, anchor=MSO_ANCHOR.MIDDLE)

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
