// Adds ![judul](sim:nama) embeds to chapters, in content/drafts and (with
// --db) in the live chapters, as the dev admin. Idempotent: a chapter that
// already has the embed is skipped. Live bodies are patched in place, never
// replaced by the draft, so admin edits survive.
//
//   npm run add:sims            (drafts)   npm run add:sims -- --db
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// `before` is the heading the block goes in front of.
const ADD = [
  { topic: "administrasi-server-dan-keamanan", chapter: "peran-sysadmin-dan-infrastruktur", before: "## Kesalahan umum di tahap awal", sim: "load-balancer",
    text: "## Load balancer: membagi beban\n\nSatu server punya batas. Load balancer berdiri di depan beberapa server dan membagi request yang masuk, sehingga tidak ada server yang kewalahan. Ia juga memeriksa kesehatan server: yang mati dilewati, dan pengguna tidak menyadarinya.\n\n![Load balancer membagi request ke tiga server](sim:load-balancer)\n\nCoba matikan dua server, lalu kirim banyak request. Server yang tersisa menanggung semuanya, dan itu alasan kapasitas cadangan perlu dihitung sejak awal.\n\n" },
  { topic: "jaringan-komputer", chapter: "model-osi-dan-tcp-ip", before: "## TCP dan UDP", sim: "enkapsulasi",
    text: "![Enkapsulasi: data dibungkus header di tiap lapisan](sim:enkapsulasi)\n\n" },
  { topic: "iot-otomasi-tingkat-lanjut", chapter: "mqtt-topik-dan-wildcard", before: "## Menulis pencocok topik", sim: "mqtt-pubsub",
    text: "![Publish/subscribe lewat broker dengan filter wildcard](sim:mqtt-pubsub)\n\n" },
  { topic: "pemrograman-mikrokontroler", chapter: "adc-dan-pwm", before: "## Empat pemakaian PWM", sim: "pwm",
    text: "![PWM: duty cycle menentukan tegangan rata-rata](sim:pwm)\n\n" },
  { topic: "html5-dan-css3", chapter: "box-model-display-dan-position", before: "## Hitung lebarnya: content-box vs border-box", sim: "box-model",
    text: "![Box model: margin, border, padding, dan konten](sim:box-model)\n\n" },
  { topic: "html5-dan-css3", chapter: "box-model-display-dan-position", before: "## z-index: siapa di atas", sim: "css-position",
    text: "![Playground position dan z-index](sim:css-position)\n\n" },
  { topic: "html5-dan-css3", chapter: "flexbox-dan-grid", before: "## CSS Grid: tata letak dua dimensi", sim: "flexbox",
    text: "![Playground Flexbox dan Grid](sim:flexbox)\n\n" },
  { topic: "html5-dan-css3", chapter: "transform-transition-dan-animasi", before: "## @keyframes dan animation", sim: "css-transition",
    text: "![Transition: easing, durasi, dan properti](sim:css-transition)\n\n" },
  { topic: "git", chapter: "branch-merge-rebase-dan-konflik", before: "## Kapan merge, kapan rebase?", sim: "git-graph",
    text: "## Coba sendiri: graf commit\n\nBuat commit dan branch, lalu gabungkan dengan merge atau rebase. Perhatikan merge membuat commit berinduk dua, sedangkan rebase memutar ulang commit dengan hash baru dan commit lama memudar.\n\n![Graf commit: commit, branch, merge, dan rebase](sim:git-graph)\n\n" },
  { topic: "git", chapter: "empat-area-kerja-dan-cara-git-menyimpan", before: "## Status file", sim: "git-areas",
    text: "![Perubahan berpindah antara working directory, staging, local repo, dan remote](sim:git-areas)\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "pengurutan", before: "## Stabil atau tidak", sim: "sorting",
    text: "## Lihat pengurutan bekerja\n\nBandingkan cara kerja lima algoritma pada data yang sama. Perhatikan seberapa cepat penghitung perbandingan dan pertukaran naik pada algoritma O(n^2) dibanding merge sort.\n\n![Visualisasi bubble, selection, insertion, merge, dan quick sort](sim:sorting)\n\nCoba tekan Data baru lalu bandingkan insertion sort dengan bubble sort pada data yang sama. Selisih jumlah langkahnya menjelaskan mengapa O(n log n) layak dipelajari.\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "pencarian", before: "## Syarat dan jebakan", sim: "binary-search",
    text: "## Linear lawan biner, berdampingan\n\nPilih angka yang dicari dan jalankan kedua pencarian sekaligus. Pencarian linear memeriksa satu per satu, pencarian biner membuang separuh ruang di tiap langkah.\n\n![Pencarian linear dan biner berdampingan dengan penanda kiri, tengah, kanan](sim:binary-search)\n\nPilih angka yang tidak ada di list: linear harus memeriksa semua elemen, sedangkan biner berhenti setelah beberapa langkah saja.\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "kompleksitas-dan-big-o", before: "## Kompleksitas memori", sim: "big-o",
    text: "## Rasakan lajunya\n\nGeser n dan lihat bagaimana keenam kelas kompleksitas menjauh satu sama lain. Dari tabel di bawah grafik, bandingkan jumlah langkah O(n) dengan O(n^2) lalu dengan O(2^n).\n\n![Grafik pertumbuhan O(1) sampai O(2^n) dengan tabel jumlah langkah](sim:big-o)\n\nNaikkan n sampai 60: O(2^n) sudah di luar jangkauan komputer mana pun, sama seperti yang disebut di atas.\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "graph-dasar", before: "## Komponen terhubung", sim: "graph-traversal",
    text: "## Coba sendiri: BFS dan DFS\n\nJalankan kedua penelusuran pada graf yang sama dan bandingkan. BFS memakai queue dan melebar per tingkat, DFS memakai stack dan menyelam dulu. Perhatikan isi queue atau stack di tiap langkah, dan bagaimana `visited` mencegah simpul diproses dua kali.\n\n![BFS dan DFS pada graf kecil](sim:graph-traversal)\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "tree", before: "## Tree di dunia nyata", sim: "bst",
    text: "## Coba sendiri: sisip dan cari di BST\n\nSisipkan beberapa angka dan ikuti jalurnya dari akar: lebih kecil ke kiri, lebih besar ke kanan. Perhatikan bahwa penelusuran inorder selalu menghasilkan angka terurut. Coba sisipkan angka yang sudah urut dan lihat tree-nya miring ke satu sisi.\n\n![Sisip dan cari pada binary search tree](sim:bst)\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "rekursi", before: "## Berpikir rekursif", sim: "call-stack",
    text: "## Call stack, langkah demi langkah\n\nGeser nilai n dan jalankan. Frame menumpuk sampai kasus dasar, lalu dilepas satu per satu sambil mengembalikan hasilnya. Coba juga `fibonacci`: pemanggilan yang sama muncul berulang kali, itulah alasan ia boros.\n\n![Call stack untuk faktorial dan fibonacci](sim:call-stack)\n\n" },
  { topic: "algoritma-dan-struktur-data", chapter: "stack-dan-queue", before: "## Contoh klasik: kurung seimbang", sim: "stack-queue",
    text: "## Stack dan queue berdampingan\n\nItem yang sama masuk ke kedua struktur. Keluarkan beberapa kali: stack mengeluarkan item terakhir yang masuk, queue mengeluarkan yang pertama. Coba isi sampai penuh, lalu kosongkan sampai habis.\n\n![Stack LIFO dan queue FIFO berdampingan](sim:stack-queue)\n\n" },
  { topic: "autentikasi-dan-keamanan-api", chapter: "jwt", before: "## Kesalahan umum pada JWT", sim: "jwt-decoder",
    text: "## Coba sendiri: membuat dan memalsukan token\n\nUbah isi payload dan lihat token terbentuk dari tiga bagian. Lalu ubah payload tanpa menghitung ulang tanda tangan: verifikasi gagal, karena tanda tangan hanya cocok dengan isi aslinya.\n\n![JWT: header, payload, tanda tangan, dan verifikasi](sim:jwt-decoder)\n\n" },
  { topic: "postgresql", chapter: "join-dan-agregasi", before: "## Fungsi agregat dan GROUP BY", sim: "sql-join",
    text: "## Membandingkan jenis JOIN\n\nBerpindahlah antara INNER, LEFT, RIGHT, dan FULL pada data yang sama. Perhatikan baris mana yang muncul dan di mana NULL menggantikan pasangan yang tidak ada.\n\n![Jenis JOIN pada tabel pelanggan dan pesanan](sim:sql-join)\n\n" },
  { topic: "desain-basis-data", chapter: "kunci-primary-dan-foreign", before: "## Kesalahan umum soal kunci", sim: "fk-relation",
    text: "## Foreign key menjaga data tetap utuh\n\nSentuh sebuah baris untuk melihat baris yang terhubung. Lalu coba hapus kelas yang masih punya siswa, atau tambah siswa ke kelas yang tidak ada, dan bandingkan RESTRICT dengan CASCADE.\n\n![Foreign key antara tabel kelas dan siswa](sim:fk-relation)\n\n" },
  { topic: "desain-basis-data", chapter: "normalisasi-2nf-dan-3nf", before: "## Kapan denormalisasi?", sim: "normalisasi",
    text: "![Normalisasi: satu tabel berantakan dipecah sampai 3NF](sim:normalisasi)\n\n" },
  { topic: "postgresql", chapter: "transaksi-dan-isolasi", before: "## Kunci baris dan deadlock", sim: "mvcc-isolation",
    text: "## Dua sesi, satu baris\n\nJalankan perintah bergantian di sesi A dan B. Bandingkan READ COMMITTED dengan REPEATABLE READ, dan perhatikan versi baris yang tersimpan setelah UPDATE, COMMIT, atau ROLLBACK.\n\n![Dua sesi, versi baris, dan level isolasi](sim:mvcc-isolation)\n\n" },
  { topic: "dasar-elektronika-dan-komponen", chapter: "hukum-ohm-ac-dc", before: "## Daya dan tiga rumusnya", sim: "hukum-ohm",
    text: "![Hukum Ohm: tegangan, hambatan, arus, dan daya pada satu rangkaian](sim:hukum-ohm)\n\n" },
  { topic: "dasar-elektronika-dan-komponen", chapter: "resistor", before: "## Toleransi, nilai standar, dan daya", sim: "kode-warna-resistor",
    text: "![Membaca kode warna resistor empat gelang](sim:kode-warna-resistor)\n\n" },
  { topic: "robotika", chapter: "driver-pwm-encoder-dan-pid", before: "## Aktuator generasi baru", sim: "pid-control",
    text: "## Mencoba PID sendiri\n\nPilih nilai Kp, Ki, dan Kd, lalu amati respons robot menuju setpoint. Kp terlalu kecil membuat robot lambat, Kp terlalu besar membuatnya berosilasi, dan Kd meredam osilasi itu.\n\n![Kontrol PID: respons posisi terhadap setpoint](sim:pid-control)\n\n" },
  { topic: "html-css-javascript", chapter: "cara-browser-merakit-halaman", before: "## DOMContentLoaded vs load", sim: "render-pipeline",
    text: "## Melihat blocking di linimasa\n\nBandingkan script biasa, `defer`, dan `async` pada linimasa yang sama. Perhatikan kapan parser berhenti dan kapan halaman pertama tergambar.\n\n![Pipeline rendering dan efek script biasa, defer, serta async](sim:render-pipeline)\n\n" },
  { topic: "javascript", chapter: "promise-generator-dan-struktur-data", before: "## Iterator dan generator", sim: "event-loop",
    text: "## Event loop: siapa jalan lebih dulu?\n\nSetelah kode sinkron selesai, event loop menjalankan semua microtask (Promise `.then`) sebelum task berikutnya (`setTimeout`). Maju langkah demi langkah untuk melihat urutannya.\n\n![Event loop: call stack, microtask queue, dan task queue](sim:event-loop)\n\n" },
  { topic: "linux-dan-terminal", chapter: "izin-dan-kepemilikan", before: "## `chown` dan `chgrp`: mengubah kepemilikan", sim: "chmod-calculator",
    text: "![Kalkulator chmod: centang rwx, angka oktal, dan teks rwxr-xr-- saling sinkron](sim:chmod-calculator)\n\n" },
  { topic: "docker-dan-deployment", chapter: "dockerfile-dasar", before: "## .dockerignore", sim: "docker-layers",
    text: "## Coba sendiri: layer dan cache\n\nUbah kode atau package.json, lalu bangun ulang. Perhatikan layer mana yang diambil dari cache dan mana yang ikut dibangun ulang, lalu tukar urutan `COPY . .` dan lihat harganya.\n\n![Layer dan cache Docker](sim:docker-layers)\n\n" },
  { topic: "linux-dan-terminal", chapter: "pipe-redirect-dan-filter", before: "## Here document dan substitusi perintah", sim: "pipe-redirect",
    text: "## Coba sendiri: aliran data antar perintah\n\nJalankan pipeline satu tahap demi satu tahap. Perhatikan bahwa pipe hanya membawa stdout, sedangkan stderr tetap ke layar kecuali dialihkan.\n\n![Pipe dan redirect](sim:pipe-redirect)\n\n" },
  { topic: "analisis-data-dengan-python", chapter: "mengelompokkan-dan-agregasi", before: "## Mengelompokkan dengan defaultdict", sim: "groupby-agg",
    text: "## Coba sendiri: pecah, terapkan, kumpulkan\n\nPilih kolom pengelompok dan jenis agregasi, lalu maju tahap demi tahap. Baris terpecah menjadi kelompok berwarna, lalu tiap kelompok menjadi satu baris hasil. Baris kode `groupby` yang setara ikut berubah.\n\n![Groupby: pecah, terapkan, dan kumpulkan](sim:groupby-agg)\n\n" },
  { topic: "analisis-data-dengan-python", chapter: "menggabungkan-tabel", before: "## Jenis penggabungan", sim: "merge-tabel",
    text: "## Coba sendiri: inner, left, dan outer\n\nGanti jenis merge dan lihat baris mana yang bertahan. Arahkan kursor ke baris hasil untuk melihat pasangannya di tabel asal, dan perhatikan NaN pada baris tanpa pasangan.\n\n![Merge dua tabel lewat kolom kunci](sim:merge-tabel)\n\n" },
  { topic: "dasar-komputer-dan-os", chapter: "booting-proses-dan-memori-virtual", before: "## Proses Booting", sim: "boot-proses",
    text: "![Urutan booting dan penjadwalan Round Robin](sim:boot-proses)\n\n" },
  { topic: "javascript", chapter: "fungsi-scope-dan-hoisting", before: "## Hoisting dasar", sim: "scope-hoisting",
    text: "![Scope dan hoisting langkah demi langkah](sim:scope-hoisting)\n\n" },
  { topic: "reactjs", chapter: "event-dan-usestate", before: "## Kenapa set state memicu render ulang", sim: "react-render",
    text: "![Render ulang komponen dan React.memo](sim:react-render)\n\n" },
  { topic: "tailwind-css", chapter: "spacing-ukuran-dan-warna", before: "## Padding, margin, dan gap", sim: "tailwind-utility",
    text: "## Coba sendiri: utilitas spacing, ukuran, dan warna\n\nPilih padding, margin, lebar, warna, dan sudut. Perhatikan class string yang terbentuk dan ukuran piksel di kotaknya.\n\n![Utilitas Tailwind: spacing, ukuran, warna](sim:tailwind-utility)\n\n" },
  { topic: "tailwind-css", chapter: "desain-responsif", before: "## Dari satu kolom menjadi tiga", sim: "tailwind-responsive",
    text: "## Coba sendiri: breakpoint dan mobile-first\n\nGeser lebar layar dan lihat prefiks mana yang menang. Bandingkan dengan cara baca desktop-first.\n\n![Breakpoint responsif Tailwind](sim:tailwind-responsive)\n\n" },
  { topic: "dasar-ux-dan-desain-antarmuka", chapter: "warna-dan-kontras", before: "## Mode gelap dan buta warna", sim: "kontras-warna",
    text: "## Coba sendiri: hitung kontras warna\n\nUbah warna teks dan latar, lalu lihat rasio kontras dan apakah lulus standar WCAG.\n\n![Pemeriksa kontras warna WCAG](sim:kontras-warna)\n\n" },
  { topic: "pemrograman-berorientasi-objek", chapter: "polimorfisme-dan-abstraksi", before: "## Duck typing", sim: "polimorfisme",
    text: "## Coba sendiri: method mana yang jalan\n\nPilih objek dan panggil `bersuara()`. Perhatikan `Ikan` yang tidak menimpa method, sehingga Python naik ke `Hewan`.\n\n![Polimorfisme dan method lookup](sim:polimorfisme)\n\n" },
  { topic: "testing-perangkat-lunak", chapter: "tdd-merah-hijau-refaktor", before: "## Refaktor dengan aman", sim: "tdd-siklus",
    text: "## Ikuti siklusnya langkah demi langkah\n\nMaju satu langkah dan perhatikan kapan tes merah, kapan hijau, dan kapan kode dirapikan.\n\n![Siklus TDD: fungsi kabisat](sim:tdd-siklus)\n\n" },
  { topic: "testing-perangkat-lunak", chapter: "piramida-tes-dan-jenisnya", before: "## Memilih jenis tes yang tepat", sim: "piramida-tes",
    text: "## Bandingkan proporsi tes\n\nGeser jumlah tes tiap lapisan dan bandingkan piramida dengan cone es krim: waktu, biaya, dan peluang tes gagal acak.\n\n![Piramida tes](sim:piramida-tes)\n\n" },
  { topic: "cicd-dengan-github-actions", chapter: "job-step-dan-runner", before: "## Rancang job dengan tujuan jelas", sim: "pipeline-actions",
    text: "## Coba sendiri: urutan job\n\nJalankan workflow, lalu gagalkan satu job. Job yang `needs`-nya tidak lulus dilewati, dan matikan `needs` untuk melihat deploy jalan walau tes gagal.\n\n![Urutan job dengan needs](sim:pipeline-actions)\n\n" },
  { topic: "pengantar-cloud-computing", chapter: "region-zona-dan-ketersediaan", before: "## Ketersediaan gabungan", sim: "availability-zones",
    text: "## Coba sendiri: satu zona vs banyak zona\n\nDeploy di 1, 2, atau 3 zona, kirim request, lalu matikan satu zona. Satu server di satu zona adalah titik lemah tunggal.\n\n![Zona ketersediaan dan titik lemah tunggal](sim:availability-zones)\n\n" },
];

const patch = (body, a) => {
  if (body.includes(`](sim:${a.sim})`)) return null;
  const i = body.indexOf(`\n${a.before}\n`);
  if (i < 0) throw new Error(`${a.chapter}: anchor not found`);
  return body.slice(0, i + 1) + a.text + body.slice(i + 1);
};

// Drafts are edited as raw text so the files keep their formatting.
const esc = (t) => JSON.stringify(t).slice(1, -1);
for (const a of ADD) {
  const f = `content/drafts/${a.topic}.json`;
  const raw = readFileSync(f, "utf8");
  const key = `\\n${esc(a.before)}\\n`;
  let state = "skip";
  if (!raw.includes(`](sim:${a.sim})`)) {
    if (raw.split(key).length !== 2) throw new Error(`${a.chapter}: anchor not unique in draft`);
    writeFileSync(f, raw.replace(key, () => `\\n${esc(a.text)}${esc(a.before)}\\n`));
    state = "ok";
  }
  console.log("draft", a.chapter, state);
}

if (process.argv.includes("--db")) {
  const env = process.env;
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: e } = await db.auth.signInWithPassword({ email: env.DEV_ADMIN_EMAIL, password: env.DEV_ADMIN_PASSWORD });
  if (e) throw new Error(`login: ${e.message}`);
  if ((await db.rpc("is_admin")).data !== true) throw new Error("not signed in as admin");
  for (const a of ADD) {
    const { data: rows, error } = await db.from("chapters").select("id, body, topics!inner(slug)").eq("slug", a.chapter).eq("topics.slug", a.topic);
    if (error) throw new Error(error.message);
    for (const r of rows) {
      const next = patch(r.body, a);
      if (next) { const { error: u } = await db.from("chapters").update({ body: next }).eq("id", r.id); if (u) throw new Error(u.message); }
      console.log("db", a.chapter, next ? "ok" : "skip");
    }
  }
}
