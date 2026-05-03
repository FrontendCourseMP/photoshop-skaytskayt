// Каналы инструмента "Уровни". Master объединяет все RGB-каналы и
// применяется к ним одинаково; отдельные ключи позволяют редактировать
// один канал независимо от остальных.

export type ChannelKey = 'master' | 'red' | 'green' | 'blue' | 'alpha';

export interface ChannelOption {
  key: ChannelKey;
  label: string;
  /** Цвет, которым рисовать столбцы гистограммы. */
  color: string;
}

export const CHANNEL_OPTIONS: ChannelOption[] = [
  { key: 'master', label: 'Master', color: '#cdd6e4' },
  { key: 'red', label: 'Red', color: '#ff6b6b' },
  { key: 'green', label: 'Green', color: '#6bd66b' },
  { key: 'blue', label: 'Blue', color: '#6ba9ff' },
  { key: 'alpha', label: 'Alpha', color: '#a0a0a0' },
];

export function findChannel(key: ChannelKey): ChannelOption {
  const option = CHANNEL_OPTIONS.find((o) => o.key === key);
  if (!option) throw new Error(`Unknown channel: ${key}`);
  return option;
}
