// The first Studio Proyek project: a personal portfolio website. One step per
// stage of the Studio; item ids are stored with each learner's ticks, so keep
// them stable (changing an id forgets that tick).
export type StudioItem = { id: string; text: string };
export type StudioStep = { id: string; title: string; intro: string; items: StudioItem[]; links?: { label: string; href: string }[] };

export const STUDIO_PROJECT = "portofolio";
export const STUDIO_FEATURE = "studio-proyek";
// Slug to display name, for the profile page.
export const STUDIO_TITLES: Record<string, string> = { portofolio: "Website Portofolio Pribadi" };

const i = (id: string, text: string): StudioItem => ({ id, text });

export const PORTOFOLIO_STEPS: StudioStep[] = [
  {
    id: "brief", title: "Brief",
    intro: "Bayangkan pembacamu perekrut atau klien yang punya waktu sekitar 30 detik. Tentukan siapa mereka dan apa yang ingin kamu tunjukkan.",
    items: [
      i("brief-pembaca", "Tulis satu kalimat: siapa yang akan membuka portofoliomu (perekrut, klien, atau dosen)?"),
      i("brief-tujuan", "Tulis tujuannya: melamar kerja, mencari klien freelance, atau menunjukkan proses belajarmu."),
      i("brief-wajib", "Daftar tiga hal yang harus langsung terlihat: namamu, bidangmu, dan cara menghubungimu."),
      i("brief-batas", "Tulis apa yang tidak akan kamu buat di versi pertama, misalnya blog atau animasi rumit."),
    ],
  },
  {
    id: "brainstorming", title: "Brainstorming",
    intro: "Kumpulkan isi dulu sebelum memikirkan tampilan. Teks biasa di catatan sudah cukup.",
    items: [
      i("ide-bagian", "Pilih tiga sampai empat bagian halaman: perkenalan, proyek, keahlian, kontak."),
      i("ide-isi", "Tulis isi tiap bagian dalam teks biasa."),
      i("ide-proyek", "Pilih dua atau tiga proyek terbaikmu, boleh proyek akhir dari kelas di Ruang Materi, dan tulis satu kalimat tentang masalah yang diselesaikannya."),
      i("ide-prioritas", "Tandai satu bagian yang paling penting. Bagian itu tampil paling atas."),
    ],
  },
  {
    id: "teknologi", title: "Memilih teknologi",
    intro: "Untuk versi pertama, HTML dan CSS biasa sudah cukup. Situs statis paling mudah di-deploy dan paling cepat dibuka.",
    items: [
      i("tek-pilih", "Putuskan teknologinya: HTML dan CSS biasa, atau Tailwind kalau kamu sudah belajar."),
      i("tek-alasan", "Tulis dua alasan pilihanmu, supaya siap kamu jelaskan di wawancara."),
      i("tek-hosting", "Pilih hosting gratis: GitHub Pages atau Netlify."),
      i("tek-alat", "Siapkan akun GitHub dan pasang Git di komputermu."),
    ],
    links: [{ label: "Kelas Git", href: "/belajar/git" }, { label: "Kelas Tailwind CSS", href: "/belajar/tailwind-css" }],
  },
  {
    id: "merancang", title: "Merancang",
    intro: "Rancang tata letak di kertas dulu. Mulai dari tampilan HP, karena itu yang sering dibuka perekrut.",
    items: [
      i("ran-sketsa", "Gambar sketsa tata letak di kertas atau Figma, mulai dari layar HP."),
      i("ran-urutan", "Tentukan urutan bagian dari atas ke bawah, bagian terpenting paling atas."),
      i("ran-gaya", "Pilih dua warna utama dan satu jenis huruf. Cukup itu."),
      i("ran-navigasi", "Tentukan tautan navigasi dan ke mana tiap tautan pergi."),
    ],
  },
  {
    id: "ngoding", title: "Ngoding dan debugging",
    intro: "Bangun selangkah demi selangkah. Mulai dari struktur HTML, baru gaya CSS, dan simpan kemajuan di Git.",
    items: [
      i("kod-struktur", "Tulis struktur HTML dulu (judul, bagian, daftar proyek) tanpa CSS."),
      i("kod-gaya", "Tambahkan CSS untuk layar HP, lalu atur layar lebar dengan media query."),
      i("kod-git", "Buat repositori Git dan commit setiap selesai satu bagian, dengan pesan yang jelas."),
      i("kod-debug", "Buka DevTools (F12), temukan satu masalah tampilan, dan perbaiki dengan memeriksa elemennya."),
    ],
    links: [{ label: "Coba di Playground", href: "/playground" }],
  },
  {
    id: "uji", title: "Uji end-to-end",
    intro: "Untuk situs statis, uji end-to-end berarti menjalani halaman seperti pengunjung sungguhan dari awal sampai akhir.",
    items: [
      i("uji-tautan", "Klik semua tautan dan tombol. Tidak ada yang mengarah ke halaman kosong."),
      i("uji-hp", "Buka di HP atau mode responsif DevTools. Tidak ada teks terpotong atau gulir menyamping."),
      i("uji-keyboard", "Telusuri halaman hanya dengan tombol Tab. Setiap tautan bisa dijangkau dan fokusnya terlihat."),
      i("uji-lighthouse", "Jalankan Lighthouse di DevTools dan catat skor Performance dan Accessibility."),
      i("uji-teman", "Minta satu orang membuka situsmu, lalu tanya apa yang ia pahami dalam 30 detik."),
    ],
  },
  {
    id: "deploy", title: "Deploy dan online",
    intro: "Rilis ke internet agar siapa pun bisa membukanya. Langkah di tiap layanan bisa berubah, jadi ikuti dokumentasi resminya.",
    items: [
      i("dep-push", "Dorong (push) repositorimu ke GitHub."),
      i("dep-hosting", "Aktifkan GitHub Pages atau hubungkan repositori ke Netlify."),
      i("dep-buka", "Buka alamat situsmu lewat data seluler dan pastikan tampilannya sama."),
      i("dep-https", "Pastikan alamatnya memakai https://."),
    ],
    links: [{ label: "Dokumentasi GitHub Pages", href: "https://docs.github.com/pages" }, { label: "Dokumentasi Netlify", href: "https://docs.netlify.com/" }],
  },
  {
    id: "dokumentasi", title: "Dokumentasi dan portofolio",
    intro: "Proyek yang baik perlu penjelasan. Perekrut biasanya membuka demo, lalu README.",
    items: [
      i("dok-readme", "Tulis README: apa proyeknya, teknologi yang dipakai, dan cara menjalankannya."),
      i("dok-gambar", "Tambahkan tangkapan layar di README."),
      i("dok-tautan", "Pasang tautan situs di profil GitHub dan LinkedIn."),
      i("dok-refleksi", "Tulis tiga hal yang kamu pelajari dan satu hal yang ingin kamu perbaiki."),
    ],
  },
];
