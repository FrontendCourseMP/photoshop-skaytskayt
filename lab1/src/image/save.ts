import type { ImageDoc, SaveFormat } from './types';
import { encodeGB7 } from './formats/gb7';

export async function saveImage(doc: ImageDoc, format: SaveFormat): Promise<void> {
  const baseName = stripExt(doc.fileName ?? 'image');

  if (format === 'png' || format === 'jpg') {
    const blob = await rasterToBlob(doc, format);
    saveBlob(blob, `${baseName}.${format === 'jpg' ? 'jpg' : 'png'}`);
    return;
  }

  const withMask = format === 'gb7-mask';
  const buffer = encodeGB7(doc, { withMask });
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveBlob(blob, `${baseName}.gb7`);
}

async function rasterToBlob(doc: ImageDoc, format: 'png' | 'jpg'): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось получить 2D-контекст для сохранения');
  ctx.putImageData(doc.pixels, 0, 0);

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'jpg' ? 0.92 : undefined;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob вернул null'));
      },
      mime,
      quality,
    );
  });
}

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stripExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}
