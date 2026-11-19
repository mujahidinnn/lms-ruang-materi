#!/usr/bin/env python3
"""Generate the 24-slide Docker dan Deployment support deck, in the style of the
other class decks (white slides, kicker, soft cards, round icons, dark callout bar).
Usage: python scripts/deck-docker.py <asset-dir> [out.pptx]
Needs python-pptx. <asset-dir>/<diagram>.png: SVGs of public/praktik (docker-*) rendered at 2x;
<asset-dir>/icons/<lucide-name>-w.png (white) and -k.png (green) 256px icons,
logo-<simple-icons-name>-w/-k.png brand logos (Simple Icons).
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
T = DT.load("docker")
INK, GREEN, AMBER, CARD, GREY, WHITE, LINE = T.ink, T.accent, T.amber, T.card, T.grey, C("FFFFFF"), T.line
TITLE_PT = round(32 * T.scale)
ASSET = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/Docker_dan_Deployment.pptx"
DECK = "Docker dan Deployment"

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
    s.shapes.add_picture(os.path.join(ASSET, "icons", "container-k.png"), Inches(12.2), Inches(0.4), Inches(0.42), Inches(0.42))
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


PROMPT = "$ "
SKY, SUN, MUTE = C("7DD3FC"), C("FCD34D"), C("64748B")


def term_runs(cmd, width=46):
    """One shell command -> physical lines of (text, color, bold) runs: command words in white,
    flags in sky blue, values in amber, long lines wrapped with a trailing backslash."""
    if cmd.startswith("#"):
        return [[(cmd, MUTE, False)]]
    toks = cmd.split(" ")
    lines, cur, used = [], [(PROMPT, GREEN, True)], len(PROMPT)
    for i, t in enumerate(toks):
        if used + 1 + len(t) + 2 > width and i > 0:
            cur.append((" \\", MUTE, False)); lines.append(cur)
            cur, used = [("  ", WHITE, False)], 2
        elif i > 0:
            cur.append((" ", WHITE, False)); used += 1
        if i < 2 and not t.startswith("-"):
            cur.append((t, WHITE, True))
        elif t.startswith("-"):
            cur.append((t, SKY, False))
        else:
            cur.append((t, SUN, False))
        used += len(t)
    lines.append(cur)
    return lines


def L_term(title, n, b, k, pic, ic, term):
    s = base(title, n, k)
    card(s, 0.6, 1.85, 6.3, 4.9, C("0B1220"))
    rect(s, 0.6, 2.2, 6.3, 0.04, C("1E293B"))
    for j, col in enumerate(("EF4444", "F59E0B", "10B981")):
        shape(s, MSO_SHAPE.OVAL, 0.85 + j * 0.27, 2.0, 0.15, 0.15, C(col))
    text(s, 1.85, 1.97, 4.8, 0.25, "terminal", 10, color=MUTE, gap=0, font="DejaVu Sans Mono")
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
 ("Kenapa Container?",
  ("Masalah: di laptopku jalan", ["Aplikasi bergantung pada runtime, library, dan konfigurasi di sekitarnya", "Server yang berbeda sedikit saja bisa membuat perilaku berbeda", "Dokumen instalasi cepat usang dan sering terlewat", "Container mengemas kode beserta lingkungannya", "Hasil: perilaku sama di laptop, CI, dan produksi"]),
  ("Container bukan mesin virtual", ["Mesin virtual membawa sistem operasi tamu lengkap dengan kernelnya", "Container berbagi kernel host dan dikurung dengan namespace dan cgroup", "Ukuran puluhan megabyte dan start dalam hitungan detik", "Isolasi lebih tipis daripada VM, bukan batas keamanan untuk kode asing", "Di Windows dan macOS, Docker Desktop memakai satu VM Linux"], "docker-vm-vs-container")),
 ("Image dan Container",
  ("Siklus hidup container", ["Image: paket hanya baca, container: image yang berjalan", "docker run membuat container baru, docker start menghidupkan yang lama", "docker stop mengirim SIGTERM, lalu SIGKILL setelah 10 detik", "docker logs dan docker exec dipakai untuk diagnosis", "docker rm menghapus container beserta lapisan tulisnya"]),
  ("Layer dan nama image", ["Image berupa layer hanya baca yang dipakai bersama dan di-cache", "Container menambah satu lapisan tulis yang hilang bersama container", "Nama image: registry/pemilik/repositori:tag", "Tanpa tag berarti latest, yang hanya nama biasa", "Di produksi pakai tag spesifik seperti node:24-alpine"], "docker-image-layers")),
 ("Dockerfile Dasar",
  ("Instruksi inti Dockerfile", ["FROM memilih image dasar, misalnya node:24-alpine", "WORKDIR menetapkan folder kerja di dalam image", "COPY menyalin berkas dari konteks build ke image", "RUN berjalan saat build dan hasilnya menjadi layer", "CMD berjalan saat container menyala, tulis dalam bentuk array"]),
  ("Cache, ignore, dan build", ["Salin package*.json dan jalankan npm ci sebelum COPY . .", "Yang jarang berubah di atas, yang sering berubah di bawah", ".dockerignore mengeluarkan node_modules, .git, dan .env", "docker build -t nama:tag . dengan titik sebagai konteks build", "EXPOSE hanya dokumentasi; port dibuka dengan -p"], None)),
 ("Dockerfile untuk Produksi",
  ("Checklist Dockerfile produksi", ["Tag image spesifik, bukan latest", "npm ci --omit=dev agar tanpa devDependencies", "USER node supaya tidak berjalan sebagai root", "HEALTHCHECK ke endpoint /health aplikasi", "CMD exec form dan tangani SIGTERM dengan server.close"]),
  ("Multi-stage build", ["Beberapa FROM dalam satu Dockerfile", "Stage build memuat compiler dan devDependencies", "Stage final hanya menyalin hasil dengan COPY --from=build", "Image akhir kecil dan permukaan serangan lebih sempit", "Hanya stage terakhir yang menjadi image hasil"], "docker-multi-stage")),
 ("Volume dan Network",
  ("Menyimpan data", ["Lapisan tulis container hilang saat container dihapus", "Named volume: data awet yang dikelola Docker", "Bind mount: folder host, cocok untuk pengembangan", "Volume bukan cadangan: buat pg_dump dan simpan di luar server", "docker compose down -v dan prune --volumes menghapus volume"]),
  ("Network dan port", ["Network buatan sendiri menyediakan DNS antar container", "Panggil container lain lewat nama, bukan IP", "Port internal tidak perlu -p untuk antar container", "-p HOST:CONTAINER hanya untuk akses dari luar", "Database jangan dipublikasikan; ikat ke 127.0.0.1 bila perlu"], "docker-volume-network")),
 ("Docker Compose",
  ("Satu berkas, banyak service", ["compose.yaml mendeskripsikan service, volume, dan network", "Nama service menjadi nama host di network otomatis", "depends_on dengan service_healthy menunggu database siap", "down menjaga volume, down -v menghapusnya", "compose.override.yaml untuk pengaturan pengembangan"]),
  ("Perintah dan arsitektur", ["docker compose up -d --build menjalankan semuanya", "docker compose logs -f api mengikuti log satu service", "docker compose config memvalidasi hasil akhir", "Service tanpa ports hanya terjangkau di network internal", "Tambah Redis atau alat lain dengan satu blok service"], "docker-compose-stack")),
 ("Variabel Lingkungan dan Rahasia",
  ("Konfigurasi di lingkungan", ["Satu image yang sama untuk semua lingkungan", "Baca konfigurasi lewat process.env dan gagal cepat bila kosong", "-e, --env-file, environment, dan env_file mengisi variabel", "Compose membaca .env untuk interpolasi di compose.yaml", "Beri contoh nama variabel lewat berkas .env.example"]),
  ("Menjaga rahasia", ["Jangan commit .env; masukkan ke .gitignore dan .dockerignore", "ENV dan ARG tersimpan di image, jangan taruh rahasia di sana", "Rahasia yang pernah ter-commit harus diganti (rotasi)", "Compose secrets menaruh rahasia di /run/secrets sebagai berkas", "openssl rand -base64 32 untuk membuat nilai acak"], None)),
 ("Deploy ke VPS dan PaaS",
  ("Menyiapkan VPS", ["Buat pengguna biasa dengan kunci SSH", "Matikan login root dan login sandi setelah uji kunci", "UFW hanya membuka SSH, 80, dan 443", "Pasang Docker dari repositori apt resmi", "Grup docker setara hak root, beri dengan hati-hati"]),
  ("Menjalankan dan memperbarui", ["Docker melewati UFW untuk port yang dipublikasikan", "docker compose pull lalu up -d memperbarui service", "Rollback: jalankan lagi tag lama", "Putar log, pantau disk, dan cadangkan data", "PaaS: hubungkan repositori, atur variabel, baca PORT"], None)),
 ("Reverse Proxy dan HTTPS",
  ("Peran reverse proxy", ["Menerima lalu lintas publik di port 80 dan 443", "Mengurus sertifikat TLS dan pengalihan ke HTTPS", "Meneruskan ke aplikasi lewat network internal", "Satu server bisa melayani banyak domain", "Aplikasi tidak perlu terbuka langsung ke internet"]),
  ("Caddy, Nginx, dan DNS", ["Record A mengarahkan domain ke IP server", "Let's Encrypt butuh port 80 dan 443 terbuka", "Caddy: reverse_proxy api:3000 sudah cukup", "Nginx: proxy_pass dan proxy_set_header, Certbot untuk sertifikat", "Express: app.set(\"trust proxy\", 1)"], "docker-reverse-proxy-https")),
 ("CI/CD dengan GitHub Actions",
  ("Workflow GitHub Actions", ["Berkas YAML di .github/workflows/", "on menentukan pemicu: push dan pull request", "jobs berisi steps yang berjalan di runner bersih", "needs merangkai job: tes, publish, deploy", "Gagal di satu step menghentikan seluruh job"]),
  ("Dari push sampai deploy", ["Login ke ghcr.io dengan GITHUB_TOKEN dan packages: write", "metadata-action menghitung tag, misalnya sha dan semver", "build-push-action membangun dan mengirim image", "Kunci SSH dan token disimpan di GitHub Secrets", "Deploy: ssh ke server, compose pull, lalu up -d"], "docker-cicd-pipeline")),
]


A_LAY = [L_row5, L_term, L_steps, L_row5, L_grid4, L_term, L_steps, L_row5, L_grid4, L_steps]
B_NOPIC = {3: L_grid4, 7: L_grid4, 8: L_term}
ICA = ["bug server clock container circle-check", "play square-terminal scroll-text refresh-cw box", "container folder file-text hammer play",
       "tag package user heart-pulse zap", "hard-drive database folder save", "file-cog link terminal network settings",
       "layers terminal key-round file-text list-checks", "user key-round shield-check package lock", "globe lock arrow-left-right share-2",
       "workflow git-branch boxes key-round rocket"]
ICB = {3: "layers file-lock hammer plug", 7: "file-lock key-round rotate-ccw shield-check", 8: "server refresh-cw rotate-ccw activity cloud"}
TERM_A = {
 2: ["docker run -d --name web -p 8080:80 nginx:alpine", "docker ps", "docker logs -f web", "docker exec -it web sh", "docker stop web", "docker rm web"],
 6: ["# compose.yaml: api + db + volume", "docker compose up -d --build", "docker compose ps", "docker compose logs -f api", "docker compose exec db psql -U app appdb", "docker compose down"],
}
TERM_B = {8: ["ssh deploy@IP_SERVER", "cd /srv/toko", "docker compose pull", "docker compose up -d", "docker compose logs -f --tail 100 api", "# rollback: ganti TAG ke versi lama lalu up -d"]}

# 1: title
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, INK)
DT.motif(s, shape, rect, T)
shape(s, MSO_SHAPE.OVAL, 9.35, 2.15, 2.6, 2.6, GREEN)
s.shapes.add_picture(os.path.join(ASSET, "icons", "logo-docker-w.png"), Inches(9.9), Inches(2.7), Inches(1.5), Inches(1.5))
text(s, 0.9, 1.9, 7, 0.4, "KEMAS, JALANKAN, DEPLOY", 14, True, AMBER, gap=0, spc=300)
text(s, 0.9, 2.5, 7.4, 2.2, "Docker dan Deployment", round(50 * T.scale), True, WHITE, gap=0, font=T.font)
text(s, 0.9, 4.6, 7.2, 1.2, "Dek pendukung kelas: 10 bab, dari container pertama sampai HTTPS dan pipeline GitHub Actions", 18, False, C("CBD5E1"), gap=0)
text(s, 0.9, 6.8, 6, 0.3, "Ruang Materi", 11, True, GREEN, gap=0, spc=250)

# 2: agenda + logos
s = base("Peta Materi", 2, "AGENDA")
AG = ["container", "box", "file-text", "shield-check", "hard-drive", "layers", "key-round", "server", "globe", "workflow"]
for i, c in enumerate(CH):
    x, y = 0.6 + (i % 5) * 2.45, 1.7 + (i // 5) * 1.55
    card(s, x, y, 2.3, 1.4)
    icon(s, AG[i], x + 0.2, y + 0.18, 0.55)
    text(s, x + 1.3, y + 0.2, 0.8, 0.4, f"{i + 1:02d}", 18, True, GREY, gap=0, align=PP_ALIGN.RIGHT)
    text(s, x + 0.2, y + 0.82, 2.0, 0.5, c[0], 12.5, True, gap=0)
text(s, 0.6, 4.95, 6, 0.3, "ALAT DI KELAS INI", 11, True, GREEN, gap=0, spc=250)
for j, (lg, nm) in enumerate([("docker", "Docker"), ("postgresql", "PostgreSQL"), ("nodedotjs", "Node.js"), ("caddy", "Caddy"), ("nginx", "Nginx"), ("githubactions", "GitHub Actions")]):
    x = 0.6 + j * 2.03
    card(s, x, 5.3, 1.9, 0.6)
    s.shapes.add_picture(os.path.join(ASSET, "icons", "logo-" + lg + "-k.png"), Inches(x + 0.13), Inches(5.4), Inches(0.4), Inches(0.4))
    text(s, x + 0.65, 5.3, 1.2, 0.6, nm, 11, True, gap=0, anchor=MSO_ANCHOR.MIDDLE)
bar(s, 6.1, "Kelas ini tidak resmi dan tidak berafiliasi dengan Docker, GitHub, atau pihak lain. Versi image dan action berubah dari waktu ke waktu; cek dokumentasi terbaru sebelum memakainya di produksi.", "lightbulb", "Catatan:")

# 3-22 chapters
n = 3
for i, (ch, a, b) in enumerate(CH, 1):
    k = f"BAB {i}  \u2022  {ch.upper()}"
    A_LAY[i - 1](a[0], n, a[1], k, None, ICA[i - 1].split(), TERM_A.get(i)); n += 1
    if b[2]:
        L_pic(i % 2 == 1)(b[0], n, b[1], k, b[2], None, None)
    else:
        B_NOPIC[i](b[0], n, b[1], k, None, ICB[i].split(), TERM_B.get(i))
    n += 1

# 23 rangkuman, 24 closing
L_steps("Rangkuman", 23, ["Container mengemas aplikasi dan lingkungannya; image dan container, layer dan cache", "Dockerfile produksi: multi-stage, USER node, HEALTHCHECK, tanpa rahasia",
    "Data di volume, container saling bicara lewat network, Compose menyatukan semuanya", "Konfigurasi di lingkungan, rahasia di .env atau secrets, bukan di image",
    "Deploy ke VPS dengan proxy HTTPS dan otomatiskan dengan GitHub Actions"], "RANGKUMAN", None, "container file-text database key-round workflow".split(), None)
L_grid4("Langkah berikutnya", 24, ["Kemas aplikasi Express milikmu dengan Dockerfile dan Compose", "Kerjakan latihan, proyek akhir, dan ujian di akhir kelas",
    "Sewa VPS kecil dan coba deploy lengkap dengan domain serta HTTPS", "Lanjut ke topik keamanan dan administrasi server di Ruang Materi",
    "Terima kasih - tetap rajin praktik!"], "PENUTUP", None, "terminal clipboard-check server book-open".split(), "")

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
