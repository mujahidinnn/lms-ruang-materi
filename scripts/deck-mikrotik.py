#!/usr/bin/env python3
"""Generate the 28-slide MikroTik RouterOS Dasar support deck, in the style of the
other class decks (white slides, kicker, soft cards, round icons, dark callout bar).
Usage: python scripts/deck-mikrotik.py <asset-dir> [out.pptx]
Needs python-pptx. <asset-dir>/<diagram>.png: SVGs of public/praktik rendered at 2x;
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
T = DT.load("mikrotik")
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = T.ink, T.accent, T.amber, T.card, T.grey, C("FFFFFF"), T.line
TITLE_PT = round(32 * T.scale)
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/MikroTik_RouterOS_Dasar.pptx"
DECK = "MikroTik RouterOS Dasar  |  Kerangka MTCNA"

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
    s.shapes.add_picture(os.path.join(ASSET, "icons", "router-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
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


PROMPT = "[admin@MikroTik] > "
SKY, SUN, MUTE = C("7DD3FC"), C("FCD34D"), C("64748B")


def term_runs(cmd, width=54):
    """One command -> physical lines of (text, color, bold) runs, RouterOS style:
    path in white, key in sky blue, value in amber, long lines wrapped with a trailing backslash."""
    if cmd.startswith("#"):
        return [[(cmd, MUTE, False)]]
    toks = cmd.split(" ")
    i = next((k for k, t in enumerate(toks) if "=" in t), len(toks))
    path, params = " ".join(toks[:i]), toks[i:]
    lines, cur, used = [], [(PROMPT, GREEN, True), (path, WHITE, True)], len(PROMPT) + len(path)
    for t in params:
        if used + 1 + len(t) + 2 > width:
            cur.append((" \\", MUTE, False)); lines.append(cur)
            cur, used = [("    ", WHITE, False)], 4
        else:
            cur.append((" ", WHITE, False)); used += 1
        k, _, v = t.partition("=")
        cur += [(k + "=", SKY, False), (v, SUN, False)]; used += len(t)
    lines.append(cur)
    return lines


def L_term(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    card(s, 0.6, 1.85, 6.3, 4.9, C("0B1220"))
    rect(s, 0.6, 2.2, 6.3, 0.04, C("1E293B"))
    for j, col in enumerate(("EF4444", "F59E0B", "10B981")):
        shape(s, MSO_SHAPE.OVAL, 0.85 + j * 0.27, 2.0, 0.15, 0.15, C(col))
    text(s, 1.85, 1.97, 4.8, 0.25, "admin@MikroTik - terminal", 10, color=MUTE, gap=0, font="DejaVu Sans Mono")
    tb = s.shapes.add_textbox(Inches(0.9), Inches(2.5), Inches(5.8), Inches(4.1)); tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    first = True
    phys = [(ln, last) for cmd in term for ln, last in ((l, j == len(term_runs(cmd)) - 1) for j, l in enumerate(term_runs(cmd)))]
    phys.append(([(PROMPT, GREEN, True), ("\u2588", GREEN, False)], True))
    for runs, last in phys:
        p = tf.paragraphs[0] if first else tf.add_paragraph(); first = False
        p.space_after = Pt(11 if last else 2)
        for t, col, bold in runs:
            r = p.add_run(); r.text = t; r.font.size = Pt(12); r.font.name = "DejaVu Sans Mono"; r.font.color.rgb = col; r.font.bold = bold
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



A_LAY = [L_row5, L_term, L_steps, L_grid4, L_term, L_row5, L_steps, L_term, L_grid4, L_term, L_row5, L_steps]
B_NOPIC = {3: L_grid4, 7: L_row5, 12: L_grid4}
ICA = ["cpu hard-drive layers terminal router", "terminal folder list-checks search file-text", "package download save file-text hard-drive",
       "share-2 layers wrench link shield-check", "split users globe wifi ban", "route list-checks link settings globe",
       "radio wifi eye signal gauge", "shield-check layers router list-checks ban", "shuffle eye arrow-left-right globe ban",
       "gauge users list-checks trending-up clock", "link shield-check settings key-round network", "activity eye gauge file-text search"]
ICB = {3: "rotate-ccw plug key-round settings lock", 7: "lock globe link users ban", 12: "chart-line bell cpu wrench file-text"}
TERM = {
 2: ["# Melihat dan mengubah konfigurasi", "/ip address print", "/ip address add address=192.168.88.1/24 interface=ether2", "/interface print", "/export"],
 5: ["/interface bridge add name=bridge1", "/interface bridge port add bridge=bridge1 interface=ether2", "/interface bridge port add bridge=bridge1 interface=ether3", "/ip address add address=192.168.88.1/24 interface=bridge1"],
 8: ["/ip firewall filter add chain=input connection-state=established,related action=accept", "/ip firewall filter add chain=input connection-state=invalid action=drop", "/ip firewall filter add chain=input in-interface=ether2 action=accept", "/ip firewall filter add chain=input action=drop", "# Uji dulu agar tidak terkunci"],
 10: ["/queue simple add name=kantor target=192.168.88.0/24 max-limit=5M/10M", "/queue simple print"],
}

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
DT.motif(s, shape, rect, T)
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "router-w.png"), Inches(9.95), Inches(2.75), Inches(1.4), Inches(1.4))
text(s, 0.9, 1.9, 7, 0.4, "KERANGKA MTCNA", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "MikroTik RouterOS Dasar", round(50 * T.scale), True, WHITE, gap=0, font=T.font)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 12 bab, dari Winbox dan CLI sampai firewall, VPN, dan monitoring", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda + disclaimer
s = base("Peta Materi", 2, "AGENDA")
AG = "router terminal settings package network split route wifi shield-check shuffle gauge link".split()
AG = ["router", "terminal", "package", "share-2", "split", "route", "wifi", "shield-check", "shuffle", "gauge", "link", "activity"]
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 4) * 3.05, 1.7 + (i // 4) * 1.45
    card(s, x, y, 2.9, 1.3)
    icon(s, AG[i], x + 0.2, y + 0.18, 0.55)
    text(s, x + 2.0, y + 0.2, 0.75, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.82, 2.55, 0.45, c[0], 13, True, gap=0)
bar(s, 6.1, "Kelas ini tidak resmi dan tidak berafiliasi dengan MikroTik. Susunannya mengikuti kerangka MTCNA publik bertanggal 22 Januari 2016, yang bisa berubah. Sebelum ujian resmi, cek outline terbaru di situs resmi MikroTik.", "lightbulb", "Catatan penting:")

# 3-26 modules
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  \u2022  {ch.upper()}"
    ica = ICA[i - 1].split()
    A_LAY[i - 1](a[0], n, a[1], k, None, ica, TERM.get(i)); n += 1
    if b[2]:
        L_pic(i % 2 == 1)(b[0], n, b[1], k, b[2], None, None)
    else:
        B_NOPIC[i](b[0], n, b[1], k, None, ICB[i].split(), None)
    n += 1

# 27 rangkuman, 28 closing
L_steps("Rangkuman", 27, ["Mulai dari Winbox, CLI, dan konfigurasi internet awal", "Rawat router: backup, export, upgrade, dan amankan layanan",
    "Jaringan lokal: DHCP, ARP, bridge, routing statik, dan wireless", "Lindungi dan atur lalu lintas: firewall, NAT, queue",
    "Hubungkan lokasi dengan VPN dan pantau dengan alat bantu"], "RANGKUMAN", None, "terminal wrench network shield-check activity".split(), None)
L_grid4("Langkah berikutnya", 28, ["Praktikkan tiap bab di router asli, simulator, atau CHR", "Kerjakan latihan dan ujian di akhir kelas",
    "Cek outline MTCNA terbaru sebelum ujian resmi MikroTik", "Lanjut belajar ke topik jaringan berikutnya di Ruang Materi",
    "Terima kasih - tetap rajin praktik!"], "PENUTUP", None, "terminal clipboard-check book-open rocket".split(), "")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
