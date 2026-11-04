import type { ReactNode } from 'react';

/** Ikon garis sederhana (24x24), digambar sendiri. */
const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconToday = () => (
  <Svg>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
  </Svg>
);
export const IconRead = () => (
  <Svg>
    <path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6zM12 6v13" />
  </Svg>
);
export const IconAnime = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="13" rx="3" />
    <path d="M10 9.5v4l4-2z M8 21h8" />
  </Svg>
);
export const IconMusic = () => (
  <Svg>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </Svg>
);
export const IconChill = () => (
  <Svg>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconSettings = () => (
  <Svg>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);
export const IconPrev = () => (
  <Svg>
    <path d="M14.5 6l-6 6 6 6" />
  </Svg>
);
export const IconNext = () => (
  <Svg>
    <path d="M9.5 6l6 6-6 6" />
  </Svg>
);
