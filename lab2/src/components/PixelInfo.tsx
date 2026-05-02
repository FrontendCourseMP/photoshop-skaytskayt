import type { PickedPixel } from '../tools/types';

interface PixelInfoProps {
  picked: PickedPixel | null;
  active: boolean;
}

export function PixelInfo({ picked, active }: PixelInfoProps) {
  return (
    <section className="panel panel--pixel">
      <h3 className="panel__title">Пипетка</h3>
      {!active && (
        <p className="panel__hint">
          Нажмите кнопку «Пипетка» на панели инструментов и кликните по пикселю.
        </p>
      )}
      {active && !picked && (
        <p className="panel__hint">Кликните по пикселю на изображении.</p>
      )}
      {picked && (
        <dl className="pixel">
          <div className="pixel__row">
            <dt>Позиция</dt>
            <dd>
              X: {picked.x}, Y: {picked.y}
            </dd>
          </div>
          <div className="pixel__row">
            <dt>RGB</dt>
            <dd>
              <span className="pixel__swatch" style={swatchStyle(picked)} />
              {picked.r}, {picked.g}, {picked.b}
            </dd>
          </div>
          <div className="pixel__row">
            <dt>Alpha</dt>
            <dd>{picked.a}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function swatchStyle(p: PickedPixel): React.CSSProperties {
  return { background: `rgb(${p.r}, ${p.g}, ${p.b})` };
}
