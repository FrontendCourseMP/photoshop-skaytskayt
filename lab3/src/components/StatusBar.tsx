import type { ImageDoc } from '../image/types';

interface StatusBarProps {
  doc: ImageDoc | null;
  error: string | null;
}

export function StatusBar({ doc, error }: StatusBarProps) {
  if (error !== null) {
    return (
      <footer className="statusbar">
        <span className="statusbar__item statusbar__item--error">Ошибка: {error}</span>
      </footer>
    );
  }

  if (doc === null) {
    return (
      <footer className="statusbar">
        <span className="statusbar__item statusbar__item--muted">Файл не загружен</span>
      </footer>
    );
  }

  return (
    <footer className="statusbar">
      <span className="statusbar__item">
        {doc.width} × {doc.height} px
      </span>
      <span className="statusbar__sep">·</span>
      <span className="statusbar__item">{doc.colorDepth}</span>
      <span className="statusbar__sep">·</span>
      <span className="statusbar__item">{doc.source.toUpperCase()}</span>
      {doc.fileName && (
        <>
          <span className="statusbar__sep">·</span>
          <span className="statusbar__item statusbar__item--muted">{doc.fileName}</span>
        </>
      )}
    </footer>
  );
}
