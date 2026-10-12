const manifest = { name: "Finally 3D Game Cases" };
const API_VERSION = 2;
const conn = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!conn) throw new Error("[@decky/api]: Failed to connect to the loader as the loader API was not initialized.");
let api;
try { api = conn.connect(API_VERSION, manifest.name); } catch { api = conn.connect(1, manifest.name); }
export const callable = api.callable, routerHook = api.routerHook, toaster = api.toaster;
export const addEventListener = api.addEventListener, removeEventListener = api.removeEventListener;
export const definePlugin = (fn) => (...args) => fn(...args);
