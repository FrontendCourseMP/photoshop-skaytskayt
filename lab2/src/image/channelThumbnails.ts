import type { ChannelKey } from './channels';

export function makeChannelThumbnail(
  source: ImageData,
  key: ChannelKey,
  maxSize: number,
): ImageData {
  const small = downscaleImageData(source, maxSize);
  return extractChannelImage(small, key);
}

export function extractChannelImage(source: ImageData, key: ChannelKey): ImageData {
  const { width, height, data } = source;
  const out = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    let v = 0;
    switch (key) {
      case 'r':
        v = data[i];
        break;
      case 'g':
        v = data[i + 1];
        break;
      case 'b':
        v = data[i + 2];
        break;
      case 'a':
        v = data[i + 3];
        break;
      case 'gray': {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        break;
      }
    }
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = 255;
  }

  return new ImageData(out, width, height);
}

function downscaleImageData(source: ImageData, maxSize: number): ImageData {
  const { width, height } = source;
  if (width <= maxSize && height <= maxSize) return source;

  const scale = Math.min(maxSize / width, maxSize / height);
  const dstW = Math.max(1, Math.round(width * scale));
  const dstH = Math.max(1, Math.round(height * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Не удалось получить 2D-контекст для миниатюры');
  srcCtx.putImageData(source, 0, 0);

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) throw new Error('Не удалось получить 2D-контекст для миниатюры');
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'medium';
  dstCtx.drawImage(srcCanvas, 0, 0, dstW, dstH);

  return dstCtx.getImageData(0, 0, dstW, dstH);
}
