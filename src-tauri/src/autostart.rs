//! "Jalankan saat Windows mulai": satu nilai di `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.
//! Hanya menyentuh nilai milik Yomi Island di hive pengguna saat ini; tidak butuh hak administrator.

use crate::util;

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

pub fn is_enabled() -> Result<bool, String> {
    Ok(imp::current()?.is_some())
}

pub fn set_enabled(enabled: bool) -> Result<(), String> {
    if !enabled {
        return imp::set(None);
    }
    // Versi dev berjalan dari target\debug dan butuh server Vite; mendaftarkannya ke startup hanya
    // menghasilkan aplikasi yang gagal terbuka saat Windows mulai.
    if cfg!(debug_assertions) {
        return Err("hanya tersedia di versi yang dipasang (bukan mode dev)".into());
    }
    imp::set(Some(&own_command()?))
}

/// Bila sudah aktif tetapi menunjuk lokasi lama (setelah pasang ulang atau pindah folder), arahkan ke exe ini.
/// Dilewati di mode dev supaya `tauri dev` tidak membelokkan entri milik versi terpasang.
pub fn refresh() {
    if cfg!(debug_assertions) {
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
