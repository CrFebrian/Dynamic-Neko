# Yomi Island

Dynamic island untuk Windows 10 dan 11 dengan maskot neko. Fokus: pengingat task harian, sesi baca, anime, dan musik.
Nama kerja, bisa diganti.

Status: **Tahap 3 selesai + revisi**. Baru: pill memanjang dengan jam dan baterai, jendela Pengaturan terpisah (tombol Pengaturan di panel atau menu tray), update manga (MangaDex), notifikasi di pill untuk episode anime, bab manga, dan reset game. Permintaan jaringan kini dikirim dari Rust lewat plugin HTTP Tauri (bukan dari WebView), jadi tidak terkena CORS dan CSP tidak membuka host luar. Sebelumnya: Tambahan Tahap 3: tab Anime (hitung mundur episode dari AniList), lirik berjalan (LRCLIB, mati secara default), suara latar (hujan/angin/putih, dibuat dengan Web Audio), timer reset harian game, progres buku, kutipan harian. Update manga (MangaDex) ditunda. Dari Tahap 2: Tambahan Tahap 2: bayangan dihapus, island bisa digeser kiri-kanan (posisi tersimpan sebagai pecahan lebar layar, tidak menempel tepi), tab Musik (Spotify/browser lewat SMTC), mode rapat (mikrofon aktif), mode nonton (layar penuh, island disembunyikan), penanda rekam layar manual. Dari Tahap 1: task tersimpan (SQLite), sesi baca (timer 25/50/5 menit), target halaman + streak, istirahat mata 20-20-20, ikon tray, animasi buka dan tutup. Musik, anime, dan suara latar menyusul.

## Yang perlu dipasang (Windows 10)

1. **Node.js 22.18 atau lebih baru** (LTS terbaru lebih baik). Versi lama tidak bisa menjalankan `npm test`.
2. **Rust** lewat [rustup](https://rustup.rs). Pilih toolchain MSVC (default di Windows).
3. **Visual Studio Build Tools 2022** dengan workload **Desktop development with C++**.
4. **Microsoft Edge WebView2 Runtime**. Biasanya sudah ada. Kalau jendela tidak mau tampil, pasang Evergreen Runtime dari situs Microsoft.

## Menjalankan

```powershell
npm install
npm test            # 122 test logika, tidak butuh Rust
npm run typecheck
npm run dev         # UI di browser (http://localhost:1420), tanpa jendela Tauri
npm run tauri dev   # jendela island sungguhan. Build Rust pertama bisa 5-10 menit
npm run tauri build # installer NSIS di src-tauri/target/release/bundle/nsis
```

## Perubahan Tahap 1: setelah mengganti file

Jalankan `npm install` lagi (ada paket baru `@tauri-apps/plugin-sql`). Build Rust berikutnya akan lebih lama karena SQLite ikut dikompilasi.
Data tersimpan di `yomi.db` dalam folder konfigurasi aplikasi (`%APPDATA%\app.yomiisland.desktop`).

## Daftar uji Tahap 1

- [ ] Klik × atau tekan Esc: panel mengecil dengan animasi, lalu pill muncul. Tidak ada kedipan atau jendela terpotong.
- [ ] Buka panel: tidak terpotong saat animasi masuk.
- [ ] Tab Baca: Mulai, Jeda, Ulang, ganti mode. Sisa waktu di pill ikut berjalan saat panel ditutup. Saat selesai: maskot semangat + bunyi.
- [ ] Tambah halaman sampai target tercapai: muncul pesan, streak bertambah.
- [ ] Tab Santai: pilih interval, "Coba sekarang". Pill menampilkan hitungan 20 detik, maskot tidur.
- [ ] Tambah task, tutup aplikasi lewat tray, buka lagi: task dan pengaturan masih ada.
- [ ] Ikon di tray: menu "Tampilkan / sembunyikan" dan "Keluar" berfungsi.

## Daftar uji Tahap 0 (di laptop Windows 10)

- [ ] Pill muncul di tengah-atas layar, tanpa bingkai, sudut transparan (bukan kotak hitam).
- [ ] Tidak muncul di taskbar. Tetap di atas aplikasi lain.
- [ ] Klik pill membuka panel. Esc, tombol ×, atau klik area kosong menutupnya. Tidak berkedip berlebihan.
- [ ] Skala layar 100%, 125%, 150%: posisi tetap di tengah, ukuran wajar.
- [ ] Gaya Dynamic dan Notch di tab Atur berganti dan diingat setelah dibuka ulang.
- [ ] Tab Atur > Keluar menutup aplikasi sepenuhnya.
- [ ] Tambah task dengan jam, centang, hapus. Task telat mengubah maskot jadi kaget lalu sedih.

Kalau ada yang gagal, kirim pesan error dari terminal dan satu tangkapan layar. Itu cukup untuk saya memperbaikinya.

## Struktur

```
src/app/          App, kontrol jendela (window.ts)
src/island/       Pill, Panel, pillState (logika prioritas pill)
src/mascot/       Neko (SVG, 7 ekspresi)
src/features/     tasks (modul lain menyusul)
src/lib/          waktu dan format
src-tauri/        Tauri 2: konfigurasi jendela, izin minimal, ikon
```

## Catatan keamanan

- Izin Tauri sengaja minimal (`src-tauri/capabilities/default.json`): hanya ukuran, posisi, tampil, tutup.
- CSP aktif. Teks dari pengguna dan sumber luar ditampilkan lewat React (di-escape otomatis). Jangan memakai `dangerouslySetInnerHTML`.
- Tidak ada secret di repo. Kunci API (bila nanti ada) tidak boleh masuk kode.

## Lisensi

Lihat `LICENSE.txt` (draf). Belum final, baca catatannya.

## Daftar uji Tahap 2

Rust Tahap 2 (crate `windows` 0.61, `winreg`) belum pernah dikompilasi; build pertama akan lebih lama. Jalankan `npm install` lalu `npm run tauri dev`.

- Geser header/pill ke kiri dan kanan di skala layar 100%, 125%, 150%: island berhenti 8 px dari tepi, tidak terpotong.
- Tutup lalu buka aplikasi: posisi terakhir kembali.
- Tidak ada bayangan gelap di belakang pill dan panel.
- Putar lagu di Spotify atau browser: judul, artis, dan tombol prev/play/next di tab Musik bekerja.
- Panggilan di aplikasi yang memakai mikrofon: pill masuk mode rapat, notifikasi ditahan; setelah selesai muncul ringkasan.
- Video layar penuh: island hilang, kembali saat keluar layar penuh.
- Sakelar Penanda rekam layar: titik merah muncul di pill.
- Catatan: deteksi mikrofon lewat registry bisa positif palsu bila aplikasi crash saat memakai mic.

## Daftar uji Tahap 3

Tidak ada dependency npm atau crate baru, jadi `npm install` tidak perlu diulang. Yang menyentuh internet: AniList (judul yang kamu cari) dan LRCLIB (judul+artis lagu, hanya bila Lirik dinyalakan). CSP sudah mengizinkan kedua host itu saja.

- Anime: cari "Frieren", muncul hitung mundur. Tutup aplikasi, buka lagi: daftar tetap ada. Matikan internet: muncul pesan, aplikasi tidak error.
- Lirik: putar lagu populer di Spotify, nyalakan Lirik di tab Musik. Baris berjalan seiring lagu. Bila tidak ketemu, muncul "Lirik tidak ditemukan".
- Suara latar: pilih Hujan, tutup panel, suara tetap jalan. Tekan lagi untuk berhenti.
- Timer game: tambah "Game 04:00", hitung mundur sesuai jam lokal.
- Buku: tambah buku 200 halaman, tombol +10/-10 tidak keluar dari 0..200.
- Belum terverifikasi: AniList/LRCLIB mengizinkan CORS dari WebView Tauri. Bila ada error "Failed to fetch" di konsol, kabari saya (solusinya lewat Rust).

## Daftar uji revisi (jam/baterai, Pengaturan, manga, notifikasi)

**Wajib dijalankan sekali:** `npm install` (ada dependency baru `@tauri-apps/plugin-http`; `package-lock.json` akan ikut diperbarui, commit lagi bila mau). Build Rust berikutnya mengunduh crate `tauri-plugin-http` dan memperbarui `Cargo.lock`.

- Pill diam: ikon neko di kiri, jam (24 jam) dan baterai di kanan. Di PC tanpa baterai hanya jam. Cabut charger: indikator berhenti menunjukkan petir; di bawah 20% berwarna merah.
- Klik tab Pengaturan di panel: jendela Pengaturan terbuka (bukan tab di dalam panel), panel island menutup. Klik lagi: jendela yang sama difokuskan. Tray > Pengaturan juga bisa.
- Matikan Tampilkan jam/baterai di Pengaturan: pill langsung berubah tanpa restart. Ganti Gaya (Dynamic/Notch): island langsung berubah.
- Ubah Jeda istirahat mata atau Target baca di Pengaturan: berlaku di island; ubah di island lalu fokuskan jendela Pengaturan: nilainya ikut.
- Anime: tambah anime yang masih tayang, ubah jam laptop ke sebelum jadwal tayang (atau tunggu): pill menampilkan "judul eps N tayang".
- Manga: cari "One Piece", tampil "Bab N · x j lalu". Ganti bahasa di Pengaturan > Anime, manga, lirik: acuan bab diulang, tidak ada notifikasi palsu.
- Game: timer "Game 04:00"; saat jam itu lewat, pill menampilkan "Reset harian Game".
- Rapat atau layar penuh aktif: notifikasi ditahan, ringkasannya muncul sesudahnya.

Belum terverifikasi (belum dikompilasi/dijalankan): nama API crate `windows` 0.61 untuk `GetSystemPowerStatus`, bentuk izin `http:default` dengan `allow` URL, pembuatan jendela kedua dari Rust, parameter query MangaDex (`order[publishAt]`, `contentRating[]`, `translatedLanguage[]`), dan apakah plugin HTTP menerima header User-Agent kustom.

## Revisi tampilan (pill dan navigasi)

- Pill diam: baterai di kiri, neko di tengah, jam di kanan. Bila baterai/jam dimatikan, neko tetap di tengah.
- Navigasi bawah: deretan ikon (Hari ini, Baca, Anime, Musik, Santai). Hanya tab aktif yang menampilkan nama; arahkan kursor ke ikon lain untuk melihat namanya. Panah kiri/kanan memindah tab, ikon slider di kanan membuka Pengaturan.
- Uji: panel tidak terpotong di bawah (tinggi isi dikurangi 10 px untuk navigasi baru).

## Tema dan tanggal

- Tab Hari ini menampilkan tanggal lengkap di kanan ("Rabu, 4 November 2026"), ikut berganti tengah malam.
- Pengaturan > Umum > Tema: Gelap, Terang, atau Ikuti Windows. Berlaku di island dan jendela Pengaturan, langsung tanpa restart. Maskot neko sengaja tetap gelap (seperti stiker) di tema terang.
- Semua warna kini lewat variabel CSS di `src/styles/island.css` (blok `:root` dan `:root[data-theme='light']`). Ubah di sana untuk menyesuaikan.
- Uji: kedua tema di semua tab (Hari ini, Baca, Anime, Musik, Santai), jendela Pengaturan, pill saat notifikasi, peringatan baterai merah; teks kecil (abu-abu) harus tetap terbaca di tema terang. Mode Ikuti Windows bergantung pada `prefers-color-scheme` WebView2 (belum diuji): ganti tema Windows saat aplikasi jalan, tampilan harus ikut.
