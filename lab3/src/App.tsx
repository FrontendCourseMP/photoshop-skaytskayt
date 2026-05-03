import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/CanvasView';
import { StatusBar } from './components/StatusBar';
import { loadImageFile } from './image/load';
import { saveImage } from './image/save';
import type { ImageDoc, SaveFormat } from './image/types';

export default function App() {
  const [doc, setDoc] = useState<ImageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <Toolbar onFile={handleFile} onSave={handleSave} canSave={doc !== null} />
      <CanvasView pixels={doc?.pixels ?? null} />
      <StatusBar doc={doc} error={error} />
    </div>
  );
}
