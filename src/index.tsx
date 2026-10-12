import { callable, definePlugin, routerHook } from "@decky/api";
import {
  ButtonItem, DialogButton, Navigation, PanelSection, PanelSectionRow, Router, SliderField, staticClasses,
  TextField, ToggleField,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { FaCube } from "react-icons/fa";
import {
  CheckLine, CustomColor, DEFAULTS, Engine, Provider, SHAPE_IDS, SHAPE_LABELS, Settings, ShapeId, STYLE_IDS, StyleId, WEAR_IDS,
  WEAR_LABELS, WearId, DEFAULT_NAMES, NAMEABLE, NAME_SUFFIX, guessStyle, loadSettings, normId, paletteFor, saveSettings, styleLabel,
} from "./engine";

const PAGE = "/sanso-3d-cases";

// ---------- Steam data (undocumented, every access is guarded) ----------

function steamDocuments(): Document[] {
  const out: Document[] = [];
  const add = (w: any) => {
    try { if (w && w.document && w.document.body && out.indexOf(w.document) < 0) out.push(w.document); } catch (e) { /* ignore */ }
  };
  add(window);
  const R: any = Router;
  try { add(R && R.WindowStore && R.WindowStore.GamepadUIMainWindowInstance && R.WindowStore.GamepadUIMainWindowInstance.BrowserWindow); } catch (e) { /* ignore */ }
  try {
    const list = R && R.WindowStore && R.WindowStore.SteamUIWindows;
    if (list && typeof list.forEach === "function") list.forEach((x: any) => add(x && (x.BrowserWindow || x)));
  } catch (e) { /* ignore */ }
  return out;
}

interface AppEntry { key: string; id: number; name: string; shortcut: boolean }
let appIdx: { t: number; byKey: Map<string, AppEntry>; byName: Map<string, string | null> } | null = null;

const TOOL_NAMES = /proton|steam linux runtime|steamworks common|steamvr|redistributable/i;

// Every game Steam knows, keyed by the unsigned app id. Non-Steam shortcuts have negative / 64-bit ids; they are
// all folded into the same key here, so a cover and a game list entry always agree on who the game is.
function buildIndex(force?: boolean) {
  const now = Date.now();
  if (appIdx && !force && now - appIdx.t < 8000) return appIdx;
  const byKey = new Map<string, AppEntry>();
  const add = (a: any) => {
    try {
      if (!a || a.appid === undefined || !a.display_name) return;
      const key = normId(a.appid);
      if (!key || byKey.has(key)) return;
      byKey.set(key, { key, id: Number(a.appid), name: String(a.display_name), shortcut: a.app_type === 1073741824 });
    } catch (e) { /* ignore */ }
  };
  try {
    const cs: any = (window as any).collectionStore;
    const lists: any[] = [];
    if (cs) {
      lists.push(cs.allGamesCollection, cs.allAppsCollection, cs.localGamesCollection, cs.deckDesktopApps);
      try { if (cs.appTypeCollectionMap && cs.appTypeCollectionMap.get) { lists.push(cs.appTypeCollectionMap.get("type-games")); lists.push(cs.appTypeCollectionMap.get("type-other")); } } catch (e) { /* ignore */ }
      for (const c of (cs.userCollections || [])) lists.push(c);
    }
    for (const c of lists) {
      try {
        const apps = c && (c.allApps || (c.apps && typeof c.apps.values === "function" ? Array.from(c.apps.values()) : null));
        if (apps) for (const a of Array.from(apps) as any[]) add(a);
      } catch (e) { /* ignore */ }
    }
    try {
      const m: any = (window as any).appStore && (window as any).appStore.m_mapApps;
      if (m && typeof m.forEach === "function") m.forEach((a: any) => add(a));
    } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
  const byName = new Map<string, string | null>();
  byKey.forEach((e) => {
    const n = e.name.toLowerCase();
    byName.set(n, byName.has(n) ? null : e.key);
  });
  appIdx = { t: now, byKey, byName };
  return appIdx;
}

function appName(key: string): string {
  const e = buildIndex().byKey.get(key);
  if (e) return e.name;
  try {
    const st = (window as any).appStore;
    const o = st.GetAppOverviewByAppID(Number(key)) || st.GetAppOverviewByAppID(Number(key) | 0);
    return (o && o.display_name) || "";
  } catch (e2) { return ""; }
}

interface CollInfo { id: string; name: string; apps: string[] }
let collCache: { t: number; list: CollInfo[]; byApp: Map<string, string[]>; names: Map<string, string> } | null = null;

function collections(force?: boolean) {
  const now = Date.now();
  if (collCache && !force && now - collCache.t < 8000) return collCache;
  const list: CollInfo[] = [];
  try {
    const cs: any = (window as any).collectionStore;
    const uc: any[] = (cs && cs.userCollections) || [];
    for (const c of uc) {
      let apps: any[] = [];
      try {
        if (c.allApps) apps = Array.from(c.allApps);
        else if (c.apps && typeof c.apps.values === "function") apps = Array.from(c.apps.values());
      } catch (e) { apps = []; }
      list.push({
        id: String(c.id), name: String(c.displayName || c.name || c.id),
        apps: apps.map((a: any) => normId(a && (a.appid !== undefined ? a.appid : a))).filter((x: string) => !!x),
      });
    }
  } catch (e) { /* ignore */ }
  const byApp = new Map<string, string[]>();
  const names = new Map<string, string>();
  for (const c of list) {
    names.set(c.id, c.name);
    for (const a of c.apps) {
      const arr = byApp.get(a);
      if (arr) arr.push(c.id); else byApp.set(a, [c.id]);
    }
  }
  collCache = { t: now, list, byApp, names };
  return collCache;
}

const provider: Provider = {
  getDocs: steamDocuments,
  appName,
  collectionsOf: (key) => collections().byApp.get(key) || [],
  collectionName: (id) => collections().names.get(id) || "",
  resolveId: (cands) => {
    let ix = buildIndex();
    for (let pass = 0; pass < 2; pass++) {
      for (const c of cands) {
        const k = normId(c);
        if (k && ix.byKey.has(k)) return k;
      }
      // a game added a moment ago (new shortcut) may not be in the list yet: refresh once, at most every 3 s
      if (pass === 0 && Date.now() - ix.t > 3000) ix = buildIndex(true); else break;
    }
    return null;
  },
  byName: (name) => buildIndex().byName.get(name.trim().toLowerCase()) || null,
  playInfo: (key) => {
    try {
      const st = (window as any).appStore;
      const e = buildIndex().byKey.get(key);
      const o = st.GetAppOverviewByAppID(e ? e.id : Number(key)) || st.GetAppOverviewByAppID(Number(key) | 0);
      if (!o) return null;
      return { minutes: Number(o.minutes_playtime_forever) || 0, last: Number(o.rt_last_time_played) || 0 };
    } catch (e) { return null; }
  },
};

interface GameInfo { id: string; name: string; shortcut: boolean }
function allGames(): GameInfo[] {
  const out: GameInfo[] = [];
  buildIndex().byKey.forEach((e) => { if (!TOOL_NAMES.test(e.name)) out.push({ id: e.key, name: e.name, shortcut: e.shortcut }); });
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

const VERSION = "1.8.2";
const lifeStats = { api: false, events: 0, last: 0 };

// ---------- optional background part (reports, fallback injection, safe-mode file) ----------
// Every call has a timeout: if the Python part is not running, a callable never answers. The 3D effect never waits for it.

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("no answer")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
async function be<T>(fn: () => Promise<T>, ms?: number): Promise<T | null> {
  try { return await withTimeout(fn(), ms || 4000); } catch (e) { return null; }
}
const cPing = callable<[], any>("ping");
const cGetSafe = callable<[], boolean>("get_safe_mode");
const cSetSafe = callable<[boolean], boolean>("set_safe_mode");
const cSaveReport = callable<[string], any>("save_report");
const cFbStart = callable<[string, string], any>("fallback_start");
const cFbCall = callable<[string, string], any>("fallback_call");
const cFbStop = callable<[], any>("fallback_stop");

// ---------- shared state ----------

let engine: Engine | null = null;
let current: Settings = loadSettings();
const listeners = new Set<() => void>();
const fb = { active: false, targets: 0, error: "" };
let lastReport = "";
let autoSaved = false;
let timers: any[] = [];
let dataTimer: any = null;
let pushTimer: any = null;
let errBase = 0;
const BOOT_KEY = "sanso-3d-boot";
const REASON_KEY = "sanso-3d-safe-reason";

function notify() { listeners.forEach((f) => f()); }

function commit(next: Settings) {
  current = next;
  saveSettings(next);
  if (engine) engine.update(next);
  if (fb.active) schedulePush();
  notify();
}

function usingFallback(): boolean {
  return fb.active && !(engine && engine.libraryReachable());
}

function buildData() {
  const ix = buildIndex(true);
  const apps: any[] = [];
  ix.byKey.forEach((e) => {
    if (apps.length >= 5000) return;
    const p = provider.playInfo(e.key);
    apps.push({ k: e.key, n: e.name, sc: e.shortcut ? 1 : 0, m: p ? p.minutes : 0, l: p ? p.last : 0 });
  });
  const colls = collections(true).list.map((c) => ({ id: c.id, n: c.name, a: c.apps }));
  return { apps, colls };
}

async function fallbackCall(name: string, arg: string): Promise<any> {
  return be(() => cFbCall(name, arg), 9000);
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { void fallbackCall("update", JSON.stringify(current)); }, 400);
}

async function startFallback(): Promise<void> {
  if (fb.active || current.safeMode || current.fallback === "off") return;
  const r = await be(() => cFbStart(JSON.stringify(current), JSON.stringify(buildData())), 30000);
  if (r && r.ok) {
    fb.active = true; fb.targets = r.targets; fb.error = "";
    clearInterval(dataTimer);
    dataTimer = setInterval(() => { void fallbackCall("setData", JSON.stringify(buildData())); }, 60000);
  } else {
    fb.error = r ? (r.error || "no library window found") : "the background part is not answering";
    if (!autoSaved) { autoSaved = true; void saveReport("Fallback injection failed: " + fb.error); }
  }
  notify();
}

async function stopFallback(): Promise<void> {
  clearInterval(dataTimer); clearTimeout(pushTimer);
  const was = fb.active;
  fb.active = false; fb.targets = 0;
  if (was) await be(() => cFbStop(), 6000);
  notify();
}

function startEngine() {
  if (engine || current.safeMode || current.fallback === "always") return;
  engine = new Engine(current, provider, { selfDoc: document });
  engine.start();
  errBase = 0;
}
function stopEngine() {
  if (engine) { engine.stop(); engine = null; }
}

function scheduleFallbackChecks() {
  const maybe = () => {
    if (current.safeMode || current.fallback === "off" || fb.active) return;
    if (current.fallback === "always" || (engine && !engine.libraryReachable())) void startFallback();
  };
  timers.push(setTimeout(maybe, current.fallback === "always" ? 800 : 8000));
  timers.push(setTimeout(maybe, 25000));
}

function enterSafe(reason: string) {
  try { window.localStorage.setItem(REASON_KEY, reason); } catch (e) { /* ignore */ }
  stopEngine();
  void stopFallback();
  void be(() => cSetSafe(true));
  commit({ ...current, safeMode: true });
}
function leaveSafe() {
  try { window.localStorage.removeItem(REASON_KEY); window.localStorage.setItem(BOOT_KEY, JSON.stringify({ running: false, n: 0, t: Date.now() })); } catch (e) { /* ignore */ }
  void be(() => cSetSafe(false));
  commit({ ...current, safeMode: false });
  startEngine();
  scheduleFallbackChecks();
}

// If the plugin keeps failing to survive its first seconds (for example the library breaks and Steam restarts),
// it switches itself off after three tries in a row.
function bootGuard(): boolean {
  try {
    const raw = window.localStorage.getItem(BOOT_KEY);
    const prev = raw ? JSON.parse(raw) : null;
    const n = prev && prev.running ? (prev.n || 0) + 1 : 0;
    window.localStorage.setItem(BOOT_KEY, JSON.stringify({ running: true, n, t: Date.now() }));
    timers.push(setTimeout(() => { try { window.localStorage.setItem(BOOT_KEY, JSON.stringify({ running: false, n: 0, t: Date.now() })); } catch (e) { /* ignore */ } }, 25000));
    return n >= 3;
  } catch (e) { return false; }
}

// ---------- game launch / exit notifications (experimental animation + wear refresh) ----------

let lifeHandle: any = null;

async function playInsertAny(key: string | null): Promise<void> {
  if (engine && engine.libraryReachable()) engine.playInsert(key);
  else if (fb.active) await fallbackCall("playInsert", JSON.stringify(key));
}
async function refreshAny(): Promise<void> {
  if (engine && engine.libraryReachable()) engine.refreshWear();
  else if (fb.active) await fallbackCall("setData", JSON.stringify(buildData()));
}

function hookLifetime(): void {
  try {
    const sc: any = (window as any).SteamClient;
    const reg = sc && sc.GameSessions && sc.GameSessions.RegisterForAppLifetimeNotifications;
    if (!reg) return;
    lifeStats.api = true;
    lifeHandle = reg.call(sc.GameSessions, (n: any) => {
      try {
        if (!n) return;
        lifeStats.events++; lifeStats.last = Date.now();
        if (current.safeMode) return;
        const key = normId(n.unAppID !== undefined ? n.unAppID : n.appid);
        if (n.bRunning) { if (current.insertAnim && key) void playInsertAny(key); }
        else void refreshAny();
      } catch (e) { /* never let a notification break Steam */ }
    });
  } catch (e) { /* not available */ }
}
function unhookLifetime(): void {
  try { if (lifeHandle && typeof lifeHandle.unregister === "function") lifeHandle.unregister(); } catch (e) { /* ignore */ }
  lifeHandle = null;
}

// ---------- self-check and saved reports ----------

const TAG: Record<string, string> = { ok: "OK", fail: "FAIL", warn: "WARN", skip: "--" };

async function runSelfCheck(): Promise<{ lines: string[]; failed: boolean }> {
  const out: string[] = [];
  let failed = false;
  const add = (st: string, label: string, detail: string) => {
    out.push(`[${TAG[st]}] ${label}${detail ? " - " + detail : ""}`);
    if (st === "fail") failed = true;
  };
  if (current.safeMode) { add("warn", "Safe mode", "the plugin is switched off on purpose"); return { lines: out, failed: false }; }
  const pong = await be(() => cPing(), 2500);
  add(pong ? "ok" : "warn", "Background part", pong ? "answering (reports and fallback available)" : "not answering; the 3D effect still works, reports and fallback do not");
  let store = false;
  try { window.localStorage.setItem("sanso-3d-test", "1"); store = window.localStorage.getItem("sanso-3d-test") === "1"; window.localStorage.removeItem("sanso-3d-test"); } catch (e) { store = false; }
  add(store ? "ok" : "fail", "Settings storage", store ? "works" : "cannot save settings");
  const ix = buildIndex(true);
  let sc = 0; ix.byKey.forEach((e) => { if (e.shortcut) sc++; });
  add(ix.byKey.size > 0 ? "ok" : "fail", "Game list read", `${ix.byKey.size} games, ${sc} non-Steam`);
  const cl = collections(true).list;
  add(cl.length > 0 ? "ok" : "warn", "Collections read", `${cl.length} collections`);
  let lines: CheckLine[] = [];
  if (usingFallback()) {
    add("ok", "Library reached through", `fallback injection (${fb.targets} window)`);
    const r = await fallbackCall("selfCheck", "");
    lines = r && r.ok && r.values && r.values[0] ? r.values[0] : [];
    if (!lines.length) add("fail", "Fallback answers", "no reply from the injected part");
  } else if (engine) {
    lines = engine.selfCheck();
  } else if (current.fallback === "always") {
    add("warn", "Fallback", fb.active ? "active" : `not running${fb.error ? " (" + fb.error + ")" : ""}`);
  }
  lines.forEach((l) => add(l.status, l.label, l.detail));
  if (current.fallback !== "off" && !fb.active && fb.error) add("warn", "Fallback injection", `could not start: ${fb.error}`);
  add(lifeStats.api ? "ok" : "fail", "Launch notifications", lifeStats.api ? "Steam's launch notification is available" : "not available; the insert animation and automatic wear refresh cannot work");
  add(lifeStats.events > 0 ? "ok" : "skip", "Launch notification received", lifeStats.events > 0 ? `${lifeStats.events} event(s) since the plugin started` : "none yet; start a game to test it");
  return { lines: out, failed };
}

async function saveReport(reason: string): Promise<string | null> {
  try {
    const chk = await runSelfCheck();
    let snap = "";
    if (usingFallback()) {
      const r = await fallbackCall("snapshot", "");
      snap = r && r.ok && r.values && r.values[0] ? String(r.values[0]) : "(no snapshot from the fallback)";
    } else if (engine) snap = engine.snapshot();
    const text = [
      `Finally 3D Game Cases report`, `reason: ${reason}`, `plugin version: ${VERSION}`, "",
      "SELF-CHECK", ...chk.lines, "", "SETTINGS", JSON.stringify(current), "", "WHAT THE PLUGIN SEES", snap,
    ].join("\n");
    const r = await be(() => cSaveReport(text), 8000);
    if (r && r.ok) { lastReport = r.path; notify(); return r.path; }
  } catch (e) { /* ignore */ }
  return null;
}

// slow, cheap watchdog: too many internal errors -> safe mode; many unmatched covers -> save a report once
function guardTick() {
  if (!engine || current.safeMode) return;
  if (engine.errors - errBase > 20) { enterSafe("The plugin hit too many internal errors and switched itself off."); return; }
  if (!autoSaved) {
    const t = engine.coverTotals();
    if (t.covers >= 8 && t.unmatched / t.covers > 0.25) { autoSaved = true; void saveReport("Many covers could not be matched to games"); }
  }
}

const CSS = `
.c3d-seg { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 6px !important; width: 100%; }
.c3d-seg > * { margin: 0 !important; min-width: 0 !important; width: 100% !important; height: 36px !important;
  min-height: 36px !important; padding: 0 4px !important; font-size: 12.5px !important; line-height: 1 !important;
  display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; }
.c3d-seg .on { background: #1a9fff !important; color: #fff !important; font-weight: bold; }
.c3d-note { font-size: 12px; line-height: 1.4; opacity: .8; padding: 6px 0; white-space: pre-wrap; }
.c3d-page { margin-top: 40px; height: calc(100% - 40px); overflow-y: auto; padding: 0 28px 40px 28px; box-sizing: border-box; }
.c3d-page h2 { margin: 10px 0 6px 0; font-size: 20px; }
.c3d-tabs { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px !important; margin: 8px 0 12px 0; }
.c3d-tabs > * { margin: 0 !important; height: 40px !important; min-height: 40px !important; }
.c3d-tabs .on { background: #1a9fff !important; color: #fff !important; font-weight: bold; }
.c3d-row { display: flex !important; align-items: center; gap: 12px; width: 100% !important; height: 46px !important;
  min-height: 46px !important; margin: 0 0 6px 0 !important; padding: 0 12px !important; box-sizing: border-box !important; text-align: left; justify-content: flex-start !important; }
.c3d-row .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
.c3d-row .st { font-size: 13px; opacity: .9; white-space: nowrap; }
.c3d-sw { width: 14px; height: 26px; border-radius: 2px; flex: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); }
.c3d-tabs3 { display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 8px !important; margin: 8px 0 12px 0; }
.c3d-tabs3 > * { margin: 0 !important; height: 40px !important; min-height: 40px !important; }
.c3d-tabs3 .on { background: #1a9fff !important; color: #fff !important; font-weight: bold; }
.c3d-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 8px !important; margin-bottom: 14px; }
.c3d-grid > * { margin: 0 !important; height: 46px !important; min-height: 46px !important; display: flex !important; align-items: center !important;
  justify-content: flex-start !important; gap: 10px; padding: 0 10px !important; font-size: 13px !important; box-sizing: border-box !important; min-width: 0 !important; }
.c3d-grid .on { outline: 2px solid #1a9fff; }
.c3d-card { border: 1px solid rgba(255,255,255,.15); border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; }
.c3d-seg3 { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 6px !important; width: 100%; }
.c3d-seg3 > * { margin: 0 !important; min-width: 0 !important; width: 100% !important; height: 36px !important; min-height: 36px !important; padding: 0 4px !important; font-size: 12px !important; line-height: 1.1 !important; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; }
.c3d-seg3 .on { background: #1a9fff !important; color: #fff !important; font-weight: bold; }
.c3d-chk { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.6); border-radius: 3px; flex: none; box-sizing: border-box; }
.c3d-chk.on { background: #1a9fff; border-color: #1a9fff; }
.c3d-hint { font-size: 13px; opacity: .75; margin: 4px 0 10px 0; line-height: 1.4; }
`;

function Swatch(props: { s: Settings; id: StyleId }) {
  const p = paletteFor(props.s, props.id);
  return <div className="c3d-sw" style={{ background: `linear-gradient(90deg, ${p.a}, ${p.b})`, border: "1px solid rgba(255,255,255,.25)" }} />;
}

function useSettings(): Settings {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n: number) => n + 1);
    listeners.add(f);
    return () => { listeners.delete(f); };
  }, []);
  return current;
}

type Target = { kind: "game" | "coll" | "default" | "bulk"; id: string; name: string; ids?: string[] };

function Picker(props: { s: Settings; target: Target; onPick: (id: StyleId | null) => void; onWear: (w: WearId | null) => void; onBack: () => void }) {
  const { s, target } = props;
  const all: StyleId[] = [...STYLE_IDS, ...s.customs.map((c) => "custom:" + c.id)];
  const cur = target.kind === "game" ? s.games[target.id] : target.kind === "coll" ? s.collections[target.id] : target.kind === "default" ? s.color : undefined;
  const curWear = target.kind === "coll" ? s.wears[target.id] : target.kind === "game" ? s.gameWears[target.id] : undefined;
  return (
    <div>
      <h2>Look for: {target.name}</h2>
      <DialogButton style={{ marginBottom: 10 }} onClick={props.onBack}>Back</DialogButton>
      <div className="c3d-grid">
        {target.kind !== "default" && (
          <DialogButton className={!cur ? "on" : ""} onClick={() => props.onPick(null)}>Automatic</DialogButton>
        )}
        {all.map((id) => (
          <DialogButton key={id} className={cur === id ? "on" : ""} onClick={() => props.onPick(id)}>
            <Swatch s={s} id={id} /><span className="nm">{styleLabel(s, id)}</span>
          </DialogButton>
        ))}
      </div>
      {target.kind !== "default" && (
        <div>
          <h2>Wear for {target.kind === "coll" ? "this collection" : target.kind === "bulk" ? "these games" : "this game"}</h2>
          <div className="c3d-grid">
            <DialogButton className={!curWear ? "on" : ""} onClick={() => props.onWear(null)}>Automatic</DialogButton>
            {WEAR_IDS.map((w) => (
              <DialogButton key={w} className={curWear === w ? "on" : ""} onClick={() => props.onWear(w)}>{WEAR_LABELS[w]}</DialogButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomEditor(props: { s: Settings; c: CustomColor }) {
  const { s, c } = props;
  const upd = (patch: Partial<CustomColor>) =>
    commit({ ...s, customs: s.customs.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) });
  const del = () => {
    const key = "custom:" + c.id;
    const games = { ...s.games }, collections = { ...s.collections };
    Object.keys(games).forEach((k) => { if (games[k] === key) delete games[k]; });
    Object.keys(collections).forEach((k) => { if (collections[k] === key) delete collections[k]; });
    commit({ ...s, customs: s.customs.filter((x) => x.id !== c.id), games, collections, color: s.color === key ? "black" : s.color });
  };
  return (
    <div className="c3d-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Swatch s={s} id={"custom:" + c.id} />
        <div style={{ flex: 1 }}><TextField label="Name" value={c.name} onChange={(e: any) => upd({ name: String(e.target.value).slice(0, 24) })} /></div>
      </div>
      <SliderField label="Colour (hue)" value={c.h} min={0} max={360} step={1} showValue onChange={(v: number) => upd({ h: v })} />
      <SliderField label="Strength" value={c.s} min={0} max={100} step={1} showValue onChange={(v: number) => upd({ s: v })} />
      <SliderField label="Light / dark" value={c.l} min={5} max={90} step={1} showValue onChange={(v: number) => upd({ l: v })} />
      <ToggleField label="Crystal (see-through)" checked={c.glass} onChange={(v: boolean) => upd({ glass: v })} />
      <div className="c3d-seg" style={{ marginTop: 8 }}>
        {(["auto", ...SHAPE_IDS] as (ShapeId | "auto")[]).map((sh) => (
          <DialogButton key={sh} className={c.shape === sh ? "on" : ""} onClick={() => upd({ shape: sh })}>{SHAPE_LABELS[sh]}</DialogButton>
        ))}
      </div>
      <DialogButton style={{ marginTop: 8 }} onClick={del}>Delete this colour</DialogButton>
    </div>
  );
}

// ---------- full-screen page ----------

function CasesPage() {
  const s = useSettings();
  const [tab, setTab] = useState<"games" | "collections" | "colours">("games");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const games = tab === "games" ? allGames() : [];
  const colls = tab === "collections" ? collections().list : [];
  const needle = q.trim().toLowerCase();
  const matches = games.filter((g) => !needle || g.name.toLowerCase().indexOf(needle) >= 0);
  const shown = matches.slice(0, 60);

  const pick = (id: StyleId | null) => {
    if (!target) return;
    if (target.kind === "default") { if (id) commit({ ...s, color: id }); }
    else if (target.kind === "bulk") {
      const map = { ...s.games };
      (target.ids || []).forEach((g) => { if (id) map[g] = id; else delete map[g]; });
      commit({ ...s, games: map });
      setSel([]); setSelecting(false);
    } else {
      const map = { ...(target.kind === "game" ? s.games : s.collections) };
      if (id) map[target.id] = id; else delete map[target.id];
      commit(target.kind === "game" ? { ...s, games: map } : { ...s, collections: map });
    }
    setTarget(null);
  };
  const setWear = (w: WearId | null) => {
    if (!target || target.kind === "default") return;
    if (target.kind === "coll") {
      const wears = { ...s.wears };
      if (w) wears[target.id] = w; else delete wears[target.id];
      commit({ ...s, wears });
    } else {
      const gameWears = { ...s.gameWears };
      const ids = target.kind === "bulk" ? (target.ids || []) : [target.id];
      ids.forEach((g) => { if (w) gameWears[g] = w; else delete gameWears[g]; });
      commit({ ...s, gameWears });
      if (target.kind === "bulk") { setSel([]); setSelecting(false); setTarget(null); }
    }
  };
  const addCustom = () => {
    const id = Math.random().toString(36).slice(2, 8);
    commit({ ...s, customs: [...s.customs, { id, name: "My colour " + (s.customs.length + 1), h: 210, s: 70, l: 45, glass: false, shape: "auto" as const }].slice(0, 12) });
  };
  const toggleSel = (id: string) => setSel(sel.indexOf(id) >= 0 ? sel.filter((x) => x !== id) : [...sel, id]);

  if (target) {
    return (
      <div className="c3d-page"><style>{CSS}</style>
        <Picker s={s} target={target} onPick={pick} onWear={setWear} onBack={() => setTarget(null)} />
      </div>
    );
  }

  return (
    <div className="c3d-page">
      <style>{CSS}</style>
      <h2>Finally 3D Game Cases: looks</h2>
      <div className="c3d-hint">
        Press a row to choose its look. A game's own look wins over its collection's look, which wins over the automatic
        guess and the default look. Non-Steam games are listed too.
      </div>
      <div className="c3d-tabs3">
        <DialogButton className={tab === "games" ? "on" : ""} onClick={() => setTab("games")}>Games</DialogButton>
        <DialogButton className={tab === "collections" ? "on" : ""} onClick={() => setTab("collections")}>Collections</DialogButton>
        <DialogButton className={tab === "colours" ? "on" : ""} onClick={() => setTab("colours")}>Colours</DialogButton>
      </div>
      {tab === "games" && (
        <div>
          <TextField label="Search games" value={q} onChange={(e: any) => setQ(e.target.value)} />
          <div style={{ height: 8 }} />
          <div className="c3d-grid">
            <DialogButton className={selecting ? "on" : ""} onClick={() => { setSelecting(!selecting); setSel([]); }}>Select several</DialogButton>
            {selecting && <DialogButton onClick={() => setSel(matches.map((g) => g.id))}>Select all {matches.length} shown by search</DialogButton>}
            {selecting && sel.length > 0 && (
              <DialogButton className="on" onClick={() => setTarget({ kind: "bulk", id: "", name: `${sel.length} selected games`, ids: sel })}>
                Choose look or wear for {sel.length}
              </DialogButton>
            )}
          </div>
          {games.length === 0 && <div className="c3d-hint">Couldn't read your game list from Steam.</div>}
          {shown.map((g) => {
            const own = s.games[g.id];
            const on = sel.indexOf(g.id) >= 0;
            return (
              <DialogButton key={g.id} className="c3d-row"
                onClick={() => (selecting ? toggleSel(g.id) : setTarget({ kind: "game", id: g.id, name: g.name }))}>
                {selecting && <div className={"c3d-chk" + (on ? " on" : "")} />}
                <Swatch s={s} id={own || s.color} />
                <span className="nm">{g.name}{g.shortcut ? " (non-Steam)" : ""}</span>
                <span className="st">{own ? styleLabel(s, own) : "Automatic"}{s.gameWears[g.id] ? ` - ${WEAR_LABELS[s.gameWears[g.id]]}` : ""}</span>
              </DialogButton>
            );
          })}
          {matches.length > shown.length && <div className="c3d-hint">Showing {shown.length} of {matches.length}. Use search to narrow it down.</div>}
        </div>
      )}
      {tab === "collections" && (
        <div>
          {colls.length === 0 && <div className="c3d-hint">No collections found. Make some in your Library first.</div>}
          {colls.map((c) => {
            const own = s.collections[c.id];
            const guess = s.autoGuess ? guessStyle(c.name, s) : null;
            const wear = s.wears[c.id];
            return (
              <DialogButton key={c.id} className="c3d-row" onClick={() => setTarget({ kind: "coll", id: c.id, name: c.name })}>
                <Swatch s={s} id={own || guess || s.color} />
                <span className="nm">{c.name} ({c.apps.length})</span>
                <span className="st">{own ? styleLabel(s, own) : guess ? `Auto: ${styleLabel(s, guess)}` : "Default"}{wear ? ` - ${WEAR_LABELS[wear]}` : ""}</span>
              </DialogButton>
            );
          })}
        </div>
      )}
      {tab === "colours" && (
        <div>
          <DialogButton className="c3d-row" onClick={() => setTarget({ kind: "default", id: "", name: "Default (all other games)" })}>
            <Swatch s={s} id={s.color} /><span className="nm">Default look</span><span className="st">{styleLabel(s, s.color)}</span>
          </DialogButton>
          <DialogButton className="c3d-row" onClick={() => commit({ ...s, wear: WEAR_IDS[(WEAR_IDS.indexOf(s.wear) + 1) % WEAR_IDS.length] })}>
            <span className="nm">Default wear (press to change)</span><span className="st">{WEAR_LABELS[s.wear]}</span>
          </DialogButton>
          <h2>Console names</h2>
          <div className="c3d-hint">These four looks have names you can change. Type any name you like, including a real one. A collection whose name contains one of these names gets that look automatically.</div>
          <div className="c3d-card">
            {NAMEABLE.map((id) => (
              <TextField key={id} label={`Name for the ${NAME_SUFFIX[id]} look`}
                value={s.names[id] !== undefined ? s.names[id] : DEFAULT_NAMES[id]}
                onChange={(e: any) => commit({ ...s, names: { ...s.names, [id]: String(e.target.value).slice(0, 24) } })} />
            ))}
            <DialogButton style={{ marginTop: 8 }} onClick={() => commit({ ...s, names: {} })}>Reset names</DialogButton>
          </div>
          <h2>My colours</h2>
          <div className="c3d-hint">Make your own: pick a colour, how strong it is and how light or dark, and a case shape. Then choose it for a game, collection or as the default.</div>
          {s.customs.map((c) => <CustomEditor key={c.id} s={s} c={c} />)}
          {s.customs.length < 12 && <DialogButton onClick={addCustom}>Add a colour</DialogButton>}
        </div>
      )}
    </div>
  );
}

// ---------- Quick Access panel ----------

function Content() {
  const s = useSettings();
  const [lines, setLines] = useState<string[]>([]);
  const [info, setInfo] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const change = (patch: Partial<Settings>) => commit({ ...s, ...patch });

  const doCheck = async () => {
    setBusy("Checking...");
    const r = await runSelfCheck();
    setLines(r.lines);
    if (!current.checkedOnce) commit({ ...current, checkedOnce: true });
    if (r.failed) {
      const path = await saveReport("Self-check found a problem");
      if (path) setLines([...r.lines, "", "A report was saved: " + path]);
    }
    setBusy("");
  };
  const doReport = async () => {
    setBusy("Saving...");
    const path = await saveReport("Saved by hand");
    setLines(path ? ["Report saved: " + path] : ["Could not save a report. The background part is not answering, so only the on-screen check works."]);
    setBusy("");
  };
  const setFallback = (m: "auto" | "off" | "always") => {
    commit({ ...current, fallback: m });
    if (m === "always") { stopEngine(); void startFallback(); }
    else if (m === "off") { void stopFallback(); startEngine(); }
    else { startEngine(); scheduleFallbackChecks(); }
  };

  if (s.safeMode) {
    let reason = "";
    try { reason = window.localStorage.getItem(REASON_KEY) || ""; } catch (e) { /* ignore */ }
    return (
      <div>
        <style>{CSS}</style>
        <PanelSection title="Safe mode is ON">
          <PanelSectionRow>
            <div className="c3d-note">{"Everything is switched off: no 3D cases, no injected styles, no listeners.\n" + (reason ? reason + "\n" : "") + "This stays off after restarts until you turn it back on."}</div>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={leaveSafe}>Turn the plugin back on</ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div className="c3d-note">{"If the library is broken and you cannot open this panel, run this in Konsole, then restart Steam:\ntouch ~/homebrew/settings/3d-game-cases/SAFE_MODE"}</div>
          </PanelSectionRow>
        </PanelSection>
      </div>
    );
  }

  const fbText = fb.active ? `Fallback injection active (${fb.targets} window)` : fb.error ? `Fallback not running: ${fb.error}` : s.fallback === "off" ? "Fallback is off" : "Fallback standby (starts only if the library window cannot be reached)";

  return (
    <div>
      <style>{CSS}</style>
      {!s.checkedOnce && (
        <PanelSection title="First time?">
          <PanelSectionRow>
            <div className="c3d-note">Press "Run self-check" once. It tests every step and shows a pass or fail line for each. A photo of the result is all that is needed if something does not work.</div>
          </PanelSectionRow>
        </PanelSection>
      )}
      <PanelSection title="Self-check">
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} onClick={doCheck}>{busy || "Run self-check"}</ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} description={lastReport ? "Last: " + lastReport : "Saved to the Downloads folder"} onClick={doReport}>Save a report now</ButtonItem>
        </PanelSectionRow>
        {lines.length > 0 && <PanelSectionRow><div className="c3d-note">{lines.join("\n")}</div></PanelSectionRow>}
      </PanelSection>
      <PanelSection title="Finally 3D Game Cases">
        <PanelSectionRow>
          <ToggleField label="Enable 3D cases" checked={s.enabled} onChange={(v: boolean) => change({ enabled: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" description={`Default: ${styleLabel(s, s.color)}`} onClick={() => { Router.CloseSideMenus(); Navigation.Navigate(PAGE); }}>
            Looks, colours and presets
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Also on Home and game pages" description="Off = library grids only"
            checked={s.otherScreens} onChange={(v: boolean) => change({ otherScreens: v })} />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Case shape">
        <PanelSectionRow>
          <div className="c3d-seg">
            {(["auto", ...SHAPE_IDS] as (ShapeId | "auto")[]).map((sh) => (
              <DialogButton key={sh} className={s.shape === sh ? "on" : ""} onClick={() => change({ shape: sh })}>{SHAPE_LABELS[sh]}</DialogButton>
            ))}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField label="Case thickness" value={s.depth} min={6} max={30} step={1} showValue onChange={(v: number) => change({ depth: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField label="Tilt of the game you are on" value={s.angle} min={0} max={40} step={1} showValue onChange={(v: number) => change({ angle: v })} />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Effects">
        <PanelSectionRow>
          <ToggleField label="Gentle floating on hover" description="Tiny drift left/right and up/down on the game you are on"
            checked={s.float} onChange={(v: boolean) => change({ float: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Foil shine on hover" description="A light sweep across the case when a game pops out"
            checked={s.shine} onChange={(v: boolean) => change({ shine: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Plastic sleeve and rounded corners" description="Clear sleeve edge and the hinge ridge of a real keepcase"
            checked={s.sleeve} onChange={(v: boolean) => change({ sleeve: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Pick-up when you open a game" description="A quick lift when you press A (Steam may open the game page before it ends)"
            checked={s.pickup} onChange={(v: boolean) => change({ pickup: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Neighbours lean away" description="The games beside the one you are on tilt back a little, like on a shelf"
            checked={s.neighbors} onChange={(v: boolean) => change({ neighbors: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <div className="c3d-seg3">
            {(["calm", "normal", "snappy"] as const).map((sp) => (
              <DialogButton key={sp} className={s.speed === sp ? "on" : ""} onClick={() => change({ speed: sp })}>
                {sp === "calm" ? "Calm" : sp === "snappy" ? "Snappy" : "Normal speed"}
              </DialogButton>
            ))}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Plastic gloss" checked={s.gloss} onChange={(v: boolean) => change({ gloss: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Shadow" checked={s.shadow} onChange={(v: boolean) => change({ shadow: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Colour band on top" checked={s.band} onChange={(v: boolean) => change({ band: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Guess look from collection name" description="PS1-PS5, PSP, Xbox, Xbox 360, your console names, Sega, retro..."
            checked={s.autoGuess} onChange={(v: boolean) => change({ autoGuess: v })} />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Wear from playtime">
        <PanelSectionRow>
          <ToggleField label="Cases wear as you play" description="Never opened = sealed, a little = mint, then scuffs, worn, battered. Not played for a year = sun-faded. A collection's own wear wins."
            checked={s.playWear} onChange={(v: boolean) => change({ playWear: v })} />
        </PanelSectionRow>
        {s.playWear && (
          <PanelSectionRow>
            <div className="c3d-seg3">
              {(["slow", "normal", "fast"] as const).map((w) => (
                <DialogButton key={w} className={s.wearSpeed === w ? "on" : ""} onClick={() => change({ wearSpeed: w })}>
                  {w === "slow" ? "Wears slowly" : w === "fast" ? "Wears fast" : "Normal"}
                </DialogButton>
              ))}
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>
      <PanelSection title="Experimental">
        <PanelSectionRow>
          <ToggleField label="Insert animation on launch" description="The case opens and the disc (or game card) flies into the slot when a game starts. May be cut short by Steam's loading screen."
            checked={s.insertAnim} onChange={(v: boolean) => change({ insertAnim: v })} />
        </PanelSectionRow>
        <PanelSectionRow>
          <div className="c3d-seg3">
            {(["auto", "handheld", "console"] as const).map((t) => (
              <DialogButton key={t} className={s.insertTarget === t ? "on" : ""} onClick={() => change({ insertTarget: t })}>
                {t === "auto" ? "Slot: auto" : t === "handheld" ? "Bottom slot" : "Side slot"}
              </DialogButton>
            ))}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => { Router.CloseSideMenus(); setTimeout(() => { void playInsertAny(null); }, 450); }}>
            Preview the animation
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Per-game wear">
        <PanelSectionRow>
          <div className="c3d-note">Set one game to Mint, Battered and so on from "Looks, colours and presets", then press the game. A game's own wear wins over everything.</div>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Fallback and safe mode">
        <PanelSectionRow>
          <div className="c3d-seg3">
            {(["auto", "off", "always"] as const).map((m) => (
              <DialogButton key={m} className={s.fallback === m ? "on" : ""} onClick={() => setFallback(m)}>
                {m === "auto" ? "Fallback: auto" : m === "off" ? "Fallback: off" : "Fallback: always"}
              </DialogButton>
            ))}
          </div>
        </PanelSectionRow>
        <PanelSectionRow><div className="c3d-note">{fbText}</div></PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" description="Removes everything and stays off after restarts" onClick={() => enterSafe("You switched safe mode on.")}>Safe mode: turn everything off</ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Tools">
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={async () => {
            if (usingFallback()) { const r = await fallbackCall("report", ""); setInfo(r && r.ok && r.values && r.values[0] ? r.values[0] : ["No answer from the fallback."]); }
            else setInfo(engine ? engine.report() : ["Not running."]);
          }}>Check what it found</ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => commit({ ...DEFAULTS, customs: s.customs, games: s.games, collections: s.collections, wears: s.wears, gameWears: s.gameWears, names: s.names, checkedOnce: s.checkedOnce, fallback: s.fallback, color: s.color, wear: s.wear })}>Reset shape and effect settings</ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => commit({ ...s, games: {}, collections: {}, wears: {}, gameWears: {} })}>Clear all game and collection looks</ButtonItem>
        </PanelSectionRow>
        {info.length > 0 && <PanelSectionRow><div className="c3d-note">{info.join("\n")}</div></PanelSectionRow>}
      </PanelSection>
    </div>
  );
}

export default definePlugin(() => {
  current = loadSettings();
  const tripped = bootGuard();
  if (tripped && !current.safeMode) enterSafe("The plugin did not survive three starts in a row, so it switched itself off.");
  if (!current.safeMode) { startEngine(); scheduleFallbackChecks(); }
  hookLifetime();
  routerHook.addRoute(PAGE, CasesPage);
  void be(() => cGetSafe(), 5000).then((fileSafe) => {
    if (fileSafe === true && !current.safeMode) enterSafe("The safe-mode file was found (SAFE_MODE).");
    else if (fileSafe === false && current.safeMode) void be(() => cSetSafe(true));
  });
  const guard = setInterval(guardTick, 10000);
  return {
    name: "Finally 3D Game Cases",
    titleView: <div className={staticClasses.Title}>Finally 3D Game Cases</div>,
    content: <Content />,
    icon: <FaCube />,
    onDismount() {
      routerHook.removeRoute(PAGE);
      unhookLifetime();
      clearInterval(guard);
      timers.forEach((x) => clearTimeout(x)); timers = [];
      clearInterval(dataTimer); clearTimeout(pushTimer);
      try { window.localStorage.setItem(BOOT_KEY, JSON.stringify({ running: false, n: 0, t: Date.now() })); } catch (e) { /* ignore */ }
      stopEngine();
      void stopFallback();
      listeners.clear();
    },
  };
});
