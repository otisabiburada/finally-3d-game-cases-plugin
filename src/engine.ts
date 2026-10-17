// Engine: injects the 3D-case CSS into every Steam UI window and tags portrait covers.
// Pure DOM code (no Decky imports) so it can be tested in a plain browser.

export type StyleId = string; // a built-in id below, or "custom:<id>"
export const STYLE_IDS: StyleId[] = [
  "black", "white", "red", "blue", "green", "gold", "purple", "grey",
  "ps1", "ps2", "ps3", "ps4", "ps5", "psp", "xbox", "x360", "wee", "wee2", "dreamcast", "sega", "pc",
];
export const STYLE_LABELS: Record<string, string> = {
  black: "Black (PC)", white: "White", red: "Red", blue: "Blue", green: "Green (Xbox One/Series)",
  gold: "Gold", purple: "Purple", grey: "Grey (Retro)",
  ps1: "PS1 grey", ps2: "PS2 dark blue", ps3: "PS3 crystal gray", ps4: "PS4 open blue", ps5: "PS5 blue",
  psp: "PSP black", xbox: "Xbox dark green", x360: "Xbox 360 open green", wee: "White", wee2: "Cyan",
  dreamcast: "Dreamcast", sega: "Sega Genesis", pc: "PC big box (Steam blue)",
};
export const STYLE_SHORT: Record<string, string> = {
  black: "Black", white: "White", red: "Secret", blue: "Blue", green: "Green", gold: "Gold", purple: "Purple", grey: "Grey",
  ps1: "PS1", ps2: "PS2", ps3: "PS3", ps4: "PS4", ps5: "PS5", psp: "PSP", xbox: "Xbox", x360: "360", wee: "Wee", wee2: "Wee Too",
  dreamcast: "DC", sega: "Sega", pc: "PC",
};

export interface Pal { a: string; b: string; band: string; text: string; line: string }
export const PALETTE: Record<string, Pal> = {
  black: { a: "#2c2f36", b: "#07080a", band: "#3b3f48", text: "#ffffff", line: "rgba(255,255,255,.22)" },
  white: { a: "#ffffff", b: "#c9ccd3", band: "#e4e6ea", text: "#1d1f24", line: "rgba(0,0,0,.18)" },
  red: { a: "#ff2a38", b: "#7d000a", band: "#e60012", text: "#ffffff", line: "rgba(255,255,255,.28)" },
  blue: { a: "#2b86ff", b: "#05306e", band: "#0070d1", text: "#ffffff", line: "rgba(255,255,255,.28)" },
  green: { a: "#34c24a", b: "#0b4a16", band: "#107c10", text: "#ffffff", line: "rgba(255,255,255,.28)" },
  gold: { a: "#f6d365", b: "#8a6a10", band: "#d4a017", text: "#2a1d00", line: "rgba(255,255,255,.35)" },
  purple: { a: "#a566ee", b: "#3a1566", band: "#7b2fbe", text: "#ffffff", line: "rgba(255,255,255,.28)" },
  grey: { a: "#c3c7ce", b: "#555961", band: "#8d9199", text: "#101214", line: "rgba(255,255,255,.3)" },
  ps1: { a: "#9a9da5", b: "#2b2d31", band: "#5b5e66", text: "#ffffff", line: "rgba(255,255,255,.25)" },
  ps2: { a: "#2547c4", b: "#081552", band: "#0e2a8f", text: "#ffffff", line: "rgba(255,255,255,.25)" },
  ps3: { a: "rgba(222,227,236,.55)", b: "rgba(118,124,138,.70)", band: "rgba(150,156,170,.75)", text: "#10151c", line: "rgba(255,255,255,.55)" },
  ps4: { a: "#63bcff", b: "#1f7ae8", band: "#2f94ff", text: "#06203f", line: "rgba(255,255,255,.35)" },
  ps5: { a: "#3a8fe8", b: "#0b4396", band: "#1560c4", text: "#ffffff", line: "rgba(255,255,255,.28)" },
  psp: { a: "#34363c", b: "#08080a", band: "#16171a", text: "#ffffff", line: "rgba(255,255,255,.2)" },
  xbox: { a: "#2e8b2e", b: "#0a380a", band: "#176b17", text: "#ffffff", line: "rgba(255,255,255,.25)" },
  x360: { a: "#8ae857", b: "#35a81c", band: "#62d42e", text: "#0b2a05", line: "rgba(255,255,255,.4)" },
  wee: { a: "#fbfcfe", b: "#b7c2cf", band: "#00b4e6", text: "#16202b", line: "rgba(0,0,0,.18)" },
  wee2: { a: "#52d6ff", b: "#0a7ba8", band: "#00a9e0", text: "#042a3a", line: "rgba(255,255,255,.4)" },
  dreamcast: { a: "#ffffff", b: "#c9ccd3", band: "#f26a21", text: "#1d1f24", line: "rgba(0,0,0,.18)" },
  pc: { a: "#2a475e", b: "#0f1a24", band: "#66c0f4", text: "#ffffff", line: "rgba(255,255,255,.25)" },
  sega: { a: "#30343c", b: "#050507", band: "#0060a8", text: "#ffffff", line: "rgba(255,255,255,.2)" },
};

export type ShapeId = "keepcase" | "cartridge" | "jewel" | "bigbox";
export const SHAPE_IDS: ShapeId[] = ["keepcase", "cartridge", "jewel", "bigbox"];
export const SHAPE_LABELS: Record<string, string> = {
  auto: "Auto", keepcase: "Keepcase", cartridge: "Cartridge case", jewel: "Jewel case", bigbox: "Big box",
};
const SHAPES: Record<ShapeId, { depth: number; radius: number; rim: number }> = {
  keepcase: { depth: 1, radius: 2, rim: 0 },
  cartridge: { depth: 0.5, radius: 5, rim: 0 },
  jewel: { depth: 0.45, radius: 1, rim: 3 },
  bigbox: { depth: 2.4, radius: 0, rim: 0 },
};
const SLEEVE_R: Record<ShapeId, number> = { keepcase: 7, cartridge: 10, jewel: 2, bigbox: 2 };
// which case each console look comes in when the shape is "Auto"
const STYLE_SHAPE: Record<string, ShapeId> = { red: "cartridge", psp: "cartridge", ps1: "jewel", dreamcast: "jewel", pc: "bigbox" };

export type WearId = "none" | "sealed" | "light" | "worn" | "battered" | "faded" | "rental";
export const WEAR_IDS: WearId[] = ["none", "sealed", "light", "worn", "battered", "faded", "rental"];
export const WEAR_LABELS: Record<string, string> = {
  none: "Mint", sealed: "Sealed (never opened)", light: "Light scuffs", worn: "Well worn", battered: "Battered", faded: "Sun-faded", rental: "Rental sticker",
};
const SCUFF = "repeating-linear-gradient(118deg, rgba(255,255,255,.08) 0 1px, transparent 1px 19px)";
const WEAR_CSS: Record<WearId, string> = {
  none: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))",
  sealed: "linear-gradient(115deg, rgba(255,255,255,.26) 0 7%, transparent 7% 30%, rgba(255,255,255,.16) 30% 33%, transparent 33%), radial-gradient(circle at 86% 91%, #ffd44d 0 4.5%, #b98a12 4.5% 6%, transparent 6.2%), repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 5px)",
  light: `${SCUFF}, repeating-linear-gradient(62deg, rgba(0,0,0,.07) 0 1px, transparent 1px 27px)`,
  worn: "radial-gradient(circle at 0% 0%, rgba(255,255,255,.38), transparent 14%), radial-gradient(circle at 100% 0%, rgba(255,255,255,.30), transparent 12%), radial-gradient(circle at 100% 100%, rgba(255,255,255,.34), transparent 15%), radial-gradient(circle at 0% 100%, rgba(255,255,255,.30), transparent 12%), repeating-linear-gradient(118deg, rgba(255,255,255,.14) 0 1px, transparent 1px 13px), repeating-linear-gradient(72deg, rgba(0,0,0,.14) 0 1px, transparent 1px 17px), linear-gradient(90deg, rgba(0,0,0,.18), transparent 12%, transparent 88%, rgba(0,0,0,.18))",
  battered: "radial-gradient(circle at 0% 0%, rgba(255,255,255,.55), transparent 24%), radial-gradient(circle at 100% 0%, rgba(255,255,255,.5), transparent 22%), radial-gradient(circle at 100% 100%, rgba(255,255,255,.55), transparent 26%), radial-gradient(circle at 0% 100%, rgba(255,255,255,.5), transparent 22%), linear-gradient(100deg, transparent 49.6%, rgba(255,255,255,.4) 50%, transparent 50.5%), linear-gradient(0deg, rgba(70,45,20,.30), transparent 34%), repeating-linear-gradient(118deg, rgba(255,255,255,.2) 0 1px, transparent 1px 9px), repeating-linear-gradient(72deg, rgba(0,0,0,.2) 0 1px, transparent 1px 12px), repeating-linear-gradient(160deg, rgba(255,255,255,.12) 0 1px, transparent 1px 21px), linear-gradient(90deg, rgba(0,0,0,.34), transparent 18%, transparent 82%, rgba(0,0,0,.34))",
  faded: "linear-gradient(180deg, rgba(255,238,200,.34), rgba(255,238,200,.12) 70%, rgba(255,238,200,.05)), linear-gradient(rgba(190,170,120,.12), rgba(190,170,120,.12))",
  rental: `linear-gradient(90deg, #d33 0 12%, #f3f0e4 12% 100%) 7% 92% / 38% 5.5% no-repeat, ${SCUFF}`,
};

export interface CustomColor { id: string; name: string; h: number; s: number; l: number; glass: boolean; shape: ShapeId | "auto" }

export function customPalette(c: CustomColor): Pal {
  const f = (h: number, s: number, l: number) => (c.glass ? `hsla(${h},${s}%,${l}%,.6)` : `hsl(${h},${s}%,${l}%)`);
  return {
    a: f(c.h, c.s, Math.min(92, c.l + 16)),
    b: f(c.h, c.s, Math.max(5, c.l - 26)),
    band: f(c.h, c.s, c.l),
    text: c.l > 62 ? "#111111" : "#ffffff",
    line: c.l > 62 ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.28)",
  };
}


// ---------- templates (frame pictures, e.g. the SteamGridDB console templates) ----------
// A template is a 2:3 picture of a case front (border, logo bar) with a dark, empty window. The game's cover art is shown
// inside the window and the frame is drawn over it. They come from a folder (see main.py) and are registered here.
export interface TemplateInfo { id: string; name: string; url: string; win: { l: number; t: number; r: number; b: number }; pal: Pal }
export interface TemplateIn { name: string; url: string; win?: number[] | null }
export const TEMPLATES: Record<string, TemplateInfo> = {};
export const TPL_PREFIX = "tpl:";
export const TPL_NAME_OK = /^[A-Za-z0-9][A-Za-z0-9._ ()+-]{0,79}$/;
export function tplId(file: string): string { return TPL_PREFIX + file; }
export function tplLabel(id: string): string {
  return id.slice(TPL_PREFIX.length).replace(/\.(png|webp|jpe?g)$/i, "").replace(/[_]+/g, " ").trim() || "Template";
}
export function templateIds(): StyleId[] { return Object.keys(TEMPLATES).sort(); }
const DEFAULT_WIN = { l: 0.03, t: 0.1, r: 0.03, b: 0.03 }; // fractions of the picture that are frame (left, top, right, bottom)

function median(a: number[]): number { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; }

/** Finds the empty window of a template and its main colour by looking at the pixels (nothing is sent anywhere). */
export function analyzeTemplate(img: HTMLImageElement, win?: number[] | null): { win: TemplateInfo["win"]; pal: Pal } {
  const doc = img.ownerDocument;
  const W = 120, H = 180;
  let data: Uint8ClampedArray | null = null;
  try {
    const c = doc.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    if (g) { g.drawImage(img, 0, 0, W, H); data = g.getImageData(0, 0, W, H).data; }
  } catch (e) { data = null; }
  const px = (x: number, y: number) => { const i = (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4; return data ? [data[i], data[i + 1], data[i + 2], data[i + 3]] : [0, 0, 0, 255]; };
  const lum = (x: number, y: number) => { const p = px(x, y); return p[3] < 40 ? -100 : 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]; };
  let w = { ...DEFAULT_WIN };
  if (win && win.length === 4 && win.every((v) => typeof v === "number" && isFinite(v) && v >= 0 && v < 0.6)) {
    w = { l: win[0], t: win[1], r: win[2], b: win[3] };
  } else if (data) {
    // walk outward from the middle of the picture until the brightness jumps: that is where the frame starts
    const cx = W >> 1, cy = (H * 0.55) | 0;
    const edge = (x0: number, y0: number, dx: number, dy: number, max: number): number => {
      let prev = lum(x0, y0);
      for (let i = 1; i < max; i++) {
        const x = x0 + dx * i, y = y0 + dy * i;
        const cur = lum(x, y);
        if (prev < -50 && cur < -50) continue;                     // see-through window: keep going until something solid
        if ((prev < -50) !== (cur < -50) || Math.abs(cur - prev) > 14) return i;
        prev = cur;
      }
      return max;
    };
    const xs = [0.2, 0.35, 0.65, 0.8].map((f) => (W * f) | 0);
    const ys = [0.4, 0.55, 0.7].map((f) => (H * f) | 0);
    const top = median(xs.map((x) => cy - edge(x, cy, 0, -1, cy)));
    const bottom = median(xs.map((x) => cy + edge(x, cy, 0, 1, H - cy)));
    const left = median(ys.map((y) => cx - edge(cx, y, -1, 0, cx)));
    const right = median(ys.map((y) => cx + edge(cx, y, 1, 0, W - cx)));
    const cand = { l: left / W, t: top / H, r: 1 - right / W, b: 1 - bottom / H };
    const area = (1 - cand.l - cand.r) * (1 - cand.t - cand.b);
    if (area > 0.4 && area < 0.97 && cand.l < 0.2 && cand.r < 0.2 && cand.t < 0.3 && cand.b < 0.2) {
      // a frame always has some border on every side; a value of about zero means no edge was found there
      w = { l: cand.l < 0.008 ? DEFAULT_WIN.l : cand.l, t: cand.t < 0.008 ? DEFAULT_WIN.t : cand.t, r: cand.r < 0.008 ? DEFAULT_WIN.r : cand.r, b: cand.b < 0.008 ? DEFAULT_WIN.b : cand.b };
    }
  }
  // colour of the frame: the border strip beside the window
  let r = 0, gg = 0, b = 0, n = 0;
  if (data) for (let y = (H * 0.3) | 0; y < ((H * 0.8) | 0); y += 4) for (const x of [Math.max(0, ((w.l * W) | 0) - 2), Math.min(W - 1, W - ((w.r * W) | 0) + 1)]) { const p = px(x, y); if (p[3] > 100) { r += p[0]; gg += p[1]; b += p[2]; n++; } }
  const base = n ? [r / n, gg / n, b / n] : [60, 66, 78];
  const L = 0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2];
  const mix = (k: number) => `rgb(${base.map((v) => Math.round(Math.max(0, Math.min(255, k >= 0 ? v + (255 - v) * k : v * (1 + k))))).join(",")})`;
  return { win: w, pal: { a: mix(0.18), b: mix(-0.55), band: "rgba(0,0,0,0)", text: L > 140 ? "#111111" : "#ffffff", line: L > 140 ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.28)" } };
}

export function registerTemplates(list: { id: string; name: string; url: string; win: TemplateInfo["win"]; pal: Pal }[]): void {
  Object.keys(TEMPLATES).forEach((k) => delete TEMPLATES[k]);
  list.forEach((t) => { TEMPLATES[t.id] = t; });
}

/** Loads template pictures (data addresses) and works out their windows. */
export function loadTemplates(doc: Document, items: TemplateIn[]): Promise<TemplateInfo[]> {
  const view = doc.defaultView as any;
  const one = (it: TemplateIn) => new Promise<TemplateInfo | null>((resolve) => {
    if (!TPL_NAME_OK.test(it.name) || typeof it.url !== "string" || it.url.indexOf("data:image/") !== 0) { resolve(null); return; }
    const im: HTMLImageElement = new view.Image();
    im.onload = () => {
      try {
        if (im.naturalWidth < 60 || im.naturalHeight < 60) { resolve(null); return; }
        const a = analyzeTemplate(im, it.win);
        resolve({ id: tplId(it.name), name: it.name, url: it.url, win: a.win, pal: a.pal });
      } catch (e) { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = it.url;
  });
  return Promise.all(items.slice(0, 40).map(one)).then((r) => r.filter((x): x is TemplateInfo => !!x));
}

function tplCss(): string {
  const ids = Object.keys(TEMPLATES);
  if (!ids.length) return "";
  const pc = (v: number) => `${(v * 100).toFixed(2)}%`;
  const rules = ids.map((id) => {
    const t = TEMPLATES[id], w = t.win, q = JSON.stringify(id);
    // the hole in the frame is a hair smaller than the window and the art a hair bigger, so no seam shows between them
    const e = 0.004, ax = (v: number) => Math.max(0, v - 0.008);
    const hole = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pc(w.l + e)} ${pc(w.t + e)}, ${pc(w.l + e)} ${pc(1 - w.b - e)}, ${pc(1 - w.r - e)} ${pc(1 - w.b - e)}, ${pc(1 - w.r - e)} ${pc(w.t + e)}, ${pc(w.l + e)} ${pc(w.t + e)})`;
    return `[data-sanso-style=${q}] > [data-sanso-tpl] > [data-t="art"] { left: ${pc(ax(w.l))}; top: ${pc(ax(w.t))}; right: ${pc(ax(w.r))}; bottom: ${pc(ax(w.b))}; }
[data-sanso-style=${q}] > [data-sanso-tpl] > [data-t="frame"] { background-image: url(${JSON.stringify(t.url)}); -webkit-clip-path: ${hole}; clip-path: ${hole}; }`;
  }).join("\n");
  return `
/* template frames: the game's art in the window, the frame picture over it */
[data-sanso-tpl] { position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; overflow: hidden; border-radius: var(--c3d-r, 2px); z-index: 1; transition: transform 0s linear .8s; }
[data-sanso-tpl] > div { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background-repeat: no-repeat; background-position: center; }
[data-sanso-tpl] > [data-t="art"] { background-size: cover; background-color: #0b0c0f; }
[data-sanso-tpl] > [data-t="frame"] { background-size: 100% 100%; }
${rules}
`;
}

export function paletteFor(s: Settings, id: string): Pal {
  if (id.indexOf(TPL_PREFIX) === 0) return TEMPLATES[id] ? TEMPLATES[id].pal : PALETTE.black;
  if (id.indexOf("custom:") === 0) {
    const c = s.customs.filter((x) => "custom:" + x.id === id)[0];
    return c ? customPalette(c) : PALETTE.black;
  }
  return PALETTE[id] || PALETTE.black;
}

// The four looks that are named after a console family have names the user can change.
export const NAMEABLE = ["red", "wee", "wee2", "purple"];
export const DEFAULT_NAMES: Record<string, string> = { red: "Secret Console", wee: "Wee", wee2: "Wee Too", purple: "PlayCube" };
export const NAME_SUFFIX: Record<string, string> = { red: "red", wee: "white", wee2: "cyan", purple: "purple" };

export function consoleName(s: Settings, id: string): string {
  const n = (s.names[id] || "").trim();
  return n || DEFAULT_NAMES[id];
}

export function styleLabel(s: Settings, id: string): string {
  if (id.indexOf(TPL_PREFIX) === 0) return tplLabel(id);
  if (NAMEABLE.indexOf(id) >= 0) return `${consoleName(s, id)} ${NAME_SUFFIX[id]}`;
  if (id.indexOf("custom:") === 0) {
    const c = s.customs.filter((x) => "custom:" + x.id === id)[0];
    return c ? c.name : "Black (PC)";
  }
  return STYLE_LABELS[id] || id;
}

export interface Settings {
  enabled: boolean;
  angle: number;       // degrees, 0..40
  depth: number;       // case thickness in px, 6..30
  color: StyleId;      // default look
  gloss: boolean;
  shadow: boolean;
  band: boolean;       // coloured band along the top of the cover
  spineTitle: boolean; // game name on the spine
  float: boolean;      // slow, tiny drifting motion on the game you are on
  idleTilt: number;    // tilt of covers you are not on, 0..20 (0 = flat, cheapest)
  autoGuess: boolean;  // guess the look from a collection's name (console names, PlayStation, Xbox...)
  names: Record<string, string>;         // your names for the four console-family looks
  shape: ShapeId | "auto";               // case shape (auto = by console look)
  wear: WearId;                          // default wear
  playWear: boolean;                     // wear follows how much you played the game
  wearSpeed: "slow" | "normal" | "fast"; // how quickly playtime wears a case
  insertAnim: boolean;                   // experimental: disc / card flies into the slot when a game launches
  insertTarget: "auto" | "handheld" | "console";
  wears: Record<string, WearId>;         // per-collection wear, key = collection id
  gameWears: Record<string, WearId>;     // per-game wear (wins over everything), key = app id
  fallback: "auto" | "off" | "always";   // inject through Steam's debug port when the library window can't be reached
  safeMode: boolean;                     // everything off
  checkedOnce: boolean;                  // the first-run self-check has been run
  shine: boolean;                        // light sweep when a game pops out
  otherScreens: boolean;                 // also Home recent games and the game page
  sleeve: boolean;                       // rounded case with a clear plastic sleeve edge
  pickup: boolean;                       // quick lift when you open a game
  neighbors: boolean;                    // the games next to the one you are on lean away
  speed: "calm" | "normal" | "snappy";   // how fast the case turns in and out
  insertSound: boolean;                  // sounds for the insert animation
  insertWhen: "before" | "after";        // play before Steam's game-logo launch screen, or after it
  ejectAnim: boolean;                    // the disc comes back out and the case closes when you quit a game
  lessMotion: "off" | "battery" | "always"; // no drifting, shine or leaning neighbours (always, or only on battery)
  customs: CustomColor[];                // your own colours
  games: Record<string, StyleId>;        // per-game look, key = app id
  collections: Record<string, StyleId>;  // per-collection look, key = collection id
}

/** The settings the cases are drawn with: "less motion" switches off drifting, shine and leaning neighbours. */
export function withLessMotion(s: Settings, onBattery: boolean): Settings {
  const on = s.lessMotion === "always" || (s.lessMotion === "battery" && onBattery);
  return on ? { ...s, float: false, shine: false, neighbors: false } : s;
}

export const DEFAULTS: Settings = {
  enabled: true, angle: 32, depth: 24, color: "black", gloss: true, shadow: true, band: true,
  spineTitle: false, float: true, idleTilt: 0, autoGuess: true, names: {}, shape: "auto", wear: "none", playWear: false, wearSpeed: "normal", insertAnim: false, insertTarget: "auto", wears: {}, gameWears: {}, fallback: "auto", safeMode: false, checkedOnce: false, shine: true, otherScreens: false, sleeve: true, pickup: true, neighbors: true, speed: "normal", insertSound: true, insertWhen: "before", ejectAnim: false, lessMotion: "off",
  customs: [], games: {}, collections: {},
};

const STORE_KEY = "sanso-3d-game-cases";
const STYLE_ID = "sanso-3d-cases-style";

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch (e) { /* storage may be unavailable */ }
  return sanitize({});
}

export function saveSettings(s: Settings): void {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

const ID_ALIAS: Record<string, string> = { wii: "wee", wiiu: "wee2" };
function fixId(id: any): any { return typeof id === "string" && ID_ALIAS[id] ? ID_ALIAS[id] : id; }

function validId(id: any, customs: CustomColor[]): boolean {
  if (typeof id !== "string") return false;
  if (STYLE_IDS.indexOf(id) >= 0) return true;
  if (id.indexOf(TPL_PREFIX) === 0) return TPL_NAME_OK.test(id.slice(TPL_PREFIX.length)); // the picture may load later
  return id.indexOf("custom:") === 0 && customs.some((c) => "custom:" + c.id === id);
}

function cleanMap(m: any, customs: CustomColor[]): Record<string, StyleId> {
  const out: Record<string, StyleId> = {};
  if (m && typeof m === "object") {
    for (const k of Object.keys(m)) { const v = fixId(m[k]); if (validId(v, customs)) out[k] = v; }
  }
  return out;
}

function cleanNames(m: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (m && typeof m === "object") for (const k of NAMEABLE) if (typeof m[k] === "string") out[k] = m[k].slice(0, 24);
  return out;
}

function cleanWears(m: any): Record<string, WearId> {
  const out: Record<string, WearId> = {};
  if (m && typeof m === "object") for (const k of Object.keys(m)) if (WEAR_IDS.indexOf(m[k]) >= 0) out[k] = m[k];
  return out;
}

export function sanitize(x: any): Settings {
  const n = (v: any, lo: number, hi: number, d: number) =>
    typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
  const b = (v: any, d: boolean) => (typeof v === "boolean" ? v : d);
  x = x && typeof x === "object" ? x : {};
  const customs: CustomColor[] = [];
  if (Array.isArray(x.customs)) {
    for (const c of x.customs.slice(0, 12)) {
      if (!c || typeof c.id !== "string" || !/^[a-z0-9]{1,12}$/.test(c.id)) continue;
      customs.push({
        id: c.id, name: typeof c.name === "string" ? c.name.slice(0, 24) : "Custom",
        h: Math.round(n(c.h, 0, 360, 210)), s: Math.round(n(c.s, 0, 100, 70)), l: Math.round(n(c.l, 5, 90, 45)), glass: b(c.glass, false),
        shape: SHAPE_IDS.indexOf(c.shape) >= 0 ? c.shape : "auto",
      });
    }
  }
  return {
    enabled: b(x.enabled, DEFAULTS.enabled),
    angle: n(x.angle, 0, 40, DEFAULTS.angle),
    depth: n(x.depth, 6, 30, DEFAULTS.depth),
    color: validId(fixId(x.color), customs) ? fixId(x.color) : DEFAULTS.color,
    gloss: b(x.gloss, DEFAULTS.gloss),
    shadow: b(x.shadow, DEFAULTS.shadow),
    band: b(x.band, DEFAULTS.band),
    spineTitle: false, // the name on the spine was removed
    float: b(x.float, DEFAULTS.float),
    idleTilt: 0, // covers you are not on stay flat
    autoGuess: b(x.autoGuess, DEFAULTS.autoGuess),
    names: cleanNames(x.names),
    shape: SHAPE_IDS.indexOf(x.shape) >= 0 ? x.shape : "auto",
    wear: WEAR_IDS.indexOf(x.wear) >= 0 ? x.wear : DEFAULTS.wear,
    playWear: b(x.playWear, DEFAULTS.playWear),
    wearSpeed: x.wearSpeed === "slow" || x.wearSpeed === "fast" ? x.wearSpeed : "normal",
    insertAnim: b(x.insertAnim, DEFAULTS.insertAnim),
    insertTarget: x.insertTarget === "handheld" || x.insertTarget === "console" ? x.insertTarget : "auto",
    wears: cleanWears(x.wears),
    gameWears: cleanWears(x.gameWears),
    fallback: x.fallback === "off" || x.fallback === "always" ? x.fallback : "auto",
    safeMode: b(x.safeMode, false),
    checkedOnce: b(x.checkedOnce, false),
    shine: b(x.shine, DEFAULTS.shine),
    otherScreens: b(x.otherScreens, DEFAULTS.otherScreens),
    sleeve: b(x.sleeve, DEFAULTS.sleeve),
    pickup: b(x.pickup, DEFAULTS.pickup),
    neighbors: b(x.neighbors, DEFAULTS.neighbors),
    speed: x.speed === "calm" || x.speed === "snappy" ? x.speed : "normal",
    insertSound: b(x.insertSound, DEFAULTS.insertSound),
    insertWhen: x.insertWhen === "after" ? "after" : "before",
    ejectAnim: b(x.ejectAnim, DEFAULTS.ejectAnim),
    lessMotion: x.lessMotion === "battery" || x.lessMotion === "always" ? x.lessMotion : "off",
    customs,
    games: cleanMap(x.games, customs),
    collections: cleanMap(x.collections, customs),
  };
}

// ---------- which look does a game get? ----------

export function guessStyle(collectionName: string, s?: Settings): StyleId | null {
  const n = (collectionName || "").toLowerCase();
  // a collection named after one of the (default or your own) console names gets that look
  const names = NAMEABLE.map((id) => ({ id, nm: (s ? consoleName(s, id) : DEFAULT_NAMES[id]).trim().toLowerCase() }))
    .filter((x) => x.nm.length >= 3).sort((a, b) => b.nm.length - a.nm.length);
  for (const x of names) {
    const esc = x.nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("(^|[^a-z0-9])" + esc + "([^a-z0-9]|$)").test(n)) return x.id;
  }
  if (/wii ?u/.test(n)) return "wee2";
  if (/\bwii\b/.test(n)) return "wee";
  if (/switch|nintendo|\bnx\b/.test(n)) return "red";
  if (/dreamcast/.test(n)) return "dreamcast";
  if (/sega|genesis|mega ?drive|master system|saturn/.test(n)) return "sega";
  if (/game ?cube|\bgcn?\b/.test(n)) return "purple";
  if (/xbox|x360/.test(n)) {
    if (/360|x360/.test(n)) return "x360";
    if (/original|\bog\b|classic/.test(n)) return "xbox";
    return "green";
  }
  if (/\bps ?5\b|playstation ?5/.test(n)) return "ps5";
  if (/\bps ?4\b|playstation ?4/.test(n)) return "ps4";
  if (/\bps ?3\b|playstation ?3/.test(n)) return "ps3";
  if (/\bps ?2\b|playstation ?2/.test(n)) return "ps2";
  if (/\bps ?1\b|\bpsx\b|playstation ?1|\bps ?one\b/.test(n)) return "ps1";
  if (/\bpsp\b|vita/.test(n)) return "psp";
  if (/playstation|\bps\b/.test(n)) return "ps4";
  if (/game ?boy|\bgba\b|\bgbc\b|\bds\b|3ds|\bsnes\b|\bnes\b|retro|n64|atari/.test(n)) return "grey";
  return null;
}

export function resolveStyle(
  s: Settings, appid: string | null, collections: string[], collectionName: (id: string) => string,
): StyleId {
  if (appid && s.games[appid]) return s.games[appid];
  for (const c of collections) if (s.collections[c]) return s.collections[c];
  if (s.autoGuess) {
    for (const c of collections) {
      const g = guessStyle(collectionName(c), s);
      if (g) return g;
    }
  }
  return s.color;
}

export function shapeFor(s: Settings, styleId: string): ShapeId {
  if (s.shape !== "auto") return s.shape;
  if (styleId.indexOf("custom:") === 0) {
    const c = s.customs.filter((x) => "custom:" + x.id === styleId)[0];
    return c && c.shape !== "auto" ? c.shape : "keepcase";
  }
  return STYLE_SHAPE[styleId] || "keepcase";
}

export interface PlayInfo { minutes: number; last: number } // minutes played in total, last played (unix seconds, 0 = never)

// never opened -> sealed; barely played -> mint; then light scuffs, worn, battered; long untouched -> sun-faded
export function playtimeWear(s: Settings, info: PlayInfo | null, nowSec?: number): WearId | null {
  if (!info) return null;
  const k = s.wearSpeed === "slow" ? 2 : s.wearSpeed === "fast" ? 0.5 : 1;
  if (info.minutes <= 0 && !info.last) return "sealed";
  const now = nowSec !== undefined ? nowSec : Date.now() / 1000;
  if (info.last && info.minutes >= 60 && now - info.last > 365 * 86400) return "faded";
  const h = info.minutes / 60;
  if (h < 1 * k) return "none";
  if (h < 10 * k) return "light";
  if (h < 50 * k) return "worn";
  return "battered";
}

export function resolveWear(s: Settings, appid: string | null, collections: string[], info?: PlayInfo | null): WearId {
  if (appid && s.gameWears[appid]) return s.gameWears[appid];        // a game's own wear wins over everything
  for (const c of collections) if (s.wears[c]) return s.wears[c];   // a collection's own wear always wins
  if (s.playWear) { const w = playtimeWear(s, info || null); if (w) return w; }
  return s.wear;
}

// Steam ids come in several shapes: small positive numbers, negative 32-bit numbers (non-Steam shortcuts) and
// 64-bit game ids. Everything is turned into one key: the unsigned 32-bit app id as a string.
export function normId(raw: string | number): string {
  try {
    const t = String(raw).trim();
    if (!/^-?\d+$/.test(t)) return "";
    if (t.replace("-", "").length > 10) return String(Number(BigInt(t) >> BigInt(32)) >>> 0);
    return String(Number(t) >>> 0);
  } catch (e) { return ""; }
}

// Every number in a picture address that could be a game id (path segments and file names like 123456789p.png).
export function srcCandidates(src: string): string[] {
  const out: string[] = [];
  if (!src) return out;
  const path = src.split(/[?#]/)[0];
  const re = /\/(-?\d{3,20})(?=[\/]|p?[._]|p?$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
  return out;
}

// React props of the cover's ancestors often hold the game's overview object.
export function fiberCandidates(el: HTMLElement | null): string[] {
  const out: string[] = [];
  if (!el) return out;
  try {
    const key = Object.keys(el).filter((k) => k.indexOf("__reactFiber$") === 0)[0];
    let f: any = key ? (el as any)[key] : null;
    const add = (v: any) => { if ((typeof v === "number" && isFinite(v) && v !== 0) || (typeof v === "string" && /^-?\d{3,20}$/.test(v))) { const t = String(v); if (out.indexOf(t) < 0) out.push(t); } };
    for (let i = 0; f && i < 16; i++, f = f.return) {
      const p = f.memoizedProps;
      if (!p || typeof p !== "object") continue;
      add(p.appid); add(p.nAppID); add(p.unAppID); add(p.gameid);
      for (const k of Object.keys(p)) {
        const v = p[k];
        if (v && typeof v === "object" && !Array.isArray(v) && (typeof v.appid === "number" || typeof v.appid === "string")) add(v.appid);
      }
    }
  } catch (e) { /* ignore */ }
  return out;
}

// ---------- CSS ----------

export function buildCss(s: Settings): string {
  const d = Math.round(s.depth);
  const T = s.speed === "calm" ? 0.8 : s.speed === "snappy" ? 0.28 : 0.5; // turn in / out time
  const EASE = "cubic-bezier(.22,.8,.26,1)";
  const A = s.angle;
  // the "pop" element is the cover's outer wrapper (Steam's focusable item) so Steam's own outline tilts together with the case
  const STATE = ":is(:hover, .gpfocus, .gpfocuswithin, :focus-within)";
  const HAS = ":has(.gpfocus)";
  // Steam's focusable item (marked data-sanso-focus) can sit above the pop element, e.g. when it also holds a reflection
  const FST = ":is(:hover, :focus, :focus-within, .gpfocus, .gpfocuswithin)";
  const P = "[data-sanso-pop][data-sanso-pop][data-sanso-pop][data-sanso-pop][data-sanso-pop]";
  const ACT = (inner: string, extra: string, st: string, desc: boolean) => `${P}${extra}${st}${inner}` + (desc ? `, .gpfocus ${P}${extra}${inner}, [data-sanso-focus]${FST} ${P}${extra}${inner}` : "");
  const ACTC = (inner: string, st: string, desc: boolean) => `[data-sanso-pop]${st} [data-sanso-case]${inner}, [data-sanso-case][data-sanso-pop]${st}${inner}` + (desc ? `, .gpfocus [data-sanso-case]${inner}, [data-sanso-focus]${FST} [data-sanso-case]${inner}` : "");
  const ANG = `var(--c3d-ang, ${A}deg)`; // per-cover tilt (wide items get less, see paint)
  // the move itself; "transform-style" and the small depth offsets switch back to flat only after the case has turned back
  const TR = `transform ${T}s ${EASE}, rotate ${T}s ${EASE}, translate ${T}s ${EASE}, scale ${T}s ${EASE}, box-shadow ${T}s ${EASE}, transform-origin ${T}s ${EASE}`;
  const XF = (dx: string, dy: string, ang: string) => `perspective(1600px) translate3d(${dx}, ${dy}, 16px) rotateY(${ang})`;
  const gloss = s.gloss
    ? `linear-gradient(112deg, rgba(255,255,255,.36) 0%, rgba(255,255,255,.10) 15%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 60%, rgba(255,255,255,.12) 72%, rgba(255,255,255,0) 73.5%),
       linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 22%),`
    : "";
  const band = s.band
    ? `linear-gradient(180deg, var(--c3d-band) 0, var(--c3d-band) 5.2%, rgba(0,0,0,.35) 5.2%, rgba(0,0,0,.35) calc(5.2% + 1px), transparent calc(5.2% + 1px)),`
    : "";
  const idleShadow = s.shadow ? `box-shadow: 4px 6px 9px rgba(0,0,0,.45) !important;` : "";
  const popShadow = s.shadow
    ? `box-shadow: ${Math.round(d * 1.1)}px ${Math.round(d * 1.5)}px 28px rgba(0,0,0,.65), ${Math.round(d * 0.3)}px ${Math.round(d * 0.4)}px 8px rgba(0,0,0,.4) !important;`
    : "";
  const imgIdle = s.shadow ? `box-shadow: calc(var(--c3d-d, ${d}px) * -.3) 0 0 0 var(--c3d-b), 4px 6px 9px rgba(0,0,0,.45) !important;` : `box-shadow: calc(var(--c3d-d, ${d}px) * -.3) 0 0 0 var(--c3d-b) !important;`;
  const imgPop = s.shadow
    ? `box-shadow: calc(var(--c3d-d, ${d}px) * -1) 0 0 0 var(--c3d-b), ${Math.round(d * 1.1)}px ${Math.round(d * 1.5)}px 28px rgba(0,0,0,.65) !important;`
    : `box-shadow: calc(var(--c3d-d, ${d}px) * -1) 0 0 0 var(--c3d-b) !important;`;
  const f = Math.min(1, Math.max(0.3, A / 32)); // keep the drift tiny and proportional
  const x = (v: number) => `${(v * f).toFixed(1)}px`;
  const floatKf = s.float
    ? `@keyframes sanso-drift {
  0%, 100% { translate: 0 0 -.4px; rotate: 0 1 0 0deg; }
  25% { translate: ${x(-1.5)} -1.5px -.4px; rotate: 0 1 0 ${(1.5 * f).toFixed(2)}deg; }
  50% { translate: 0 .5px -.4px; rotate: 0 1 0 0deg; }
  75% { translate: ${x(-1)} 1.5px -.4px; rotate: 0 1 0 ${(-1.2 * f).toFixed(2)}deg; }
}`
    : "";
  const shine = s.shine
    ? `
[data-sanso-faces] > [data-f="shine"] {
  top: 0; right: 0; bottom: 0; left: 0; transform: translateZ(2px); border-radius: var(--c3d-r, 2px);
  background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.6) 50%, transparent 62%) 160% 0 / 260% 100% no-repeat;
}
@keyframes sanso-shine { from { background-position: 160% 0; } to { background-position: -60% 0; } }`
    : `[data-sanso-faces] > [data-f="shine"] { display: none; }`;
  const active = (st: string, desc: boolean) => `
/* 3D only here: the game you are on gets the 3D setup at once; it keeps it until it has turned back (see the delays below) */
${ACT("", ":not(img)", st, desc)}, ${ACT(" [data-sanso-link]", "", st, desc)}, ${ACTC('[data-sanso-case="box"]', st, desc)} { transform-style: preserve-3d !important; }
${ACT("", "", st, desc)} { transition: ${TR}, transform-style 0s linear 0s !important; }
${ACT(" [data-sanso-link]", "", st, desc)}, ${ACTC('[data-sanso-case="box"]:not([data-sanso-pop])', st, desc)} { transition: box-shadow ${T}s ${EASE}, transform-style 0s linear 0s, translate 0s linear 0s !important; }
${ACT(" *", "", st, desc)} { mix-blend-mode: normal !important; }
${ACTC('[data-sanso-case="box"] > img', st, desc)} { translate: 0 0 .6px; transition: filter ${T}s ${EASE}, translate 0s linear 0s; }
${ACTC('[data-sanso-case="box"]:not([data-sanso-pop])', st, desc)} { translate: 0 0 -.4px; }
${ACT(' > :not([data-sanso-case]):not([data-sanso-link]):not([data-sanso-faces]):not([data-sanso-tpl]):not(img)', "", st, desc)} { translate: 0 0 1.4px; transition: translate 0s linear 0s; }
${ACTC('[data-sanso-case="box"]::after', st, desc)} { transform: translateZ(1px); transition: transform 0s linear 0s; }
${ACTC('[data-sanso-case="box"] > [data-sanso-tpl]', st, desc)} { transform: translateZ(.8px); transition: transform 0s linear 0s; }
${ACT("", ":not([data-sanso-own])", st, desc)} { rotate: 0 1 0 ${ANG}; translate: 0 8px 16px; transform-origin: 100% 50% !important; z-index: 12; opacity: 1 !important; }
${ACT("", "[data-sanso-own]", st, desc)} { transform: ${XF("0px", "8px", ANG)}; transform-origin: 100% 50% !important; z-index: 12; opacity: 1 !important; }
${ACT("", "", st, desc)}, ${ACT(" *", "", st, desc)}${desc ? `, [data-sanso-focus]${FST}, [data-sanso-focus]${FST} *` : ""} { -webkit-box-reflect: initial !important; }
${ACTC('[data-sanso-case="box"]:not([data-sanso-pop])', st, desc)} { box-shadow: none !important; }
${ACT("", ":not(img)", st, desc)} { ${popShadow} }
${s.float ? `${ACTC(":not([data-sanso-pop])", st, desc)} { animation: sanso-drift 6s ease-in-out ${(T + 0.05).toFixed(2)}s 2; }` : ""}
${ACTC('[data-sanso-case="box"] > img', st, desc)} { filter: brightness(1); }
${ACTC('[data-sanso-case="box"]', st, desc)}, ${ACT(" [data-sanso-link]", "", st, desc)} { opacity: 1 !important; }
${ACTC('[data-sanso-case="img"]', st, desc)} { ${imgPop} }
${ACTC(" > [data-sanso-faces]", st, desc)} { display: block; transition-delay: 0s; }
${desc ? `/* Steam's outline sits on a bigger item that does not tilt (Home): hide it and draw one on the case instead */
[data-sanso-focus]${FST} { outline-color: transparent !important; }
[data-sanso-focus]${FST} [class*="FocusRing"] { opacity: 0 !important; }
[data-sanso-focus]:is(:focus, :focus-within, .gpfocus, .gpfocuswithin) [data-sanso-case] > [data-sanso-faces] > [data-f="front"] { outline: 3px solid rgba(255,255,255,.9); outline-offset: 3px; border-radius: calc(var(--c3d-r, 2px) + 2px); }` : ""}
${s.shine ? `${ACTC(' > [data-sanso-faces] > [data-f="shine"]', st, desc)} { animation: sanso-shine 1.1s ease-out .15s 1 both; }` : ""}`;
  const PICK = (ang: number, z: number, dy: number) => `perspective(1600px) translate3d(0, ${dy}px, ${z}px) rotateY(${ang === A ? ANG : ang + "deg"})`;
  const pick = s.pickup ? `
@keyframes sanso-pick { 0% { transform: ${PICK(A, 16, 8)}; } 45% { transform: ${PICK(Math.round(A * 0.35), 70, -4)}; } 100% { transform: ${PICK(A, 16, 8)}; } }
@keyframes sanso-pick-i { 0% { rotate: 0 1 0 ${ANG}; translate: 0 8px 16px; } 45% { rotate: 0 1 0 ${Math.round(A * 0.35)}deg; translate: 0 -4px 70px; } 100% { rotate: 0 1 0 ${ANG}; translate: 0 8px 16px; } }
${P}[data-sanso-pick][data-sanso-own] { animation: sanso-pick .42s cubic-bezier(.3,.7,.3,1) both; z-index: 20 !important; }
${P}[data-sanso-pick]:not([data-sanso-own]) { animation: sanso-pick-i .42s cubic-bezier(.3,.7,.3,1) both; z-index: 20 !important; }` : "";
  const LEAN = 9;
  const NB = (sel: string, left: boolean) => `${sel} ${P}[data-sanso-own] { transform: perspective(1600px) translateZ(-6px) rotateY(${left ? LEAN : -LEAN}deg); transform-origin: ${left ? "0% 50%" : "100% 50%"} !important; }
${sel} ${P}:not([data-sanso-own]) { rotate: 0 1 0 ${left ? LEAN : -LEAN}deg; translate: 0 0 -6px; transform-origin: ${left ? "0% 50%" : "100% 50%"} !important; }`;
  const neighbors = s.neighbors ? `
/* the games beside the one you are on lean away, like on a shelf */
${NB("[data-sanso-cell]:hover + [data-sanso-cell]", false)}
${NB("[data-sanso-cell]:has(+ [data-sanso-cell]:hover)", true)}
${NB("[data-sanso-cell]:has(.gpfocus, :focus) + [data-sanso-cell]", false)}
${NB("[data-sanso-cell]:has(+ [data-sanso-cell] :is(.gpfocus, :focus))", true)}
${NB("[data-sanso-cell]:is(.gpfocus, :focus) + [data-sanso-cell]", false)}
${NB("[data-sanso-cell]:has(+ [data-sanso-cell]:is(.gpfocus, :focus))", true)}` : "";
  return `
${floatKf}
/* Steam's own perspective on a parent magnifies the tilted case (a strong one made it twice its size and blocky): use ours */
[data-sanso-stage="big"], [data-sanso-persp] { perspective: 1600px !important; perspective-origin: 50% 50% !important; }
[data-sanso-stage="small"] { perspective: 1100px !important; perspective-origin: 50% -30% !important; }
[data-sanso-stage="own"] { perspective: none !important; }
/* Resting covers are flat (no 3D, no extra GPU layers): the case look is plain 2D paint. Only the game you are on is
   3D, and it stays 3D until it has turned back (the transform-style and depth offsets switch back after ${T}s). */
[data-sanso-pop] { transform-origin: 100% 50% !important; transition: ${TR}, transform-style 0s linear ${T}s !important; transition-behavior: allow-discrete !important; }
[data-sanso-link], [data-sanso-case="box"]:not([data-sanso-pop]) { transition: box-shadow ${T}s ${EASE}, transform-style 0s linear ${T}s, translate 0s linear ${T}s !important; transition-behavior: allow-discrete !important; }
[data-sanso-pop]:not(img), [data-sanso-link], [data-sanso-case="box"] {
  overflow: visible !important;
  filter: none !important; -webkit-filter: none !important; clip-path: none !important; mask: none !important; -webkit-mask: none !important;
  contain: none !important; mix-blend-mode: normal !important; content-visibility: visible !important; will-change: auto !important; backdrop-filter: none !important;
}
[data-sanso-pop]:not([data-sanso-case="box"])::after, [data-sanso-pop]:not([data-sanso-case="box"])::before { display: none !important; } /* (when the item is the case itself, its own overlays stay) */
[data-sanso-case="box"][data-sanso-pop] { transition: ${TR}, transform-style 0s linear ${T}s !important; transition-behavior: allow-discrete !important; }
[data-sanso-case="box"] > img { filter: brightness(.9); transition: filter ${T}s ${EASE}, translate 0s linear ${T}s; }
/* In 3D (see the active rules) nothing may lie in the same plane as the cover picture: equal depth makes the GPU flicker.
   The picture and Steam's badges are lifted a hair, the case sits a hair behind its Steam item. Flat at rest. */
[data-sanso-pop] > :not([data-sanso-case]):not([data-sanso-link]):not([data-sanso-faces]):not([data-sanso-tpl]):not(img) { transition: translate 0s linear ${T}s; }
[data-sanso-pop][data-sanso-pstatic] { position: relative !important; }
[data-sanso-pop]:not(img) { border-radius: calc(var(--c3d-r, 2px) + 1px) !important; }
[data-sanso-case="box"] { border-radius: var(--c3d-r, 2px); ${idleShadow} }
[data-sanso-case="box"] img { border-radius: var(--c3d-r, 2px); }
[data-sanso-case="box"][data-sanso-static] { position: relative !important; }
img[data-sanso-case="img"] { border-radius: var(--c3d-r, 2px); ${imgIdle} }

/* resting cover: one flat overlay, no extra elements */
[data-sanso-case="box"]::after {
  content: ""; position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; z-index: 1;
  border-radius: var(--c3d-r, 2px); transition: transform 0s linear ${T}s;
  background:
    var(--c3d-wear, linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))),
    ${gloss}
    ${band}
    ${s.sleeve ? `linear-gradient(90deg, transparent 3.2%, rgba(255,255,255,.34) 3.2%, rgba(255,255,255,.34) 3.9%, rgba(0,0,0,.30) 3.9%, rgba(0,0,0,.30) 5%, rgba(255,255,255,.06) 5%, transparent 9%),
    linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0) 1.6%, rgba(255,255,255,0) 98.4%, rgba(0,0,0,.25)),` : ""}
    linear-gradient(90deg, rgba(0,0,0,.42) 0, rgba(255,255,255,.22) 1.5%, rgba(0,0,0,.16) 3.2%, rgba(0,0,0,0) 7.5%);
  box-shadow: inset 0 0 0 1px var(--c3d-line), inset 0 0 0 var(--c3d-rim, 0px) rgba(255,255,255,.5), inset 0 0 0 3px rgba(0,0,0,.18)${s.sleeve ? ", inset 0 0 0 4px rgba(255,255,255,.10), inset 0 0 0 5px rgba(0,0,0,.16)" : ""};
}

/* real 3D box: exists in the page but is not drawn until you hover or focus the game */
[data-sanso-faces] { display: none; transition-property: display; transition-duration: 0s; transition-delay: ${T}s; transition-behavior: allow-discrete; position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; transform-style: preserve-3d; z-index: 3; }
[data-sanso-faces] > div { position: absolute; box-sizing: border-box; }
[data-sanso-faces] > [data-f="front"] { top: 0; right: 0; bottom: 0; left: 0; transform: translateZ(1px); border-radius: var(--c3d-r, 2px); }
[data-sanso-faces] > [data-f="spine"] {
  top: 0; bottom: 0; left: 0; width: var(--c3d-d, ${d}px); min-width: 12px; transform-origin: left center; transform: rotateY(90deg);
  background:
    linear-gradient(180deg, var(--c3d-band) 0, var(--c3d-band) 5.2%, rgba(0,0,0,.35) 5.2%, rgba(0,0,0,.35) calc(5.2% + 1px), transparent calc(5.2% + 1px)),
    linear-gradient(90deg, var(--c3d-a), var(--c3d-b));
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
[data-sanso-faces] > [data-f="spine"] > span {
  writing-mode: vertical-rl; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-height: 86%; margin-top: 8%; font-weight: 800; font-family: sans-serif; line-height: 1; font-size: max(9px, calc(var(--c3d-d, ${d}px) * .8)); color: var(--c3d-text);
  transform: scaleX(-1); letter-spacing: .05em; text-shadow: 0 0 2px rgba(0,0,0,.75), 0 1px 1px rgba(0,0,0,.6);
}
[data-sanso-faces] > [data-f="top"] { top: 0; left: 0; right: 0; height: var(--c3d-d, ${d}px); transform-origin: center top; transform: rotateX(-90deg); background: linear-gradient(0deg, var(--c3d-b), var(--c3d-a)); }
[data-sanso-faces] > [data-f="bottom"] { bottom: 0; left: 0; right: 0; height: var(--c3d-d, ${d}px); transform-origin: center bottom; transform: rotateX(90deg); background: linear-gradient(180deg, var(--c3d-b), #000); }
[data-sanso-faces] > [data-f="right"] { top: 0; bottom: 0; right: 0; width: var(--c3d-d, ${d}px); transform-origin: right center; transform: rotateY(-90deg); background: linear-gradient(270deg, var(--c3d-b), var(--c3d-a)); }
[data-sanso-faces] > [data-f="back"] { top: 0; right: 0; bottom: 0; left: 0; transform: translateZ(calc(var(--c3d-d, ${d}px) * -1)) rotateY(180deg); backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--c3d-b); }
${shine}

/* the game you are on: bigger tilt, lifts toward you, full box appears */
${active(STATE, true)}
@supports selector(:has(*)) {
${neighbors}
${active(HAS, false)}
}
${pick}
${tplCss()}
/* a game is running: nothing of ours animates */
[data-sanso-sleep] [data-sanso-pop], [data-sanso-sleep] [data-sanso-pop] *, [data-sanso-sleep] [data-sanso-case]::after { animation-play-state: paused !important; }
`;
}

// ---------- tagging ----------

export interface Provider {
  getDocs: () => Document[];
  appName: (key: string) => string;
  collectionsOf: (key: string) => string[];
  collectionName: (id: string) => string;
  /** candidate numbers from a cover -> the game's key (unsigned app id) if the game list knows it */
  resolveId: (candidates: string[]) => string | null;
  /** game name -> key, only when exactly one game has that name */
  byName: (name: string) => string | null;
  /** playtime of a game (null when unknown) */
  playInfo: (key: string) => PlayInfo | null;
  /** the game's portrait cover art addresses, best first (optional) */
  artUrls?: (key: string) => string[];
}

// Cover test with no layout reads: portrait artwork (about 2:3, tolerant of 3:4) that is big enough for a capsule.
export function isPortraitCover(img: HTMLImageElement): boolean {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h || w < 100) return false;
  const r = h / w;
  return r >= 1.28 && r <= 1.75;
}

export type IdSource = "src" | "fiber" | "name" | "raw" | "none";

// Several independent ways to find out which game a cover belongs to (works for Steam and non-Steam games).
export function resolveAppId(img: HTMLImageElement, prov: Provider): { key: string | null; how: IdSource } {
  const c1 = srcCandidates(img.currentSrc || img.src || "");
  let k = c1.length ? prov.resolveId(c1) : null;
  if (k) return { key: k, how: "src" };
  const c2 = fiberCandidates(img).concat(fiberCandidates(img.parentElement));
  k = c2.length ? prov.resolveId(c2) : null;
  if (k) return { key: k, how: "fiber" };
  const nm = (img.alt || img.getAttribute("aria-label") || (img.parentElement && img.parentElement.getAttribute("aria-label")) || "").trim();
  if (nm) { k = prov.byName(nm); if (k) return { key: k, how: "name" }; }
  // not in the game list: keep a stable key from the picture address so the cover still gets one consistent look
  const raw = c1[0] || c2[0];
  if (raw) { const n = normId(raw); if (n) return { key: n, how: "raw" }; }
  return { key: null, how: "none" };
}

function setVars(el: HTMLElement, p: Pal, id: string, depthPx: number, radius: number, rim: number, wear: WearId): void {
  el.style.setProperty("--c3d-a", p.a);
  el.style.setProperty("--c3d-b", p.b);
  el.style.setProperty("--c3d-band", p.band);
  el.style.setProperty("--c3d-text", p.text);
  el.style.setProperty("--c3d-line", p.line);
  el.style.setProperty("--c3d-d", `${depthPx}px`);
  el.style.setProperty("--c3d-r", `${radius}px`);
  el.style.setProperty("--c3d-rim", `${rim}px`);
  el.style.setProperty("--c3d-wear", WEAR_CSS[wear]);
  el.setAttribute("data-sanso-style", id);
  el.setAttribute("data-sanso-wear", wear);
}

const VAR_NAMES = ["--c3d-a", "--c3d-b", "--c3d-band", "--c3d-text", "--c3d-line", "--c3d-d", "--c3d-r", "--c3d-rim", "--c3d-wear"];

function clearVars(el: HTMLElement): void {
  VAR_NAMES.forEach((v) => el.style.removeProperty(v));
  el.removeAttribute("data-sanso-style");
  el.removeAttribute("data-sanso-wear");
}

function ensureFaces(doc: Document, box: HTMLElement, title: string): void {
  let faces = box.querySelector(":scope > [data-sanso-faces]") as HTMLElement | null;
  if (!faces) {
    faces = doc.createElement("div");
    faces.setAttribute("data-sanso-faces", "1");
    box.appendChild(faces);
  }
  ["back", "bottom", "top", "right", "spine", "front", "shine"].forEach((f) => {
    if (faces!.querySelector(`:scope > [data-f="${f}"]`)) return;
    const c = doc.createElement("div");
    c.setAttribute("data-f", f);
    if (f === "spine") c.appendChild(doc.createElement("span"));
    faces!.appendChild(c);
  });
  const span = faces.querySelector("[data-f=spine] > span") as HTMLElement | null;
  if (span && span.textContent !== title) span.textContent = title;
}

function untag(el: HTMLElement): void {
  if (!el.hasAttribute("data-sanso-case")) return;
  el.removeAttribute("data-sanso-case");
  el.removeAttribute("data-sanso-static");
  el.removeAttribute("data-sanso-app");
  clearVars(el);
  const faces = el.querySelector(":scope > [data-sanso-faces]");
  if (faces) faces.remove();
  const tl = el.querySelector(":scope > [data-sanso-tpl]");
  if (tl) tl.remove();
  let e: HTMLElement | null = el;
  for (let i = 0; e && i < 8; i++, e = e.parentElement) {
    if (e.hasAttribute("data-sanso-pop")) {
      e.removeAttribute("data-sanso-pop"); e.removeAttribute("data-sanso-pstatic"); e.removeAttribute("data-sanso-own");
      const st = e.parentElement;
      if (st) st.removeAttribute("data-sanso-stage");
      let q: HTMLElement | null = st;
      for (let j = 0; q && j < 6; j++, q = q.parentElement) { q.removeAttribute("data-sanso-focus"); q.removeAttribute("data-sanso-cell"); }
      e.removeAttribute("data-sanso-cell"); e.removeAttribute("data-sanso-pick"); e.style.removeProperty("--c3d-r");
      break;
    }
    e.removeAttribute("data-sanso-link");
  }
}

export function clearAll(doc: Document): void {
  doc.querySelectorAll("[data-sanso-faces],[data-sanso-tpl]").forEach((el) => el.remove());
  doc.querySelectorAll("[data-sanso-case],[data-sanso-pop],[data-sanso-link],[data-sanso-focus],[data-sanso-cell],[data-sanso-pick],[data-sanso-stage],[data-sanso-persp],[data-sanso-static],[data-sanso-style],[data-sanso-app]").forEach((el) => {
    const h = el as HTMLElement;
    ["data-sanso-case", "data-sanso-stage", "data-sanso-static", "data-sanso-app", "data-sanso-pop", "data-sanso-pstatic", "data-sanso-own", "data-sanso-link", "data-sanso-focus", "data-sanso-cell", "data-sanso-pick", "data-sanso-persp"].forEach((a) => h.removeAttribute(a));
    clearVars(h);
  });
  const st = doc.getElementById(STYLE_ID);
  if (st) st.remove();
}

function ensureStyle(doc: Document, css: string): void {
  let st = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!st) {
    st = doc.createElement("style");
    st.id = STYLE_ID;
    (doc.head || doc.documentElement).appendChild(st);
  }
  if (st.textContent !== css) st.textContent = css;
}

// Home recent games and the game page are "other screens"; they only get cases when that option is on.
export function screenPath(doc: Document): string {
  try { return (doc.defaultView && doc.defaultView.location && doc.defaultView.location.pathname) || ""; } catch (e) { return ""; }
}
export function screenAllowed(doc: Document, s: Settings): boolean {
  if (s.otherScreens) return true;
  const p = screenPath(doc);
  if (/\/library\/home\b/.test(p) || /\/library\/app\/\d/.test(p)) return false;
  return true; // unknown paths count as the library grid
}

// ---------- engine: event driven, incremental, time-sliced ----------

interface Tracked {
  img: HTMLImageElement; target: HTMLElement; mode: "box" | "img"; appid: string | null; how: IdSource; sig?: string; w?: number; pop?: HTMLElement;
}

// Steam draws extra copies of a cover: a blurred glow behind the focused game, reflections on Home.
// Those copies must stay as Steam draws them, so they are never turned into cases.
const DECOY_CLASS = /Glow|Reflect|Blur|BackgroundImage/i;
export function isDecoy(img: HTMLImageElement, view: Window | null): boolean {
  let e: Element | null = img;
  for (let i = 0; e && i < 5; i++, e = e.parentElement) {
    const cls = typeof (e as HTMLElement).className === "string" ? (e as HTMLElement).className : "";
    if (cls && DECOY_CLASS.test(cls)) return true;
    if (view && i < 4) {
      const cs = view.getComputedStyle(e);
      const bl = cs.filter ? /blur\(([\d.]+)px\)/.exec(cs.filter) : null;
      if (bl && parseFloat(bl[1]) >= 25) return true;
      if (i > 0 && cs.position === "absolute" && parseInt(cs.zIndex, 10) <= -10) return true; // a layer drawn behind the item
      const m = cs.transform && cs.transform !== "none" ? /matrix(3d)?\(([^)]+)\)/.exec(cs.transform) : null;
      if (m) { const n = m[2].split(",").map(parseFloat); if ((m[1] ? n[5] : n[3]) < 0) return true; } // flipped upside down
    }
  }
  return false;
}

// Steam draws a second copy of the same cover inside the same tile (the glow behind it, a reflection). Since Steam started
// scrambling its class names the names no longer tell them apart, and the copy was tilted and un-blurred too: a huge,
// blocky ghost around the focused cover. They are found by structure instead: same picture, same tile.
function coverTwin(img: HTMLImageElement): { twin: HTMLImageElement; common: Element } | null {
  const src = img.currentSrc || img.src;
  if (!src) return null;
  let p: Element | null = img.parentElement;
  for (let i = 0; p && i < 7; i++, p = p.parentElement) {
    const list = p.getElementsByTagName("img");
    if (list.length > 6) return null; // reached a row of games: no twin in this game's own box
    for (let j = 0; j < list.length; j++) {
      const o = list[j];
      if (o !== img && (o.currentSrc || o.src) === src) return { twin: o, common: p };
    }
  }
  return null;
}
const FOCUSABLE = /(^|\s)Focusable(\s|$)/;
// is there a Steam focus target (the thing you actually move onto) between the picture and `anc`?
function inFocusTarget(el: Element, anc: Element): boolean {
  for (let e: Element | null = el.parentElement; e && e !== anc; e = e.parentElement) {
    if (FOCUSABLE.test(typeof (e as HTMLElement).className === "string" ? (e as HTMLElement).className : "") || e.hasAttribute("tabindex")) return true;
  }
  return false;
}
/** True when `img` is the extra copy of a cover (Steam's glow / reflection), not the cover itself. */
export function isTwinDecoy(img: HTMLImageElement): boolean {
  const t = coverTwin(img);
  if (!t) return false;
  // Home (Steam Deck client 2026): the real cover sits inside the focus target (a role=link Focusable); the copy is a
  // sibling box next to it, outside any focus target
  const fa = inFocusTarget(img, t.common), fb = inFocusTarget(t.twin, t.common);
  if (fa !== fb) return !fa;
  // otherwise: the copy that spreads beyond the cover is the glow
  const wa = img.offsetWidth * img.offsetHeight, wb = t.twin.offsetWidth * t.twin.offsetHeight;
  if (wa > wb * 1.15) return true;
  return false; // can't tell them apart: keep both rather than lose the real cover
}

// what would make the browser draw the case flat (no spine / top)
export function flattenReasons(el: HTMLElement): string[] {
  const out: string[] = [];
  try {
    const v = el.ownerDocument.defaultView as Window;
    let e: HTMLElement | null = el;
    let stage: HTMLElement | null = null;
    for (let i = 0; e && i < 8; i++, e = e.parentElement) {
      const cs = v.getComputedStyle(e);
      const nm = e === el ? "case" : "wrapper";
      if (cs.transformStyle !== "preserve-3d") out.push(`${nm} transform-style=${cs.transformStyle}`);
      if (cs.filter && cs.filter !== "none") out.push(`${nm} filter`);
      if (cs.clipPath && cs.clipPath !== "none") out.push(`${nm} clip-path`);
      if (cs.overflow && cs.overflow !== "visible") out.push(`${nm} overflow=${cs.overflow}`);
      if (cs.mixBlendMode && cs.mixBlendMode !== "normal") out.push(`${nm} blend`);
      if (cs.contain && cs.contain !== "none") out.push(`${nm} contain=${cs.contain}`);
      if (e.hasAttribute("data-sanso-pop")) {
        const pa = v.getComputedStyle(e, "::after"), pb = v.getComputedStyle(e, "::before");
        if ((pa.content !== "none" && pa.display !== "none" && pa.mixBlendMode !== "normal") || (pb.content !== "none" && pb.display !== "none" && pb.mixBlendMode !== "normal")) out.push("item overlay blend mode");
        stage = e.parentElement; break;
      }
    }
    if (stage && stage.getAttribute("data-sanso-stage") === "small" && !(v.getComputedStyle(stage).perspective !== "none")) out.push("stage has no perspective");
  } catch (err) { out.push("could not read"); }
  return out;
}

// Other style sheets (themes, other plugins) that also change the cover: names and the properties they set.
const WATCH_PROPS = ["transform", "rotate", "translate", "scale", "perspective", "-webkit-box-reflect", "filter", "mix-blend-mode", "opacity", "transform-style"];
export function themeScan(doc: Document, focusEl: HTMLElement | null): { others: string[]; conflicts: string[] } {
  const others: string[] = [];
  const conflicts: string[] = [];
  const els: Element[] = [];
  if (focusEl) {
    let e: Element | null = focusEl;
    for (let i = 0; e && i < 3; i++, e = e.parentElement) els.push(e);
    const kids = focusEl.querySelectorAll("*");
    for (let i = 0; i < kids.length && i < 40; i++) if (!kids[i].hasAttribute("data-f") && !kids[i].hasAttribute("data-sanso-faces")) els.push(kids[i]);
  }
  const sheets = Array.from(doc.styleSheets);
  sheets.forEach((sh, idx) => {
    const node = sh.ownerNode as HTMLElement | null;
    if (!node || node.id === STYLE_ID) return;
    const href = (sh as CSSStyleSheet).href || "";
    if (href && /\/css\/|steamloopback|steamstatic/.test(href)) return; // Steam's own
    let rules: CSSRuleList | null = null;
    try { rules = (sh as CSSStyleSheet).cssRules; } catch (e) { rules = null; }
    if (!rules || rules.length === 0) return;
    const name = node.id || (node.getAttribute && (node.getAttribute("data-theme") || node.getAttribute("data-name"))) || (href ? href.split("/").slice(-2).join("/") : `style #${idx + 1}`);
    others.push(`${name} (${rules.length} rules)`);
    if (!els.length) return;
    const props = new Set<string>();
    const walk = (list: CSSRuleList, depth: number) => {
      for (let i = 0; i < list.length && i < 4000; i++) {
        const r: any = list[i];
        if (r.cssRules && depth < 3 && !r.selectorText) { walk(r.cssRules, depth + 1); continue; }
        if (!r.selectorText || !r.style) continue;
        const touched = WATCH_PROPS.filter((pr) => r.style.getPropertyValue(pr));
        if (!touched.length) continue;
        let hit = false;
        try { hit = els.some((el) => el.matches(r.selectorText)); } catch (e) { hit = false; }
        if (hit) touched.forEach((pr: string) => props.add(pr));
      }
    };
    walk(rules, 0);
    if (props.size) conflicts.push(`${name}: ${Array.from(props).join(", ")}`);
  });
  return { others, conflicts };
}

export interface CheckLine { status: "ok" | "fail" | "warn" | "skip"; label: string; detail: string }

export interface Stats { batches: number; imagesChecked: number; mutationCalls: number; ms: number }

export const OWNER_ATTR = "data-sanso-owner";
const BATCH = 24;          // images per slice
const DISCOVER_MS = 3000;  // cheap check for new/closed Steam windows and screen changes (no page scan)

export interface Look { style: StyleId; pal: Pal; shapeId: ShapeId; shape: { depth: number; radius: number; rim: number }; depthPx: number; wear: WearId }

// everything that decides how one game's case looks
export function lookFor(s: Settings, prov: Provider, appid: string | null): Look {
  const colls = appid ? prov.collectionsOf(appid) : [];
  const style = resolveStyle(s, appid, colls, prov.collectionName);
  const shapeId = shapeFor(s, style);
  const base = SHAPES[shapeId];
  // with the sleeve, real keepcase corners: rounder plastic, the jewel case stays sharp
  const shape = s.sleeve ? { ...base, radius: SLEEVE_R[shapeId] } : base;
  const info = s.playWear && appid ? prov.playInfo(appid) : null;
  return { style, pal: paletteFor(s, style), shapeId, shape, depthPx: Math.max(3, Math.round(s.depth * shape.depth)), wear: resolveWear(s, appid, colls, info) };
}

class DocWatch {
  doc: Document;
  obs: MutationObserver;
  queue = new Set<HTMLImageElement>();
  tracked = new Map<HTMLImageElement, Tracked>();
  decoys = new Set<HTMLImageElement>();
  timer: any = null;
  lastOk: boolean | null = null;
  onLoad: (e: Event) => void;
  onPick: (e: Event) => void;
  onVis: () => void;
  constructor(doc: Document, public eng: Engine) {
    this.doc = doc;
    this.obs = new MutationObserver((recs) => this.onMutations(recs));
    this.onLoad = (e: Event) => {
      const t = e.target as any;
      if (t && t.tagName === "IMG") this.enqueue(t);
    };
    this.onVis = () => { if (!doc.hidden) this.schedule(); };
    this.observe();
    // pick-up: Steam sends "vgp_onok" to the focused game when A is pressed (captured before Steam handles it)
    this.onPick = (e: Event) => {
      try {
        if (!this.eng.settings.pickup || !this.eng.settings.enabled) return;
        const tg = e.target as HTMLElement | null;
        if (!tg || typeof tg.closest !== "function") return;
        let pop = tg.closest("[data-sanso-pop]") as HTMLElement | null;
        if (!pop) { const f = tg.closest("[data-sanso-focus]"); if (f) pop = f.querySelector("[data-sanso-pop]"); }
        if (!pop) return;
        const el = pop;
        el.removeAttribute("data-sanso-pick");
        requestAnimationFrame(() => {
          el.setAttribute("data-sanso-pick", "1");
          setTimeout(() => el.removeAttribute("data-sanso-pick"), 460);
        });
      } catch (err) { /* never block Steam */ }
    };
    doc.addEventListener("vgp_onok", this.onPick, true);
    doc.addEventListener("click", this.onPick, true);
    doc.addEventListener("load", this.onLoad, true);
    doc.addEventListener("visibilitychange", this.onVis);
  }
  observe(): void {
    if (this.eng.sleeping) return; // a game is running: Steam's pages are not watched
    if (this.doc.body) this.obs.observe(this.doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }
  onMutations(recs: MutationRecord[]): void {
    this.eng.stats.mutationCalls++;
    for (const r of recs) {
      if (r.type === "attributes") {
        const t = r.target as any;
        if (t.tagName === "IMG") this.enqueue(t);
        continue;
      }
      r.addedNodes.forEach((n: Node) => {
        if (n.nodeType !== 1) return;
        const el = n as Element;
        if (el.tagName === "IMG") this.enqueue(el as HTMLImageElement);
        else if (el.firstElementChild) {
          const list = el.getElementsByTagName("img");
          for (let i = 0; i < list.length; i++) this.enqueue(list[i]);
        }
      });
    }
  }
  enqueue(img: HTMLImageElement): void {
    this.queue.add(img);
    this.schedule();
  }
  scanAll(): void {
    const list = this.doc.getElementsByTagName("img");
    for (let i = 0; i < list.length; i++) this.queue.add(list[i]);
    this.schedule();
  }
  // cheap: looks at the address only; scans the page again only when the screen changes between allowed / not allowed
  checkPath(force?: boolean): void {
    const ok = screenAllowed(this.doc, this.eng.settings);
    if (!force && ok === this.lastOk) return;
    const first = this.lastOk === null;
    this.lastOk = ok;
    if (ok && !first && this.eng.settings.playWear) this.restyle();
    if (ok) this.scanAll();
    else this.untagAll();
  }
  untagAll(): void {
    this.obs.disconnect();
    try {
      this.tracked.forEach((tr) => untag(tr.target));
      this.tracked.clear();
      this.queue.clear();
      this.obs.takeRecords();
    } finally { this.observe(); }
  }
  schedule(): void {
    if (this.eng.sleeping) return;
    if (this.timer || this.queue.size === 0 || this.doc.hidden) return;
    this.timer = setTimeout(() => { this.timer = null; this.run(); }, 60);
  }
  run(): void {
    const t0 = performance.now();
    this.obs.disconnect();
    try {
      const batch: HTMLImageElement[] = [];
      for (const img of this.queue) {
        this.queue.delete(img);
        batch.push(img);
        if (batch.length >= BATCH) break;
      }
      this.process(batch);
      this.obs.takeRecords();
    } catch (e) {
      this.eng.noteError(e);
    } finally {
      this.observe();
    }
    this.eng.stats.batches++;
    this.eng.stats.ms += performance.now() - t0;
    if (this.queue.size) this.schedule();
  }
  // phase 1 reads layout once per NEW cover, phase 2 writes (no read/write interleaving)
  process(batch: HTMLImageElement[]): void {
    const s = this.eng.settings;
    const view = this.doc.defaultView;
    const allowed = screenAllowed(this.doc, s);
    const fresh: { img: HTMLImageElement; mode: "box" | "img"; makeStatic: boolean; lift: number; big: boolean; popStatic: boolean; own: boolean; w: number; flift: number; clift: number }[] = [];
    const body = this.doc.body;
    for (const img of batch) {
      this.eng.stats.imagesChecked++;
      const old = this.tracked.get(img);
      if (!s.enabled || !allowed || !img.isConnected || !isPortraitCover(img) || (!old && (isDecoy(img, view) || isTwinDecoy(img)))) {
        if (!old && img.isConnected && isPortraitCover(img)) this.decoys.add(img);
        if (old) { untag(old.target); this.tracked.delete(img); }
        continue;
      }
      if (old) {
        // the same <img> may have been reused for another game (virtual lists): re-read its id
        const r = resolveAppId(img, this.eng.prov);
        if (r.key !== old.appid) { old.appid = r.key; old.how = r.how; if (r.key) old.target.setAttribute("data-sanso-app", r.key); this.paint(old); }
        else if (old.mode === "box" && old.target.hasAttribute("data-sanso-style")) this.syncTemplate(old, old.target.getAttribute("data-sanso-style") || "");
        continue;
      }
      // the extra copy of this cover in the same tile: never part of the case, and if it was tagged before the real
      // cover showed up, it is released again
      let decoy: HTMLElement | null = null;
      { const t = coverTwin(img);
        if (t && isTwinDecoy(t.twin)) {
          decoy = t.twin;
          const tt = this.tracked.get(t.twin);
          if (tt) { untag(tt.target); this.tracked.delete(t.twin); this.decoys.add(t.twin); }
        } }
      const parent = img.parentElement;
      let mode: "box" | "img" = "img";
      let makeStatic = false;
      if (parent && parent !== this.doc.body && parent.getElementsByTagName("img").length <= 4) {
        const pr = parent.getBoundingClientRect(), ir = img.getBoundingClientRect();
        if (Math.abs(pr.width - ir.width) < 6 && Math.abs(pr.height - ir.height) < 6) {
          mode = "box";
          makeStatic = !!view && view.getComputedStyle(parent).position === "static";
        }
      }
      // the pop element: the cover's focusable outer wrapper (so Steam's focus outline moves with the case)
      const base: HTMLElement = mode === "box" ? (parent as HTMLElement) : img;
      let pop: HTMLElement = base, lift = 0;
      try {
        const br = base.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
          const p: HTMLElement | null = pop.parentElement;
          if (!p || p === body || p === this.doc.documentElement) break;
          if (p.getElementsByTagName("img").length > 4) break;
          if (decoy && p.contains(decoy)) break; // the glow copy must not tilt with the case
          const cls = typeof p.className === "string" ? p.className : "";
          const focusable = /(^|\s)Focusable(\s|$)|(^|\s)gpfocus/.test(cls);
          const pr = p.getBoundingClientRect();
          const near = pr.width <= br.width + 48 && pr.height <= br.height + 64 && pr.width >= br.width - 2;
          if (focusable) { if (pr.width <= br.width * 1.5 + 60 && pr.height <= br.height * 1.5 + 80) { pop = p; lift++; } break; }
          if (!near) break;
          pop = p; lift++;
        }
      } catch (e) { /* keep the cover itself */ }
      // Steam's focusable item above the pop element (if any): it gets the focus class, the case reacts to it
      let flift = 0;
      if (!/(^|\s)Focusable(\s|$)/.test(typeof pop.className === "string" ? pop.className : "")) {
        let q: HTMLElement | null = pop.parentElement;
        for (let i = 1; q && q !== body && i <= 6; i++, q = q.parentElement) {
          if (q.getElementsByTagName("img").length > 6) break;
          const c = typeof q.className === "string" ? q.className : "";
          if (/(^|\s)Focusable(\s|$)/.test(c) || q.hasAttribute("tabindex")) { flift = i; break; }
        }
      }
      // the grid cell (outermost wrapper holding only this game): its neighbours lean away
      let clift = 0;
      { let q: HTMLElement = pop;
        for (let i = 1; i <= 5; i++) {
          const pp: HTMLElement | null = q.parentElement;
          if (!pp || pp === body || pp === this.doc.documentElement) break;
          const nf = pp.getElementsByClassName("Focusable").length;
          if (nf > 1 || (nf === 0 && pp.getElementsByTagName("img").length > 4)) break; // holds another game
          q = pp; clift = i;
        } }
      let big = false, popStatic = false, own = false, w = 0;
      try { w = base.getBoundingClientRect().width; } catch (e) { w = 0; }
      try {
        const st = pop.parentElement;
        const pr = pop.getBoundingClientRect();
        if (st && view) {
          const sr = st.getBoundingClientRect();
          big = sr.width > pr.width * 1.8 || sr.height > pr.height * 1.6;
        }
        const pcs = view ? view.getComputedStyle(pop) : null;
        popStatic = !!pcs && pcs.position === "static";
        // Steam lifts the focused item with its own transform; ours replaces it, so that one does not count
        let busy = false;
        try { busy = pop.matches(":focus, .gpfocus, :hover"); } catch (e) { busy = false; }
        own = !!pcs && (pcs.transform === "none" || pcs.transform === "" || busy);
      } catch (e) { /* ignore */ }
      fresh.push({ img, mode, makeStatic, lift, big, popStatic, own, w, flift, clift });
    }
    for (const f of fresh) {
      const img = f.img;
      const target: HTMLElement = f.mode === "box" ? (img.parentElement as HTMLElement) : img;
      const r = resolveAppId(img, this.eng.prov);
      target.setAttribute("data-sanso-case", f.mode);
      if (f.makeStatic) target.setAttribute("data-sanso-static", "1");
      let pop: HTMLElement = target;
      for (let i = 0; i < f.lift && pop.parentElement; i++) {
        pop = pop.parentElement;
        if (i < f.lift - 1) pop.setAttribute("data-sanso-link", "1");
      }
      pop.setAttribute("data-sanso-pop", "1");
      if (f.popStatic) pop.setAttribute("data-sanso-pstatic", "1");
      if (f.own) pop.setAttribute("data-sanso-own", "1");
      { let q: HTMLElement | null = pop; for (let i = 0; q && i < f.clift; i++) q = q.parentElement; if (q && q !== this.doc.body) q.setAttribute("data-sanso-cell", "1"); }
      if (f.flift) { let q: HTMLElement | null = pop; for (let i = 0; q && i < f.flift; i++) q = q.parentElement; if (q) q.setAttribute("data-sanso-focus", "1"); }
      if (view) { let q: HTMLElement | null = pop.parentElement; for (let i = 0; q && q !== this.doc.body && i < 8; i++, q = q.parentElement) { try { const pe = view.getComputedStyle(q).perspective; if (pe && pe !== "none") q.setAttribute("data-sanso-persp", "1"); } catch (e) { /* ignore */ } } }
      const stage = pop.parentElement;
      if (stage && stage !== this.doc.body && f.own) stage.setAttribute("data-sanso-stage", "own"); // Steam's own perspective there would distort ours
      else if (stage && stage !== this.doc.body) {
        if (f.big || stage.getAttribute("data-sanso-stage") === "big") stage.setAttribute("data-sanso-stage", "big");
        else stage.setAttribute("data-sanso-stage", "small");
      }
      if (r.key) target.setAttribute("data-sanso-app", r.key);
      const tr: Tracked = { img, target, mode: f.mode, appid: r.key, how: r.how, w: f.w, pop };
      this.tracked.set(img, tr);
      this.paint(tr);
    }
    if (this.tracked.size > 600 || this.decoys.size > 200) this.prune();
  }
  paint(tr: Tracked): void {
    const s = this.eng.settings, prov = this.eng.prov;
    const lk = lookFor(s, prov, tr.appid);
    // thickness follows the cover's size, so it looks the same on a small and on a big cover
    if (tr.w && tr.w > 40) lk.depthPx = Math.max(4, Math.round(tr.w * 0.0075 * s.depth * lk.shape.depth));
    const sig = [lk.style, lk.pal.a, lk.pal.b, lk.pal.band, lk.depthPx, lk.shape.radius, lk.shape.rim, lk.wear].join("|");
    if (tr.sig !== sig) {
      setVars(tr.target, lk.pal, lk.style, lk.depthPx, lk.shape.radius, lk.shape.rim, lk.wear); tr.sig = sig;
      if (tr.pop && tr.pop !== tr.target) tr.pop.style.setProperty("--c3d-r", `${lk.shape.radius}px`);
    }
    if (tr.pop) {
      // The case hinges on its right edge, so its far edge swings toward you by width x sin(tilt). On a wide item (Home's
      // big tiles) the full tilt pushes that edge so close to the camera that the whole cover is magnified and smeared.
      // Keep the swing small compared with the perspective distance.
      const w = Math.max(tr.w || 0, 1);
      const max = Math.asin(Math.min(1, (0.12 * 1100) / w)) * 180 / Math.PI;
      if (s.angle > max) tr.pop.style.setProperty("--c3d-ang", `${max.toFixed(1)}deg`); else tr.pop.style.removeProperty("--c3d-ang");
    }
    if (tr.mode === "box") { ensureFaces(this.doc, tr.target, ""); this.syncTemplate(tr, lk.style); }
  }
  // a template look: a layer with the game's art in the window and the frame picture over it
  syncTemplate(tr: Tracked, style: string): void {
    let layer = tr.target.querySelector(":scope > [data-sanso-tpl]") as HTMLElement | null;
    if (!(style.indexOf(TPL_PREFIX) === 0 && TEMPLATES[style])) { if (layer) layer.remove(); return; }
    if (!layer) {
      layer = this.doc.createElement("div");
      layer.setAttribute("data-sanso-tpl", "1");
      ["art", "frame"].forEach((t) => { const c = this.doc.createElement("div"); c.setAttribute("data-t", t); layer!.appendChild(c); });
      tr.target.appendChild(layer);
    }
    const art = layer.firstElementChild as HTMLElement | null;
    const src = tr.img.currentSrc || tr.img.src;
    if (art && src && art.getAttribute("data-src") !== src) { art.setAttribute("data-src", src); art.style.backgroundImage = `url(${JSON.stringify(src)})`; }
  }
  prune(): void {
    this.tracked.forEach((_tr, img) => { if (!img.isConnected) this.tracked.delete(img); });
    this.decoys.forEach((img) => { if (!img.isConnected) this.decoys.delete(img); });
  }
  // settings changed: restyle what is already tracked, no page scan
  restyle(): void {
    this.obs.disconnect();
    try {
      this.prune();
      ensureStyle(this.doc, buildCss(this.eng.settings));
      this.tracked.forEach((tr) => this.paint(tr));
      this.obs.takeRecords();
    } finally { this.observe(); }
  }
  destroy(): void {
    this.obs.disconnect();
    clearTimeout(this.timer);
    this.doc.removeEventListener("load", this.onLoad, true);
    this.doc.removeEventListener("vgp_onok", this.onPick, true);
    this.doc.removeEventListener("click", this.onPick, true);
    this.doc.removeEventListener("visibilitychange", this.onVis);
    try { clearAll(this.doc); if (this.doc.documentElement.getAttribute(OWNER_ATTR) === this.eng.owner) this.doc.documentElement.removeAttribute(OWNER_ATTR); } catch (e) { /* window gone */ }
    this.tracked.clear();
    this.queue.clear();
  }
}


// ---------- experimental: the game disc / card goes into the slot when a game launches ----------
// One temporary layer above the page, removed again when the animation ends; nothing stays behind.
// The case and the disc (or game card) are printed with the game's own cover art.

export interface InsertSrc { rect: { left: number; top: number; width: number; height: number } | null; art: string; look: Look }
/** eject: the same scene played backwards (the disc comes out of the slot and back into the case, which closes).
 *  tear: a sealed game's first launch, the shrink-wrap is ripped off before the case opens. */
export interface InsertOpts { eject?: boolean; tear?: boolean }
const TEAR_MS = 700;   // extra time a shrink-wrap tear adds
const TEAR_AT = 519;   // the timeline is pushed back from here (the case has flown in, the cover is still closed)

function box(doc: Document, css: string): HTMLElement {
  const e = doc.createElement("div");
  e.style.cssText = "position:absolute;box-sizing:border-box;" + css;
  return e;
}

// Case and disc sounds, made on the spot with Web Audio (no sound files): plastic clicks, the disc lifting,
// the slide into the slot, the drive spinning up and the final clunk. Times are in ms from the start.
export function insertSounds(view: Window, card: boolean, volume: number, mode: "insert" | "eject" = "insert", warp: (ms: number) => number = (ms) => ms): void {
  try {
    const AC: any = (view as any).AudioContext || (view as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    const master = ctx.createGain(); master.gain.value = Math.max(0, Math.min(1, volume)); master.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.03;
    const noise = (len: number) => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate); const ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; return b; };
    // short filtered noise burst: plastic click / snap
    const click = (ms: number, freq: number, len: number, gain: number, q = 2) => {
      const s = ctx.createBufferSource(); s.buffer = noise(len);
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); const at = t0 + warp(ms) / 1000;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + 0.002); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
      s.connect(f); f.connect(g); g.connect(master); s.start(at); s.stop(at + len + 0.02);
    };
    // low body thump
    const thump = (ms: number, freq: number, len: number, gain: number) => {
      const o = ctx.createOscillator(); o.type = "sine"; const g = ctx.createGain(); const at = t0 + warp(ms) / 1000;
      o.frequency.setValueAtTime(freq * 1.6, at); o.frequency.exponentialRampToValueAtTime(freq, at + len * 0.6);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
      o.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.02);
    };
    // sliding: noise swept through a filter
    const slide = (ms: number, len: number, f1: number, f2: number, gain: number) => {
      const s = ctx.createBufferSource(); s.buffer = noise(len);
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2; const at = t0 + warp(ms) / 1000;
      f.frequency.setValueAtTime(f1, at); f.frequency.exponentialRampToValueAtTime(f2, at + len);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + len * 0.3); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
      s.connect(f); f.connect(g); g.connect(master); s.start(at); s.stop(at + len + 0.02);
    };
    // drive motor spinning up
    const motor = (ms: number, len: number, gain: number) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
      const g = ctx.createGain(); const at = t0 + warp(ms) / 1000;
      o.frequency.setValueAtTime(70, at); o.frequency.exponentialRampToValueAtTime(240, at + len);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + len * 0.35); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
      o.connect(lp); lp.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.02);
    };
    if (mode === "eject") {
      // the reverse: case opens, the drive spins down and pushes the disc out, it drops into the tray, the case shuts
      const spinDown = (ms: number, len: number, gain: number) => {
        const o = ctx.createOscillator(); o.type = "sawtooth"; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
        const g = ctx.createGain(); const at = t0 + warp(ms) / 1000;
        o.frequency.setValueAtTime(240, at); o.frequency.exponentialRampToValueAtTime(60, at + len);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + 0.05); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
        o.connect(lp); lp.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.02);
      };
      click(330, 3200, 0.03, 0.5); thump(350, 140, 0.08, 0.22);
      if (!card) spinDown(420, 0.45, 0.05);
      click(600, 2200, 0.04, 0.45, 3); thump(610, 110, 0.1, 0.4);
      slide(620, 0.3, 2600, 900, card ? 0.35 : 0.28);
      if (card) { click(1300, 4200, 0.025, 0.4); } else { click(1290, 3600, 0.03, 0.3); click(1310, 5200, 0.02, 0.35); }
      click(1820, 2800, 0.035, 0.55); thump(1840, 160, 0.08, 0.3);
      view.setTimeout(() => { try { ctx.close(); } catch (e) { /* ignore */ } }, 3200);
      return;
    }
    // case: hinge unlatches, cover opens and taps open
    click(380, 3200, 0.03, 0.55); thump(400, 140, 0.08, 0.25);
    click(880, 2400, 0.04, 0.35);
    // disc / card lifts off the hub
    if (card) { click(900, 4200, 0.025, 0.4); } else { click(890, 5200, 0.02, 0.35); click(915, 3600, 0.03, 0.3); }
    // into the slot: slide, (disc) motor spin-up, clunk
    slide(1320, 0.3, 900, 2600, card ? 0.35 : 0.28);
    if (card) { click(1575, 1800, 0.05, 0.6, 3); thump(1580, 110, 0.12, 0.5); }
    else { thump(1585, 95, 0.14, 0.5); click(1580, 2200, 0.04, 0.45, 3); motor(1600, 0.55, 0.06); }
    // case snaps shut
    click(1850, 2800, 0.035, 0.5); thump(1855, 160, 0.07, 0.25);
    // a sealed game: the shrink-wrap crinkles and rips first. The rest of the timeline is pushed back for it, so these
    // use real time (the tear runs from 540 to about 1150 ms).
    if (warp(519) !== 519) {
      const burst = (ms: number, len: number, freq: number, gain: number, kind: BiquadFilterType) => {
        const b = ctx.createBufferSource(); b.buffer = noise(len);
        const f = ctx.createBiquadFilter(); f.type = kind; f.frequency.value = freq; f.Q.value = 3;
        const g = ctx.createGain(); const at = t0 + ms / 1000;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
        b.connect(f); f.connect(g); g.connect(master); b.start(at); b.stop(at + len + 0.02);
      };
      for (let k = 0; k < 7; k++) burst(540 + k * 34 + Math.random() * 18, 0.014, 5200 + Math.random() * 2600, 0.2, "bandpass"); // crinkle as it is gripped
      burst(800, 0.28, 2600, 0.38, "highpass");                                                                                  // the rip
      for (let k = 0; k < 5; k++) burst(900 + k * 45 + Math.random() * 20, 0.012, 6000 + Math.random() * 2000, 0.14, "bandpass"); // the pieces fly off
    }
    view.setTimeout(() => { try { ctx.close(); } catch (e) { /* ignore */ } }, 3200);
  } catch (e) { /* no sound is fine */ }
}

export function runInsert(doc: Document, src: InsertSrc, target: "auto" | "handheld" | "console", sound = true, opts: InsertOpts = {}): boolean {
  const view = doc.defaultView;
  if (!view || !doc.body || typeof (doc.body as any).animate !== "function") return false;
  const old = doc.getElementById("sanso-insert");
  if (old) old.remove(); // a newer launch replaces one still playing
  const W = view.innerWidth, H = view.innerHeight;
  if (W < 200 || H < 200) return false; // the window is not laid out yet (e.g. Steam coming back after a game): try again later
  const variant = target === "auto" ? (W >= 1800 ? "console" : "handheld") : target;
  const L = src.look, pal = L.pal;
  const art = src.art ? `url(${JSON.stringify(src.art)})` : `linear-gradient(160deg, ${pal.a}, ${pal.b})`;
  const card = L.shapeId === "cartridge";
  const rad = Math.max(3, L.shape.radius + 2);

  // final size and place of the case: big and centred a little to the right, so the cover can swing open to the left
  const ch = Math.round(Math.min(H * 0.56, W * 0.42 * 1.5)), cw = Math.round(ch / 1.5);
  const cx = Math.round(W * 0.56 - cw / 2), cy = Math.round(H * 0.42 - ch / 2);
  const d = Math.max(10, Math.round(cw * (card ? 0.06 : 0.1)));
  // where it starts: the cover on screen, or a little smaller in the same place
  const r0 = src.rect && src.rect.width > 30 && src.rect.top < H && src.rect.top + src.rect.height > 0 ? src.rect : null;
  const s0 = r0 ? r0.width / cw : 0.82;
  const x0 = r0 ? r0.left + r0.width / 2 - (cx + cw / 2) : 0, y0 = r0 ? r0.top + r0.height / 2 - (cy + ch / 2) : 30;

  const root = box(doc, `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:2147483000;pointer-events:none;overflow:hidden;perspective:1500px;perspective-origin:50% 38%;`);
  root.id = "sanso-insert";
  // nearly opaque: Steam's launch screen (the big game logo) is only revealed once the case has played
  const shade = box(doc, `inset:0;background:radial-gradient(120% 95% at 55% 40%, rgb(16,21,32), rgb(3,4,8));opacity:0;`);
  root.appendChild(shade);

  // soft light behind the case in the game's colour
  const glow = box(doc, `left:${Math.round(cx - cw * 0.9)}px;top:${Math.round(cy - ch * 0.35)}px;width:${Math.round(cw * 2.8)}px;height:${Math.round(ch * 1.7)}px;border-radius:50%;background:radial-gradient(closest-side, ${pal.a}, transparent);opacity:0;filter:blur(30px);`);
  root.appendChild(glow);
  // ---- the case ----
  const wrap = box(doc, `left:${cx}px;top:${cy}px;width:${cw}px;height:${ch}px;perspective:1400px;perspective-origin:50% 35%;`);
  // contact shadow on the "floor" under the case
  const floor = box(doc, `left:-8%;right:-8%;bottom:-9%;height:12%;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,.7), rgba(0,0,0,0));`);
  wrap.appendChild(floor);
  const stage = box(doc, `inset:0;transform-style:preserve-3d;`);
  wrap.appendChild(stage);
  const shell = `linear-gradient(135deg, rgba(255,255,255,.10), rgba(0,0,0,.25)), ${pal.b}`;
  stage.appendChild(box(doc, `inset:0;border-radius:${rad}px;background:${shell};transform:translateZ(-${d}px);box-shadow:0 30px 60px rgba(0,0,0,.55);`));
  // inside: dark plastic tray with the hub (or a card slot)
  const tray = card
    ? `linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.2)), repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 2px, transparent 2px 6px), #15171c`
    : `radial-gradient(circle at 50% 50%, #3d424b 0 4.5%, #0b0c0f 5% 6.5%, #2c3038 7% 10.5%, #121418 11% 42%, rgba(255,255,255,.07) 42.6% 43.4%, #14161b 44% 100%)`;
  stage.appendChild(box(doc, `left:4%;top:3%;right:4%;bottom:3%;border-radius:${Math.max(2, rad - 2)}px;background:${tray};transform:translateZ(-${d - 2}px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06), inset 0 8px 18px rgba(0,0,0,.5);`));
  if (card) stage.appendChild(box(doc, `left:22%;top:16%;width:56%;height:40%;border-radius:6px;background:rgba(0,0,0,.55);box-shadow:inset 0 0 0 2px rgba(255,255,255,.07);transform:translateZ(-${d - 3}px);`));
  // walls: spine (left, hinge side), top, bottom, right
  stage.appendChild(box(doc, `top:0;bottom:0;left:0;width:${d}px;transform-origin:left center;transform:rotateY(90deg);background:linear-gradient(90deg, ${pal.a}, ${pal.b});`));
  stage.appendChild(box(doc, `top:0;bottom:0;right:0;width:${d}px;transform-origin:right center;transform:rotateY(-90deg);background:linear-gradient(270deg, ${pal.b}, ${pal.a});`));
  stage.appendChild(box(doc, `left:0;right:0;top:0;height:${d}px;transform-origin:center top;transform:rotateX(-90deg);background:linear-gradient(0deg, ${pal.b}, ${pal.a});`));
  stage.appendChild(box(doc, `left:0;right:0;bottom:0;height:${d}px;transform-origin:center bottom;transform:rotateX(90deg);background:linear-gradient(180deg, ${pal.b}, #000);`));
  // the front cover swings open on the spine
  const cover = box(doc, `inset:0;transform-origin:left center;transform-style:preserve-3d;`);
  cover.appendChild(box(doc, `inset:0;border-radius:${rad}px;backface-visibility:hidden;background:${art} center/cover no-repeat, ${pal.b};box-shadow:inset 0 0 0 1px ${pal.line};`));
  cover.appendChild(box(doc, `inset:0;border-radius:${rad}px;backface-visibility:hidden;transform:translateZ(.6px);background:linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(255,255,255,.28) 1.6%, rgba(0,0,0,.15) 3.4%, transparent 7%), linear-gradient(115deg, rgba(255,255,255,.34), rgba(255,255,255,0) 32%, rgba(255,255,255,0) 62%, rgba(255,255,255,.12) 74%, transparent 76%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3), inset 0 0 0 4px rgba(255,255,255,.08);`));
  // inside of the cover: the dark sleeve with the art showing faintly through, and the manual clips
  // a light sweep across the cover as the case turns towards you
  const glint = box(doc, `inset:0;border-radius:${rad}px;backface-visibility:hidden;transform:translateZ(.8px);overflow:hidden;`);
  const glintBar = box(doc, `top:-20%;bottom:-20%;left:-60%;width:45%;background:linear-gradient(100deg, transparent, rgba(255,255,255,.38), transparent);transform:skewX(-14deg);`);
  glint.appendChild(glintBar);
  cover.appendChild(glint);
  cover.appendChild(box(doc, `inset:0;border-radius:${rad}px;backface-visibility:hidden;transform:rotateY(180deg);background:linear-gradient(rgba(12,14,19,.84), rgba(12,14,19,.92)), ${art} center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);`));
  stage.appendChild(cover);
  root.appendChild(wrap);

  // ---- the disc / card (its own flat layer so the slot can hide it as it goes in) ----
  const handheld = variant !== "console";
  const slotY = H - 7, slotX = W - 7;
  const layer = box(doc, `inset:0;${handheld ? `clip-path:inset(0 0 ${H - slotY}px 0);` : `clip-path:inset(0 ${W - slotX}px 0 0);`}`);
  const D = Math.round(card ? cw * 0.5 : cw * 0.76);
  const DH = card ? Math.round(D * 1.16) : D;
  const dcx = cx + cw / 2, dcy = cy + ch * (card ? 0.36 : 0.5);
  const holder = box(doc, `left:${Math.round(dcx - D / 2)}px;top:${Math.round(dcy - DH / 2)}px;width:${D}px;height:${DH}px;opacity:0;will-change:transform,opacity;`);
  const shadow = box(doc, `left:6%;top:9%;width:88%;height:88%;border-radius:${card ? "10px" : "50%"};background:rgba(0,0,0,.55);filter:blur(10px);`);
  holder.appendChild(shadow);
  // the disc / card, printed with the game's art (built twice: one sits in the tray, one flies to the slot)
  const makeItem = (): { el: HTMLElement; spin: HTMLElement | null } => {
    const el = box(doc, "inset:0;");
    if (card) {
      const c = box(doc, `inset:0;border-radius:7px;clip-path:polygon(0 0, 80% 0, 100% 12%, 100% 100%, 0 100%);background:linear-gradient(180deg,#2c2f36,#101216);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18);`);
      c.appendChild(box(doc, `left:7%;top:6%;right:7%;height:62%;border-radius:4px;background:${art} center/cover no-repeat;box-shadow:0 0 0 2px rgba(255,255,255,.85);`));
      c.appendChild(box(doc, `left:14%;right:14%;bottom:6%;height:10%;background:repeating-linear-gradient(90deg,#e0bf55 0 3px,#8a6d1c 3px 4px,transparent 4px 7px);border-radius:2px;`));
      c.appendChild(box(doc, `inset:0;background:linear-gradient(120deg, rgba(255,255,255,.28), rgba(255,255,255,0) 40%);`));
      el.appendChild(c);
      return { el, spin: null };
    }
    const hole = "radial-gradient(circle, transparent 0 6.2%, #000 6.6%)";
    const spin = box(doc, `inset:0;border-radius:50%;background:${art} center/cover no-repeat, ${pal.b};-webkit-mask:${hole};mask:${hole};`);
    // clear hub ring and the outer rim (they spin with the print)
    spin.appendChild(box(doc, `inset:0;border-radius:50%;background:radial-gradient(circle, transparent 0 6.4%, rgba(230,236,245,.62) 6.8% 15.2%, rgba(255,255,255,.95) 15.5% 16.1%, rgba(0,0,0,.25) 16.4% 17%, transparent 17.4% 95.6%, rgba(255,255,255,.7) 96.2% 97.4%, rgba(0,0,0,.45) 98%);`));
    el.appendChild(spin);
    // light on the disc stays still while it spins (plain alpha: blend modes would flatten the 3D case)
    el.appendChild(box(doc, `inset:0;border-radius:50%;-webkit-mask:${hole};mask:${hole};background:conic-gradient(from 40deg, rgba(255,255,255,0) 0, rgba(255,255,255,.30) 6%, rgba(160,220,255,.14) 11%, rgba(255,255,255,0) 17%, rgba(255,255,255,0) 50%, rgba(255,255,255,.26) 56%, rgba(255,190,240,.12) 61%, rgba(255,255,255,0) 67%);`));
    return { el, spin };
  };
  const flying = makeItem();
  holder.appendChild(flying.el);
  const spinner = flying.spin;
  // the copy that sits in the tray from the start, so the case is never empty when it opens
  const seated = makeItem();
  const seat = box(doc, `left:${Math.round(cw / 2 - D / 2)}px;top:${Math.round(ch * (card ? 0.36 : 0.5) - DH / 2)}px;width:${D}px;height:${DH}px;transform:translateZ(-${d - 3}px);`);
  seat.appendChild(seated.el);
  stage.appendChild(seat);
  layer.appendChild(holder);
  root.appendChild(layer);

  // ---- the slot ----
  const slot = handheld
    ? box(doc, `left:${Math.round(W / 2 - D * 0.62)}px;top:${slotY - 3}px;width:${Math.round(D * 1.24)}px;height:7px;border-radius:4px;background:linear-gradient(180deg,#000,#1b1e24);box-shadow:0 0 0 1px rgba(255,255,255,.16), 0 -1px 0 rgba(255,255,255,.25);opacity:0;`)
    : box(doc, `left:${slotX - 3}px;top:${Math.round(H / 2 - D * 0.62)}px;width:7px;height:${Math.round(D * 1.24)}px;border-radius:4px;background:linear-gradient(90deg,#000,#1b1e24);box-shadow:0 0 0 1px rgba(255,255,255,.16), -1px 0 0 rgba(255,255,255,.25);opacity:0;`);
  const bezel = handheld
    ? box(doc, `left:${Math.round(W / 2 - D * 0.8)}px;top:${slotY - 12}px;width:${Math.round(D * 1.6)}px;height:24px;border-radius:12px;background:linear-gradient(180deg, #2a2e36, #121418);box-shadow:inset 0 1px 0 rgba(255,255,255,.12), 0 6px 18px rgba(0,0,0,.6);opacity:0;`)
    : box(doc, `left:${slotX - 12}px;top:${Math.round(H / 2 - D * 0.8)}px;width:24px;height:${Math.round(D * 1.6)}px;border-radius:12px;background:linear-gradient(90deg, #2a2e36, #121418);box-shadow:inset 1px 0 0 rgba(255,255,255,.12), 0 6px 18px rgba(0,0,0,.6);opacity:0;`);
  const streak = box(doc, handheld
    ? `left:0;top:2px;width:30%;height:2px;border-radius:2px;background:linear-gradient(90deg, transparent, rgba(150,215,255,.95), transparent);opacity:0;`
    : `top:0;left:2px;height:30%;width:2px;border-radius:2px;background:linear-gradient(180deg, transparent, rgba(150,215,255,.95), transparent);opacity:0;`);
  slot.appendChild(streak);
  root.insertBefore(bezel, layer);
  root.appendChild(slot);
  doc.body.appendChild(root);

  // ---- timeline (ms) ----
  const fx: Animation[] = [];
  const A = (el: HTMLElement, kf: Keyframe[], o: KeyframeAnimationOptions) => { fx.push(el.animate(kf, { fill: "both", ...o })); };
  // fly in 0-420, open 380-900, disc shows 780, lifts 880-1060, travels 1060-1560, close 1520-1860, fade out to 2100
  const eject = !!opts.eject, tearing = !!opts.tear && !eject;
  const TEAR = tearing ? TEAR_MS : 0;
  const warp = (ms: number) => (ms < TEAR_AT ? ms : ms + TEAR);
  const T_END = 2200 + TEAR;
  const at = (ms: number) => Math.min(1, Math.max(0, warp(ms) / T_END));
  A(shade, [{ opacity: 0 }, { opacity: 1, offset: at(200) }, { opacity: 1, offset: at(1880) }, { opacity: 0 }], { duration: T_END, easing: "ease-in-out" });
  // seated copy hands over to the flying one at the same spot
  A(seat, [{ opacity: 1 }, { opacity: 1, offset: at(880) }, { opacity: 0, offset: at(881) }, { opacity: 0 }], { duration: T_END, easing: "linear" });
  const back = r0 ? `translate(${x0}px,${y0}px) scale(${s0})` : `translate(0,${Math.round(ch * 0.08)}px) scale(.88)`;
  A(glow, [{ opacity: 0 }, { opacity: 0.55, offset: at(500) }, { opacity: 0.4, offset: at(1500) }, { opacity: 0, offset: at(1900) }, { opacity: 0 }], { duration: T_END, easing: "ease-in-out" });
  // fly out with a little overshoot, settle, then go back where it came from
  A(wrap, [
    { transform: `translate(${x0}px,${y0}px) scale(${s0})`, opacity: 1, easing: "cubic-bezier(.2,.8,.3,1)" },
    { transform: "translate(0,-6px) scale(1.035)", opacity: 1, offset: at(360), easing: "cubic-bezier(.4,0,.3,1)" },
    { transform: "translate(0,0) scale(1)", opacity: 1, offset: at(520) },
    { transform: "translate(0,0) scale(1)", opacity: 1, offset: at(1640), easing: "cubic-bezier(.6,0,.4,1)" },
    { transform: back, opacity: 1, offset: at(1900), easing: "ease-in" },
    { transform: back, opacity: 0, offset: at(1990) },
    { transform: back, opacity: 0 },
  ], { duration: T_END });
  A(floor, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)", offset: at(420) }, { opacity: 1, transform: "scale(1)", offset: at(1640) }, { opacity: 0, transform: "scale(.7)", offset: at(1880) }, { opacity: 0 }], { duration: T_END, easing: "ease-out" });
  A(glintBar, [{ transform: "translateX(0) skewX(-14deg)" }, { transform: "translateX(0) skewX(-14deg)", offset: at(80) }, { transform: `translateX(${Math.round(cw * 2.6)}px) skewX(-14deg)`, offset: at(560) }, { transform: `translateX(${Math.round(cw * 2.6)}px) skewX(-14deg)` }], { duration: T_END, easing: "cubic-bezier(.4,0,.2,1)" });
  A(stage, [
    { transform: "rotateX(0deg) rotateY(0deg)", easing: "cubic-bezier(.2,.8,.3,1)" },
    { transform: "rotateX(8deg) rotateY(-22deg)", offset: at(480), easing: "ease-in-out" },
    { transform: "rotateX(6deg) rotateY(-14deg)", offset: at(1500), easing: "ease-in-out" },
    { transform: "rotateX(5deg) rotateY(-10deg)", offset: at(1830), easing: "ease-out" },
    { transform: "rotateX(3deg) rotateY(-12deg)", offset: at(1870), easing: "ease-in-out" }, // little bump when the cover snaps shut
    { transform: "rotateX(0deg) rotateY(0deg)" },
  ], { duration: T_END });
  // the cover swings open, overshoots the hinge stop a touch and settles; later it snaps shut
  A(cover, [
    { transform: "rotateY(0deg)" },
    { transform: "rotateY(0deg)", offset: at(tearing ? 520 : 380), easing: "cubic-bezier(.5,0,.3,1)" },
    { transform: "rotateY(-168deg)", offset: at(860), easing: "ease-in-out" },
    { transform: "rotateY(-157deg)", offset: at(960), easing: "ease-in-out" },
    { transform: "rotateY(-160deg)", offset: at(1040) },
    { transform: "rotateY(-160deg)", offset: at(1520), easing: "cubic-bezier(.55,0,.85,.35)" },
    { transform: "rotateY(0deg)", offset: at(1830) },
    { transform: "rotateY(0deg)" },
  ], { duration: T_END });
  // the disc / card: lifts out with a small wobble, swings along an arc, turns edge-on and is pulled into the slot
  const tx = handheld ? W / 2 - dcx : slotX + D * 0.7 - dcx;
  const ty = handheld ? slotY + DH * 0.62 - dcy : H / 2 - dcy;
  const preX = handheld ? W / 2 - dcx : slotX - D * 0.8 - dcx;
  const preY = handheld ? slotY - DH * 0.75 - dcy : H / 2 - dcy;
  const midX = handheld ? preX * 0.5 - D * 0.18 : preX * 0.5, midY = handheld ? preY * 0.42 : preY * 0.5 - DH * 0.25;
  const edge = handheld ? (card ? "rotateX(0deg)" : "rotateX(72deg)") : (card ? "rotateY(0deg)" : "rotateY(72deg)");
  const half = handheld ? (card ? "rotateX(0deg) rotateZ(-6deg)" : "rotateX(30deg) rotateZ(-4deg)") : (card ? "rotateY(0deg)" : "rotateY(30deg)");
  const inTray = "rotateX(6deg) rotateY(-14deg)";
  const P = (x: number, y: number, r: string, s: number) => `perspective(1000px) translate(${Math.round(x)}px,${Math.round(y)}px) ${r} scale(${s})`;
  A(holder, [
    { opacity: 0, transform: P(0, 0, inTray, 0.97) },
    { opacity: 0, transform: P(0, 0, inTray, 0.97), offset: at(879) },
    { opacity: 1, transform: P(0, 0, inTray, 0.97), offset: at(880), easing: "cubic-bezier(.2,.8,.3,1)" },
    { opacity: 1, transform: P(0, -ch * 0.06, "rotateX(-4deg) rotateY(3deg)", 1.07), offset: at(1010), easing: "ease-in-out" },
    { opacity: 1, transform: P(0, -ch * 0.055, "rotateX(2deg) rotateY(-2deg)", 1.06), offset: at(1080), easing: "cubic-bezier(.45,0,.55,1)" },
    { opacity: 1, transform: P(midX, midY, half, 0.95), offset: at(1250), easing: "cubic-bezier(.45,0,.55,1)" },
    { opacity: 1, transform: P(preX, preY, edge, 0.84), offset: at(1430), easing: "cubic-bezier(.6,0,1,.5)" },
    { opacity: 1, transform: P(tx, ty, edge, 0.82), offset: at(1580) },
    { opacity: 0, transform: P(tx, ty, edge, 0.82) },
  ], { duration: T_END });
  // a tiny jolt when it clicks in
  A(root, [{ transform: "translate(0,0)" }, { transform: "translate(0,0)", offset: at(1575) }, { transform: "translate(0,2.5px)", offset: at(1605) }, { transform: "translate(0,-1px)", offset: at(1650) }, { transform: "translate(0,0)", offset: at(1700) }, { transform: "translate(0,0)" }], { duration: T_END, easing: "ease-out" });
  A(bezel, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 0, transform: "translateY(10px)", offset: at(900) }, { opacity: 1, transform: "translateY(0)", offset: at(1120) }, { opacity: 1, transform: "translateY(0)", offset: at(1760) }, { opacity: 0, transform: "translateY(8px)", offset: at(2000) }, { opacity: 0 }], { duration: T_END, easing: "cubic-bezier(.2,.8,.3,1)" });
  A(streak, handheld
    ? [{ opacity: 0, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(0)", offset: at(1560) }, { opacity: 1, transform: `translateX(${Math.round(D * 0.6)}px)`, offset: at(1650) }, { opacity: 0, transform: `translateX(${Math.round(D * 1.24)}px)`, offset: at(1780) }, { opacity: 0 }]
    : [{ opacity: 0, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(0)", offset: at(1560) }, { opacity: 1, transform: `translateY(${Math.round(D * 0.6)}px)`, offset: at(1650) }, { opacity: 0, transform: `translateY(${Math.round(D * 1.24)}px)`, offset: at(1780) }, { opacity: 0 }],
    { duration: T_END, easing: "linear" });
  A(shadow, [{ opacity: 0.9, transform: "translate(0,0)" }, { opacity: 0.9, transform: "translate(0,0)", offset: at(880) }, { opacity: 0.45, transform: `translate(${Math.round(D * 0.06)}px,${Math.round(D * 0.1)}px)`, offset: at(1060) }, { opacity: 0, offset: at(1400) }, { opacity: 0 }], { duration: T_END, easing: "linear" });
  if (spinner) A(spinner, [{ transform: "rotate(0deg)" }, { transform: "rotate(0deg)", offset: at(900), easing: "cubic-bezier(.5,0,.8,.5)" }, { transform: "rotate(1080deg)", offset: at(1580) }, { transform: "rotate(1080deg)" }], { duration: T_END });
  A(slot, [
    { opacity: 0, transform: "scale(.9)" },
    { opacity: 0, transform: "scale(.9)", offset: at(950) },
    { opacity: 1, transform: "scale(1)", offset: at(1150) },
    { opacity: 1, transform: "scale(1)", offset: at(1480) },
    { opacity: 1, transform: "scale(1.05)", boxShadow: "0 0 0 1px rgba(170,225,255,.95), 0 0 24px 7px rgba(80,170,255,.8)", offset: at(1600) },
    { opacity: 1, transform: "scale(1)", boxShadow: "0 0 0 1px rgba(170,225,255,.6), 0 0 14px 3px rgba(80,170,255,.4)", offset: at(1800) },
    { opacity: 0, transform: "scale(1)" },
  ], { duration: T_END, easing: "ease-out" });
  if (tearing) {
    // the shrink-wrap: a glossy film with the seal sticker, in two pieces that are torn apart and fly off
    const film = `linear-gradient(115deg, rgba(255,255,255,.30) 0 7%, transparent 7% 30%, rgba(255,255,255,.18) 30% 33%, transparent 33%), radial-gradient(circle at 86% 91%, #ffd44d 0 4.5%, #b98a12 4.5% 6%, transparent 6.2%), repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 5px), linear-gradient(rgba(255,255,255,.10), rgba(255,255,255,.05))`;
    const edge = ["52% 0", "47% 12%", "54% 25%", "46% 38%", "55% 52%", "47% 66%", "53% 80%", "48% 92%", "52% 100%"];
    const left = `polygon(0 0, ${edge.join(", ")}, 0 100%)`;
    const right = `polygon(100% 0, ${edge.join(", ")}, 100% 100%)`;
    const wrapL = box(doc, `inset:-1px;border-radius:${rad}px;background:${film};clip-path:${left};-webkit-clip-path:${left};transform:translateZ(1.2px);backface-visibility:hidden;`);
    const wrapR = box(doc, `inset:-1px;border-radius:${rad}px;background:${film};clip-path:${right};-webkit-clip-path:${right};transform:translateZ(1.2px);backface-visibility:hidden;`);
    cover.appendChild(wrapL); cover.appendChild(wrapR);
    const r = (ms: number) => Math.min(1, ms / T_END); // real time (the tear itself is not pushed back)
    A(wrapL, [
      { transform: "translateZ(1.2px)", opacity: 1 },
      { transform: "translateZ(1.2px)", opacity: 1, offset: r(540) },
      { transform: "translateZ(1.2px) translate(-2px,1px) rotate(-1deg)", opacity: 1, offset: r(700) },      // gripped, crinkles
      { transform: "translateZ(1.2px) translate(1px,-1px) rotate(.5deg)", opacity: 1, offset: r(790), easing: "cubic-bezier(.3,0,.6,1)" },
      { transform: `translateZ(40px) translate(${-Math.round(cw * 0.75)}px,${Math.round(ch * 0.18)}px) rotate(-24deg) rotateY(-35deg)`, opacity: 0, offset: r(1150) },
      { transform: `translateZ(40px) translate(${-Math.round(cw * 0.75)}px,${Math.round(ch * 0.18)}px) rotate(-24deg) rotateY(-35deg)`, opacity: 0 },
    ], { duration: T_END });
    A(wrapR, [
      { transform: "translateZ(1.2px)", opacity: 1 },
      { transform: "translateZ(1.2px)", opacity: 1, offset: r(540) },
      { transform: "translateZ(1.2px) translate(2px,-1px) rotate(1deg)", opacity: 1, offset: r(700) },
      { transform: "translateZ(1.2px) translate(-1px,1px) rotate(-.5deg)", opacity: 1, offset: r(800), easing: "cubic-bezier(.3,0,.6,1)" },
      { transform: `translateZ(60px) translate(${Math.round(cw * 0.9)}px,${-Math.round(ch * 0.28)}px) rotate(30deg) rotateY(40deg)`, opacity: 0, offset: r(1120) },
      { transform: `translateZ(60px) translate(${Math.round(cw * 0.9)}px,${-Math.round(ch * 0.28)}px) rotate(30deg) rotateY(40deg)`, opacity: 0 },
    ], { duration: T_END });
  }
  // eject: everything runs backwards, from the slot back into the case and back to the cover's place
  if (eject) fx.forEach((a) => { try { a.reverse(); } catch (e) { /* ignore */ } });
  if (sound) insertSounds(view, card, 0.85, eject ? "eject" : "insert", warp);
  const done = () => { fx.forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } }); try { if (root.isConnected) root.remove(); } catch (e) { /* ignore */ } };
  setTimeout(done, T_END + 80);
  return true;
}

export class Engine {
  settings: Settings;
  prov: Provider;
  stats: Stats = { batches: 0, imagesChecked: 0, mutationCalls: 0, ms: 0 };
  private watches = new Map<Document, DocWatch>();
  private findTimer: any = null;
  owner: "plugin" | "inject";
  selfDoc: Document | null;
  errors = 0;
  lastError = "";

  constructor(settings: Settings, prov: Provider, opts?: { owner?: "plugin" | "inject"; selfDoc?: Document }) {
    this.settings = settings;
    this.prov = prov;
    this.owner = (opts && opts.owner) || "plugin";
    this.selfDoc = (opts && opts.selfDoc) || null;
  }

  /** While a game runs the plugin does nothing at all: no page watching, no timers, no animations.
   *  On waking up it catches up with one scan of each window. */
  sleeping = false;
  setSleeping(on: boolean): void {
    if (on === this.sleeping) return;
    this.sleeping = on;
    this.watches.forEach((w) => {
      try {
        if (on) { w.obs.disconnect(); clearTimeout(w.timer); w.timer = null; w.doc.documentElement.setAttribute("data-sanso-sleep", "1"); }
        else { w.doc.documentElement.removeAttribute("data-sanso-sleep"); w.observe(); w.scanAll(); }
      } catch (e) { this.noteError(e); }
    });
    if (on) { if (this.findTimer) clearInterval(this.findTimer); this.findTimer = null; }
    else if (!this.findTimer && this.settings.enabled) { this.discover(); this.findTimer = setInterval(() => this.discover(), DISCOVER_MS); }
  }

  /** New or changed template pictures: every cover is restyled. */
  setTemplates(list: TemplateInfo[]): void {
    registerTemplates(list);
    this.watches.forEach((w) => w.restyle());
  }

  noteError(e: any): void { this.errors++; this.lastError = String(e && e.message ? e.message : e); }

  start(): void {
    this.discover();
    this.findTimer = setInterval(() => this.discover(), DISCOVER_MS);
  }

  stop(): void {
    if (this.findTimer) clearInterval(this.findTimer);
    this.findTimer = null;
    this.watches.forEach((w) => w.destroy());
    this.watches.clear();
  }

  update(s: Settings): void {
    const prev = this.settings;
    this.settings = s;
    if (!s.enabled) {
      this.watches.forEach((w) => w.destroy());
      this.watches.clear();
      return;
    }
    if (!prev.enabled || this.watches.size === 0) { this.discover(); return; }
    this.watches.forEach((w) => {
      w.restyle();
      if (prev.otherScreens !== s.otherScreens) w.checkPath(true);
    });
  }


  /** True when the plugin can see a window that holds the library (not just its own). */
  libraryReachable(): boolean {
    if (!this.selfDoc) return this.watches.size > 0;
    let ok = false;
    this.watches.forEach((w, d) => { if (d !== this.selfDoc || w.tracked.size > 0) ok = true; });
    return ok;
  }

  coverTotals(): { covers: number; matched: number; unmatched: number; images: number } {
    let covers = 0, matched = 0, images = 0;
    this.watches.forEach((w) => {
      images += w.doc.getElementsByTagName("img").length;
      w.tracked.forEach((tr) => { covers++; if (tr.how === "src" || tr.how === "fiber" || tr.how === "name") matched++; });
    });
    return { covers, matched, unmatched: covers - matched, images };
  }

  /** One line per thing that has to work, each marked ok / fail / warn / skip (not testable right now). */
  selfCheck(): CheckLine[] {
    const out: CheckLine[] = [];
    const s = this.settings;
    const L = (status: CheckLine["status"], label: string, detail: string) => out.push({ status, label, detail });
    if (!s.enabled) { L("warn", "3D cases switched on", "they are turned off in the settings"); return out; }
    L(this.watches.size > 0 ? "ok" : "fail", "Steam windows watched", `${this.watches.size} window(s)`);
    const reach = this.libraryReachable();
    L(reach ? "ok" : "fail", "Library window reachable", reach ? "the library window can be changed" : "no library window found");
    let styled = false;
    this.watches.forEach((w) => { if (w.doc.getElementById(STYLE_ID)) styled = true; });
    L(styled ? "ok" : (this.watches.size ? "fail" : "skip"), "Style sheet added", styled ? "in place" : "missing");
    const t = this.coverTotals();
    let nBox = 0, nImg = 0;
    this.watches.forEach((w) => w.tracked.forEach((tr) => { if (tr.mode === "box") nBox++; else nImg++; }));
    if (t.covers > 0) L("ok", "Covers found", `${t.covers} covers out of ${t.images} images (${nBox} full 3D, ${nImg} simple)`);
    else L(t.images > 0 ? "fail" : "skip", "Covers found", t.images > 0 ? `0 covers out of ${t.images} images (open your Library and check again)` : "no images on screen yet (open your Library)");
    if (t.covers > 0) {
      const ratio = t.matched / t.covers;
      L(ratio >= 0.9 ? "ok" : ratio >= 0.5 ? "warn" : "fail", "Games matched to covers", `${t.matched} of ${t.covers} matched (${t.unmatched} not)`);
    }
    // is the look really applied?
    let first: Tracked | null = null, firstBox: Tracked | null = null;
    this.watches.forEach((w) => w.tracked.forEach((tr) => { if (!first) first = tr; if (!firstBox && tr.mode === "box") firstBox = tr; }));
    if (this.watches.size > 0 && firstBox === null && t.covers > 0) L("warn", "Full 3D boxes", "covers are in simple mode (no wrapper element); the spine and top are not drawn");
    let focBox: HTMLElement | null = null;
    this.watches.forEach((w) => { if (!focBox) { try { focBox = w.doc.querySelector(".gpfocus [data-sanso-case='box'], :focus [data-sanso-case='box'], [data-sanso-case='box'].gpfocus, [data-sanso-pop]:focus [data-sanso-case='box']"); } catch (e) { focBox = null; } } });
    if (firstBox && !focBox) L("skip", "Full 3D boxes", "move onto a game with the controller, then run the check again");
    if (focBox) {
      const why = flattenReasons(focBox);
      L(why.length ? "warn" : "ok", "Full 3D boxes", why.length ? "Steam may flatten them: " + why.join(", ") : "nothing flattens the case (spine, top and back can be drawn)");
    }
    // focus pop-out
    let foc: { n: number; popped: boolean; info: string } | null = null;
    this.watches.forEach((w) => {
      try {
        const g = w.doc.querySelector(".gpfocus");
        if (g && !foc) {
          const cs = g.querySelectorAll("[data-sanso-case]");
          let popped = false, info = "";
          const v = w.doc.defaultView;
          if (cs.length === 1 && v) { const pe = (cs[0] as HTMLElement).closest("[data-sanso-pop]") as HTMLElement | null; if (pe) { const pc = v.getComputedStyle(pe); popped = (pc.rotate || "").indexOf(String(s.angle) + "deg") >= 0 || (pc.transform !== "none" && pc.transform !== ""); info = `${pe.tagName.toLowerCase()}.${typeof pe.className === "string" ? pe.className.split(/\s+/).slice(0, 3).join(".") : ""} own=${pe.hasAttribute("data-sanso-own")} rotate=${pc.rotate} transform=${pc.transform.slice(0, 40)}`; } else info = "no pop element found"; }
          foc = { n: cs.length, popped, info };
        }
      } catch (e) { /* ignore */ }
    });
    if (!foc) L("skip", "Focus pop-out", "move onto a game with the controller, then run the check again");
    else {
      const f: { n: number; popped: boolean; info: string } = foc;
      if (f.n === 1) L(f.popped ? "ok" : "warn", "Focus pop-out", f.popped ? "the focused game pops out" : "the focused game has a case but did not pop out (" + f.info + ")");
      else if (f.n === 0) L("warn", "Focus pop-out", "the focused item holds no cover (it may be a menu)");
      else L("fail", "Focus pop-out", `the focused item holds ${f.n} covers; a whole row would pop out`);
    }
    // themes and other plugins' styles
    try {
      let doc: Document | null = null, el: HTMLElement | null = null;
      this.watches.forEach((w) => {
        if (doc) return;
        const f = w.doc.querySelector(".gpfocus [data-sanso-pop], [data-sanso-pop].gpfocus, [data-sanso-pop]:focus") as HTMLElement | null;
        const any = f || (w.tracked.size ? (w.tracked.values().next().value as Tracked).pop || null : null);
        if (any) { doc = w.doc; el = any; }
      });
      if (doc) {
        const sc = themeScan(doc, el);
        if (sc.conflicts.length) L("warn", "Themes", `other styles also change the case: ${sc.conflicts.join("; ")}`);
        else L("ok", "Themes", sc.others.length ? `${sc.others.length} other style sheet(s), none change the case (${sc.others.slice(0, 4).join(", ")})` : "no other style sheets found");
      }
    } catch (e) { /* ignore */ }
    if (this.errors > 0) L("warn", "Errors inside the plugin", `${this.errors} (last: ${this.lastError.slice(0, 80)})`);
    return out;
  }

  /** Text copy of what the plugin sees, for a saved report. */
  snapshot(): string {
    const out: string[] = [];
    out.push(`time: ${new Date().toISOString()}`);
    try { out.push(`user agent: ${navigator.userAgent}`); } catch (e) { /* ignore */ }
    this.report().forEach((l) => out.push(l));
    this.watches.forEach((w) => {
      const doc = w.doc;
      out.push("");
      out.push(`=== window "${doc.title}" path ${screenPath(doc)} size ${doc.defaultView ? doc.defaultView.innerWidth + "x" + doc.defaultView.innerHeight : "?"} ===`);
      const imgs = Array.from(doc.getElementsByTagName("img")).slice(0, 200);
      out.push(`-- first ${imgs.length} images (natural size, tracked?, address, ancestors) --`);
      imgs.forEach((img) => {
        const chain: string[] = [];
        let e: Element | null = img.parentElement;
        for (let i = 0; e && i < 5; i++, e = e.parentElement) chain.push(e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(/\s+/).slice(0, 2).join(".") : ""));
        out.push(`${img.naturalWidth}x${img.naturalHeight} ${w.tracked.has(img) ? "TAGGED " + (w.tracked.get(img) as Tracked).how : "-"} ${img.currentSrc || img.src} <- ${chain.join(" < ")}`);
      });
      try {
        const g = doc.querySelector(".gpfocus [data-sanso-case]");
        const v = doc.defaultView;
        if (g && v) {
          out.push("-- focused cover: ancestors with style (outline | box-shadow | border) --");
          let e: Element | null = g;
          for (let i = 0; e && i < 8; i++, e = e.parentElement) {
            const cs = v.getComputedStyle(e);
            out.push(`${e.tagName.toLowerCase()}.${typeof e.className === "string" ? e.className.split(/\s+/).slice(0, 4).join(".") : ""} pop=${e.hasAttribute("data-sanso-pop")} | ${cs.outline} | ${cs.boxShadow.slice(0, 80)} | ${cs.borderTopWidth} ${cs.borderTopColor} | transform=${cs.transform.slice(0, 40)} ts=${cs.transformStyle} filter=${cs.filter}`);
          }
        }
      } catch (err) { /* ignore */ }
      out.push("-- unmatched covers: parent html --");
      let n = 0;
      w.tracked.forEach((tr) => {
        if (n < 15 && (tr.how === "raw" || tr.how === "none")) { n++; out.push((tr.img.parentElement ? tr.img.parentElement.outerHTML : tr.img.outerHTML).slice(0, 600)); }
      });
      out.push("-- body html (start) --");
      out.push((doc.body ? doc.body.innerHTML : "").slice(0, 40000));
    });
    return out.join("\n");
  }

  /** Re-read playtime etc. for every cover (e.g. after a game session ended). */
  refreshWear(): void {
    if (!this.settings.enabled) return;
    this.watches.forEach((w) => w.restyle());
  }

  /** Play the insert animation for a game (key = unsigned app id) or, with null, for any visible cover. */
  private lastInsert = { key: "", t: 0 };
  /** Play the insert animation for a game (key = unsigned app id). With null: the game page you are on, or any visible cover. */
  /** Called when a sealed game's wrap was torn off (its own "Sealed" wear can then be removed). */
  onTear: ((key: string) => void) | null = null;

  playInsert(key: string | null, opts: { eject?: boolean } = {}): boolean {
    const eject = !!opts.eject;
    // Steam's windows: the watched ones, or (3D cases switched off) straight from Steam, so the animation works on its own
    let docs: Document[] = Array.from(this.watches.keys());
    if (!docs.length) { try { docs = this.prov.getDocs().filter((x) => !!x && !!x.body); } catch (e) { docs = []; } }
    // the game page you are on (Play pressed there, or Preview)
    let pageDoc: Document | null = null;
    if (key === null) {
      docs.forEach((dd) => {
        const m = /\/library\/app\/(\d+)/.exec(screenPath(dd));
        if (m && !dd.hidden && !pageDoc) { key = normId(m[1]) || null; pageDoc = dd; }
      });
    }
    if (key !== null && !eject) {
      const now = Date.now();
      if (this.lastInsert.key === key && now - this.lastInsert.t < 8000) return false; // launch reported twice
      this.lastInsert = { key, t: now };
    }
    // the game's cover on screen: the case starts there and its picture is the art
    const onScreen = (im: HTMLImageElement, dd: Document): DOMRect | null => {
      let rect: DOMRect | null = null;
      try { rect = im.getBoundingClientRect(); } catch (e) { rect = null; }
      const vh = dd.defaultView ? dd.defaultView.innerHeight : 0;
      return rect && rect.width > 20 && rect.height > 20 && rect.bottom > 0 && rect.top < vh ? rect : null;
    };
    let hit: { doc: Document; img: HTMLImageElement; rect: DOMRect; key: string | null } | null = null;
    this.watches.forEach((w) => {
      if (w.doc.hidden) return;
      w.tracked.forEach((tr) => {
        if (hit || !tr.img.isConnected || (key !== null && tr.appid !== key)) return;
        const rect = onScreen(tr.img, w.doc);
        if (rect) hit = { doc: w.doc, img: tr.img, rect, key: tr.appid };
      });
    });
    if (!hit) {
      // 3D cases switched off (nothing is tagged) or this cover is not tagged: look for it on the page directly
      for (const dd of docs) {
        if (hit || dd.hidden) continue;
        const imgs = dd.getElementsByTagName("img");
        for (let i = 0; i < imgs.length && i < 600; i++) {
          const im = imgs[i] as HTMLImageElement;
          if (!isPortraitCover(im)) continue;
          const r = resolveAppId(im, this.prov);
          if (key !== null ? r.key !== key : !r.key) continue;
          if (isDecoy(im, dd.defaultView) || isTwinDecoy(im)) continue;
          const rect = onScreen(im, dd);
          if (rect) { hit = { doc: dd, img: im, rect, key: r.key }; break; }
        }
      }
    }
    const b: any = hit;
    const lookKey = key !== null ? key : b ? b.key : null;
    let doc: Document | null = b ? b.doc : pageDoc;
    if (!doc) {
      // not on screen (game page, Home...): the biggest visible Steam window
      let most = -1;
      docs.forEach((dd) => {
        const v = dd.defaultView; const area = v && !dd.hidden ? v.innerWidth * v.innerHeight : 0;
        if (area > most) { most = area; doc = dd; }
      });
    }
    if (!doc) return false;
    const look = lookFor(this.settings, this.prov, lookKey);
    const rect = b ? { left: b.rect.left, top: b.rect.top, width: b.rect.width, height: b.rect.height } : null;
    // the game's cover art: the picture already on screen, else the art Steam has for the game (custom art first)
    const cands: string[] = [];
    const add = (u: string) => { if (u && cands.indexOf(u) < 0) cands.push(u); };
    if (b) add(b.img.currentSrc || b.img.src);
    if (lookKey && this.prov.artUrls) { try { this.prov.artUrls(lookKey).forEach(add); } catch (e) { /* ignore */ } }
    // where Steam keeps a game's portrait art (custom art first): used when the calls above give nothing usable
    if (lookKey && /^\d+$/.test(lookKey)) {
      ["png", "jpg", "webp"].forEach((x) => add(`/customimages/${lookKey}p.${x}`));
      add(`/assets/${lookKey}/library_600x900.jpg`);
      add(`/assets/${lookKey}/library_600x900_2x.jpg`);
    }
    const d: Document = doc;
    // first launch of a sealed game: the wrap is torn off. "First" = never played, or the game itself is set to Sealed.
    let tear = false;
    if (!eject && lookKey && look.wear === "sealed") {
      let info: PlayInfo | null = null;
      try { info = this.prov.playInfo(lookKey); } catch (e) { info = null; }
      tear = this.settings.gameWears[lookKey] === "sealed" || (!!info && info.minutes <= 0 && !info.last);
    }
    const go = (art: string): boolean => {
      try {
        const ok = runInsert(d, { rect, art, look }, this.settings.insertTarget, this.settings.insertSound, { eject, tear });
        if (ok && tear && lookKey && this.onTear) this.onTear(lookKey);
        return ok;
      } catch (e) { this.noteError(e); return false; }
    };
    if (!cands.length || b) return go(cands[0] || "");
    // load the art first, all candidates at once, and take the best one that loads (at most ~1.5 s), so the case and
    // the disc are never blank. Relative addresses are Steam's own (steamloopback.host), as in its own pages.
    const view = d.defaultView as any;
    const done: boolean[] = [], good: boolean[] = [];
    let settled = false;
    const decide = (force: boolean) => {
      if (settled) return;
      for (let i = 0; i < cands.length; i++) {
        if (good[i]) { settled = true; go(cands[i]); return; }
        if (!done[i] && !force) return; // a better one may still come
      }
      if (force || done.filter(Boolean).length === cands.length) { settled = true; go(""); }
    };
    cands.forEach((u, i) => {
      const im = new view.Image();
      im.onload = () => { done[i] = true; good[i] = im.naturalWidth > 10 && im.naturalHeight > im.naturalWidth; decide(false); };
      im.onerror = () => { done[i] = true; decide(false); };
      im.src = u;
    });
    setTimeout(() => decide(true), 1500);
    return true;
  }

  // cheap: compares window identities and the screen address only; the page is scanned once per new window
  private discover(): void {
    if (!this.settings.enabled || this.sleeping) return;
    let docs: Document[] = [];
    try { docs = this.prov.getDocs(); } catch (e) { docs = []; }
    this.watches.forEach((w, doc) => {
      if (docs.indexOf(doc) < 0) { w.destroy(); this.watches.delete(doc); }
    });
    for (const doc of docs) {
      try {
        if (!doc.body) continue;
        let w = this.watches.get(doc);
        if (!w) {
          const o = doc.documentElement.getAttribute(OWNER_ATTR);
          if (o && o !== this.owner) continue; // the other injection method already looks after this window
          doc.documentElement.setAttribute(OWNER_ATTR, this.owner);
          w = new DocWatch(doc, this);
          this.watches.set(doc, w);
          ensureStyle(doc, buildCss(this.settings));
          w.checkPath(true);
        } else {
          if (!doc.getElementById(STYLE_ID)) ensureStyle(doc, buildCss(this.settings)); // Steam rebuilt <head>
          w.checkPath();
        }
      } catch (e) { this.noteError(e); }
    }
  }

  report(): string[] {
    const lines: string[] = [];
    lines.push(`Steam windows watched: ${this.watches.size}`);
    let tagged = 0;
    this.watches.forEach((w) => {
      const doc = w.doc;
      let box = 0, simple = 0;
      const how: Record<string, number> = { src: 0, fiber: 0, name: 0, raw: 0, none: 0 };
      const unknown: string[] = [];
      w.tracked.forEach((tr) => {
        if (tr.mode === "box") box++; else simple++;
        how[tr.how]++;
        if ((tr.how === "raw" || tr.how === "none") && unknown.length < 3) {
          unknown.push(`${tr.appid || "no id"}: ...${(tr.img.currentSrc || tr.img.src || "").slice(-46)}`);
        }
      });
      tagged += box + simple;
      lines.push(`- ${doc.title || "(untitled)"}: ${box} full 3D, ${simple} simple, ${w.decoys.size} glow/reflection copies left alone`);
      lines.push(`  screen: ${screenPath(doc) || "(unknown)"}${screenAllowed(doc, this.settings) ? "" : " (other screen, off)"}`);
      lines.push(`  game found by: picture address ${how.src}, Steam data ${how.fiber}, name ${how.name}; not in your game list ${how.raw}; no id ${how.none}`);
      unknown.forEach((x) => lines.push(`  unmatched ${x}`));
      try {
        const g = doc.querySelector(".gpfocus");
        if (g) lines.push(`  focused tile holds ${g.querySelectorAll("[data-sanso-case]").length} covers (should be 1)`);
      } catch (e) { /* ignore */ }
    });
    const st = this.stats;
    lines.push(`Work so far: ${st.imagesChecked} images checked in ${st.batches} slices, ${st.ms.toFixed(1)} ms total, ${st.mutationCalls} page changes seen.`);
    lines.push(tagged > 0 ? `OK: ${tagged} covers are 3D right now.` : "No covers tagged. Open your Library, then check again.");
    return lines;
  }
}
