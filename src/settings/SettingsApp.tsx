import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { quitApp } from '../app/window.ts';
import { Neko } from '../mascot/Neko.tsx';
import { CAT_ICON } from './icons.tsx';
import { CATS, entry, GROUPS, catLabel, searchSettings, type Cat } from './catalog.ts';
import { notifySettingsChanged, onSettingsChanged, requestTour } from '../lib/bus.ts';
import { APP_VERSION } from '../lib/version.ts';
import { checkForUpdate, loadUpdateInfo } from '../features/update/updateCheck.ts';
import { isNewer, RELEASES_PAGE, statusText, type UpdateInfo } from '../features/update/update.ts';
import { DEFAULT_SETTINGS, EYE_OPTIONS, GOAL_MAX, GOAL_MIN, loadSettings, saveSetting, type SettingKey, type Settings } from '../lib/settings.ts';
import { getStore } from '../lib/store.ts';
import { openDataDir, openExternal, readErrorLog } from '../lib/external.ts';
import { describeOs, issueUrl, lastLines, SAWERIA_URL } from '../lib/report.ts';
import { THEME_LABEL, THEME_PREFS } from '../lib/theme.ts';
import { Switch } from '../ui/Switch.tsx';
import { useTheme } from '../ui/useTheme.ts';


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

const T = (id: string) => entry(id).title;
const H = (id: string) => entry(id).hint;

export function SettingsApp() {
  const { cfg, update, ready } = useSettings();
  useTheme(cfg.theme);
  const [cat, setCat] = useState<Cat>('umum');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [upd, setUpd] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [updErr, setUpdErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadUpdateInfo(getStore())
      .then((i) => alive && setUpd(i))
      .catch((e: unknown) => console.error('Gagal membaca info pembaruan:', e));
    return () => {
      alive = false;
    };
  }, []);

  const checkNow = () => {
    if (checking) return;
    setChecking(true);
    setUpdErr(null);
    checkForUpdate(getStore(), Date.now(), true)
      .then(({ info }) => setUpd(info))
      .catch((e: unknown) => setUpdErr(`Gagal memeriksa. ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setChecking(false));
  };

  // Ctrl+F memfokuskan kotak cari.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
  const results = searchSettings(query);
  const searching = query.trim() !== '';

  const goto = (c: Cat) => {
    setCat(c);
    setQuery('');
    setMsg(null);
  };

  return (
    <div className="sx">
      <nav className="sx-side" aria-label="Kategori pengaturan">
        <div className="sx-brand">
          <span className="sx-logo" aria-hidden="true">
            <Neko state="idle" />
          </span>
          <span>
            <b>Yomi Island</b>
            <small>Versi {APP_VERSION}</small>
          </span>
        </div>
        <input
          ref={searchRef}
          className="sx-search"
          type="search"
          value={query}
          placeholder="Cari pengaturan (Ctrl+F)"
          aria-label="Cari pengaturan"
          onChange={(e) => setQuery(e.target.value)}
        />
        {GROUPS.map((g) => (
          <div key={g.label} className="sx-group">
            <div className="sx-glabel">{g.label}</div>
            {g.items.map((c) => {
              const Icon = CAT_ICON[c.key];
              return (
                <button key={c.key} aria-current={!searching && cat === c.key ? 'page' : undefined} onClick={() => goto(c.key)}>
                  <Icon />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <main className="sx-main">
        {searching ? (
          <>
            <h1>Hasil pencarian</h1>
            <p className="sub">{results.length === 0 ? 'Tidak ada pengaturan yang cocok.' : `${results.length} pengaturan ditemukan.`}</p>
            <div className="card">
              {results.map((r) => (
                <button key={r.id} className="result" onClick={() => goto(r.cat)}>
                  <span>
                    <b>{r.title}</b>
                    <small>{r.hint}</small>
                  </span>
                  <span className="tag">{catLabel(r.cat)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1>{info.label}</h1>
            <p className="sub">{info.desc}</p>
            {!ready && <p className="sub">Memuat…</p>}

            {cat === 'umum' && (
              <>
                <Card>
                  <Switch on={cfg.autoClose} onChange={(v) => update('autoClose', v)} label={T('autoClose')} hint={H('autoClose')} />
                </Card>
                <p className="note">Geser island ke kiri atau kanan dengan menyeret pill atau bagian atas panel. Posisi tersimpan.</p>
                <h2>Tur pengenalan</h2>
                <Card>
                  <Row title={T('tourDone')} hint={H('tourDone')}>
                    <button className="btn" onClick={() => run(requestTour, 'Gagal memulai tur.')}>
                      Mulai tur
                    </button>
                  </Row>
                </Card>
                <h2>Pembaruan</h2>
                <Card>
                  <Switch on={cfg.updateCheck} onChange={(v) => update('updateCheck', v)} label={T('updateCheck')} hint={H('updateCheck')} />
                  <Row title={`Versi ${APP_VERSION}`} hint={updErr ?? (checking ? 'Memeriksa…' : statusText(upd, APP_VERSION))}>
                    <div className="upd-actions">
                      {upd?.latest && isNewer(upd.latest, APP_VERSION) && (
                        <button className="btn pri" onClick={() => run(() => openExternal(RELEASES_PAGE), 'Gagal membuka halaman rilis.')}>
                          Unduh
                        </button>
                      )}
                      <button className="btn" disabled={checking} onClick={checkNow}>
                        Cek sekarang
                      </button>
                    </div>
                  </Row>
                </Card>
                {msg && (
                  <p className="note" role="alert">
                    {msg}
                  </p>
                )}
                <h2>Aplikasi</h2>
                <Card>
                  <Row title={T('quit')} hint={H('quit')}>
                    <button className="btn" onClick={() => void quitApp()}>
                      Keluar
                    </button>
                  </Row>
                </Card>
              </>
            )}

            {cat === 'tentang' && (
              <>
                <div className="about">
                  <div className="about-logo" aria-hidden="true">
                    <Neko state="idle" />
                  </div>
                  <b>Yomi Island</b>
                  <span className="mono">Versi {APP_VERSION}</span>
                  <p>Dynamic island untuk Windows bertema neko, untuk pembaca dan penggemar anime.</p>
                </div>
                <Card>
                  <Row title={T('license')} hint={H('license')}>
                    <span />
                  </Row>
                  <Row title={T('support')} hint={H('support')}>
                    <button className="btn pri" onClick={() => run(() => openExternal(SAWERIA_URL), 'Gagal membuka Saweria.')}>
                      Traktir kopi
                    </button>
                  </Row>
                </Card>
                <h2>Ada masalah?</h2>
                <Card>
                  <Row title={T('report')} hint={H('report')}>
                    <button className="btn" onClick={report}>
                      Laporkan
                    </button>
                  </Row>
                  <Row title={T('folder')} hint={H('folder')}>
                    <button className="btn" onClick={() => run(openDataDir, 'Gagal membuka folder.')}>
                      Buka folder
                    </button>
                  </Row>
                </Card>
                {msg && (
                  <p className="note" role="alert">
                    {msg}
                  </p>
                )}
              </>
            )}

            {cat === 'tampilan' && (
              <Card>
                <Row title={T('theme')} hint={H('theme')}>
                  <div className="seg" role="group" aria-label="Tema">
                    {THEME_PREFS.map((t) => (
                      <button key={t} aria-pressed={cfg.theme === t} onClick={() => update('theme', t)}>
                        {THEME_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row title={T('style')} hint={H('style')}>
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
            )}

            {cat === 'isi' && (
              <Card>
                <Switch on={cfg.showBattery} onChange={(v) => update('showBattery', v)} label={T('showBattery')} hint={H('showBattery')} />
                <Switch on={cfg.showClock} onChange={(v) => update('showClock', v)} label={T('showClock')} hint={H('showClock')} />
              </Card>
            )}

            {cat === 'musik' && (
              <Card>
                <Switch on={cfg.lyrics} onChange={(v) => update('lyrics', v)} label={T('lyrics')} hint={H('lyrics')} />
                <Switch on={cfg.beep} onChange={(v) => update('beep', v)} label={T('beep')} hint={H('beep')} />
              </Card>
            )}

            {cat === 'hari' && (
              <>
                <Card>
                  <Row title={T('eyeInterval')} hint={H('eyeInterval')}>
                    <div className="chips">
                      {EYE_OPTIONS.map((m) => (
                        <button key={m} className="chip" aria-pressed={cfg.eyeInterval === m} onClick={() => update('eyeInterval', m)}>
                          {m === 0 ? 'Mati' : `${m} mnt`}
                        </button>
                      ))}
                    </div>
                  </Row>
                  <Row title={T('goal')} hint={H('goal')}>
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
                  <Switch on={cfg.notifyGacha} onChange={(v) => update('notifyGacha', v)} label={T('notifyGacha')} hint={H('notifyGacha')} />
                </Card>
                <p className="note">Selama mode rapat atau mode nonton aktif, notifikasi ditahan lalu diringkas setelah selesai.</p>
              </>
            )}

            {cat === 'anime' && (
              <>
                <Card>
                  <Switch on={cfg.notifyAnime} onChange={(v) => update('notifyAnime', v)} label={T('notifyAnime')} hint={H('notifyAnime')} />
                  <Switch on={cfg.notifyManga} onChange={(v) => update('notifyManga', v)} label={T('notifyManga')} hint={H('notifyManga')} />
                  <Row title={T('mangaLang')} hint={H('mangaLang')}>
                    <div className="seg" role="group" aria-label="Bahasa bab manga">
                      <button aria-pressed={cfg.mangaLang === 'en'} onClick={() => update('mangaLang', 'en')}>
                        Inggris
                      </button>
                      <button aria-pressed={cfg.mangaLang === 'id'} onClick={() => update('mangaLang', 'id')}>
                        Indonesia
                      </button>
                    </div>
                  </Row>
                </Card>
                <p className="note">
                  Daftar anime dan manga dikelola di panel island, tab Anime. Layanan online yang dipakai: AniList (judul/ID anime), MangaDex (judul/ID manga), dan LRCLIB (judul dan artis lagu, bila Lirik nyala). Task, buku, dan statistik baca hanya disimpan di laptop ini.
                </p>
              </>
            )}

            {cat === 'fokus' && (
              <>
                <Card>
                  <Switch on={cfg.meetingMode} onChange={(v) => update('meetingMode', v)} label={T('meetingMode')} hint={H('meetingMode')} />
                  <Switch on={cfg.watchMode} onChange={(v) => update('watchMode', v)} label={T('watchMode')} hint={H('watchMode')} />
                </Card>
                <p className="note">Penanda rekam layar ada di panel island, tab Santai, karena Windows tidak memberi tahu saat layar direkam.</p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
