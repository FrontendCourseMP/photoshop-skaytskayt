import { useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import { LevelsDialog } from './tools/levels/LevelsDialog';
import type { ImageDoc, SaveFormat } from './image/types';

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levelsOpen, setLevelsOpen] = useState(false);

  const hasAlpha = useMemo(() => detectAlpha(doc), [doc]);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const next = await loadImageFile(file);
      setDoc(next);
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

  return (
    <div className="app">
      <Toolbar
        onFile={handleFile}
        onSave={handleSave}
        canSave={doc !== null}
        onOpenLevels={() => setLevelsOpen(true)}
        levelsDisabled={doc === null}
      />
      <CanvasView pixels={doc?.pixels ?? null} />
      <StatusBar doc={doc} error={error} />
      <LevelsDialog
        open={levelsOpen}
        source={doc?.pixels ?? null}
        hasAlpha={hasAlpha}
        onClose={() => setLevelsOpen(false)}
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
