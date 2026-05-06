// Look-Up Tables для коррекции уровней.
//
// Формула:
//   1. Линейно растягиваем [black..white] -> [0..1]: t = clamp01((v - b)/(w - b)).
//   2. Применяем гамма-коррекцию: t' = t^(1/gamma).
//      gamma > 1 — осветление средних тонов, gamma < 1 — затемнение.
//   3. Масштабируем обратно в 0..255 и округляем.
//
// LUT — массив из 256 чисел (Uint8ClampedArray), отображающий вход в выход.

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

  // Защита от вырождения: если black >= white, возвращаем "пороговый" LUT —
  // всё ниже black -> 0, всё выше white -> 255. Этого не должно случаться при
  // корректном UI, но лучше не падать.
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

/** Эта таблица — тождественное преобразование? */
export function isIdentity(params: LevelsParams): boolean {
  return params.black === 0 && params.white === 255 && params.gamma === 1.0;
}
