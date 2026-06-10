import { useEffect, useRef } from 'react';
import { HISTOGRAM_BINS } from './histogram';
import { findChannel, type ChannelKey } from './channelKeys';

export type HistogramScale = 'linear' | 'log';

interface HistogramViewProps {
  bins: Uint32Array | null;
  channel: ChannelKey;
  scale: HistogramScale;
  width?: number;
  height?: number;
}

export function HistogramView({
  bins,
  channel,
  scale,
  width = HISTOGRAM_BINS,
  height = 120,
}: HistogramViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Нормируем по максимуму отображаемой гистограммы: глобальный максимум
    // по всем каналам делает линейную гистограмму почти плоской, когда
    // доминирует один бин (например, alpha=255 у непрозрачных изображений).
    const maxCount = bins ? maxBin(bins) : 0;
    if (!bins || maxCount === 0) {
      drawEmpty(ctx, width, height);
      return;
    }

    const color = findChannel(channel).color;
    drawBins(ctx, bins, width, height, maxCount, color, scale);
  }, [bins, channel, scale, width, height]);

  return <canvas ref={canvasRef} className="histogram__canvas" />;
}

function drawBins(
  ctx: CanvasRenderingContext2D,
  bins: Uint32Array,
  width: number,
  height: number,
  maxCount: number,
  color: string,
  scale: HistogramScale,
): void {
  const binWidth = width / HISTOGRAM_BINS;
  const denom = scale === 'log' ? Math.log1p(maxCount) : maxCount;

  ctx.fillStyle = color;
  for (let i = 0; i < HISTOGRAM_BINS; i++) {
    const v = bins[i];
    if (v === 0) continue;
    const norm = scale === 'log' ? Math.log1p(v) / denom : v / denom;
    const h = Math.max(1, Math.round(norm * height));
    const x = Math.floor(i * binWidth);
    const w = Math.max(1, Math.ceil(binWidth));
    ctx.fillRect(x, height - h, w, h);
  }
}

function maxBin(bins: Uint32Array): number {
  let max = 0;
  for (let i = 0; i < bins.length; i++) {
    if (bins[i] > max) max = bins[i];
  }
  return max;
}

function drawEmpty(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(0, 0, width, height);
}
