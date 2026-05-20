export type InterpolationMethod = 'nearest' | 'bilinear';

export function resizeImage(
  src: ImageData,
  dstW: number,
  dstH: number,
  method: InterpolationMethod,
): ImageData {
  if (method === 'nearest') return resizeNearest(src, dstW, dstH);
  return resizeBilinear(src, dstW, dstH);
}

function resizeNearest(src: ImageData, dstW: number, dstH: number): ImageData {
  const dst = new ImageData(dstW, dstH);
  const srcData = src.data;
  const dstData = dst.data;
  const scaleX = src.width / dstW;
  const scaleY = src.height / dstH;
  const srcW = src.width;

  for (let y = 0; y < dstH; y++) {
    const srcY = Math.min(Math.floor(y * scaleY), src.height - 1);
    const srcRow = srcY * srcW;
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.min(Math.floor(x * scaleX), srcW - 1);
      const si = (srcRow + srcX) * 4;
      const di = (y * dstW + x) * 4;
      dstData[di] = srcData[si];
      dstData[di + 1] = srcData[si + 1];
      dstData[di + 2] = srcData[si + 2];
      dstData[di + 3] = srcData[si + 3];
    }
  }

  return dst;
}

function resizeBilinear(src: ImageData, dstW: number, dstH: number): ImageData {
  const dst = new ImageData(dstW, dstH);
  const srcData = src.data;
  const dstData = dst.data;
  const srcW = src.width;
  const srcH = src.height;
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const fy = y * scaleY - 0.5;
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(y0 + 1, srcH - 1);
    const ty = fy - Math.floor(fy);
    const ty1 = 1 - ty;

    for (let x = 0; x < dstW; x++) {
      const fx = x * scaleX - 0.5;
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(x0 + 1, srcW - 1);
      const tx = fx - Math.floor(fx);
      const tx1 = 1 - tx;

      const i00 = (y0 * srcW + x0) * 4;
      const i10 = (y0 * srcW + x1) * 4;
      const i01 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;

      const w00 = tx1 * ty1;
      const w10 = tx * ty1;
      const w01 = tx1 * ty;
      const w11 = tx * ty;

      const di = (y * dstW + x) * 4;
      dstData[di] = srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11;
      dstData[di + 1] = srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 + srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11;
      dstData[di + 2] = srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 + srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11;
      dstData[di + 3] = srcData[i00 + 3] * w00 + srcData[i10 + 3] * w10 + srcData[i01 + 3] * w01 + srcData[i11 + 3] * w11;
    }
  }

  return dst;
}
