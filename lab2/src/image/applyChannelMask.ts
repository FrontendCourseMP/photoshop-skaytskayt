import type { ChannelKey, ChannelLayout } from './channels';

export function applyChannelMask(
  source: ImageData,
  active: Set<ChannelKey>,
  layout: ChannelLayout,
): ImageData {
  const { width, height, data } = source;
  const out = new Uint8ClampedArray(data.length);

  const onlyAlpha =
    layout.hasAlpha && active.size === 1 && active.has('a');

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (onlyAlpha) {
      out[i] = a;
      out[i + 1] = a;
      out[i + 2] = a;
      out[i + 3] = 255;
      continue;
    }

    if (layout.hasColor) {
      out[i] = active.has('r') ? r : 0;
      out[i + 1] = active.has('g') ? g : 0;
      out[i + 2] = active.has('b') ? b : 0;
    } else {
      const grayOn = active.has('gray');
      out[i] = grayOn ? r : 0;
      out[i + 1] = grayOn ? g : 0;
      out[i + 2] = grayOn ? b : 0;
    }

    if (layout.hasAlpha) {
      out[i + 3] = active.has('a') ? a : 255;
    } else {
      out[i + 3] = 255;
    }
  }

  return new ImageData(out, width, height);
}
