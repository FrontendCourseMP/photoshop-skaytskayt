import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { resizeImage, type InterpolationMethod } from '../../image/interpolation';

interface ResizeDialogProps {
  open: boolean;
  source: ImageData | null;
  onClose: () => void;
  onApply: (result: ImageData) => void;
}

type ResizeUnit = 'percent' | 'pixels';

interface FieldErrors {
  width?: string;
  height?: string;
}

const INTERP_TOOLTIP: Record<InterpolationMethod, string> = {
  nearest:
    'Ближайший сосед: быстрый алгоритм, берёт цвет ближайшего пикселя. Создаёт чёткий «пиксельный» эффект при увеличении.',
  bilinear:
    'Билинейная: интерполирует между четырьмя соседними пикселями. Сглаживает края — хороший баланс скорости и качества.',
};

export function ResizeDialog({ open, source, onClose, onApply }: ResizeDialogProps) {
  const [unit, setUnit] = useState<ResizeUnit>('percent');
  const [widthStr, setWidthStr] = useState('100');
  const [heightStr, setHeightStr] = useState('100');
  const [keepAspect, setKeepAspect] = useState(true);
  const [method, setMethod] = useState<InterpolationMethod>('bilinear');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setUnit('percent');
      setWidthStr('100');
      setHeightStr('100');
      setKeepAspect(true);
      setMethod('bilinear');
      setErrors({});
    }
  }, [open]);

  const origW = source?.width ?? 0;
  const origH = source?.height ?? 0;

  const computeDst = (): { w: number; h: number } | null => {
    const wv = parseFloat(widthStr);
    const hv = parseFloat(heightStr);
    if (Number.isNaN(wv) || Number.isNaN(hv) || wv <= 0 || hv <= 0) return null;
    if (unit === 'percent') {
      return {
        w: Math.max(1, Math.round((origW * wv) / 100)),
        h: Math.max(1, Math.round((origH * hv) / 100)),
      };
    }
    return { w: Math.round(wv), h: Math.round(hv) };
  };

  const dst = computeDst();
  const beforeMpx = (origW * origH / 1_000_000).toFixed(2);
  const afterMpx = dst ? ((dst.w * dst.h) / 1_000_000).toFixed(2) : '—';

  const handleWidthChange = (val: string) => {
    setWidthStr(val);
    if (!keepAspect || origW === 0 || origH === 0) return;
    const wv = parseFloat(val);
    if (Number.isNaN(wv) || wv <= 0) return;
    if (unit === 'percent') {
      setHeightStr(String(wv));
    } else {
      setHeightStr(String(Math.max(1, Math.round((wv * origH) / origW))));
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightStr(val);
    if (!keepAspect || origW === 0 || origH === 0) return;
    const hv = parseFloat(val);
    if (Number.isNaN(hv) || hv <= 0) return;
    if (unit === 'percent') {
      setWidthStr(String(hv));
    } else {
      setWidthStr(String(Math.max(1, Math.round((hv * origW) / origH))));
    }
  };

  const handleUnitChange = (newUnit: ResizeUnit) => {
    if (newUnit === unit) return;
    const wv = parseFloat(widthStr);
    const hv = parseFloat(heightStr);
    if (newUnit === 'pixels') {
      setWidthStr(String(Math.max(1, Math.round((origW * (Number.isNaN(wv) ? 100 : wv)) / 100))));
      setHeightStr(String(Math.max(1, Math.round((origH * (Number.isNaN(hv) ? 100 : hv)) / 100))));
    } else {
      const wp = origW > 0 ? (((Number.isNaN(wv) ? origW : wv) / origW) * 100) : 100;
      const hp = origH > 0 ? (((Number.isNaN(hv) ? origH : hv) / origH) * 100) : 100;
      setWidthStr(String(Math.round(wp * 10) / 10));
      setHeightStr(String(Math.round(hp * 10) / 10));
    }
    setUnit(newUnit);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    const wv = parseFloat(widthStr);
    const hv = parseFloat(heightStr);

    if (Number.isNaN(wv) || wv <= 0) {
      newErrors.width = 'Введите положительное число';
    } else if (unit === 'percent' && (wv < 1 || wv > 1000)) {
      newErrors.width = 'Диапазон: 1 – 1000 %';
    } else if (unit === 'pixels' && (Math.round(wv) < 1 || Math.round(wv) > 32768)) {
      newErrors.width = 'Диапазон: 1 – 32768 пкс';
    }

    if (Number.isNaN(hv) || hv <= 0) {
      newErrors.height = 'Введите положительное число';
    } else if (unit === 'percent' && (hv < 1 || hv > 1000)) {
      newErrors.height = 'Диапазон: 1 – 1000 %';
    } else if (unit === 'pixels' && (Math.round(hv) < 1 || Math.round(hv) > 32768)) {
      newErrors.height = 'Диапазон: 1 – 32768 пкс';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (!source) return;
    if (!validate()) return;
    const dims = computeDst();
    if (!dims) return;
    onApply(resizeImage(source, dims.w, dims.h, method));
  };

  return (
    <Modal open={open} onClose={onClose} className="resize">
      <div className="resize__form">
        <header className="resize__header">
          <h2 className="resize__title">Размер изображения</h2>
          <button type="button" className="resize__close" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="resize__info">
          <span>
            До:&nbsp;<strong>{origW} × {origH}</strong>&nbsp;пкс&nbsp;({beforeMpx} МПкс)
          </span>
          <span className="resize__info-arrow">→</span>
          <span>
            После:&nbsp;<strong>{dst ? `${dst.w} × ${dst.h}` : '—'}</strong>&nbsp;пкс&nbsp;({afterMpx} МПкс)
          </span>
        </div>

        <div className="resize__row">
          <label className="resize__field">
            <span>Единицы</span>
            <select value={unit} onChange={(e) => handleUnitChange(e.target.value as ResizeUnit)}>
              <option value="percent">Проценты (%)</option>
              <option value="pixels">Пиксели (пкс)</option>
            </select>
          </label>
        </div>

        <div className="resize__dims">
          <div className="resize__dim-col">
            <label className="resize__dim-label">Ширина</label>
            <input
              className={`resize__dim-input${errors.width ? ' resize__dim-input--error' : ''}`}
              type="number"
              value={widthStr}
              min={unit === 'percent' ? 1 : 1}
              max={unit === 'percent' ? 1000 : 32768}
              step={unit === 'percent' ? 0.1 : 1}
              onChange={(e) => handleWidthChange(e.target.value)}
            />
            {errors.width && <span className="resize__error">{errors.width}</span>}
          </div>

          <button
            type="button"
            className={`resize__lock${keepAspect ? ' resize__lock--on' : ''}`}
            title={keepAspect ? 'Пропорции заблокированы' : 'Пропорции не привязаны'}
            onClick={() => setKeepAspect((v) => !v)}
          >
            {keepAspect ? '🔗' : '🔓'}
          </button>

          <div className="resize__dim-col">
            <label className="resize__dim-label">Высота</label>
            <input
              className={`resize__dim-input${errors.height ? ' resize__dim-input--error' : ''}`}
              type="number"
              value={heightStr}
              min={unit === 'percent' ? 1 : 1}
              max={unit === 'percent' ? 1000 : 32768}
              step={unit === 'percent' ? 0.1 : 1}
              onChange={(e) => handleHeightChange(e.target.value)}
            />
            {errors.height && <span className="resize__error">{errors.height}</span>}
          </div>
        </div>

        <div className="resize__row resize__row--interp">
          <label className="resize__field">
            <span>Интерполяция</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as InterpolationMethod)}
            >
              <option value="bilinear">Билинейная</option>
              <option value="nearest">Ближайший сосед</option>
            </select>
          </label>
          <span className="resize__tooltip-wrap">
            <span className="resize__tooltip-icon" aria-label="Подсказка">ⓘ</span>
            <span className="resize__tooltip" role="tooltip">
              {INTERP_TOOLTIP[method]}
            </span>
          </span>
        </div>

        <div className="resize__footer">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn--active"
            disabled={!source}
            onClick={handleApply}
          >
            Применить
          </button>
        </div>
      </div>
    </Modal>
  );
}
