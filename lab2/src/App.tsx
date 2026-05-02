import { useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { ChannelsPanel } from './components/ChannelsPanel';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import { allKeys, detectChannelLayout } from './image/channels';
import { applyChannelMask } from './image/applyChannelMask';
import type { ChannelKey } from './image/channels';
import type { ImageDoc, SaveFormat } from './image/types';

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChannels, setActiveChannels] = useState<Set<ChannelKey>>(
    () => new Set<ChannelKey>(['gray', 'r', 'g', 'b', 'a']),
  );

  const layout = useMemo(() => (doc ? detectChannelLayout(doc) : null), [doc]);

  const displayPixels = useMemo(() => {
    if (!doc || !layout) return null;
    return applyChannelMask(doc.pixels, activeChannels, layout);
  }, [doc, layout, activeChannels]);

  const handleFile = async (file: File) => {
    setError(null);
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

  return (
    <div className="app">
      <Toolbar onFile={handleFile} onSave={handleSave} canSave={doc !== null} />
      <CanvasView pixels={displayPixels} />
      <aside className="sidebar">
        <ChannelsPanel
          doc={doc}
          layout={layout}
          active={activeChannels}
          onToggle={toggleChannel}
        />
      </aside>
      <StatusBar doc={doc} error={error} />
    </div>
  );
}
