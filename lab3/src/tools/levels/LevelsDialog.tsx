import { useEffect, useMemo, useRef, useState } from 'react';
import { computeHistograms, selectHistogram, type HistogramSet } from './histogram';
import { HistogramView, type HistogramScale } from './HistogramView';
import { CHANNEL_OPTIONS, type ChannelKey } from './channelKeys';
import { InputLevels } from './InputLevels';
import { DEFAULT_PARAMS, type LevelsParams } from './levelsState';

interface LevelsDialogProps {
  open: boolean;
  /** Снимок изображения, по которому считаем гистограмму. */
  source: ImageData | null;
  hasAlpha: boolean;
  onClose: () => void;
}

/**
 * Каркас диалога "Уровни": нативный <dialog>, выбор канала, гистограмма.
 * Слайдеры входных уровней и логика применения добавляются отдельным
 * коммитом — здесь мы только показываем гистограмму выбранного канала.
 */
export function LevelsDialog({ open, source, hasAlpha, onClose }: LevelsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [channel, setChannel] = useState<ChannelKey>('master');
  const [scale, setScale] = useState<HistogramScale>('linear');
  const [params, setParams] = useState<LevelsParams>(DEFAULT_PARAMS);

  const histograms: HistogramSet | null = useMemo(
    () => (source ? computeHistograms(source) : null),
    [source],
  );

  // Открытие/закрытие нативного диалога синхронизируем с пропом open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // При новом открытии всегда стартуем с Master, чтобы привычно начать.
      setChannel('master');
      setParams(DEFAULT_PARAMS);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Если пользователь закрывает диалог через Esc — синхронизируем состояние.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener('close', handler);
    return () => dialog.removeEventListener('close', handler);
  }, [onClose]);

  const channelOptions = hasAlpha
    ? CHANNEL_OPTIONS
    : CHANNEL_OPTIONS.filter((o) => o.key !== 'alpha');

  const bins = histograms ? selectHistogram(histograms, channel) : null;

  return (
    <dialog ref={dialogRef} className="levels">
      <form method="dialog" className="levels__form">
        <header className="levels__header">
          <h2 className="levels__title">Уровни</h2>
          <button
            type="button"
            className="levels__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="levels__row">
          <label className="levels__field">
            <span>Канал</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ChannelKey)}
            >
              {channelOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="histogram__scale" role="tablist" aria-label="Шкала">
            <button
              type="button"
              className={scale === 'linear' ? 'is-active' : ''}
              onClick={() => setScale('linear')}
            >
              Linear
            </button>
            <button
              type="button"
              className={scale === 'log' ? 'is-active' : ''}
              onClick={() => setScale('log')}
            >
              Log
            </button>
          </div>
        </div>

        <div className="histogram">
          <HistogramView
            bins={bins}
            globalMax={histograms?.maxCount ?? 0}
            channel={channel}
            scale={scale}
          />
          <InputLevels params={params} onChange={setParams} />
        </div>
      </form>
    </dialog>
  );
}
