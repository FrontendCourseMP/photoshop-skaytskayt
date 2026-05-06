// Сборка набора LUT для всех каналов из текущего состояния по каналам.
//
// Master применяется ко всем R/G/B одновременно; поверх него для конкретных
// R/G/B накладывается отдельная таблица — итог = compose(perChannel, master).
// Alpha обрабатывается полностью независимо.

import { applyComposed, buildLut, identityLut, isIdentity, type Lut } from './lut';
import type { ChannelLuts } from './applyLevels';
import type { ChannelKey } from './channelKeys';
import type { LevelsParams } from './levelsState';
import { DEFAULT_PARAMS } from './levelsState';

/**
 * Состояние диалога: параметры для каждого ключа, в т.ч. master.
 * При переключении канала в селекте мы не сбрасываем чужие значения.
 */
export type LevelsByChannel = Record<ChannelKey, LevelsParams>;

export function defaultByChannel(): LevelsByChannel {
  return {
    master: { ...DEFAULT_PARAMS },
    red: { ...DEFAULT_PARAMS },
    green: { ...DEFAULT_PARAMS },
    blue: { ...DEFAULT_PARAMS },
    alpha: { ...DEFAULT_PARAMS },
  };
}

export function buildChannelLuts(state: LevelsByChannel): ChannelLuts {
  const masterLut = isIdentity(state.master) ? null : buildLut(state.master);

  return {
    r: composeChannelLut(state.red, masterLut),
    g: composeChannelLut(state.green, masterLut),
    b: composeChannelLut(state.blue, masterLut),
    a: isIdentity(state.alpha) ? identityLut() : buildLut(state.alpha),
  };
}

function composeChannelLut(channel: LevelsParams, master: Lut | null): Lut {
  const channelLut = isIdentity(channel) ? null : buildLut(channel);
  if (!channelLut && !master) return identityLut();
  if (!channelLut) return master!;
  if (!master) return channelLut;
  // Сначала канальная таблица, потом master — это эквивалент порядка
  // "сначала Levels по R, потом Levels по Master" в Photoshop.
  return applyComposed(channelLut, master);
}

/** Любой канал отличается от тождественного? */
export function hasAnyChange(state: LevelsByChannel): boolean {
  return (
    !isIdentity(state.master) ||
    !isIdentity(state.red) ||
    !isIdentity(state.green) ||
    !isIdentity(state.blue) ||
    !isIdentity(state.alpha)
  );
}
