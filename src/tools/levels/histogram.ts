import type { ChannelKey } from './channelKeys';

export const HISTOGRAM_BINS = 256;

export interface HistogramSet {
  master: Uint32Array;
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  alpha: Uint32Array;
  totalPixels: number;
}

export function computeHistograms(pixels: ImageData): HistogramSet {
  const data = pixels.data;
  const total = pixels.width * pixels.height;

  const master = new Uint32Array(HISTOGRAM_BINS);
  const red = new Uint32Array(HISTOGRAM_BINS);
  const green = new Uint32Array(HISTOGRAM_BINS);
  const blue = new Uint32Array(HISTOGRAM_BINS);
  const alpha = new Uint32Array(HISTOGRAM_BINS);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    red[r]++;
    green[g]++;
    blue[b]++;
    alpha[a]++;

    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.5) | 0;
    master[luma]++;
  }

  return { master, red, green, blue, alpha, totalPixels: total };
}

export function selectHistogram(set: HistogramSet, channel: ChannelKey): Uint32Array {
  switch (channel) {
    case 'master':
      return set.master;
    case 'red':
      return set.red;
    case 'green':
      return set.green;
    case 'blue':
      return set.blue;
    case 'alpha':
      return set.alpha;
  }
}
