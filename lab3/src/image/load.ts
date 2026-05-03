import type { ImageDoc } from './types';
import { decodeRaster } from './formats/raster';
import { decodeGB7 } from './formats/gb7';

export async function loadImageFile(file: File): Promise<ImageDoc> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type.toLowerCase();

  if (mime === 'image/png' || ext === 'png') {
    return decodeRaster(file, 'png');
  }
  if (mime === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg') {
    return decodeRaster(file, 'jpg');
  }
  if (ext === 'gb7') {
    const buffer = await file.arrayBuffer();
    return decodeGB7(buffer, { fileName: file.name });
  }
  throw new Error(`Неподдерживаемый формат: ${file.name}`);
}
