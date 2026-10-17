// Fallback entry point: this whole file is bundled into dist/inject.js and pushed into Steam's library page through
// the debug port by the plugin's Python part, when the plugin cannot reach the library window itself.
// It runs the same engine inside the page. Game names, collections and playtime are pushed in as plain data.
import { CheckLine, Engine, Provider, Settings, PlayInfo, TemplateIn, loadTemplates, normId, registerTemplates, sanitize } from "./engine";

interface PushedData {
  apps: { k: string; n: string; sc?: number; m?: number; l?: number }[];
  colls: { id: string; n: string; a: string[] }[];
}

let engine: Engine | null = null;
let byKey = new Map<string, { n: string; m: number; l: number }>();
let byName = new Map<string, string | null>();
let collOf = new Map<string, string[]>();
let collNames = new Map<string, string>();
let current: Settings = sanitize({});

function setData(d: PushedData | null): void {
  byKey = new Map(); byName = new Map(); collOf = new Map(); collNames = new Map();
  if (!d) return;
  (d.apps || []).forEach((a) => {
    byKey.set(a.k, { n: a.n, m: a.m || 0, l: a.l || 0 });
    const ln = a.n.toLowerCase();
    byName.set(ln, byName.has(ln) ? null : a.k);
  });
  (d.colls || []).forEach((c) => {
    collNames.set(c.id, c.n);
    (c.a || []).forEach((k) => { const arr = collOf.get(k); if (arr) arr.push(c.id); else collOf.set(k, [c.id]); });
  });
}

const prov: Provider = {
  getDocs: () => [document],
  appName: (k) => (byKey.get(k) || { n: "" }).n,
  collectionsOf: (k) => collOf.get(k) || [],
  collectionName: (id) => collNames.get(id) || "",
  resolveId: (cands) => {
    for (const c of cands) { const k = normId(c); if (k && byKey.has(k)) return k; }
    return null;
  },
  byName: (n) => byName.get(n.trim().toLowerCase()) || null,
  playInfo: (k): PlayInfo | null => { const a = byKey.get(k); return a ? { minutes: a.m, last: a.l } : null; },
};

const api = {
  start(settings: any, data: PushedData | null): string {
    current = sanitize(settings);
    setData(data);
    if (engine) { engine.update(current); return "updated"; }
    engine = new Engine(current, prov, { owner: "inject" });
    engine.start();
    return "started";
  },
  update(settings: any): string { current = sanitize(settings); if (engine) engine.update(current); return "ok"; },
  setData(data: PushedData): string { setData(data); if (engine) engine.refreshWear(); return "ok"; },
  setTemplates(list: TemplateIn[]): string {
    loadTemplates(document, Array.isArray(list) ? list : []).then((r) => { if (engine) engine.setTemplates(r); else registerTemplates(r); });
    return "loading";
  },
  playInsert(key: string | null): boolean { return engine ? engine.playInsert(key) : false; },
  playEject(key: string | null): boolean { return engine ? engine.playInsert(key, { eject: true }) : false; },
  refresh(): string { if (engine) engine.refreshWear(); return "ok"; },
  stop(): string { if (engine) { engine.stop(); engine = null; } return "stopped"; },
  selfCheck(): CheckLine[] { return engine ? engine.selfCheck() : []; },
  report(): string[] { return engine ? engine.report() : ["not running"]; },
  snapshot(): string { return engine ? engine.snapshot() : ""; },
  errors(): number { return engine ? engine.errors : 0; },
};

(window as any).__sansoCases = api;
