import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../components/Modal';
import { computeHistograms, selectHistogram, type HistogramSet } from './histogram';
import { HistogramView, type HistogramScale } from './HistogramView';
import { CHANNEL_OPTIONS, type ChannelKey } from './channelKeys';
import { InputLevels } from './InputLevels';
import type { LevelsParams } from './levelsState';
import {
  buildChannelLuts,
  defaultByChannel,
  hasAnyChange,
  type LevelsByChannel,
} from './buildChannelLuts';
import { applyLuts, type ChannelLuts } from './applyLevels';

interface LevelsDialogProps {
  open: boolean;
  source: ImageData | null;
  hasAlpha: boolean;
  onClose: () => void;
  onPreview: (preview: ImageData | null) => void;
  onApply: (next: ImageData | null) => void;
}

export function LevelsDialog({
  open,
  source,
  hasAlpha,
  onClose,
  onPreview,
  onApply,
}: LevelsDialogProps) {
  const [channel, setChannel] = useState<ChannelKey>('master');
  const [scale, setScale] = useState<HistogramScale>('linear');
  const [byChannel, setByChannel] = useState<LevelsByChannel>(defaultByChannel);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      setChannel('master');
      setByChannel(defaultByChannel());
      setPreviewEnabled(true);
    }
  }, [open]);

  const histograms: HistogramSet | null = useMemo(
    () => (source ? computeHistograms(source) : null),
    [source],
  );

  const channelOptions = hasAlpha
    ? CHANNEL_OPTIONS
    : CHANNEL_OPTIONS.filter((o) => o.key !== 'alpha');

  const bins = histograms ? selectHistogram(histograms, channel) : null;
  const params = byChannel[channel];
  const setParams = (next: LevelsParams) =>
    setByChannel((prev) => ({ ...prev, [channel]: next }));

  const luts: ChannelLuts | null = useMemo(
    () => (hasAnyChange(byChannel) ? buildChannelLuts(byChannel) : null),
    [byChannel],
  );

  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const cancel = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (!open || !source || !previewEnabled || !luts) {
      cancel();
      onPreview(null);
      return cancel;
    }

    cancel();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onPreview(applyLuts(source, luts));
    });

    return cancel;
  }, [open, source, previewEnabled, luts, onPreview]);

  return (
    <Modal open={open} onClose={onClose} className="levels">
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

        <div className="levels__footer">
          <label className="levels__preview">
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => setPreviewEnabled(e.target.checked)}
            />
            Предпросмотр
          </label>

          <div className="levels__buttons">
            <button
              type="button"
              className="btn"
              onClick={() => setByChannel(defaultByChannel())}
            >
              Сброс
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className="btn btn--active"
              onClick={() => {
                if (!source || !luts) {
                  onApply(null);
                  return;
                }
                onApply(applyLuts(source, luts));
              }}
            >
              Применить
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
