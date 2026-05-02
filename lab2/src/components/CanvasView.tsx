import { useEffect, useRef } from 'react';

interface CanvasViewProps {
  pixels: ImageData | null;
}

export function CanvasView({ pixels }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;

    canvas.width = pixels.width;
    canvas.height = pixels.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(pixels, 0, 0);
  }, [pixels]);

  return (
    <main className="workspace">
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
