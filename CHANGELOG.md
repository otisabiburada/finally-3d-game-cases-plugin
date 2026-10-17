# Changelog

## 1.11.1
### Near-zero cost
- **Resting covers are flat now.** Before, every cover on screen was a full 3D object with its own GPU layers (in a 36-game Home row: 210 promoted elements and 70 3D overlay layers on top of Steam's own). Now resting covers are plain 2D paint with the same look (gloss, band, sleeve, wear, shadow): 0 extra layers. Only the game you are on becomes 3D, and it stays 3D until it has turned back, so the turn in and out look the same as before.
- **Nothing animates forever.** The gentle drift used to loop endlessly on the game you are on; it now plays two slow cycles and stops.
- **Sleeps while you play.** While a game is running the plugin stops watching Steam's pages, stops its timer and pauses its animations; when the game closes it catches up with one scan.
- Removed an invisible spine layer that every cover carried.

### Fixed
- **Insert and eject animations showed a plain black case and disc with the 3D cases switched off.** The animation took its art from the 3D-tagged cover, and with 3D off nothing is tagged; the fallback asked Steam for the art and gave up after 0.6 s. It now finds the game's cover on screen by itself, and otherwise tries Steam's art, your custom art (`customimages`) and Steam's standard cover address all at once, taking the best one that loads within 1.5 s.

## 1.11.0
### Eject animation (new, its own switch)
- When you quit a game, the case flies out and opens, the disc (or game card) comes back out of the slot, drops into its tray, and the case closes and flies back to its place. Its own switch under *Insert animation*, with a **Preview the eject** button; it works without the insert animation too.
- Sounds: the case opens, the drive spins down and pushes the disc out, it drops into the tray, the case shuts.
- Waits until Steam's window is back after the game closes (up to 8 seconds).

### Shrink-wrap tear on first launch (new)
- A sealed game (never played, or set to *Sealed* itself) gets its shrink-wrap torn off when you launch it: the glossy wrap with the gold seal is gripped, ripped in two and the pieces fly off, then the case opens as usual. With crinkle and rip sounds.
- A game you set to *Sealed* yourself switches to normal wear after that. Games sealed because they were never played switch on their own once Steam has played them.

### Less motion (new)
- *Full motion*, *Less on battery* or *Less motion* (Effects). Less motion turns off the drifting, the foil shine and the leaning neighbours. The covers stay 3D.
- *Less on battery* follows Steam's charger state and switches back when you plug in.

### Other
- The insert and eject animations no longer start in a window that isn't laid out yet; the eject tries again a moment later.
- `npm test` also checks the less-motion settings.

## 1.10.3
- **Fixed the insert animation sometimes playing twice.** Steam reports a launch twice: when you press Play, and again when the game is actually running. The second report was ignored only for 15 seconds, so when Steam Cloud sync (or a cloud conflict dialog that restarts the launch) took longer, the animation played again. Now each launch plays it once, until that game has exited. Pressing Play again after closing or cancelling still plays it.
- `npm test` replays Steam's launch reports (cloud sync delay, restarted launch, relaunch...) and checks the animation plays exactly once per launch.

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
