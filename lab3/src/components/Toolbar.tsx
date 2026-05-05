import { useRef } from 'react';
import { SaveMenu } from './SaveMenu';
import type { SaveFormat } from '../image/types';

interface ToolbarProps {
  onFile: (file: File) => void;
  onSave: (format: SaveFormat) => void;
  canSave: boolean;
  onOpenLevels: () => void;
  levelsDisabled: boolean;
}

export function Toolbar({
  onFile,
  onSave,
  canSave,
  onOpenLevels,
  levelsDisabled,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <header className="toolbar">
      <span className="toolbar__brand">GrayBit Image Editor</span>
      <div className="toolbar__tools">
        <button
          type="button"
          className="btn"
          disabled={levelsDisabled}
          title="Открыть инструмент «Уровни»"
          onClick={onOpenLevels}
        >
          Уровни…
        </button>
      </div>
      <div className="toolbar__actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,.gb7"
          onChange={handleChange}
          hidden
        />
        <button type="button" className="btn" onClick={handleClick}>
          Загрузить…
        </button>
        <SaveMenu disabled={!canSave} onPick={onSave} />
      </div>
    </header>
  );
}
