import type { ImageDoc } from './types';

export type ChannelKey = 'gray' | 'r' | 'g' | 'b' | 'a';

export interface ChannelInfo {
  key: ChannelKey;
  label: string;
  description: string;
}

export interface ChannelLayout {
  channels: ChannelInfo[];
  hasColor: boolean;
  hasAlpha: boolean;
}

export function detectChannelLayout(doc: ImageDoc): ChannelLayout {
  if (doc.source === 'gb7') {
    if (doc.hasMask) {
      return {
        channels: [
          { key: 'gray', label: 'Gray', description: 'Яркость 0..255' },
          { key: 'a', label: 'Alpha', description: 'Маска прозрачности' },
        ],
        hasColor: false,
        hasAlpha: true,
      };
    }
    return {
      channels: [{ key: 'gray', label: 'Gray', description: 'Яркость 0..255' }],
      hasColor: false,
      hasAlpha: false,
    };
  }

  const hasAlpha = pixelsHaveAlpha(doc.pixels);
  const channels: ChannelInfo[] = [
    { key: 'r', label: 'R', description: 'Красный 0..255' },
    { key: 'g', label: 'G', description: 'Зелёный 0..255' },
    { key: 'b', label: 'B', description: 'Синий 0..255' },
  ];
  if (hasAlpha) {
    channels.push({ key: 'a', label: 'A', description: 'Альфа 0..255' });
  }
  return {
    channels,
    hasColor: true,
    hasAlpha,
  };
}

export function allKeys(layout: ChannelLayout): ChannelKey[] {
  return layout.channels.map((c) => c.key);
}

function pixelsHaveAlpha(img: ImageData): boolean {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] !== 255) return true;
  }
  return false;
}
