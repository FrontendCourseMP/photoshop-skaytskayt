import { useCallback, useMemo, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import { LevelsDialog } from './tools/levels/LevelsDialog';
import { ResizeDialog } from './tools/resize/ResizeDialog';
import type { ImageDoc, SaveFormat } from './image/types';

const SCALE_MIN = 12;
const SCALE_MAX = 300;

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [preview, setPreview] = useState<ImageData | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);

  const hasAlpha = useMemo(() => detectAlpha(doc), [doc]);

  const calcFitScale = (imgW: number, imgH: number): number => {
    const ws = workspaceRef.current;
    if (!ws || imgW === 0 || imgH === 0) return 100;
    const availW = ws.clientWidth - 100;
    const availH = ws.clientHeight - 100;
    if (availW <= 0 || availH <= 0) return 100;
    const raw = Math.min(availW / imgW, availH / imgH) * 100;
    return Math.round(Math.max(SCALE_MIN, Math.min(SCALE_MAX, raw)));
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);
    try {
      const next = await loadImageFile(file);
      setDoc(next);
      setScale(calcFitScale(next.width, next.height));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSave = async (format: SaveFormat) => {
    if (!doc) return;
    setError(null);
    try {
      await saveImage(doc, format);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleCloseLevels = useCallback(() => {
    setLevelsOpen(false);
    setPreview(null);
  }, []);

  const handleApplyLevels = useCallback(
    (next: ImageData | null) => {
      if (next && doc) {
        setDoc({ ...doc, pixels: next });
      }
      setLevelsOpen(false);
      setPreview(null);
    },
    [doc],
  );

  const handleApplyResize = useCallback(
    (next: ImageData) => {
      if (!doc) return;
      setDoc({ ...doc, pixels: next, width: next.width, height: next.height });
      setResizeOpen(false);
    },
    [doc],
  );

  const visiblePixels = preview ?? doc?.pixels ?? null;

  return (
    <div className="app">
      <Toolbar
        onFile={handleFile}
        onSave={handleSave}
        canSave={doc !== null}
        onOpenLevels={() => setLevelsOpen(true)}
        levelsDisabled={doc === null}
        onOpenResize={() => setResizeOpen(true)}
        resizeDisabled={doc === null}
      />
      <CanvasView pixels={visiblePixels} scale={scale} workspaceRef={workspaceRef} />
      <StatusBar doc={doc} error={error} scale={scale} onScaleChange={setScale} />
      <LevelsDialog
        open={levelsOpen}
        source={doc?.pixels ?? null}
        hasAlpha={hasAlpha}
        onClose={handleCloseLevels}
        onPreview={setPreview}
        onApply={handleApplyLevels}
      />
      <ResizeDialog
        open={resizeOpen}
        source={doc?.pixels ?? null}
        onClose={() => setResizeOpen(false)}
        onApply={handleApplyResize}
      />
    </div>
  );
}

function detectAlpha(doc: ImageDoc | null): boolean {
  if (!doc) return false;
  if (doc.source === 'gb7') return doc.hasMask === true;
  const data = doc.pixels.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}
