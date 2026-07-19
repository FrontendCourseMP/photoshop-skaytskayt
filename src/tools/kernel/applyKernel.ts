export type EdgeMode = 'black' | 'white' | 'copy';

function sampleChannel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  c: number,
  edge: EdgeMode,
): number {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    return data[(y * width + x) * 4 + c];
  }
  if (edge === 'black') return 0;
  if (edge === 'white') return 255;
  return data[(Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4 + c];
}

export function applyKernelRaw(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
  kernel: number[],
  divisor: number,
  offset: number,
  channels: boolean[],
  edge: EdgeMode,
  absolute = false,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        if (!channels[c]) continue;
        let acc = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            acc += kernel[ky * 3 + kx] * sampleChannel(data, width, height, x + kx - 1, y + ky - 1, c, edge);
          }
        }
        const value = absolute ? Math.abs(acc / divisor) : acc / divisor;
        out[idx + c] = Math.max(0, Math.min(255, Math.round(value + offset)));
      }
    }
  }

  return out;
}
