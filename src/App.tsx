import { useCallback, useMemo, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { ChannelsPanel } from './components/ChannelsPanel';
import { PixelInfo } from './components/PixelInfo';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import { allKeys, detectChannelLayout } from './image/channels';
import { applyChannelMask } from './image/applyChannelMask';
import { LevelsDialog } from './tools/levels/LevelsDialog';
import { ResizeDialog } from './tools/resize/ResizeDialog';
import { KernelDialog } from './tools/kernel/KernelDialog';
import type { ChannelKey } from './image/channels';
import type { ImageDoc, SaveFormat } from './image/types';
import type { PickedPixel, Tool } from './tools/types';

const SCALE_MIN = 12;
const SCALE_MAX = 300;

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [kernelOpen, setKernelOpen] = useState(false);
  const [preview, setPreview] = useState<ImageData | null>(null);
  const [activeChannels, setActiveChannels] = useState<Set<ChannelKey>>(
    () => new Set<ChannelKey>(['gray', 'r', 'g', 'b', 'a']),
  );
  const [tool, setTool] = useState<Tool>('none');
  const [picked, setPicked] = useState<PickedPixel | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);

  const hasAlpha = doc?.hasAlphaChannel ?? false;
  const isGray = doc?.isGray ?? false;

  const layout = useMemo(() => (doc ? detectChannelLayout(doc) : null), [doc]);

  const displayPixels = useMemo(() => {
    if (!doc || !layout) return null;
    return applyChannelMask(doc.pixels, activeChannels, layout);
  }, [doc, layout, activeChannels]);

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
    setPicked(null);
    try {
      const next = await loadImageFile(file);
      setDoc(next);
      setScale(calcFitScale(next.width, next.height));
      const nextLayout = detectChannelLayout(next);
      setActiveChannels(new Set<ChannelKey>(allKeys(nextLayout)));
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

  const toggleChannel = (key: ChannelKey) => {
    setActiveChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePick = (x: number, y: number) => {
    if (!doc) return;
    const o = (y * doc.width + x) * 4;
    const d = doc.pixels.data;
    setPicked({
      x,
      y,
      r: d[o],
      g: d[o + 1],
      b: d[o + 2],
      a: d[o + 3],
    });
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
      setPicked(null);
      setResizeOpen(false);
    },
    [doc],
  );

  const handleCloseKernel = useCallback(() => {
    setKernelOpen(false);
    setPreview(null);
  }, []);

  const handleApplyKernel = useCallback(
    (next: ImageData) => {
      if (!doc) return;
      setDoc({ ...doc, pixels: next });
      setKernelOpen(false);
      setPreview(null);
    },
    [doc],
  );

  const visiblePixels = preview ?? displayPixels;

  return (
    <div className="app">
      <Toolbar
        onFile={handleFile}
        onSave={handleSave}
        canSave={doc !== null}
        tool={tool}
        onToolChange={setTool}
        toolsDisabled={doc === null}
        onOpenLevels={() => setLevelsOpen(true)}
        levelsDisabled={doc === null}
        onOpenResize={() => setResizeOpen(true)}
        resizeDisabled={doc === null}
        onOpenKernel={() => setKernelOpen(true)}
        kernelDisabled={doc === null}
      />
      <CanvasView
        pixels={visiblePixels}
        scale={scale}
        workspaceRef={workspaceRef}
        tool={tool}
        onPick={handlePick}
      />
      <aside className="sidebar">
        <ChannelsPanel
          doc={doc}
          layout={layout}
          active={activeChannels}
          onToggle={toggleChannel}
        />
        <PixelInfo picked={picked} active={tool === 'eyedropper'} />
      </aside>
      <StatusBar doc={doc} error={error} scale={scale} onScaleChange={setScale} />
      <LevelsDialog
        open={levelsOpen}
        source={doc?.pixels ?? null}
        hasAlpha={hasAlpha}
        isGray={isGray}
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
      <KernelDialog
        open={kernelOpen}
        source={doc?.pixels ?? null}
        hasAlpha={hasAlpha}
        isGray={isGray}
        onClose={handleCloseKernel}
        onPreview={setPreview}
        onApply={handleApplyKernel}
      />
    </div>
  );
}
