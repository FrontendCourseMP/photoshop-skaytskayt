import type { ImageDoc } from './types';
import { decodeRaster } from './formats/raster';

export async function loadImageFile(file: File): Promise<ImageDoc> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type.toLowerCase();

  if (mime === 'image/png' || ext === 'png') {
    return decodeRaster(file, 'png');
  }
  if (mime === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg') {
    return decodeRaster(file, 'jpg');
  }
  throw new Error(`Неподдерживаемый формат: ${file.name}`);
}
