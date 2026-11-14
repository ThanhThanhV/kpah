/**
 * Decoder for the map byte stream consumed by original hf.a(int, byte[]).
 * It extracts the source-observed tile grid and auxiliary records only; tile
 * atlas indices, collision semantics and decoration rendering remain separate.
 */
export function decodeOriginalMapData(payload) {
  if (!(payload instanceof Uint8Array)) throw new TypeError("Map payload must be Uint8Array");
  let offset = 0;
  const readU8 = (section) => {
    if (offset >= payload.length) throw new RangeError("Truncated map data while reading " + section);
    return payload[offset++];
  };
  const readI16 = (section) => {
    const high = readU8(section), low = readU8(section);
    const value = (high << 8) | low;
    return value > 0x7fff ? value - 0x10000 : value;
  };
  const readSentinelRecords = (section, readRecord, sentinel = 255) => {
    const records = [];
    while (true) {
      const marker = readU8(section + " marker");
      if (marker === sentinel) return records;
      records.push(readRecord(marker));
    }
  };
  const width = readU8("map width"), height = readU8("map height");
  if (width < 1 || height < 1) throw new RangeError("Map dimensions must be positive");
  const tileCount = width * height;
  if (tileCount > 4_000_000) throw new RangeError("Map tile grid exceeds safe decoder limit");
  const tiles = new Uint8Array(tileCount);
  for (let i = 0; i < tileCount; i += 1) {
    const value = readU8("base tile grid");
    tiles[i] = value === 254 ? 255 : value;
  }
  const rectangleOverrides = readSentinelRecords("rectangle overrides", firstColumn => {
    const firstRow = readU8("rectangle first row");
    const columnSpan = readU8("rectangle column span");
    const rowSpan = readU8("rectangle row span");
    const cells = [];
    for (let row = firstRow; row < firstRow + rowSpan; row += 1) {
      for (let column = firstColumn; column < firstColumn + columnSpan; column += 1) {
        cells.push({ row, column, tileId: readI16("rectangle tile id") });
      }
    }
    return { firstColumn, firstRow, columnSpan, rowSpan, cells };
  });
  const pointOverrides = readSentinelRecords("point overrides", column => {
    const row = readU8("point override row");
    const tileId = readI16("point override tile id");
    return { row, column, tileId };
  });
  const decorations = [];
  while (true) {
    let type = readU8("map decoration marker");
    if (type === 254) type = 255;
    if (type === 255) break;
    decorations.push({ type, x: readU8("decoration x"), y: readU8("decoration y") });
  }
  const mapMode = readU8("map mode flag") === 1;
  const portalCount = readU8("portal count");
  const portals = [];
  for (let i = 0; i < portalCount; i += 1) {
    const x = readU8("portal x"), y = readU8("portal y");
    const idLow = readU8("portal id low byte"), idHigh = readU8("portal id high byte");
    portals.push({ x, y, portalId: (idHigh << 8) | idLow,
      type: readU8("portal type"), flags: readU8("portal flags") });
  }
  const npcCount = readU8("map NPC count");
  const npcs = [];
  for (let i = 0; i < npcCount; i += 1) {
    npcs.push({ x: readU8("NPC x"), y: readU8("NPC y"), id: readU8("NPC id") });
  }
  const tileRows = Array.from({ length: height }, (_, row) =>
    Array.from(tiles.slice(row * width, (row + 1) * width)));
  return {
    width, height, tileCount, tiles, tileRows, rectangleOverrides,
    pointOverrides, decorations, mapMode, portalCount, portals,
    npcCount, npcs, trailingBytes: payload.slice(offset),
    consumedBytes: offset,
  };
}
