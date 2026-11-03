# Yomi Island

Dynamic island untuk Windows 10 dan 11 dengan maskot neko. Fokus: pengingat task harian, sesi baca, anime, dan musik.
Nama kerja, bisa diganti.

Status: **Tahap 3 (sebagian)**. Tambahan Tahap 3: tab Anime (hitung mundur episode dari AniList), lirik berjalan (LRCLIB, mati secara default), suara latar (hujan/angin/putih, dibuat dengan Web Audio), timer reset harian game, progres buku, kutipan harian. Update manga (MangaDex) ditunda. Dari Tahap 2: Tambahan Tahap 2: bayangan dihapus, island bisa digeser kiri-kanan (posisi tersimpan sebagai pecahan lebar layar, tidak menempel tepi), tab Musik (Spotify/browser lewat SMTC), mode rapat (mikrofon aktif), mode nonton (layar penuh, island disembunyikan), penanda rekam layar manual. Dari Tahap 1: task tersimpan (SQLite), sesi baca (timer 25/50/5 menit), target halaman + streak, istirahat mata 20-20-20, ikon tray, animasi buka dan tutup. Musik, anime, dan suara latar menyusul.

## Yang perlu dipasang (Windows 10)

1. **Node.js 22.18 atau lebih baru** (LTS terbaru lebih baik). Versi lama tidak bisa menjalankan `npm test`.
2. **Rust** lewat [rustup](https://rustup.rs). Pilih toolchain MSVC (default di Windows).
3. **Visual Studio Build Tools 2022** dengan workload **Desktop development with C++**.
4. **Microsoft Edge WebView2 Runtime**. Biasanya sudah ada. Kalau jendela tidak mau tampil, pasang Evergreen Runtime dari situs Microsoft.

## Menjalankan

```powershell
npm install
npm test            # 101 test logika, tidak butuh Rust
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
