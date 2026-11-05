//! Fungsi murni tanpa ketergantungan Tauri, supaya mudah diuji.

/// URL yang boleh dibuka dari aplikasi. Selain ini ditolak.
const ALLOWED_URLS: [&str; 3] = [
    "https://github.com/CrFebrian/Dynamic-Neko/issues/new",
    "https://github.com/CrFebrian/Dynamic-Neko/releases/latest",
    "https://saweria.co/BrianCoding",
];

/// Hanya URL persis di daftar, boleh diikuti query string (`?...`). Spasi dan karakter kontrol ditolak.
pub fn url_allowed(url: &str) -> bool {
    if url.len() > 8000 || url.chars().any(|c| c.is_control() || c.is_whitespace()) {
        return false;
    }
    ALLOWED_URLS
        .iter()
        .any(|p| url == *p || url.strip_prefix(p).is_some_and(|rest| rest.starts_with('?')))
}

/// Persen volume (0..=100) -> skala 0.0..=1.0. Di atas 100 ditolak, bukan dijepit, supaya bug pemanggil terlihat.
pub fn percent_to_scalar(percent: u8) -> Result<f32, String> {
    if percent > 100 {
        return Err(format!("volume di luar rentang: {percent}"));
    }
    Ok(f32::from(percent) / 100.0)
}

/// Skala 0.0..=1.0 -> persen bulat 0..=100. Nilai di luar rentang atau NaN menghasilkan None.
pub fn scalar_to_percent(v: f32) -> Option<u8> {
    if v.is_finite() && (0.0..=1.0).contains(&v) {
        Some((v * 100.0).round() as u8)
    } else {
        None
    }
}

/// Satu baris, tanpa karakter kontrol, maksimal `max` karakter.
pub fn sanitize(s: &str, max: usize) -> String {
    let mut out = String::with_capacity(s.len().min(max));
    let mut last_space = false;
    for c in s.chars() {
        let c = if c.is_control() || c.is_whitespace() { ' ' } else { c };
        if c == ' ' {
            if last_space {
                continue;
            }
            last_space = true;
        } else {
            last_space = false;
        }
        out.push(c);
        if out.chars().count() >= max {
            break;
        }
    }
    out.trim().to_string()
}

/// Detik sejak epoch -> "YYYY-MM-DDTHH:MM:SSZ" (UTC).
pub fn iso_utc(secs: u64) -> String {
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    // Algoritma civil_from_days (Howard Hinnant).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}Z", rem / 3600, rem % 3600 / 60, rem % 60)
}

/// Potongan akhir teks sepanjang paling banyak `max` karakter (batas karakter, bukan byte).
pub fn tail_chars(s: &str, max: usize) -> String {
    let n = s.chars().count();
    if n <= max {
        return s.to_string();
    }
    s.chars().skip(n - max).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn url_hanya_yang_diizinkan() {
        assert!(url_allowed("https://saweria.co/BrianCoding"));
        assert!(url_allowed("https://github.com/CrFebrian/Dynamic-Neko/issues/new"));
        assert!(url_allowed("https://github.com/CrFebrian/Dynamic-Neko/issues/new?template=bug_report.yml&title=x%20y"));
        for bad in [
            "",
            "http://saweria.co/BrianCoding",
            "https://saweria.co/BrianCoding/../x",
            "https://saweria.co/BrianCodingX",
            "https://evil.example/https://saweria.co/BrianCoding",
            "https://github.com/CrFebrian/Dynamic-Neko/issues/new#x",
            "https://github.com/CrFebrian/Dynamic-Neko/issues/newx",
            "https://saweria.co/BrianCoding?a=1 b",
            "https://saweria.co/BrianCoding\n",
            "file:///C:/Windows/System32/calc.exe",
            "calc.exe",
        ] {
            assert!(!url_allowed(bad), "{bad:?} seharusnya ditolak");
        }
        let long = format!("https://saweria.co/BrianCoding?{}", "a".repeat(9000));
        assert!(!url_allowed(&long));
    }

    #[test]
    fn url_halaman_rilis_diizinkan() {
        assert!(url_allowed("https://github.com/CrFebrian/Dynamic-Neko/releases/latest"));
        assert!(!url_allowed("https://github.com/CrFebrian/Dynamic-Neko/releases/latest/../../x"));
        assert!(!url_allowed("https://github.com/CrFebrian/Dynamic-Neko/releases"));
    }

    #[test]
    fn volume_persen_dan_skala() {
        assert_eq!(percent_to_scalar(0), Ok(0.0));
        assert_eq!(percent_to_scalar(100), Ok(1.0));
        assert_eq!(percent_to_scalar(50), Ok(0.5));
        assert!(percent_to_scalar(101).is_err());
        assert_eq!(scalar_to_percent(0.0), Some(0));
        assert_eq!(scalar_to_percent(1.0), Some(100));
        assert_eq!(scalar_to_percent(0.555), Some(56));
        for bad in [-0.1_f32, 1.01, f32::NAN, f32::INFINITY] {
            assert_eq!(scalar_to_percent(bad), None);
        }
        for p in 0..=100u8 {
            assert_eq!(scalar_to_percent(percent_to_scalar(p).unwrap()), Some(p));
        }
    }

    #[test]
    fn sanitize_satu_baris_dan_terbatas() {
        assert_eq!(sanitize("a\r\nb\tc\u{0}d", 100), "a b c d");
        assert_eq!(sanitize("   rapi   ", 100), "rapi");
        assert_eq!(sanitize(&"x".repeat(5000), 10).chars().count(), 10);
        assert_eq!(sanitize("日本語テキスト", 3), "日本語");
        assert_eq!(sanitize("", 10), "");
    }

    #[test]
    fn iso_utc_nilai_diketahui() {
        assert_eq!(iso_utc(0), "1970-01-01T00:00:00Z");
        assert_eq!(iso_utc(1_700_000_000), "2023-11-14T22:13:20Z");
        assert_eq!(iso_utc(951_782_400), "2000-02-29T00:00:00Z");
        assert_eq!(iso_utc(1_782_864_000), "2026-07-01T00:00:00Z");
        assert_eq!(iso_utc(4_102_444_799), "2099-12-31T23:59:59Z");
    }

    #[test]
    fn tail_chars_batas_karakter() {
        assert_eq!(tail_chars("abcdef", 3), "def");
        assert_eq!(tail_chars("abc", 10), "abc");
        assert_eq!(tail_chars("日本語テキスト", 2), "スト");
        assert_eq!(tail_chars("", 5), "");
    }
}
