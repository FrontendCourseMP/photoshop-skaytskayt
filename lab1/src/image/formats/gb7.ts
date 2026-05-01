import type { ImageDoc } from '../types';

const SIGNATURE = [0x47, 0x42, 0x37, 0x1d] as const;
const VERSION = 0x01;
const HEADER_SIZE = 12;
const FLAG_MASK_BIT = 0x01;
const PIXEL_MASK_BIT = 0x80;
const PIXEL_GRAY_MASK = 0x7f;

export interface DecodeGB7Options {
  fileName?: string;
}

export function decodeGB7(buffer: ArrayBuffer, opts: DecodeGB7Options = {}): ImageDoc {
  if (buffer.byteLength < HEADER_SIZE) {
    throw new Error('Файл повреждён: меньше 12 байт заголовка');
  }

  const view = new DataView(buffer);

  for (let i = 0; i < SIGNATURE.length; i++) {
    if (view.getUint8(i) !== SIGNATURE[i]) {
      throw new Error('Это не GB7: неверная сигнатура файла');
    }
  }

  const version = view.getUint8(4);
  if (version !== VERSION) {
    throw new Error(`Неподдерживаемая версия GB7: 0x${version.toString(16).padStart(2, '0')}`);
  }

  const flags = view.getUint8(5);
  const hasMask = (flags & FLAG_MASK_BIT) !== 0;

  const width = view.getUint16(6, false);
  const height = view.getUint16(8, false);
  if (width === 0 || height === 0) {
    throw new Error(`Некорректные размеры: ${width} × ${height}`);
  }

  const pixelCount = width * height;
  const expected = HEADER_SIZE + pixelCount;
  if (buffer.byteLength < expected) {
    throw new Error(
      `Файл обрезан: ожидалось ${expected} байт, получено ${buffer.byteLength}`,
    );
  }

  const src = new Uint8Array(buffer, HEADER_SIZE, pixelCount);
  const dst = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const byte = src[i];
    const gray7 = byte & PIXEL_GRAY_MASK;
    const gray8 = Math.round((gray7 * 255) / 127);

    const alpha = hasMask ? ((byte & PIXEL_MASK_BIT) !== 0 ? 255 : 0) : 255;

    const o = i * 4;
    dst[o] = gray8;
    dst[o + 1] = gray8;
    dst[o + 2] = gray8;
    dst[o + 3] = alpha;
  }

  const pixels = new ImageData(dst, width, height);

  return {
    source: 'gb7',
    width,
    height,
    pixels,
    colorDepth: hasMask ? '7 bpp (gray + 1-bit mask)' : '7 bpp (grayscale)',
    hasMask,
    fileName: opts.fileName,
  };
}
