# Pemberitahuan komponen pihak ketiga

Yomi Island dibangun di atas perangkat lunak sumber terbuka berikut. Tiap komponen tunduk pada lisensinya sendiri; lisensi Yomi Island (`LICENSE.txt`) tidak mengubah hak Anda atas komponen tersebut. Daftar ini mencakup dependensi langsung; teks lisensi lengkap ada di repositori masing-masing komponen dan di dalam paket sumbernya.

| Komponen | Dipakai untuk | Lisensi |
|---|---|---|
| [Tauri](https://github.com/tauri-apps/tauri) 2 | Kerangka aplikasi desktop | Apache-2.0 atau MIT |
| [tauri-plugin-sql](https://github.com/tauri-apps/plugins-workspace) | Database lokal SQLite | Apache-2.0 atau MIT |
| [tauri-plugin-http](https://github.com/tauri-apps/plugins-workspace) | Permintaan jaringan terbatas | Apache-2.0 atau MIT |
| [serde](https://github.com/serde-rs/serde), serde_json | Serialisasi data | Apache-2.0 atau MIT |
| [windows](https://github.com/microsoft/windows-rs) (crate) | Akses API Windows | Apache-2.0 atau MIT |
| [winreg](https://github.com/gentoo90/winreg-rs) | Registry Windows (autostart, mikrofon) | MIT |
| [React](https://github.com/facebook/react), react-dom | Antarmuka | MIT |
| [Vite](https://github.com/vitejs/vite) dan [TypeScript](https://github.com/microsoft/TypeScript) | Alat pembangunan | MIT dan Apache-2.0 |

Dependensi turunan (transitif) beserta lisensinya tercantum di `package-lock.json` dan `src-tauri/Cargo.lock`.

## Data dan layanan

Jadwal anime dari [AniList](https://anilist.co), update bab dari [MangaDex](https://mangadex.org), dan lirik dari [LRCLIB](https://lrclib.net) diambil lewat API publik masing-masing dan tunduk pada ketentuan mereka.

## Musik

Lagu suara latar adalah milik pembuatnya, bukan bagian dari lisensi Yomi Island: "An Ode To (demo)" oleh Kenji Peach; "Chill Day" dan "Me 2" oleh LAKEY INSPIRED; "Tuesday at Three".
