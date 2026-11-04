import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { quitApp } from '../app/window.ts';
import { notifySettingsChanged, onSettingsChanged } from '../lib/bus.ts';
import { DEFAULT_SETTINGS, EYE_OPTIONS, GOAL_MAX, GOAL_MIN, loadSettings, saveSetting, type SettingKey, type Settings } from '../lib/settings.ts';
import { getStore } from '../lib/store.ts';
import { openDataDir, openExternal, readErrorLog } from '../lib/external.ts';
import { describeOs, issueUrl, lastLines, SAWERIA_URL } from '../lib/report.ts';
import { THEME_LABEL, THEME_PREFS } from '../lib/theme.ts';
import { Switch } from '../ui/Switch.tsx';
import { useTheme } from '../ui/useTheme.ts';

const APP_VERSION = '0.1.0';

type Cat = 'umum' | 'fokus' | 'pengingat' | 'konten' | 'tentang';
const CATS: ReadonlyArray<{ key: Cat; label: string; desc: string }> = [
  { key: 'umum', label: 'Umum', desc: 'Tema, gaya, dan isi pill.' },
  { key: 'fokus', label: 'Mode fokus', desc: 'Rapat dan menonton.' },
  { key: 'pengingat', label: 'Pengingat', desc: 'Istirahat mata, target baca, dan notifikasi di pill.' },
  { key: 'konten', label: 'Anime, manga, lirik', desc: 'Sumber data dan bahasa.' },
  { key: 'tentang', label: 'Tentang', desc: 'Versi, bantuan, dan dukungan.' },
];

function useSettings() {
  const [cfg, setCfg] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const alive = useRef(true);

  const reload = useCallback(() => {
    loadSettings(getStore())
      .then((s) => {
        if (alive.current) {
          setCfg(s);
          setReady(true);
        }
      })
      .catch((e: unknown) => console.error('Gagal memuat pengaturan:', e));
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    // Island bisa mengubah nilai yang sama (target baca, interval mata): muat ulang saat jendela difokuskan.
    window.addEventListener('focus', reload);
    const off = onSettingsChanged(reload);
    return () => {
      alive.current = false;
      window.removeEventListener('focus', reload);
      off();
    };
  }, [reload]);

  const update = useCallback(<K extends SettingKey>(key: K, value: Settings[K]) => {
    setCfg((c) => ({ ...c, [key]: value }));
    saveSetting(getStore(), key, value)
      .then(() => notifySettingsChanged())
      .catch((e: unknown) => console.error(`Gagal menyimpan ${key}:`, e));
  }, []);

  return { cfg, update, ready };
}

const Card = ({ children }: { children: ReactNode }) => <div className="card">{children}</div>;
const Row = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div className="rowset">
    <div>
      <b>{title}</b>
      {hint && <small>{hint}</small>}
    </div>
    <div className="ctrl">{children}</div>
  </div>
);

export function SettingsApp() {
  const { cfg, update, ready } = useSettings();
  useTheme(cfg.theme);
  const [cat, setCat] = useState<Cat>('umum');
  const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: () => Promise<void>, fail: string) => {
    setMsg(null);
    fn().catch((e: unknown) => setMsg(`${fail} ${e instanceof Error ? e.message : String(e)}`));
  };
  const report = () =>
    run(async () => {
      const log = lastLines(await readErrorLog(), 10, 1500);
      await openExternal(issueUrl({ version: APP_VERSION, os: describeOs(navigator.userAgent), log }));
    }, 'Gagal membuka form laporan.');
  const info = CATS.find((c) => c.key === cat) ?? CATS[0];

  return (
    <div className="sx">
      <nav className="sx-side" aria-label="Kategori pengaturan">
        <div className="sx-brand">
          <b>Yomi Island</b>
          <small>Versi {APP_VERSION}</small>
        </div>
        {CATS.map((c) => (
          <button key={c.key} aria-current={cat === c.key ? 'page' : undefined} onClick={() => setCat(c.key)}>
            {c.label}
          </button>
        ))}
      </nav>

      <main className="sx-main">
        <h1>{info.label}</h1>
        <p className="sub">{info.desc}</p>
        {!ready && <p className="sub">Memuat…</p>}

        {cat === 'umum' && (
          <>
            <Card>
              <Row title="Tema" hint="Gelap, terang, atau mengikuti pengaturan terang/gelap Windows.">
                <div className="seg" role="group" aria-label="Tema">
                  {THEME_PREFS.map((t) => (
                    <button key={t} aria-pressed={cfg.theme === t} onClick={() => update('theme', t)}>
                      {THEME_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Row>
              <Row title="Gaya island" hint="Dynamic melayang di bawah tepi atas, Notch menempel ke tepi.">
                <div className="seg" role="group" aria-label="Gaya island">
                  <button aria-pressed={cfg.style === 'dynamic'} onClick={() => update('style', 'dynamic')}>
                    Dynamic
                  </button>
                  <button aria-pressed={cfg.style === 'notch'} onClick={() => update('style', 'notch')}>
                    Notch
                  </button>
                </div>
              </Row>
            </Card>
            <h2>Perilaku</h2>
            <Card>
              <Switch on={cfg.autoClose} onChange={(v) => update('autoClose', v)} label="Tutup otomatis saat kursor keluar" hint="Panel kembali jadi pill kecil sesaat setelah kursor meninggalkannya, tanpa menekan ×. Tidak menutup saat kamu sedang mengetik." />
            </Card>
            <h2>Isi pill saat diam</h2>
            <Card>
              <Switch on={cfg.showClock} onChange={(v) => update('showClock', v)} label="Tampilkan jam" hint="Jam lokal (24 jam) di samping ikon neko." />
              <Switch on={cfg.showBattery} onChange={(v) => update('showBattery', v)} label="Tampilkan baterai" hint="Persentase dan status mengisi. Tidak tampil di PC tanpa baterai." />
            </Card>
            <h2>Suara</h2>
            <Card>
              <Switch on={cfg.beep} onChange={(v) => update('beep', v)} label="Bunyi saat pengingat" hint="Bip singkat saat timer, istirahat mata, atau notifikasi muncul." />
            </Card>
            <p className="note">Geser island ke kiri atau kanan dengan menyeret pill atau bagian atas panel. Posisi tersimpan.</p>
          </>
        )}

        {cat === 'fokus' && (
          <>
            <Card>
              <Switch on={cfg.meetingMode} onChange={(v) => update('meetingMode', v)} label="Mode rapat otomatis" hint="Saat mikrofon dipakai: pengingat dan bunyi ditahan, pill jadi indikator rapat." />
              <Switch on={cfg.watchMode} onChange={(v) => update('watchMode', v)} label="Mode nonton otomatis" hint="Saat ada aplikasi layar penuh: island bersembunyi dan pengingat ditahan." />
            </Card>
            <p className="note">Penanda rekam layar ada di panel island, tab Santai, karena Windows tidak memberi tahu saat layar direkam.</p>
          </>
        )}

        {cat === 'pengingat' && (
          <>
            <h2>Istirahat mata 20-20-20</h2>
            <Card>
              <Row title="Jeda antar pengingat" hint="Tiap jeda ini, pandang yang jauh selama 20 detik.">
                <div className="chips">
                  {EYE_OPTIONS.map((m) => (
                    <button key={m} className="chip" aria-pressed={cfg.eyeInterval === m} onClick={() => update('eyeInterval', m)}>
                      {m === 0 ? 'Mati' : `${m} mnt`}
                    </button>
                  ))}
                </div>
              </Row>
            </Card>
            <h2>Target baca harian</h2>
            <Card>
              <Row title="Halaman per hari" hint={`${GOAL_MIN} sampai ${GOAL_MAX} halaman.`}>
                <div className="stepper">
                  <button className="chip" aria-label="Kurangi 5" onClick={() => update('goal', Math.max(GOAL_MIN, cfg.goal - 5))}>
                    −5
                  </button>
                  <span className="mono" aria-live="polite">
                    {cfg.goal}
                  </span>
                  <button className="chip" aria-label="Tambah 5" onClick={() => update('goal', Math.min(GOAL_MAX, cfg.goal + 5))}>
                    +5
                  </button>
                </div>
              </Row>
            </Card>
            <h2>Notifikasi di pill</h2>
            <Card>
              <Switch on={cfg.notifyAnime} onChange={(v) => update('notifyAnime', v)} label="Episode anime tayang" hint="Muncul saat jadwal tayang anime di daftarmu tiba." />
              <Switch on={cfg.notifyManga} onChange={(v) => update('notifyManga', v)} label="Bab manga baru" hint="Dicek tiap 30 menit selama aplikasi berjalan." />
              <Switch on={cfg.notifyGacha} onChange={(v) => update('notifyGacha', v)} label="Reset harian game" hint="Muncul saat jam reset timer game tiba." />
            </Card>
            <p className="note">Selama mode rapat atau mode nonton aktif, notifikasi ditahan lalu diringkas setelah selesai.</p>
          </>
        )}

        {cat === 'konten' && (
          <>
            <Card>
              <Row title="Bahasa bab manga" hint="Bab yang dipantau dari MangaDex. Mengganti bahasa mengulang acuan bab, jadi tidak ada notifikasi palsu.">
                <div className="seg" role="group" aria-label="Bahasa bab manga">
                  <button aria-pressed={cfg.mangaLang === 'en'} onClick={() => update('mangaLang', 'en')}>
                    Inggris
                  </button>
                  <button aria-pressed={cfg.mangaLang === 'id'} onClick={() => update('mangaLang', 'id')}>
                    Indonesia
                  </button>
                </div>
              </Row>
              <Switch on={cfg.lyrics} onChange={(v) => update('lyrics', v)} label="Lirik berjalan" hint="Judul dan artis lagu yang diputar dikirim ke LRCLIB untuk mencari lirik." />
            </Card>
            <p className="note">Daftar anime dan manga dikelola di panel island, tab Anime. Layanan online yang dipakai: AniList (judul/ID anime), MangaDex (judul/ID manga), LRCLIB (judul dan artis lagu, bila Lirik nyala). Task, buku, dan statistik baca hanya disimpan di laptop ini.</p>
          </>
        )}

        {cat === 'tentang' && (
          <>
            <Card>
              <Row title="Yomi Island" hint="Gratis untuk pemakaian pribadi, tidak dijual.">
                <span className="mono">v{APP_VERSION}</span>
              </Row>
            </Card>

            <h2>Ada masalah?</h2>
            <Card>
              <Row title="Laporkan masalah" hint="Membuka form GitHub di browser. Versi, Windows, dan 10 baris error terakhir terisi otomatis; periksa dan ubah dulu sebelum mengirim.">
                <button className="btn" onClick={report}>
                  Buka form
                </button>
              </Row>
            </Card>

            <h2>Folder log dan pengaturan</h2>
            <Card>
              <Row title="Buka folder" hint="Berisi error.log (catatan error, bisa dilampirkan saat melaporkan masalah) dan yomi.db (task, buku, dan pengaturanmu).">
                <button className="btn" onClick={() => run(openDataDir, 'Gagal membuka folder.')}>
                  Buka folder
                </button>
              </Row>
            </Card>
            {msg && <p className="note" role="alert">{msg}</p>}

            <h2>Dukung pengembangan</h2>
            <Card>
              <Row title="Traktir kopi" hint="Aplikasi ini gratis. Kalau terbantu, kamu bisa membantu pengembang lewat Saweria untuk pengembangan lebih lanjut.">
                <button className="btn pri" onClick={() => run(() => openExternal(SAWERIA_URL), 'Gagal membuka Saweria.')}>
                  Saweria
                </button>
              </Row>
            </Card>

            <h2>Aplikasi</h2>
            <Card>
              <Row title="Keluar dari Yomi Island" hint="Island ditutup. Buka lagi dari menu Start.">
                <button className="btn" onClick={() => void quitApp()}>
                  Keluar
                </button>
              </Row>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
