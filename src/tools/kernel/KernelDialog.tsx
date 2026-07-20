import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../components/Modal';
import { KERNEL_PRESETS } from './kernelPresets';
import { applyKernelRaw, type EdgeMode } from './applyKernel';
import KernelWorker from './kernelWorker?worker';

interface KernelDialogProps {
  open: boolean;
  source: ImageData | null;
  hasAlpha: boolean;
  isGray: boolean;
  onClose: () => void;
  onPreview: (preview: ImageData | null) => void;
  onApply: (result: ImageData) => void;
}

const IDENTITY = KERNEL_PRESETS[0];
const CHANNEL_LABELS = ['R', 'G', 'B', 'A'];

function runSync(
  src: ImageData,
  kernel: number[],
  divisor: number,
  offset: number,
  channels: boolean[],
  edge: EdgeMode,
  absolute: boolean,
): ImageData {
  const copy = new Uint8ClampedArray(src.data.buffer.slice(src.data.byteOffset, src.data.byteOffset + src.data.byteLength)) as Uint8ClampedArray<ArrayBuffer>;
  const result = applyKernelRaw(copy, src.width, src.height, kernel, divisor, offset, channels, edge, absolute);
  return new ImageData(result, src.width, src.height);
}

export function KernelDialog({
  open,
  source,
  hasAlpha,
  isGray,
  onClose,
  onPreview,
  onApply,
}: KernelDialogProps) {
  const [presetIdx, setPresetIdx] = useState(0);
  const [kernelStrs, setKernelStrs] = useState<string[]>(IDENTITY.values.map(String));
  const [divisorStr, setDivisorStr] = useState(String(IDENTITY.divisor));
  const [offsetStr, setOffsetStr] = useState(String(IDENTITY.offset));
  const [channels, setChannels] = useState<boolean[]>([true, true, true, false]);
  const [edge, setEdge] = useState<EdgeMode>('black');
  const [absolute, setAbsolute] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const applyWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (open) {
      setPresetIdx(0);
      setKernelStrs(IDENTITY.values.map(String));
      setDivisorStr(String(IDENTITY.divisor));
      setOffsetStr(String(IDENTITY.offset));
      setChannels([true, true, true, false]);
      setEdge('black');
      setAbsolute(false);
      setPreviewEnabled(true);
      setBusy(false);
    }
  }, [open]);

  const parsedKernel = useMemo(() => kernelStrs.map((s) => parseFloat(s)), [kernelStrs]);
  const divisor = parseFloat(divisorStr);
  const offset = parseFloat(offsetStr);
  const divisorValid = !Number.isNaN(divisor) && divisor !== 0;
  const offsetValid = !Number.isNaN(offset);
  const kernelValid = useMemo(
    () => parsedKernel.every((v) => !Number.isNaN(v)),
    [parsedKernel],
  ) && divisorValid && offsetValid;
  const anyChannel = channels.some(Boolean);

  // Preview effect: spawns a worker and cancels the previous one on change
  useEffect(() => {
    if (!open || !source || !previewEnabled || !kernelValid || !anyChannel) {
      onPreview(null);
      return;
    }

    let cancelled = false;
    const worker = new KernelWorker();
    const copy = source.data.slice().buffer;

    worker.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
      worker.terminate();
      if (!cancelled) {
        onPreview(new ImageData(new Uint8ClampedArray(e.data.buffer), source.width, source.height));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      if (!cancelled) {
        onPreview(runSync(source, parsedKernel, divisor, offset, channels, edge, absolute));
      }
    };

    worker.postMessage(
      { buffer: copy, width: source.width, height: source.height, kernel: parsedKernel, divisor, offset, channels, edge, absolute },
      [copy],
    );

    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [open, source, previewEnabled, kernelValid, anyChannel, parsedKernel, divisor, offset, channels, edge, absolute, onPreview]);

  const handlePresetChange = (idx: number) => {
    const preset = KERNEL_PRESETS[idx];
    setPresetIdx(idx);
    setKernelStrs(preset.values.map(String));
    setDivisorStr(String(preset.divisor));
    setOffsetStr(String(preset.offset));
    setAbsolute(preset.absolute ?? false);
  };

  const handleCellChange = (i: number, val: string) => {
    setPresetIdx(-1);
    setAbsolute(false);
    setKernelStrs((prev) => prev.map((v, j) => (j === i ? val : v)));
  };

  const handleReset = () => {
    setPresetIdx(0);
    setKernelStrs(IDENTITY.values.map(String));
    setDivisorStr(String(IDENTITY.divisor));
    setOffsetStr(String(IDENTITY.offset));
    setChannels([true, true, true, false]);
    setEdge('black');
    setAbsolute(false);
  };

  const handleApply = () => {
    if (!source || !kernelValid || !anyChannel || busy) return;

    setBusy(true);

    const worker = new KernelWorker();
    applyWorkerRef.current = worker;
    const copy = source.data.slice().buffer;

    worker.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
      worker.terminate();
      applyWorkerRef.current = null;
      setBusy(false);
      onApply(new ImageData(new Uint8ClampedArray(e.data.buffer), source.width, source.height));
    };

    worker.onerror = () => {
      worker.terminate();
      applyWorkerRef.current = null;
      setBusy(false);
      onApply(runSync(source, parsedKernel, divisor, offset, channels, edge, absolute));
    };

    worker.postMessage(
      { buffer: copy, width: source.width, height: source.height, kernel: parsedKernel, divisor, offset, channels, edge, absolute },
      [copy],
    );
  };

  const toggleChannel = (i: number) =>
    setChannels((prev) => prev.map((v, j) => (j === i ? !v : v)));

  const toggleGray = () =>
    setChannels((prev) => {
      const next = !prev[0];
      return prev.map((v, j) => (j < 3 ? next : v));
    });

  return (
    <Modal open={open} onClose={onClose} className="kernel">
      <div className="kernel__form">
        <header className="kernel__header">
          <h2 className="kernel__title">Фильтрация ядром</h2>
          <button type="button" className="kernel__close" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        <label className="kernel__field">
          <span>Предустановка</span>
          <select
            value={presetIdx === -1 ? '' : String(presetIdx)}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== '') handlePresetChange(Number(v));
            }}
          >
            {presetIdx === -1 && <option value="">— пользовательское —</option>}
            {KERNEL_PRESETS.map((p, i) => (
              <option key={i} value={String(i)}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="kernel__grid">
          {kernelStrs.map((val, i) => (
            <input
              key={i}
              className={`kernel__cell${Number.isNaN(parseFloat(val)) ? ' kernel__cell--error' : ''}`}
              type="number"
              step="any"
              value={val}
              onChange={(e) => handleCellChange(i, e.target.value)}
            />
          ))}
        </div>

        <div className="kernel__params">
          <label className="kernel__field">
            <span>Делитель</span>
            <input
              className={`kernel__cell${divisorValid ? '' : ' kernel__cell--error'}`}
              type="number"
              step="any"
              title="Сумма произведений делится на это число (0 недопустим)"
              value={divisorStr}
              onChange={(e) => {
                setPresetIdx(-1);
                setAbsolute(false);
                setDivisorStr(e.target.value);
              }}
            />
          </label>
          <label className="kernel__field">
            <span>Смещение</span>
            <input
              className={`kernel__cell${offsetValid ? '' : ' kernel__cell--error'}`}
              type="number"
              step="any"
              title="Прибавляется к результату (например, 128 для просмотра градиентов)"
              value={offsetStr}
              onChange={(e) => {
                setPresetIdx(-1);
                setAbsolute(false);
                setOffsetStr(e.target.value);
              }}
            />
          </label>
        </div>

        <div className="kernel__section">
          <span className="kernel__label">Каналы</span>
          <div className="kernel__channels">
            {isGray ? (
              <label className="kernel__check">
                <input type="checkbox" checked={channels[0]} onChange={toggleGray} />
                Gray
              </label>
            ) : (
              CHANNEL_LABELS.slice(0, 3).map((label, i) => (
                <label key={label} className="kernel__check">
                  <input
                    type="checkbox"
                    checked={channels[i]}
                    onChange={() => toggleChannel(i)}
                  />
                  {label}
                </label>
              ))
            )}
            {hasAlpha && (
              <label className="kernel__check">
                <input
                  type="checkbox"
                  checked={channels[3]}
                  onChange={() => toggleChannel(3)}
                />
                A
              </label>
            )}
          </div>
        </div>

        <div className="kernel__section">
          <span className="kernel__label">Заполнение краёв</span>
          <div className="kernel__radios">
            {(['black', 'white', 'copy'] as EdgeMode[]).map((mode) => (
              <label key={mode} className="kernel__check">
                <input
                  type="radio"
                  name="kernel-edge"
                  value={mode}
                  checked={edge === mode}
                  onChange={() => setEdge(mode)}
                />
                {mode === 'black' ? 'Чёрный' : mode === 'white' ? 'Белый' : 'Копирование'}
              </label>
            ))}
          </div>
        </div>

        <div className="kernel__footer">
          <label className="kernel__preview-check">
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => setPreviewEnabled(e.target.checked)}
            />
            Предпросмотр
          </label>

          <div className="kernel__buttons">
            <button type="button" className="btn" onClick={handleReset} disabled={busy}>
              Сброс
            </button>
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              Отмена
            </button>
            <button
              type="button"
              className="btn btn--active"
              disabled={!source || !kernelValid || !anyChannel || busy}
              onClick={handleApply}
            >
              {busy ? 'Обработка…' : 'Применить'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
