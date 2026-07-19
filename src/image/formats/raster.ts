import type { ImageDoc, SourceFormat } from '../types';

export async function decodeRaster(
  file: File,
  source: Extract<SourceFormat, 'png' | 'jpg'>,
): Promise<ImageDoc> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    if (width === 0 || height === 0) {
      throw new Error('Изображение нулевого размера');
    }

    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), { width, height });

    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) throw new Error('Не удалось получить 2D-контекст для декода изображения');

    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height);

    const pngMeta = source === 'png' ? await readPngMeta(file) : null;

    return {
      source,
      width,
      height,
      pixels,
      colorDepth: pngMeta ? describePngDepth(pngMeta) : detectDepth(pixels),
      isGray: pngMeta?.gray,
      hasAlphaChannel: pngMeta?.alpha,
      fileName: file.name,
    };
  } finally {
    bitmap.close();
  }
}

interface PngMeta {
  bitDepth: number;
  colorType: number;
  gray: boolean;
  /** undefined для палитровых PNG — альфа определяется по пикселям */
  alpha?: boolean;
}

// Состав каналов берём из IHDR: скан пикселей не отличает
// полностью непрозрачный альфа-канал от его отсутствия.
async function readPngMeta(file: File): Promise<PngMeta | null> {
  try {
    const head = new Uint8Array(await file.slice(0, 26).arrayBuffer());
    if (head.length < 26) return null;
    const isIhdr =
      head[12] === 0x49 && head[13] === 0x48 && head[14] === 0x44 && head[15] === 0x52;
    if (!isIhdr) return null;
    const bitDepth = head[24];
    const colorType = head[25];
    if (![0, 2, 3, 4, 6].includes(colorType)) return null;
    return {
      bitDepth,
      colorType,
      gray: colorType === 0 || colorType === 4,
      alpha: colorType === 3 ? undefined : colorType === 4 || colorType === 6,
    };
  } catch {
    return null;
  }
}

function describePngDepth(meta: PngMeta): string {
  switch (meta.colorType) {
    case 0:
      return `${meta.bitDepth} bpp (grayscale)`;
    case 2:
      return `${meta.bitDepth * 3} bpp (RGB)`;
    case 3:
      return `${meta.bitDepth} bpp (palette)`;
    case 4:
      return `${meta.bitDepth * 2} bpp (gray + alpha)`;
    default:
      return `${meta.bitDepth * 4} bpp (RGBA)`;
  }
}

function detectDepth(img: ImageData): string {
  const data = img.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return '32 bpp (RGBA)';
  }
  return '24 bpp (RGB)';
}
