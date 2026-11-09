//! Membaca keadaan sistem untuk Yomi Island: layar penuh, mikrofon, dan pemutar media.
//! Kode khusus Windows ada di `win.rs`. Di platform lain `stub.rs` mengembalikan keadaan kosong,
//! supaya proyek tetap bisa dikompilasi (mis. untuk pengembangan di Linux/macOS).

use serde::Serialize;

#[cfg(windows)]
mod win;
#[cfg(windows)]
use win as platform;

#[cfg(not(windows))]
mod stub;
#[cfg(not(windows))]
use stub as platform;

#[derive(Serialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub title: String,
    pub artist: String,
    pub playing: bool,
    pub position_sec: f64,
    /// 0 bila pemutar tidak melaporkan durasi.
    pub duration_sec: f64,
}

#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Battery {
    /// 0..=100.
    pub percent: u8,
    pub charging: bool,
}

#[derive(Serialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub fullscreen: bool,
    pub mic_active: bool,
    pub media: Option<MediaInfo>,
    /// None bila perangkat tanpa baterai (PC desktop) atau tidak terbaca.
    pub battery: Option<Battery>,
    /// Volume utama perangkat keluaran, 0..=100. None bila tidak terbaca.
    pub volume: Option<u8>,
}

/// Aksi pemutar yang diizinkan. Nilai lain ditolak sebelum menyentuh API Windows.
#[derive(Debug, PartialEq, Clone, Copy)]
pub enum MediaAction {
    Toggle,
    Next,
    Prev,
}

impl MediaAction {
    pub fn parse(s: &str) -> Result<Self, String> {
        match s {
            "toggle" => Ok(Self::Toggle),
            "next" => Ok(Self::Next),
            "prev" => Ok(Self::Prev),
            other => Err(format!("aksi pemutar tidak dikenal: {other:?}")),
        }
    }
}

pub fn snapshot() -> Snapshot {
    platform::snapshot()
}

/// Atur volume utama Windows (0..=100).
pub fn set_volume(percent: u8) -> Result<(), String> {
    let scalar = crate::util::percent_to_scalar(percent)?;
    platform::set_volume(scalar)
}

pub fn media_control(action: &str) -> Result<(), String> {
    let action = MediaAction::parse(action)?;
    platform::media_control(action)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_aksi_valid() {
        assert_eq!(MediaAction::parse("toggle"), Ok(MediaAction::Toggle));
        assert_eq!(MediaAction::parse("next"), Ok(MediaAction::Next));
        assert_eq!(MediaAction::parse("prev"), Ok(MediaAction::Prev));
    }

    #[test]
    fn parse_aksi_tidak_valid_ditolak() {
        for bad in ["", "TOGGLE", "stop", "toggle ", "../x", "next;prev"] {
            assert!(MediaAction::parse(bad).is_err(), "{bad:?} seharusnya ditolak");
        }
    }

    #[test]
    fn snapshot_serial_camel_case() {
        let s = Snapshot {
            fullscreen: true,
            mic_active: false,
            battery: Some(Battery { percent: 82, charging: true }),
            volume: Some(40),
            media: Some(MediaInfo {
                title: "t".into(),
                artist: "a".into(),
                playing: true,
                position_sec: 1.5,
                duration_sec: 3.0,
            }),
        };
        let json = serde_json::to_string(&s).unwrap();
        assert!(json.contains("\"micActive\":false"));
        assert!(json.contains("\"positionSec\":1.5"));
        assert!(json.contains("\"durationSec\":3.0"));
        assert!(json.contains("\"battery\":{\"percent\":82,\"charging\":true}"));
        assert!(json.contains("\"volume\":40"));
    }
}

/// Sampul album pemutar aktif (data URL), atau None bila tidak ada.
pub fn media_art() -> Result<Option<String>, String> {
    platform::media_art()
}
