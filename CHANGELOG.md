# Changelog

## 1.10.2
Update from 1.9.0: install the new zip the same way as before. It replaces the old version and keeps all your looks, wears, names and settings.

### Fixed: huge, blocky ghost with a white ring around the focused game on Home
- Steam's Home draws every cover twice: the real cover inside the tile you move onto (a role=link Focusable), and a blurred glow copy in a box right next to it, outside that tile. Steam's class names are scrambled now, so the plugin no longer recognised the copy and turned it into a case too. On focus that copy was tilted, un-blurred and drawn on top of the real cover.
- The copy is now recognised by where it sits (same picture, next to the cover, outside Steam's focus target), is never turned into a case, and keeps Steam's own glow. When two copies can't be told apart, both are kept, so the real cover is never dropped.
- Works whichever of the two Steam creates first, and when Steam re-creates them. On Home the panel now shows about as many "glow/reflection copies left alone" as covers.

### Template frames (new)
- Use printed console frames instead of plain colours. Put frame pictures (PNG, WebP or JPG, 2:3, for example the SteamGridDB collection "Templates" by MANE0395) in `~/homebrew/settings/3d-game-cases/templates/` and press **Reload templates** (Looks, colours and presets → Colours → Templates).
- Every picture appears as a look next to the colours and can be set as the default, per collection or per game. The game's own cover art is drawn inside the frame's window and the frame over it, on the resting cover and on the 3D case.
- The window is found automatically. If one is off, add `<same name>.json` next to the picture, for example `{"window":[0.04,0.11,0.04,0.04]}` (left, top, right, bottom, as fractions of the frame).
- Nothing is downloaded or included in the plugin; only files you put in that folder are used. Works with the fallback injection too.

### Other
- The tilt no longer picks up a strong perspective that Steam sets on a parent (it could magnify the case); the plugin sets its own. Very wide items get a slightly smaller tilt.
- Covers whose tilting item is the cover itself keep their gloss, band and sleeve.

## 1.9.0
Update from 1.8.2: install the new zip the same way you installed 1.8.2. It replaces the old version and keeps all your looks, wears, names and settings.

### Insert animation (new, with its own switch)
- **Its own section and switch** in the panel; it works with the 3D cases switched off.
- Plays the moment you press **Play**, in the library or on a game page.
- The case flies out with a little overshoot, a light sweeps across the cover, and it opens on its hinge with a soft glow in the game's colour behind it.
- The disc (or a game card for cartridge looks) is printed with the game's cover art (your custom art first, then Steam's) and is already in the tray when the case opens. It lifts with a wobble, swings along an arc, spins up and is pulled into the slot, which sits in a bezel and lights up, with a small jolt when it clicks. Then the case snaps shut and flies back to its place.
- **Timing:** *Before game logo* (covers the screen, Steam's logo shows after it) or *After game logo* (Steam's logo first, then the animation, before Steam's small loading animation).
- **Insert sounds:** the case clicks open, the disc lifts, slides into the slot, the drive spins up, the case snaps shut. Made with Web Audio, no sound files.
- Self-check: new "Play button seen" line.

## 1.8.2
- Renamed to **Finally 3D Game Cases**.
- Steam's focus outline is never cut by the case or its shadow any more.
- Fixed the emergency safe-mode path in the panel and README (`~/homebrew/settings/3d-game-cases/SAFE_MODE`).

## 1.8.1
- Fixed a one-frame dark flicker over the selected cover (cover and background shared one depth plane).

## 1.8.0
- Plastic sleeve edge and rounded keepcase corners.
- Pick-up animation when you open a game.
- Neighbouring games lean away, like books on a shelf.
- Animation speed: Calm / Normal / Snappy.
- Self-check lists other themes and warns when they also change the cases.

## 1.7.x
- Smooth turn in and out; the spine name was removed.
- The case stays inside its own slot (hinges on its right edge).
- Built against Valve's current Steam UI: the glow copy is left alone, Steam's focus lift and perspective are replaced, the 3D is never flattened.
- First-run self-check, saved reports in `~/Downloads`, fallback injection through Steam's debug port, safe mode, per-game wear.

## 1.6 and earlier
- Per-game and per-collection looks, 21 console presets, custom colours, case shapes, wear (also from playtime), bulk assign, editable console names, experimental launch animation, non-Steam game support.
