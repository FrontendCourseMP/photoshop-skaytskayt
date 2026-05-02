import { useEffect, useRef } from 'react';
import type { Tool } from '../tools/types';

interface CanvasViewProps {
  pixels: ImageData | null;
  tool: Tool;
  onPick?: (x: number, y: number) => void;
}

export function CanvasView({ pixels, tool, onPick }: CanvasViewProps) {
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

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'eyedropper' || !onPick || !pixels) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    onPick(x, y);
  };

  const cursorClass = tool === 'eyedropper' ? ' workspace__canvas--pick' : '';

  return (
    <main className="workspace">
      {pixels === null ? (
        <div className="workspace__placeholder">
          Загрузите изображение, чтобы начать. Поддерживаются PNG, JPG и GB7.
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={`workspace__canvas${cursorClass}`}
          onClick={handleClick}
        />
      )}
    </main>
  );
}
