import { identityLut, type Lut } from './lut';

export interface ChannelLuts {
  r: Lut;
  g: Lut;
  b: Lut;
  a: Lut;
}

export function identityLuts(): ChannelLuts {
  const id = identityLut();
  return { r: id, g: id, b: id, a: id };
}

export function applyLuts(source: ImageData, luts: ChannelLuts): ImageData {
  const { width, height, data } = source;
  const out = new Uint8ClampedArray(data.length);

  const { r: lutR, g: lutG, b: lutB, a: lutA } = luts;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = lutR[data[i]];
    out[i + 1] = lutG[data[i + 1]];
    out[i + 2] = lutB[data[i + 2]];
    out[i + 3] = lutA[data[i + 3]];
  }

  return new ImageData(out, width, height);
}
