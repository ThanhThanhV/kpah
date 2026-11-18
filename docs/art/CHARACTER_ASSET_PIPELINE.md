# Character asset integration contract

This document defines the hand-off format for original, project-owned character art. The client intentionally ships without character image files until approved assets are supplied; the procedural character remains the fallback.

## Directory layout

Place each character's files under `apps/client/public/characters/<character-key>/`.

```text
characters/
  warrior/
    warrior.png
    source/
      warrior.aseprite
  mage/
    mage.png
  archer/
    archer.png
```

The `source/` directory is optional and should contain editable project-owned source files. Only runtime files referenced by the client catalog are loaded by the browser.

## Spritesheet contract

- PNG with transparency; no baked-in background, nameplate, HP bar, shadow or UI.
- Fixed frame dimensions throughout one sheet; no padding or spacing between frames.
- Frames are row-major and zero-indexed, matching Phaser's spritesheet frame numbering.
- Each animation is a contiguous inclusive frame range (`start` through `end`).
- Character feet should align to the same baseline in every frame. The runtime origin is the feet pivot, normally `{ x: 0.5, y: 1 }`.
- The logical display size is independent from source pixel dimensions; the initial prototype uses 44×64 logical pixels until art direction defines final scale.
- Recommended action set: `idle`, `walk`, `attack`, `cast`, `hit`, `death`.
- Recommended facing set: `down`, `left`, `right`, `up`. Idle and walk should provide all four directions. Other actions may fall back to their down-facing clip until all directions are authored.
- Idle and walk loop. Attack, cast and hit are one-shot clips. Death should remain on its final frame or use a dedicated static/death pose.

## Client catalog entry

Add one `CharacterSpriteDefinition` to `CHARACTER_SPRITE_CATALOG` in `apps/client/src/game/SpriteSheetAnimationRegistry.ts` only after the matching file is committed.

```ts
{
  characterKey: "warrior",            // must match server classCode
  textureKey: "character-warrior",    // unique Phaser texture key
  path: "characters/warrior/warrior.png",
  frameWidth: 64,
  frameHeight: 64,
  animations: [
    { action: "idle", facing: "down", start: 0, end: 3, frameRate: 6 },
    { action: "walk", facing: "down", start: 4, end: 9, frameRate: 10 },
    { action: "attack", facing: "down", start: 10, end: 14, frameRate: 12 }
  ]
}
```

The example ranges are illustrative only; replace them with frame indices from the actual sheet. Do not commit guessed mappings.

## Spine / hybrid characters

Spine characters should keep the same logical action and facing vocabulary. The project has a plugin-neutral `SpineCharacterVisualAdapter`; a concrete adapter factory must be added only after the Spine runtime/plugin version and exported skeleton format are selected. Keep skeleton, atlas and texture files together under the character directory. Map logical keys such as `attack:left` to actual Spine animation names in the integration layer. Do not add a runtime dependency or invent animation names before receiving a real export.

## Acceptance checklist

- [ ] Art is original or properly licensed for this project.
- [ ] Transparent background, consistent frame dimensions and feet baseline.
- [ ] All frame ranges checked against the exported sheet.
- [ ] Idle/walk verified in all four directions.
- [ ] Attack/cast/hit replay correctly when the same action occurs repeatedly.
- [ ] Death and respawn transition correctly.
- [ ] Local and remote characters use the same class-keyed catalog entry.
- [ ] Nameplate and HP bar remain separate overlays and depth-sort from the feet position.
- [ ] Test at desktop and mobile viewport sizes.

## Current state

The code pipeline and validation are present, but `CHARACTER_SPRITE_CATALOG` is empty and no character PNG/Spine export is currently committed. Therefore the visible game character remains procedural. This is an explicit asset dependency, not a completed art integration.
