//! Pengganti untuk platform selain Windows: tidak ada yang dibaca.

use super::{MediaAction, Snapshot};

pub fn snapshot() -> Snapshot {
    Snapshot::default()
}

pub fn media_control(_action: MediaAction) -> Result<(), String> {
    Err("kontrol pemutar hanya tersedia di Windows".into())
}
