// Tahap 0: semua kontrol jendela dilakukan dari frontend (src/app/window.ts).
// Kode Rust khusus Windows (musik, mic, fullscreen) menyusul di Tahap 2.

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Yomi Island");
}
