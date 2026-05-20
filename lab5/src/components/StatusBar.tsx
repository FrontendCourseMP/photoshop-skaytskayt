import type { ImageDoc } from '../image/types';

const SCALE_PRESETS = [12, 25, 33, 50, 67, 75, 100, 150, 200, 300];

interface StatusBarProps {
  doc: ImageDoc | null;
  error: string | null;
  scale: number;
  onScaleChange: (scale: number) => void;
}

export function StatusBar({ doc, error, scale, onScaleChange }: StatusBarProps) {
  if (error !== null) {
    return (
      <footer className="statusbar">
        <span className="statusbar__item statusbar__item--error">Ошибка: {error}</span>
      </footer>
    );
  }

  const options = SCALE_PRESETS.includes(scale)
    ? SCALE_PRESETS
    : [...SCALE_PRESETS, scale].sort((a, b) => a - b);

  const scaleControl = (
    <span className="statusbar__scale-wrap">
      <span className="statusbar__scale-label">Масштаб:</span>
      <select
        className="statusbar__scale"
        value={scale}
        title="Масштаб отображения"
        onChange={(e) => onScaleChange(parseInt(e.target.value, 10))}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v}%
          </option>
        ))}
      </select>
    </span>
  );

  if (doc === null) {
    return (
      <footer className="statusbar">
        <span className="statusbar__item statusbar__item--muted">Файл не загружен</span>
        <span className="statusbar__sep">·</span>
        {scaleControl}
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
      <span className="statusbar__sep statusbar__sep--push">·</span>
      {scaleControl}
    </footer>
  );
}
