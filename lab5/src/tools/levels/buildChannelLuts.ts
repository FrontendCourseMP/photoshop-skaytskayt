import { applyComposed, buildLut, identityLut, isIdentity, type Lut } from './lut';
import type { ChannelLuts } from './applyLevels';
import type { ChannelKey } from './channelKeys';
import type { LevelsParams } from './levelsState';
import { DEFAULT_PARAMS } from './levelsState';

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

  return applyComposed(channelLut, master);
}

export function hasAnyChange(state: LevelsByChannel): boolean {
  return (
    !isIdentity(state.master) ||
    !isIdentity(state.red) ||
    !isIdentity(state.green) ||
    !isIdentity(state.blue) ||
    !isIdentity(state.alpha)
  );
}
