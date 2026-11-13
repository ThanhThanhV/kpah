/**
 * Source-faithful playback cursor for original d.a() effect updates.
 * One call to advanceEffectPlayback represents one original d.a() invocation;
 * callers choose the game-loop cadence rather than this module inventing one.
 */
export function createEffectPlayback(definition, expiryValue = 0n) {
  if (!definition || !Array.isArray(definition.frameSequence)) {
    throw new TypeError("A decoded effect definition is required");
  }
  const expiry = typeof expiryValue === "bigint" ? expiryValue : BigInt(expiryValue);
  return {
    sequenceCursor: 0,
    frameIndex: 0,
    finished: definition.frameSequence.length === 0,
    expiryValue: expiry,
    mode: expiry === -1n ? "loop" : expiry === 0n ? "once" : "until-expiry",
  };
}

/**
 * Mirrors d.a(): once advances through the sequence and finishes; timed mode
 * loops until the supplied epoch-millisecond expiry; -1 loops indefinitely.
 */
export function advanceEffectPlayback(playback, definition, nowMs = Date.now()) {
  if (!playback || !definition || !Array.isArray(definition.frameSequence)) {
    throw new TypeError("Playback and decoded effect definition are required");
  }
  if (!Number.isFinite(nowMs)) throw new TypeError("nowMs must be finite");
  if (playback.finished) return playback;
  const sequence = definition.frameSequence;
  if (sequence.length === 0) return { ...playback, finished: true };

  let cursor = playback.sequenceCursor + 1;
  let frameIndex = playback.frameIndex;
  let finished = false;

  if (playback.mode === "once") {
    if (cursor < sequence.length) frameIndex = sequence[cursor];
    if (cursor >= sequence.length) {
      cursor = 0;
      finished = true;
    }
  } else if (playback.mode === "until-expiry") {
    if (cursor > sequence.length - 1) cursor = 0;
    if (cursor < sequence.length) frameIndex = sequence[cursor];
    if (playback.expiryValue < BigInt(Math.trunc(nowMs))) finished = true;
  } else {
    // Original p=3 path resets after stepping one past the sequence tail.
    if (cursor < sequence.length) frameIndex = sequence[cursor];
    else if (cursor > sequence.length) cursor = 0;
  }

  return { ...playback, sequenceCursor: cursor, frameIndex, finished };
}

/** Resolve the two source-rendered frame groups into atlas crop instructions. */
export function getEffectFrameParts(definition, frameIndex) {
  if (!definition || !Array.isArray(definition.frames) || !Number.isInteger(frameIndex)) {
    throw new TypeError("Decoded effect definition and integer frame index are required");
  }
  const frame = definition.frames[frameIndex];
  if (!frame) return { groupZero: [], groupNonZero: [] };
  const resolve = part => {
    const region = definition.regions[part.regionIndex];
    if (!region) return { ...part, region: null, drawable: false };
    return {
      ...part,
      region: { x: region.x, y: region.y, width: region.width, height: region.height },
      drawable: region.width > 0 && region.height > 0,
    };
  };
  return {
    groupZero: frame.groupZero.map(resolve),
    groupNonZero: frame.groupNonZero.map(resolve),
  };
}
