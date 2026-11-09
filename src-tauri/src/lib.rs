// Membaca keadaan sistem (layar penuh, mikrofon, media, baterai), jendela Pengaturan, dan HTTP keluar.
// Kontrol jendela tetap dari frontend (src/app/window.ts).

mod applog;
mod autostart;
mod system;
mod util;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

const WINDOW_LABEL: &str = "island";
const SETTINGS_LABEL: &str = "settings";

/// Buka jendela Pengaturan, atau fokuskan bila sudah terbuka. Tampilannya dipilih frontend dari label jendela.
fn show_settings(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window(SETTINGS_LABEL) {
        let _ = win.unminimize();
        win.show()?;
        win.set_focus()?;
        return Ok(());
    }
    tauri::WebviewWindowBuilder::new(app, SETTINGS_LABEL, tauri::WebviewUrl::App("index.html".into()))
        .title("Pengaturan Yomi Island")
        .inner_size(900.0, 640.0)
        .min_inner_size(640.0, 460.0)
        .center()
        .build()?;
    Ok(())
}

/// Async agar pembuatan jendela tidak menemui deadlock di Windows.
#[tauri::command]
async fn open_settings(app: tauri::AppHandle) -> Result<(), String> {
    show_settings(&app).map_err(|e| e.to_string())
}

/// Catat error dari frontend ke error.log.
#[tauri::command]
fn log_error(app: tauri::AppHandle, source: String, message: String) -> Result<(), String> {
    applog::append(&app, &source, &message)
}

/// Akhir error.log, untuk dilampirkan ke laporan masalah.
#[tauri::command]
fn read_error_log(app: tauri::AppHandle) -> Result<String, String> {
    applog::tail(&app, 1500)
}

/// Buka folder log dan pengaturan (berisi error.log dan yomi.db).
#[tauri::command]
fn open_data_dir(app: tauri::AppHandle) -> Result<(), String> {
    applog::open_target(applog::dir(&app)?.as_os_str())
}

/// Buka tautan di browser. Hanya URL di daftar putih (form laporan GitHub dan Saweria).
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !util::url_allowed(&url) {
        return Err("URL tidak diizinkan".into());
    }
    applog::open_target(std::ffi::OsStr::new(&url))
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

/// Snapshot keadaan sistem. Dijalankan di thread terpisah karena memanggil API Windows yang blocking.
#[tauri::command]
async fn system_snapshot() -> Result<system::Snapshot, String> {
    tauri::async_runtime::spawn_blocking(system::snapshot)
        .await
        .map_err(|e| e.to_string())
}

/// Atur volume utama Windows, 0..=100. Nilai di luar rentang ditolak.
#[tauri::command]
async fn set_volume(percent: u8) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || system::set_volume(percent))
        .await
        .map_err(|e| e.to_string())?
}

/// Perintah pemutar: "toggle", "next", atau "prev". Nilai lain ditolak.
#[tauri::command]
async fn media_control(action: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || system::media_control(&action))
        .await
        .map_err(|e| e.to_string())?
}

/// Sampul album dari pemutar aktif; null bila tidak tersedia.
#[tauri::command]
async fn media_art() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(system::media_art)
        .await
        .map_err(|e| e.to_string())?
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![system_snapshot, media_control, media_art, set_volume, open_settings, quit_app, log_error, read_error_log, open_data_dir, open_url])
        .setup(|app| {
            if let Ok(dir) = applog::dir(app.handle()) {
                autostart::init_default(&dir);
            }
            let toggle = MenuItem::with_id(app, "toggle", "Tampilkan / sembunyikan island", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Pengaturan", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Keluar", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &settings, &quit])?;

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
                    "settings" => {
                        let handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = show_settings(&handle) {
                                eprintln!("gagal membuka pengaturan: {e}");
                            }
                        });
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
