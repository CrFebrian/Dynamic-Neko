//! error.log di folder konfigurasi aplikasi (satu folder dengan yomi.db), dan pembuka folder/URL.

use std::{
    ffi::OsStr,
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

use crate::util;

const FILE: &str = "error.log";
const OLD_FILE: &str = "error.log.old";
const MAX_BYTES: u64 = 512 * 1024;

/// Folder konfigurasi aplikasi; dibuat bila belum ada.
pub fn dir(app: &AppHandle) -> Result<PathBuf, String> {
    let d = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    Ok(d)
}

/// Tambah satu baris ke error.log. Bila lebih dari 512 KB, berkas lama dipindah ke error.log.old.
pub fn append(app: &AppHandle, source: &str, message: &str) -> Result<(), String> {
    let d = dir(app)?;
    let path = d.join(FILE);
    if fs::metadata(&path).map(|m| m.len() > MAX_BYTES).unwrap_or(false) {
        let _ = fs::rename(&path, d.join(OLD_FILE));
    }
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).map(|t| t.as_secs()).unwrap_or(0);
    let mut f = OpenOptions::new().create(true).append(true).open(&path).map_err(|e| e.to_string())?;
    writeln!(
        f,
        "{} [{}] {}",
        util::iso_utc(secs),
        util::sanitize(source, 20),
        util::sanitize(message, 2000)
    )
    .map_err(|e| e.to_string())
}

/// Akhir isi error.log (paling banyak `max_chars` karakter). Kosong bila belum ada.
pub fn tail(app: &AppHandle, max_chars: usize) -> Result<String, String> {
    let path = dir(app)?.join(FILE);
    match fs::read(&path) {
        Ok(bytes) => Ok(util::tail_chars(&String::from_utf8_lossy(&bytes), max_chars)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Buka folder atau URL dengan aplikasi bawaan Windows. Argumen diberikan langsung, tanpa shell.
pub fn open_target(target: &OsStr) -> Result<(), String> {
    #[cfg(windows)]
    let program = "explorer.exe";
    #[cfg(not(windows))]
    let program = "xdg-open";
    Command::new(program).arg(target).spawn().map(|_| ()).map_err(|e| e.to_string())
}
