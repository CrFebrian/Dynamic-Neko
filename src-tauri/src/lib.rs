// Tahap 2: membaca keadaan sistem (layar penuh, mikrofon, pemutar media) untuk frontend.
// Kontrol jendela tetap dari frontend (src/app/window.ts).

mod system;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

const WINDOW_LABEL: &str = "island";

/// Snapshot keadaan sistem. Dijalankan di thread terpisah karena memanggil API Windows yang blocking.
#[tauri::command]
async fn system_snapshot() -> Result<system::Snapshot, String> {
    tauri::async_runtime::spawn_blocking(system::snapshot)
        .await
        .map_err(|e| e.to_string())
}

/// Perintah pemutar: "toggle", "next", atau "prev". Nilai lain ditolak.
#[tauri::command]
async fn media_control(action: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || system::media_control(&action))
        .await
        .map_err(|e| e.to_string())?
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![system_snapshot, media_control])
        .setup(|app| {
            let toggle = MenuItem::with_id(app, "toggle", "Tampilkan / sembunyikan island", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Keluar", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &quit])?;

            let mut tray = TrayIconBuilder::new()
                .tooltip("Yomi Island")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(win) = app.get_webview_window(WINDOW_LABEL) {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                            }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                });

            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Yomi Island");
}
