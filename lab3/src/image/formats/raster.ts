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

    return {
      source,
      width,
      height,
      pixels,
      colorDepth: detectDepth(pixels),
      fileName: file.name,
    };
  } finally {
    bitmap.close();
  }
}

function detectDepth(img: ImageData): string {
  const data = img.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return '32 bpp (RGBA)';
  }
  return '24 bpp (RGB)';
}
