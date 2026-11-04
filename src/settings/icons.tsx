import type { ComponentType } from 'react';
import { Svg, IconAnime, IconChill, IconMusic, IconToday } from '../island/icons.tsx';
import type { Cat } from './catalog.ts';

const IconGear = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
  </Svg>
);
const IconInfo = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);
const IconPalette = () => (
  <Svg>
    <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" />
    <path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01" />
  </Svg>
);
const IconPillShape = () => (
  <Svg>
    <rect x="3" y="8" width="18" height="8" rx="4" />
    <circle cx="8" cy="12" r="1.3" />
  </Svg>
);

/** Ikon sidebar per kategori. */
export const CAT_ICON: Record<Cat, ComponentType> = {
  umum: IconGear,
  tentang: IconInfo,
  tampilan: IconPalette,
  isi: IconPillShape,
  musik: IconMusic,
  hari: IconToday,
  anime: IconAnime,
  fokus: IconChill,
};
