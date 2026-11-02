# Yomi Island

Dynamic island untuk Windows 10 dan 11 dengan maskot neko. Fokus: pengingat task harian, sesi baca, anime, dan musik.
Nama kerja, bisa diganti.

Status: **Tahap 0** (kerangka proyek + perilaku jendela). Fitur lengkap masih berupa prototipe web.

## Yang perlu dipasang (Windows 10)

1. **Node.js 22.18 atau lebih baru** (LTS terbaru lebih baik). Versi lama tidak bisa menjalankan `npm test`.
2. **Rust** lewat [rustup](https://rustup.rs). Pilih toolchain MSVC (default di Windows).
3. **Visual Studio Build Tools 2022** dengan workload **Desktop development with C++**.
4. **Microsoft Edge WebView2 Runtime**. Biasanya sudah ada. Kalau jendela tidak mau tampil, pasang Evergreen Runtime dari situs Microsoft.

## Menjalankan

```powershell
npm install
npm test            # 23 test logika, tidak butuh Rust
npm run typecheck
npm run dev         # UI di browser (http://localhost:1420), tanpa jendela Tauri
npm run tauri dev   # jendela island sungguhan. Build Rust pertama bisa 5-10 menit
npm run tauri build # installer NSIS di src-tauri/target/release/bundle/nsis
```

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
