// Demo island. Tidak ada data asli, tidak ada permintaan jaringan.
(() => {
  const island = document.getElementById('island');
  const pill = document.getElementById('pill');
  const panel = document.getElementById('panel');
  const neko = document.getElementById('neko');
  const hint = document.getElementById('hint');
  const clock = document.getElementById('clock');
  const tabs = Array.from(document.querySelectorAll('.tabs [role=tab]'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ext = reduced ? 'png' : 'gif';

  const setMood = (mood) => {
    neko.src = `assets/neko/${mood}.${ext}`;
  };
  setMood('idle');

  const open = (v) => {
    island.dataset.open = String(v);
    pill.setAttribute('aria-expanded', String(v));
    panel.toggleAttribute('inert', !v);
    hint.textContent = v ? 'Pindah tab untuk melihat neko berganti ekspresi.' : 'Coba klik pill di atas. Ini contoh, isinya bukan data asli.';
    if (!v) setMood('idle');
    else setMood(document.querySelector('.tabs [aria-selected=true]').dataset.mood);
  };
  pill.addEventListener('click', () => open(island.dataset.open !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && island.dataset.open === 'true') {
      open(false);
      pill.focus();
    }
  });

  const select = (tab, focus) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(`v-${t.dataset.view}`).hidden = !on;
    }
    setMood(tab.dataset.mood);
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) {
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      }
    });
  });

  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    document.getElementById('today-date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  tick();
  setInterval(tick, 15000);
})();
