//! Pengganti untuk platform selain Windows: tidak ada yang dibaca.

use super::{MediaAction, Snapshot};

pub fn snapshot() -> Snapshot {
    Snapshot::default()
}

pub fn set_volume(_scalar: f32) -> Result<(), String> {
    Err("pengaturan volume hanya tersedia di Windows".into())
}

pub fn media_control(_action: MediaAction) -> Result<(), String> {
    Err("kontrol pemutar hanya tersedia di Windows".into())
}
