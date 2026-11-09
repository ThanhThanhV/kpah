# Startup and render-loop trace (verified from bytecode)

## Entry point: `game.GameMidlet`

The JAR manifest declares:

- `MIDlet-1: Khi Phach Anh Hung,/icon.png,game.GameMidlet`
- MIDlet version `1.5.9`
- Client/package version string `2.7.8` in `game.GameMidlet.<clinit>`

The constructor performs the initial client hand-off:

1. Stores the MIDlet instance in static field `game.GameMidlet.b`.
2. Constructs `km`.
3. Stores the `km` instance in `game.GameMidlet.a`.
4. Calls `Display.getDisplay(this).setCurrent(km)`.
5. Calls `km.d()`.
6. Sets `ku.S.f = true`.

The static field and method names are obfuscated. Preserve these exact symbols in notes until their meaning is confirmed from call sites.

## Main Canvas: `km`

Verified class declaration:

```java
final class km extends javax.microedition.lcdui.Canvas
    implements Runnable, CommandListener
```

Useful methods exposed by bytecode inspection:

- `km.paint(Graphics)`: MIDP canvas paint entry.
- `km.run()`: runnable loop.
- `km.keyPressed(int)` / `km.keyReleased(int)`: keyboard dispatch.
- `km.pointerPressed(int,int)`, `pointerDragged(int,int)`, `pointerReleased(int,int)`: touch/pointer dispatch.
- `km.sizeChanged(int,int)`: viewport change.
- `km.d()`: invoked immediately after the Canvas becomes current.
- `km.e()`, `km.f()`, `km.g()`, `km.h()`: additional static lifecycle/render helpers; semantics still under investigation.

Constructor observations:

- Enables full-screen Canvas mode.
- Performs a startup RMS check using the key `loadClearRMS`.
- Starts a thread using `ku.S` as its Runnable.
- Calls `km.a()` to initialize/load an Image.
- Initializes several UI/runtime helper objects, including `kx`.

## Implications for the Web recreation

The original client is a single full-screen Canvas application, not a collection of native screens. The Web recreation should therefore model the game as one scene/canvas with explicit screen states and overlay panels. Phaser is a reasonable fit for the world/render layer; HTML panels should be introduced only where they improve responsive UI/accessibility.

Do not yet assume the current mock's world dimensions, HUD layout, skill slots, currencies, or character stats match the original. Those need evidence from `km.paint`, screen-state classes, resource readers, and captured resource layouts.

## Reproduction commands

With a JDK installed, inspect the entry point and Canvas signatures:

```bash
javap -classpath KPAH_278.jar -p game.GameMidlet
javap -classpath KPAH_278.jar -p km
javap -classpath KPAH_278.jar -p -c game.GameMidlet
javap -classpath KPAH_278.jar -p -c km
```

For full Java source reconstruction, use JADX CLI (the GUI-with-JRE package does not necessarily include `bin/jadx.bat`). Keep the raw JAR as the baseline and compare decompiler output against bytecode when control flow is unclear.


## Render loop and input details (verified from `km` bytecode)

- `km.d()` starts a dedicated Thread for the Canvas Runnable once.
- `km.run()` updates the active `tj` state, updates overlay/runtime objects, calls `km.f()`, requests `repaint()`, then services repaints.
- The loop targets a 40 ms frame interval (approximately 25 updates/second): it sleeps for the remainder of 40 ms, or 1 ms when the frame has already exceeded that budget.
- `km.paint(Graphics)` delegates drawing to the active `tj` state, optional `md` overlay, optional `sg` layer, optional `xf` overlay, and finally `mj.c(Graphics)`. This is direct evidence of a state-driven Canvas renderer with layered overlays.
- Pointer press/drag/release store pointer coordinates and update separate pressed/released flags. The client therefore has a pointer/touch path in addition to key-code input.
- `sizeChanged` recalculates screen center coordinates and notifies the current screen/state objects so they can rebuild size-dependent layout.

The exact meanings of the obfuscated classes (`tj`, `md`, `sg`, `xf`, `mj`) are not yet established. Their draw/update call sites are confirmed; semantic names must wait for inspection of their implementations.
