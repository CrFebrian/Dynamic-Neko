/** Jeda sebelum panel menutup sendiri setelah kursor keluar. Cukup lama agar lintasan singkat tidak menutupnya. */
export const AUTO_CLOSE_MS = 500;

const TEXT_TYPES = new Set(['text', 'number', 'time', 'search', 'email', 'url']);

/** Pengguna sedang mengetik: kolom teks terfokus dan sudah berisi. Panel tidak boleh menutup dan menghapus ketikannya. */
export function isTyping(el: { tag: string; type?: string; value?: string } | null): boolean {
  if (!el) return false;
  const tag = el.tag.toUpperCase();
  const filled = (el.value ?? '') !== '';
  if (tag === 'TEXTAREA') return filled;
  return tag === 'INPUT' && TEXT_TYPES.has((el.type ?? 'text').toLowerCase()) && filled;
}
