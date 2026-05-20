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

export function InputLevels({ params, onChange }: InputLevelsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Marker | null>(null);

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
        <LevelMarker pct={blackPct} kind="black" onMouseDown={startDrag('black')} />
        <LevelMarker pct={gammaPct} kind="gamma" onMouseDown={startDrag('gamma')} />
        <LevelMarker pct={whitePct} kind="white" onMouseDown={startDrag('white')} />
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

interface LevelMarkerProps {
  pct: number;
  kind: Marker;
  onMouseDown: (e: React.MouseEvent) => void;
}

function LevelMarker({ pct, kind, onMouseDown }: LevelMarkerProps) {
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

function positionToGamma(pos: number): number {
  const t = (0.5 - pos) * 2;
  return Math.pow(10, t);
}

function gammaToPosition(gamma: number): number {
  const t = Math.log10(gamma);
  return 0.5 - t / 2;
}
