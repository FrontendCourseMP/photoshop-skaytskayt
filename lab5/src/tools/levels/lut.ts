import type { LevelsParams } from './levelsState';

export type Lut = Uint8ClampedArray;

const IDENTITY_LUT: Lut = (() => {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = i;
  return lut;
})();

export function identityLut(): Lut {
  return IDENTITY_LUT;
}

export function buildLut(params: LevelsParams): Lut {
  const { black, white, gamma } = params;
  const lut = new Uint8ClampedArray(256);
  const span = white - black;

  if (span <= 0) {
    for (let v = 0; v < 256; v++) {
      lut[v] = v < black ? 0 : 255;
    }
    return lut;
  }

  const invGamma = 1 / gamma;

  for (let v = 0; v < 256; v++) {
    if (v <= black) {
      lut[v] = 0;
      continue;
    }
    if (v >= white) {
      lut[v] = 255;
      continue;
    }
    const t = (v - black) / span;
    const corrected = Math.pow(t, invGamma);
    lut[v] = Math.round(corrected * 255);
  }

  return lut;
}

export function isIdentity(params: LevelsParams): boolean {
  return params.black === 0 && params.white === 255 && params.gamma === 1.0;
}

export function applyComposed(a: Lut, b: Lut): Lut {
  const out = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) out[v] = b[a[v]];
  return out;
}
