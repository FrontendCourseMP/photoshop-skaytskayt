import { useEffect, useRef } from 'react';
import {
  clampBlack,
  clampGamma,
  clampWhite,
  GAMMA_MAX,
  GAMMA_MIN,
  type LevelsParams,
} from './levelsState';

interface InputLevelsProps {
  params: LevelsParams;
  onChange: (next: LevelsParams) => void;
}

type Marker = 'black' | 'gamma' | 'white';

const TRACK_HEIGHT = 14;

/**
 * Три маркера под гистограммой: black / gamma / white. Black и white двигаются
 * по оси 0..255 и не могут пересекаться. Gamma на самом деле задаётся числом
 * от 0.1 до 9.9, но визуально маркер показываем между точкой чёрного и белой
 * (0.5 — посередине, при gamma=1.0).
 */
export function InputLevels({ params, onChange }: InputLevelsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Marker | null>(null);

  // Глобальные обработчики на время перетаскивания: mousemove/up отвязываем
  // в cleanup, чтобы курсор не «застревал» между диалогами.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      applyDrag(dragRef.current, e.clientX);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [params, onChange]);

  const applyDrag = (marker: Marker, clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const value = Math.round(clamp01(ratio) * 255);

    if (marker === 'black') {
      const black = clampBlack(value, params.white);
      onChange({ ...params, black });
      return;
    }
    if (marker === 'white') {
      const white = clampWhite(value, params.black);
      onChange({ ...params, white });
      return;
    }
    // gamma: ползунок между black и white => 0.5 это gamma 1.0,
    // влево осветляет (gamma > 1), вправо затемняет (gamma < 1) — как в PS.
    const span = params.white - params.black;
    if (span <= 0) return;
    const local = clamp01((value - params.black) / span);
    const gamma = positionToGamma(local);
    onChange({ ...params, gamma: clampGamma(gamma) });
  };

  const startDrag = (marker: Marker) => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = marker;
    applyDrag(marker, e.clientX);
  };

  const blackPct = (params.black / 255) * 100;
  const whitePct = (params.white / 255) * 100;
  const gammaPct = blackPct + (whitePct - blackPct) * gammaToPosition(params.gamma);

  return (
    <div className="levels-input">
      <div
        ref={trackRef}
        className="levels-input__track"
        style={{ height: TRACK_HEIGHT }}
      >
        <div className="levels-input__gradient" />
        <Marker pct={blackPct} kind="black" onMouseDown={startDrag('black')} />
        <Marker pct={gammaPct} kind="gamma" onMouseDown={startDrag('gamma')} />
        <Marker pct={whitePct} kind="white" onMouseDown={startDrag('white')} />
      </div>

      <div className="levels-input__values">
        <NumericField
          label="Чёрная"
          min={0}
          max={params.white - 1}
          step={1}
          value={params.black}
          onChange={(v) => onChange({ ...params, black: clampBlack(v, params.white) })}
        />
        <NumericField
          label="Гамма"
          min={GAMMA_MIN}
          max={GAMMA_MAX}
          step={0.01}
          value={params.gamma}
          onChange={(v) => onChange({ ...params, gamma: clampGamma(v) })}
        />
        <NumericField
          label="Белая"
          min={params.black + 1}
          max={255}
          step={1}
          value={params.white}
          onChange={(v) => onChange({ ...params, white: clampWhite(v, params.black) })}
        />
      </div>
    </div>
  );
}

interface MarkerProps {
  pct: number;
  kind: Marker;
  onMouseDown: (e: React.MouseEvent) => void;
}

function Marker({ pct, kind, onMouseDown }: MarkerProps) {
  return (
    <div
      className={`levels-input__marker levels-input__marker--${kind}`}
      style={{ left: `${pct}%` }}
      onMouseDown={onMouseDown}
      role="slider"
      aria-label={kind}
    />
  );
}

interface NumericFieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

function NumericField({ label, min, max, step, value, onChange }: NumericFieldProps) {
  return (
    <label className="levels-input__field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const next = parseFloat(e.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
      />
    </label>
  );
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * Маппинг положения ползунка (0..1) в значение гаммы (0.1..9.9):
 * центр = 1.0, влево от центра — gamma > 1 (осветление средних тонов),
 * вправо — gamma < 1 (затемнение).
 *
 * Используем экспоненциальную кривую, чтобы движение около центра было
 * плавным, а у краёв ускорялось — так удобнее тянуть в Photoshop.
 */
function positionToGamma(pos: number): number {
  // pos: 0 = слева (gamma 9.9), 0.5 = centre (1.0), 1 = справа (gamma 0.1)
  const t = (0.5 - pos) * 2; // -1..1
  return Math.pow(10, t);
}

function gammaToPosition(gamma: number): number {
  const t = Math.log10(gamma); // -1..1 для 0.1..10
  return 0.5 - t / 2;
}
