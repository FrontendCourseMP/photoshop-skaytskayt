import { useEffect, useRef } from 'react';
import { resizeImage } from '../image/interpolation';

interface CanvasViewProps {
  pixels: ImageData | null;
  scale: number;
  workspaceRef: React.RefObject<HTMLDivElement>;
}

export function CanvasView({ pixels, scale, workspaceRef }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      const dstW = Math.max(1, Math.round((pixels.width * scale) / 100));
      const dstH = Math.max(1, Math.round((pixels.height * scale) / 100));

      canvas.width = dstW;
      canvas.height = dstH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (scale === 100) {
        ctx.putImageData(pixels, 0, 0);
      } else {
        const scaled = resizeImage(pixels, dstW, dstH, 'bilinear');
        ctx.putImageData(scaled, 0, 0);
      }
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [pixels, scale]);

  return (
    <main className="workspace" ref={workspaceRef}>
      {pixels === null ? (
        <div className="workspace__placeholder">
          Загрузите изображение, чтобы начать. Поддерживаются PNG, JPG и GB7.
        </div>
      ) : (
        <canvas ref={canvasRef} className="workspace__canvas" />
      )}
    </main>
  );
}
