export interface LabColor {
  L: number;
  a: number;
  b: number;
}

const REF_X = 0.95047;
const REF_Y = 1.0;
const REF_Z = 1.08883;

const DELTA = 6 / 29;
const DELTA3 = DELTA * DELTA * DELTA;

export function srgbToLab(r: number, g: number, b: number): LabColor {
  const rl = srgbChannelToLinear(r / 255);
  const gl = srgbChannelToLinear(g / 255);
  const bl = srgbChannelToLinear(b / 255);

  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const Z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;

  const fx = pivot(X / REF_X);
  const fy = pivot(Y / REF_Y);
  const fz = pivot(Z / REF_Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function pivot(t: number): number {
  return t > DELTA3 ? Math.cbrt(t) : t / (3 * DELTA * DELTA) + 4 / 29;
}
