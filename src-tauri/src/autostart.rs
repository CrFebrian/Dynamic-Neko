//! "Jalankan saat Windows mulai" (otomatis, tanpa pengaturan): satu nilai di `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.
//! Hanya menyentuh nilai milik Yomi Island di hive pengguna saat ini; tidak butuh hak administrator.

use crate::util;
use std::{fs, path::Path};

const VALUE_NAME: &str = "Yomi Island";

#[cfg(windows)]
mod imp {
    use super::VALUE_NAME;
    use winreg::{
        enums::{HKEY_CURRENT_USER, KEY_READ, KEY_SET_VALUE},
        RegKey,
    };

    const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

    fn run_key() -> Result<RegKey, String> {
        RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(RUN_KEY, KEY_READ | KEY_SET_VALUE)
            .map_err(|e| format!("tidak bisa membuka registry: {e}"))
    }

    /// Nilai yang tersimpan saat ini; None bila belum ada.
    pub fn current() -> Result<Option<String>, String> {
        match run_key()?.get_value::<String, _>(VALUE_NAME) {
            Ok(v) => Ok(Some(v)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(format!("tidak bisa membaca registry: {e}")),
        }
    }

    /// Some(perintah) = tulis nilai; None = hapus (tidak error bila memang belum ada).
    pub fn set(command: Option<&str>) -> Result<(), String> {
        let key = run_key()?;
        match command {
            Some(c) => {
                let c = c.to_string();
                key.set_value(VALUE_NAME, &c)
                    .map_err(|e| format!("tidak bisa menulis registry: {e}"))
            }
            None => match key.delete_value(VALUE_NAME) {
                Ok(()) => Ok(()),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
                Err(e) => Err(format!("tidak bisa menghapus entri registry: {e}")),
            },
        }
    }
}

#[cfg(not(windows))]
mod imp {
    pub fn current() -> Result<Option<String>, String> {
        Ok(None)
    }
    pub fn set(_command: Option<&str>) -> Result<(), String> {
        Err("hanya tersedia di Windows".into())
    }
}

/// Perintah untuk exe yang sedang berjalan.
fn own_command() -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|e| format!("tidak bisa menemukan lokasi aplikasi: {e}"))?;
    util::autostart_command(exe.to_str().ok_or("lokasi aplikasi bukan teks yang valid")?)
}

fn enable() -> Result<(), String> {
    imp::set(Some(&own_command()?))
}

/// Dipanggil tiap aplikasi terpasang dibuka. Pertama kali: daftarkan ke startup Windows (itu default
/// aplikasi ini) dan catat penanda di `marker_dir`. Setelah itu hanya merapikan entri yang sudah ada
/// bila menunjuk lokasi lama (pasang ulang di folder lain). Entri yang dihapus atau dinonaktifkan
/// pengguna di Pengaturan Windows tidak pernah dipasang ulang.
/// Dilewati di mode dev: versi dev berjalan dari target\debug dan butuh server Vite.
pub fn init_default(marker_dir: &Path) {
    if cfg!(debug_assertions) {
        return;
    }
    let marker = marker_dir.join("autostart-initialized");
    if !marker.exists() {
        match enable() {
            Ok(()) => {
                if let Err(e) = fs::write(&marker, b"1") {
                    eprintln!("gagal menulis penanda startup: {e}");
                }
            }
            // Tanpa penanda, percobaan diulang saat aplikasi dibuka berikutnya.
            Err(e) => eprintln!("gagal mendaftarkan startup: {e}"),
        }
        return;
    }
    let (Ok(Some(current)), Ok(wanted)) = (imp::current(), own_command()) else {
        return;
    };
    if current != wanted {
        if let Err(e) = imp::set(Some(&wanted)) {
            eprintln!("gagal memperbarui entri startup: {e}");
        }
    }
}
