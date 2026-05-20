export interface LevelsParams {
  black: number;
  white: number;
  gamma: number;
}

export const DEFAULT_PARAMS: LevelsParams = {
  black: 0,
  white: 255,
  gamma: 1.0,
};

export const GAMMA_MIN = 0.1;
export const GAMMA_MAX = 9.9;

const MIN_BW_GAP = 1;

export function clampBlack(black: number, white: number): number {
  return clampInt(black, 0, white - MIN_BW_GAP);
}

export function clampWhite(white: number, black: number): number {
  return clampInt(white, black + MIN_BW_GAP, 255);
}

export function clampGamma(gamma: number): number {
  if (Number.isNaN(gamma)) return 1.0;
  return Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, gamma));
}

function clampInt(v: number, lo: number, hi: number): number {
  const n = Math.round(v);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
