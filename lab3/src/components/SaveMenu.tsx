import { useEffect, useRef, useState } from 'react';
import type { SaveFormat } from '../image/types';

interface SaveMenuProps {
  disabled: boolean;
  onPick: (format: SaveFormat) => void;
}

interface Option {
  format: SaveFormat;
  label: string;
  hint?: string;
}

const OPTIONS: Option[] = [
  { format: 'png', label: 'PNG', hint: 'без потерь, прозрачность' },
  { format: 'jpg', label: 'JPG', hint: 'с потерями, без прозрачности' },
  { format: 'gb7', label: 'GB7', hint: '7-bit grayscale' },
  { format: 'gb7-mask', label: 'GB7 + маска', hint: '7-bit + 1-bit маска' },
];

export function SaveMenu({ disabled, onPick }: SaveMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (format: SaveFormat) => {
    setOpen(false);
    onPick(format);
  };

  return (
    <div ref={ref} className="save-menu">
      <button
        type="button"
        className="btn"
        disabled={disabled}
        title={disabled ? 'Сначала загрузите изображение' : 'Сохранить изображение'}
        onClick={() => setOpen((o) => !o)}
      >
        Сохранить как… <span className="save-menu__caret">▾</span>
      </button>
      {open && (
        <div className="save-menu__list" role="menu">
          {OPTIONS.map((opt) => (
            <button
              key={opt.format}
              type="button"
              role="menuitem"
              className="save-menu__item"
              onClick={() => pick(opt.format)}
            >
              <span className="save-menu__label">{opt.label}</span>
              {opt.hint && <span className="save-menu__hint">{opt.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
