//! Implementasi Windows. Semua fungsi di sini bersifat blocking, jadi dipanggil
//! lewat `spawn_blocking` dari command Tauri.

use super::{MediaAction, MediaInfo, Snapshot};

use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager as SessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as PlaybackStatus,
};
use windows::Win32::UI::Shell::{
    SHQueryUserNotificationState, QUNS_BUSY, QUNS_PRESENTATION_MODE, QUNS_RUNNING_D3D_FULL_SCREEN,
};
use winreg::{enums::HKEY_CURRENT_USER, RegKey};

pub fn snapshot() -> Snapshot {
    Snapshot {
        fullscreen: fullscreen(),
        mic_active: mic_active(),
        media: media().ok().flatten(),
    }
}

/// Ada aplikasi layar penuh (video, game) atau mode presentasi.
fn fullscreen() -> bool {
    match unsafe { SHQueryUserNotificationState() } {
        Ok(state) => {
            state == QUNS_BUSY || state == QUNS_RUNNING_D3D_FULL_SCREEN || state == QUNS_PRESENTATION_MODE
        }
        Err(_) => false,
    }
}

const MIC_CONSENT_KEY: &str =
    r"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone";

/// Mikrofon dipakai bila ada aplikasi yang `LastUsedTimeStart` > 0 dan `LastUsedTimeStop` = 0.
/// Catatan: entri yang tertinggal setelah aplikasi crash bisa menghasilkan positif palsu.
fn mic_active() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let Ok(root) = hkcu.open_subkey(MIC_CONSENT_KEY) else {
        return false;
    };
    if any_app_using(&root) {
        return true;
    }
    // Aplikasi desktop biasa (bukan Store) dicatat di subkey NonPackaged.
    root.open_subkey("NonPackaged")
        .map(|k| any_app_using(&k))
        .unwrap_or(false)
}

fn any_app_using(parent: &RegKey) -> bool {
    parent.enum_keys().flatten().any(|name| {
        parent
            .open_subkey(&name)
            .map(|app| {
                let start: u64 = app.get_value("LastUsedTimeStart").unwrap_or(0);
                let stop: u64 = app.get_value("LastUsedTimeStop").unwrap_or(0);
                start > 0 && stop == 0
            })
            .unwrap_or(false)
    })
}

/// TimeSpan Windows dalam satuan 100 nanodetik -> detik.
fn to_secs(ticks: i64) -> f64 {
    ticks as f64 / 10_000_000.0
}

/// Pemutar media aktif saat ini (Spotify, browser, dll). None bila tidak ada.
fn media() -> windows::core::Result<Option<MediaInfo>> {
    let manager = SessionManager::RequestAsync()?.get()?;
    let Ok(session) = manager.GetCurrentSession() else {
        return Ok(None);
    };

    let props = session.TryGetMediaPropertiesAsync()?.get()?;
    let title = props.Title()?.to_string();
    let artist = props.Artist()?.to_string();
    if title.trim().is_empty() && artist.trim().is_empty() {
        return Ok(None);
    }

    let playing = session.GetPlaybackInfo()?.PlaybackStatus()? == PlaybackStatus::Playing;

    let timeline = session.GetTimelineProperties()?;
    let start = to_secs(timeline.StartTime()?.Duration);
    let end = to_secs(timeline.EndTime()?.Duration);
    let position = (to_secs(timeline.Position()?.Duration) - start).max(0.0);
    let duration = (end - start).max(0.0);

    Ok(Some(MediaInfo {
        title,
        artist,
        playing,
        position_sec: position,
        duration_sec: duration,
    }))
}

pub fn media_control(action: MediaAction) -> Result<(), String> {
    let run = || -> windows::core::Result<()> {
        let manager = SessionManager::RequestAsync()?.get()?;
        let session = manager.GetCurrentSession()?;
        match action {
            MediaAction::Toggle => {
                session.TryTogglePlayPauseAsync()?.get()?;
            }
            MediaAction::Next => {
                session.TrySkipNextAsync()?.get()?;
            }
            MediaAction::Prev => {
                session.TrySkipPreviousAsync()?.get()?;
            }
        }
        Ok(())
    };
    run().map_err(|e| e.to_string())
}
