import { useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { ChannelsPanel } from './components/ChannelsPanel';
import { PixelInfo } from './components/PixelInfo';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import { allKeys, detectChannelLayout } from './image/channels';
import { applyChannelMask } from './image/applyChannelMask';
import type { ChannelKey } from './image/channels';
import type { ImageDoc, SaveFormat } from './image/types';
import type { PickedPixel, Tool } from './tools/types';

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChannels, setActiveChannels] = useState<Set<ChannelKey>>(
    () => new Set<ChannelKey>(['gray', 'r', 'g', 'b', 'a']),
  );
  const [tool, setTool] = useState<Tool>('none');
  const [picked, setPicked] = useState<PickedPixel | null>(null);

  const layout = useMemo(() => (doc ? detectChannelLayout(doc) : null), [doc]);

  const displayPixels = useMemo(() => {
    if (!doc || !layout) return null;
    return applyChannelMask(doc.pixels, activeChannels, layout);
  }, [doc, layout, activeChannels]);

  const handleFile = async (file: File) => {
    setError(null);
    setPicked(null);
    try {
      const next = await loadImageFile(file);
      setDoc(next);
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

  return (
    <div className="app">
      <Toolbar
        onFile={handleFile}
        onSave={handleSave}
        canSave={doc !== null}
        tool={tool}
        onToolChange={setTool}
        toolsDisabled={doc === null}
      />
      <CanvasView pixels={displayPixels} tool={tool} onPick={handlePick} />
      <aside className="sidebar">
        <ChannelsPanel
          doc={doc}
          layout={layout}
          active={activeChannels}
          onToggle={toggleChannel}
        />
        <PixelInfo picked={picked} active={tool === 'eyedropper'} />
      </aside>
      <StatusBar doc={doc} error={error} />
    </div>
  );
}
