// Builds dist/index.js (the plugin) and dist/inject.js (the optional fallback bundle).
// Uses esbuild. React, Decky's UI library and the Decky loader API are taken from the globals
// Decky Loader provides inside Steam (window.SP_REACT, window.SP_JSX, window.DFL), exactly like
// the official @decky/rollup template does, so the output works the same way.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = (p) => path.join(root, p);
const shims = {
  "react": r("tools/shims/react.js"),
  "react/jsx-runtime": r("tools/shims/jsx.js"),
  "@decky/ui": r("tools/shims/ui.js"),
  "@decky/api": r("tools/shims/api.js"),
};

await build({
  entryPoints: [r("src/index.tsx")], bundle: true, format: "esm", target: "es2020",
  outfile: r("dist/index.js"), jsx: "automatic", charset: "utf8", logLevel: "warning",
  plugins: [{ name: "decky-globals", setup(b) {
    b.onResolve({ filter: /^(react|react\/jsx-runtime|@decky\/ui|@decky\/api)$/ }, (a) => ({ path: shims[a.path] }));
  } }],
});

await build({
  entryPoints: [r("src/inject.ts")], bundle: true, format: "iife", target: "es2020",
  outfile: r("dist/inject.js"), charset: "utf8", logLevel: "warning", minify: true,
});

console.log("built dist/index.js and dist/inject.js");
