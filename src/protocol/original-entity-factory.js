/**
 * Mirrors the original mj.a(kind, templateId, entityId, x, y, state, extra)
 * class factory. These are original Java class names, not visual asset guesses.
 */
const KIND_ONE_TEMPLATE_CLASSES = new Map([
  [91, "v"], [92, "v"], [93, "u"], [94, "x"], [46, "w"],
  [43, "hj:0"], [36, "hj:1"], [37, "hj:2"], [38, "p"], [39, "q"],
  [82, "t"], [83, "aj"], [84, "hy"],
  [113, "cf"], [115, "cf"], [116, "cf"], [117, "cf"],
]);

export function resolveOriginalEntityFactoryClass(kind, templateId, entityState, extraSubtype) {
  if (!Number.isInteger(kind)) return null;
  switch (kind) {
    case 0:
      return Number.isInteger(extraSubtype) && extraSubtype >= 0 ? "hd" : "z";
    case 1: {
      if (KIND_ONE_TEMPLATE_CLASSES.has(templateId)) return KIND_ONE_TEMPLATE_CLASSES.get(templateId);
      if (Number.isInteger(templateId) && templateId >= 95 && templateId <= 112) return "cf";
      if (entityState === 1) return "cf";
      return "cd";
    }
    case 3: return "al";
    case 4: return "am";
    case 6:
    case 7: return "ak";
    case 14: return "bq";
    default: return null;
  }
}


// Exact cd.c[templateType][direction][animationState] table from original source.
const ORIGINAL_CD_FRAME_TABLE = [
  [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]],
  [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 2, 3], [4, 5, 6, 7]],
  [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]],
  [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 2, 3], [4, 5, 6, 7]],
  [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
];

export function resolveOriginalEntityFrameIndex(templateType, direction, animationState = 0) {
  if (!Number.isInteger(templateType) || templateType < 0 || templateType >= ORIGINAL_CD_FRAME_TABLE.length
    || !Number.isInteger(direction) || direction < 0 || direction > 3
    || !Number.isInteger(animationState) || animationState < 0 || animationState > 3) return null;
  return ORIGINAL_CD_FRAME_TABLE[templateType][direction][animationState];
}
