// Tokens repris tels quels de assets/css/style.css (site Edgio)
export const colors = {
  bg: '#08090d',
  bg2: '#0b0d13',
  card: '#12141d',
  card2: '#161925',
  txt: '#eef1f7',
  dim: '#9aa3b6',
  dim2: '#6b7386',
  magenta: '#c81fe0',
  violet: '#8a2be8',
  indigo: '#5638e8',
  accent: '#a26bff',
  accent2: '#d33cf0',
  green: '#34d399',
  red: '#f8717a',
} as const;

export const gradient = `linear-gradient(120deg, ${colors.magenta} 0%, ${colors.violet} 48%, ${colors.indigo} 100%)`;

// Dimensions vidéo (format vertical Reels/Shorts)
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const FPS = 30;

// Durée de chaque scène, en frames (30fps -> 120 frames = 4s)
export const SCENE_DURATION = 120;
