#!/usr/bin/env python3
"""Generate the 24-slide Linux dan Terminal support deck, in the style of the
other class decks (white slides, kicker, soft cards, round icons, dark callout bar).
Usage: python scripts/deck-linux.py <asset-dir> [out.pptx]
Needs python-pptx. <asset-dir> comes from node scripts/deck-linux-assets.mjs <asset-dir>
(<diagram>.png and icons/<lucide-name>-w.png / -k.png).
Slide count and order are fixed: chapter slide ranges in content/drafts/linux-dan-terminal.json point at them."""
import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from PIL import Image
import deck_theme as DT

C = lambda h: RGBColor.from_string(h)
T = DT.load("linux")
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = T.ink, T.accent, T.amber, T.card, T.grey, C("FFFFFF"), T.line
TITLE_PT = round(32 * T.scale)
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/Linux_dan_Terminal.pptx"
DECK = "Linux dan Terminal  |  Ruang Materi"

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
    s.shapes.add_picture(os.path.join(ASSET, "icons", "terminal-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
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


SKY, SUN, MUTE, OUTC = C("7DD3FC"), C("FCD34D"), C("64748B"), C("CBD5E1")


def term_runs(cmd):
    """One entry -> one physical line of (text, color, bold) runs. '#' comment, '=' program output,
    '|' script text without prompt, anything else a command after a green $ prompt (flags in amber)."""
    if cmd.startswith("#"):
        return [(cmd, MUTE, False)]
    if cmd.startswith("="):
        return [(cmd[1:], OUTC, False)]
    if cmd.startswith("|"):
        return [(cmd[1:], SKY, False)]
    toks = cmd.split(" ")
    runs = [("$ ", GREEN, True), (toks[0], WHITE, True)]
    for t in toks[1:]:
        runs.append((" " + t, SUN if t.startswith("-") else WHITE, False))
    return runs


def L_term(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    card(s, 0.6, 1.85, 6.3, 4.9, C("0B1220"))
    rect(s, 0.6, 2.2, 6.3, 0.04, C("1E293B"))
    for j, col in enumerate(("EF4444", "F59E0B", "10B981")):
        shape(s, MSO_SHAPE.OVAL, 0.85 + j * 0.27, 2.0, 0.15, 0.15, C(col))
    text(s, 1.85, 1.97, 4.8, 0.25, "budi@lab: ~ - terminal", 10, color=MUTE, gap=0, font="DejaVu Sans Mono")
    tb = s.shapes.add_textbox(Inches(0.9), Inches(2.5), Inches(5.8), Inches(4.1)); tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    entries = list(term) + ["$cursor"]
    for i, cmd in enumerate(entries):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        nxt = entries[i + 1] if i + 1 < len(entries) else ""
        p.space_after = Pt(2 if nxt.startswith("=") else 8)
        runs = [("$ ", GREEN, True), ("\u2588", GREEN, False)] if cmd == "$cursor" else term_runs(cmd)
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


# (chapter title, slide A: (layout, title, bullets, icons, term), slide B: (layout, title, bullets, icons, term or pic name))
CH = [
 ("Terminal dan Navigasi",
  (L_row5, "Terminal, shell, dan Bash", ["Terminal adalah jendelanya; shell membaca dan menjalankan perintah", "Bash adalah shell paling umum; zsh dan fish serupa", "Prompt: pengguna@host:folder. $ berarti biasa, # berarti root", "Bentuk perintah: perintah, opsi, argumen", "Huruf besar dan kecil dibedakan: ls bukan LS"], "terminal braces user list-checks eye", None),
  (L_pic(True), "Pohon direktori dan navigasi", ["Satu pohon berakar di /, tanpa C: atau D:", "/etc konfigurasi, /home pengguna, /var/log log, /tmp sementara", "pwd menunjukkan posisi, ls -la isi lengkap, cd berpindah", "Path absolut diawali /, relatif dihitung dari folder kerja", "Pintasan: . .. ~ dan cd -; Tab melengkapi nama"], None, "linux-tree")),
 ("Perintah Dasar Berkas",
  (L_term, "Membuat, menyalin, memindah, menghapus", ["mkdir -p membuat seluruh rantai folder", "touch membuat berkas kosong", "cp -r menyalin folder; cp dan mv menimpa tanpa tanya", "mv memindah sekaligus mengganti nama", "rm tidak punya tempat sampah: ls dulu, baru rm"], "folder-plus file-plus copy move trash", ["# buat, salin, pindah, hapus", "mkdir -p proyek/src", "touch proyek/catatan.txt", "cp -r proyek proyek-lama", "mv proyek-lama arsip", "ls arsip", "=catatan.txt  src", "rm -i arsip/catatan.txt"]),
  (L_grid4, "Membaca berkas dan wildcard", ["cat untuk berkas pendek, less untuk membaca per halaman", "head dan tail menampilkan awal dan akhir; tail -f memantau log", "wc menghitung baris, kata, dan byte", "Wildcard * ? [..] diperluas shell dan tidak mencocokkan berkas tersembunyi", "Jalankan ls dengan pola yang sama sebelum memakai rm"], "file-text eye list-checks asterisk", None)),
 ("Mencari dengan grep dan find",
  (L_steps, "grep: mencari baris yang cocok", ["grep pola berkas mencari baris yang mengandung pola", "-i abaikan huruf, -v balik, -n nomor baris, -c hitung", "-r menelusuri folder, -l hanya mencetak nama berkas", "Pola adalah regex: titik berarti satu karakter apa saja", "Beri kutip pada pola agar tidak diperluas shell"], "search funnel folder-search regex terminal", None),
  (L_pic(False), "find: mencari berkas", ["find mencari berkas menurut nama, tipe, ukuran, dan umur", "find . -name \"*.conf\" -type f -mtime -2", "-exec ... {} + atau -delete bertindak atas hasil; uji tanpa itu dulu", "grep mencari isi, find mencari berkas; keduanya sering digabung", "2>/dev/null menyembunyikan Permission denied saat find /"], None, "grep-vs-find")),
 ("Izin dan Kepemilikan",
  (L_row5, "Membaca izin berkas", ["ls -l menampilkan tipe, izin, pemilik, dan grup", "Tiga kelompok: pemilik (u), grup (g), lainnya (o)", "r baca, w tulis, x jalankan atau masuk folder", "Pada folder, w berarti boleh membuat dan menghapus isi", "Pemilik dinilai lebih dulu, lalu grup, lalu lainnya"], "list-checks users key-round folder lock", None),
  (L_pic(True), "chmod, chown, dan umask", ["Oktal: r=4, w=2, x=1, jumlahkan per kelompok", "chmod u+x skrip atau chmod 644 berkas", "chown user:grup mengganti pemilik, biasanya dengan sudo", "umask 022: berkas baru 644, folder baru 755", "Jangan pakai chmod 777; beri izin sesempit mungkin"], None, "izin-rwx")),
 ("Pipe, Redirect, dan Filter",
  (L_term, "Redirect dan pipe", ["stdin (0), stdout (1), stderr (2)", "> menimpa, >> menambah, 2> mengalihkan galat", "| menyambung stdout ke stdin program berikutnya", "sort, uniq -c, cut, tr, awk, wc memfilter teks", "tee menyimpan sambil meneruskan; xargs mengubah baris jadi argumen"], "arrow-right-left file-output workflow funnel split", ["# redirect", "ls /etc > daftar.txt", "echo baru >> daftar.txt", "find / -name x 2>/dev/null", "# pipe", "grep Failed auth.log | wc -l", "=2"]),
  (L_pic(False), "Merangkai perkakas kecil", ["Pola ringkas log: awk, sort, uniq -c, sort -rn, head", "uniq hanya menggabungkan baris yang bersebelahan, sort dulu", "Pipe hanya membawa stdout; 2>&1 menyertakan galat", "sudo echo x > f gagal; pakai echo x | sudo tee f", "Pakai -print0 dengan xargs -0 untuk nama berspasi"], None, "pipe-stream")),
 ("Proses dan Sinyal",
  (L_steps, "Proses dan PID", ["Proses adalah program yang berjalan, punya PID dan induk (PPID)", "ps aux dan pgrep mencari proses; pstree menunjukkan pohonnya", "top dan htop memantau CPU dan memori langsung", "free -h memori, uptime beban, ss -tlnp port yang didengarkan", "systemctl status menunjukkan keadaan layanan"], "cpu search activity gauge server", None),
  (L_pic(True), "Sinyal dan pekerjaan", ["kill PID mengirim SIGTERM (15); kill -9 hanya jika macet", "SIGHUP sering berarti muat ulang konfigurasi", "&, jobs, fg, bg, dan Ctrl+Z mengatur pekerjaan di shell", "nohup, tmux, atau systemd menjaga proses tetap hidup", "Kode keluar $?: 0 sukses; 137 berarti SIGKILL"], None, "proses-sinyal")),
 ("Paket apt dan Sistem",
  (L_term, "Memasang dan memperbarui paket", ["Paket berasal dari repositori, dependensi diselesaikan otomatis", "update menyegarkan daftar, upgrade menaikkan versi", "remove menyimpan konfigurasi, purge menghapusnya", "dpkg -L dan -S memeriksa berkas milik paket", "Pasang hanya dari sumber tepercaya"], "package download trash search shield-check", ["# jalankan update dulu", "sudo apt update", "sudo apt install nginx", "apt policy nginx", "sudo apt remove nginx", "sudo apt purge nginx", "sudo apt autoremove"]),
  (L_grid4, "Memeriksa keadaan sistem", ["cat /etc/os-release dan uname -r: versi distro dan kernel", "free -h dan uptime: memori, beban, waktu hidup", "df -h melihat partisi, du -sh melihat ukuran folder", "ip -br a dan ss -tlnp: alamat IP dan port terbuka", "Disk penuh: df -h dulu, lalu du --max-depth=1 sampai ketemu"], "server cpu folder-tree arrow-right-left", None)),
 ("Pengguna, Grup, dan sudo",
  (L_grid4, "Pengguna dan grup", ["UID: 0 root, 1-999 akun sistem, 1000 ke atas manusia", "/etc/passwd tujuh kolom, /etc/shadow menyimpan hash sandi", "adduser interaktif, useradd tingkat rendah, userdel -r hapus akun", "usermod -aG menambah grup; tanpa -a daftar lama terganti", "Akun layanan memakai shell nologin dan hak sempit"], "users file-text user-plus users-round", None),
  (L_pic(False), "Berkas akun dan sudo", ["sudo menjalankan satu perintah dengan hak root atas namamu", "Tercatat di /var/log/auth.log sebagai jejak audit", "Sunting aturan dengan visudo, bukan editor biasa", "Ubuntu: akun root tanpa sandi, tugas admin lewat sudo", "Beri hak sesempit mungkin, mis. satu perintah untuk satu grup"], None, "passwd-kolom")),
 ("Shell Scripting Dasar",
  (L_term, "Skrip pertama", ["Skrip: berkas teks dengan shebang dan chmod +x", "Variabel tanpa spasi di sekitar =; kutip \"$variabel\"", "$1, $#, \"$@\" membaca argumen", "if, case, for, while, dan fungsi dengan local", "set -euo pipefail menghentikan skrip saat ada galat"], "file-code braces terminal repeat shield-check", ["# isi salam.sh", "|#!/usr/bin/env bash", "|set -euo pipefail", "|nama=\"${1:-dunia}\"", "|echo \"Halo, $nama\"", "# jalankan", "chmod +x salam.sh", "./salam.sh Budi", "=Halo, Budi"]),
  (L_steps, "Skrip yang aman dan terjadwal", ["Periksa masukan di awal, kirim galat ke stderr, exit dengan kode jelas", "bash -n memeriksa sintaks, bash -x menelusuri eksekusi", "shellcheck menangkap kesalahan kutip dan sintaks", "crontab -e: menit jam hari bulan hari-minggu perintah", "Di cron pakai path absolut dan alihkan keluaran ke log"], "list-checks bug search calendar-clock file-text", None)),
 ("SSH dan Akses Jarak Jauh",
  (L_steps, "Masuk ke server dengan SSH", ["ssh pengguna@host menyambung lewat port 22, terenkripsi", "Cocokkan fingerprint saat pertama kali; tersimpan di known_hosts", "ssh -p port dan ssh host \"perintah\" untuk perintah jarak jauh", "scp menyalin sederhana; rsync -avz hanya mengirim perubahan", "~/.ssh/config memberi nama pendek: Host, HostName, User, Port"], "terminal shield-check send upload settings", None),
  (L_pic(True), "Kunci SSH dan keamanan", ["ssh-keygen -t ed25519 membuat pasangan kunci; beri passphrase", "ssh-copy-id memasang kunci publik di authorized_keys", "Izin: ~/.ssh 700, kunci privat dan authorized_keys 600", "Server: PermitRootLogin no, matikan sandi setelah uji kunci", "Simpan sesi cadangan sebelum mengubah sshd_config"], None, "ssh-kunci")),
]

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
DT.motif(s, shape, rect, T)
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "terminal-w.png"), Inches(9.95), Inches(2.75), Inches(1.4), Inches(1.4))
text(s, 0.9, 1.9, 7, 0.4, "DASAR SISTEM", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "Linux dan Terminal", round(50 * T.scale), True, WHITE, gap=0, font=T.font)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 10 bab, dari filesystem dan perintah dasar sampai izin, pipe, skrip, dan SSH", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda + note
s = base("Peta Materi", 2, "AGENDA")
AG = ["terminal", "copy", "search", "lock", "workflow", "cpu", "package", "users", "file-code", "send"]
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 5) * 2.47, 1.7 + (i // 5) * 1.95
    card(s, x, y, 2.3, 1.75)
    icon(s, AG[i], x + 0.2, y + 0.2, 0.6)
    text(s, x + 1.35, y + 0.22, 0.8, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.98, 1.95, 0.7, c[0], 13.5, True, gap=0)
bar(s, 5.85, "Contoh perintah memakai Bash di Ubuntu 24.04. Distro lain berbeda terutama pada manajer paket dan nama layanan. Berlatihlah di mesin virtual, WSL, atau kontainer, bukan di server yang dipakai orang lain.", "lightbulb", "Catatan:")

# 3-22 chapters
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  •  {ch.upper()}"
    lay, ttl, bl, ics, term = a
    lay(ttl, n, bl, k, None, ics.split(), term); n += 1
    lay, ttl, bl, ics, pic = b
    lay(ttl, n, bl, k, pic, ics.split() if ics else None, None)
    n += 1

# 23 rangkuman, 24 penutup
L_steps("Rangkuman", 23, ["Navigasi dan berkas: pwd, ls, cd, cp, mv, rm", "Cari dengan grep dan find; rangkai dengan pipe dan redirect",
    "Izin dan pengguna: chmod, chown, sudo", "Proses dan paket: ps, kill, apt, df", "Otomatisasi dan akses jarak jauh: skrip Bash, cron, SSH"], "RANGKUMAN", None, "terminal search lock cpu send".split(), None)
L_grid4("Langkah berikutnya", 24, ["Latih tiap perintah di mesin virtual atau WSL", "Kerjakan latihan, proyek Terminal Mini, dan ujian",
    "Lanjut ke Administrasi Server dan Keamanan atau kelas Docker", "Buka man dan --help sebelum menyalin perintah dari internet", "Terima kasih, tetap rajin berlatih di terminal!"], "PENUTUP", None, "terminal clipboard-check book-open rocket".split(), "")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
