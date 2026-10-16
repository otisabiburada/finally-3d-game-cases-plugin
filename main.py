# Finally 3D Game Cases: optional background part.
# The panel and the 3D effect do NOT depend on this file. It only provides:
#   - saving a report to ~/Downloads (for "it doesn't work" cases)
#   - the safe-mode file (survives even if browser storage is wiped)
#   - fallback injection through Steam's debug port when the plugin cannot reach the library window itself
# Only modules known to exist in Decky's bundled Python are imported at the top.
import asyncio
import base64
import json
import os
import re
import struct
import time
from typing import Any, Dict, List, Optional

import decky

log = decky.logger

CDP_HOST = "127.0.0.1"
CDP_PORT = int(os.environ.get("SANSO_CDP_PORT", "8080"))
REPORT_PREFIX = "3d-game-cases-report-"
KEEP_REPORTS = 5
MAX_REPORT = 2 * 1024 * 1024
ALLOWED_CALLS = ("update", "setData", "playInsert", "refresh", "selfCheck", "report", "snapshot", "errors", "setTemplates")
TEMPLATE_DIR_NAME = "templates"
TEMPLATE_MIME = {".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
TEMPLATE_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._ ()+-]{0,79}$")
MAX_TEMPLATE_BYTES = 2 * 1024 * 1024
MAX_TEMPLATES = 40


# ---------- pure helpers (unit-tested without Decky) ----------

def report_filename(now: Optional[float] = None) -> str:
    return REPORT_PREFIX + time.strftime("%Y%m%d-%H%M%S", time.localtime(now if now is not None else time.time())) + ".txt"


def prune_reports(folder: str, keep: int = KEEP_REPORTS) -> List[str]:
    """Delete the oldest reports of this plugin, keep the newest `keep`. Returns the deleted names."""
    try:
        names = sorted(n for n in os.listdir(folder) if n.startswith(REPORT_PREFIX) and n.endswith(".txt"))
    except OSError:
        return []
    gone = []
    for n in names[:-keep] if keep > 0 else names:
        try:
            os.remove(os.path.join(folder, n))
            gone.append(n)
        except OSError:
            pass
    return gone


def write_report(folder: str, text: str, now: Optional[float] = None) -> str:
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, report_filename(now))
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", errors="replace") as f:
        f.write(text)
    os.replace(tmp, path)
    prune_reports(folder)
    return path


def list_template_files(folder: str) -> List[str]:
    """Picture files in the templates folder that the plugin will accept (right name, type and size), sorted."""
    try:
        names = os.listdir(folder)
    except OSError:
        return []
    out = []
    for n in sorted(names, key=str.lower):
        ext = os.path.splitext(n)[1].lower()
        if ext not in TEMPLATE_MIME or not TEMPLATE_NAME_RE.match(n):
            continue
        path = os.path.join(folder, n)
        try:
            if os.path.isfile(path) and 0 < os.path.getsize(path) <= MAX_TEMPLATE_BYTES:
                out.append(n)
        except OSError:
            continue
    return out[:MAX_TEMPLATES]


def read_template(folder: str, name: str) -> Optional[Dict[str, Any]]:
    """One template as {name, url (data address), win}. `win` comes from an optional <picture name>.json next to it:
    {"window": [left, top, right, bottom]} as fractions (0.05 = 5%) of the frame that are NOT the window."""
    if not isinstance(name, str) or name not in list_template_files(folder):
        return None
    ext = os.path.splitext(name)[1].lower()
    try:
        with open(os.path.join(folder, name), "rb") as f:
            raw = f.read(MAX_TEMPLATE_BYTES + 1)
    except OSError:
        return None
    if len(raw) > MAX_TEMPLATE_BYTES:
        return None
    win = None
    try:
        side = os.path.join(folder, os.path.splitext(name)[0] + ".json")
        if os.path.isfile(side) and os.path.getsize(side) < 4096:
            with open(side, "r", encoding="utf-8") as f:
                w = json.load(f).get("window")
            if isinstance(w, list) and len(w) == 4 and all(isinstance(v, (int, float)) and 0 <= v < 0.6 for v in w):
                win = [float(v) for v in w]
    except (OSError, ValueError, AttributeError):
        win = None
    return {"name": name, "url": "data:%s;base64,%s" % (TEMPLATE_MIME[ext], base64.b64encode(raw).decode("ascii")), "win": win}


def pick_library_targets(tabs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Which debugger tabs are the Steam library window(s)."""
    out = []
    for t in tabs:
        if t.get("type", "page") != "page" or not t.get("webSocketDebuggerUrl"):
            continue
        title = str(t.get("title", ""))
        url = str(t.get("url", ""))
        if re.search(r"big picture", title, re.I) or "/routes/library" in url:
            out.append(t)
    return out


def safe_json(text: str) -> str:
    """Re-serialise JSON that came from the panel, so only data (never code) can reach the page."""
    return json.dumps(json.loads(text), separators=(",", ":"))


# ---------- minimal WebSocket client for the debugger (no extra modules) ----------

def ws_frame(text: str) -> bytes:
    data = text.encode("utf-8")
    n = len(data)
    mask = os.urandom(4)
    if n < 126:
        head = struct.pack("!BB", 0x81, 0x80 | n)
    elif n < 65536:
        head = struct.pack("!BBH", 0x81, 0x80 | 126, n)
    else:
        head = struct.pack("!BBQ", 0x81, 0x80 | 127, n)
    key = (mask * (n // 4 + 1))[:n]
    masked = (int.from_bytes(data, "big") ^ int.from_bytes(key, "big")).to_bytes(n, "big") if n else b""
    return head + mask + masked


async def ws_read_message(reader: asyncio.StreamReader) -> str:
    parts = []
    while True:
        b0, b1 = struct.unpack("!BB", await reader.readexactly(2))
        fin = bool(b0 & 0x80)
        op = b0 & 0x0F
        n = b1 & 0x7F
        if n == 126:
            n = struct.unpack("!H", await reader.readexactly(2))[0]
        elif n == 127:
            n = struct.unpack("!Q", await reader.readexactly(8))[0]
        payload = await reader.readexactly(n) if n else b""
        if op == 8:
            raise ConnectionError("debugger closed the connection")
        if op in (9, 10):
            continue
        parts.append(payload)
        if fin:
            return b"".join(parts).decode("utf-8", "replace")


async def ws_connect(host: str, port: int, path: str, timeout: float = 5.0):
    reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout)
    key = base64.b64encode(os.urandom(16)).decode()
    req = ("GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
           "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n") % (path, host, port, key)
    writer.write(req.encode())
    await writer.drain()
    head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout)
    if b" 101 " not in head.split(b"\r\n")[0]:
        writer.close()
        raise ConnectionError("debugger refused the connection: " + head.split(b"\r\n")[0].decode("utf-8", "replace"))
    return reader, writer


async def cdp_eval(ws_url: str, expression: str, timeout: float = 12.0) -> Any:
    m = re.match(r"wss?://([^/:]+):?(\d+)?(/.*)", ws_url)
    if not m:
        raise ValueError("bad debugger address")
    host, port, path = m.group(1), int(m.group(2) or 80), m.group(3)
    host = CDP_HOST if host in ("localhost", "127.0.0.1") else host
    reader, writer = await ws_connect(host, port, path)
    try:
        msg = {"id": 1, "method": "Runtime.evaluate",
               "params": {"expression": expression, "returnByValue": True, "awaitPromise": False}}
        writer.write(ws_frame(json.dumps(msg)))
        await writer.drain()
        deadline = time.time() + timeout
        while True:
            left = deadline - time.time()
            if left <= 0:
                raise asyncio.TimeoutError()
            text = await asyncio.wait_for(ws_read_message(reader), left)
            try:
                data = json.loads(text)
            except ValueError:
                continue
            if data.get("id") == 1:
                if "error" in data:
                    raise RuntimeError(str(data["error"]))
                res = data.get("result", {})
                if res.get("exceptionDetails"):
                    raise RuntimeError("page error: " + str(res["exceptionDetails"].get("text", "")))
                return res.get("result", {}).get("value")
    finally:
        try:
            writer.close()
        except Exception:
            pass


def _fetch_tabs_blocking() -> List[Dict[str, Any]]:
    import urllib.request  # known to exist in Decky's Python; imported lazily
    with urllib.request.urlopen("http://%s:%d/json" % (CDP_HOST, CDP_PORT), timeout=3) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


async def fetch_tabs() -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_fetch_tabs_blocking)


class Plugin:
    async def _main(self):
        self.settings_dir = decky.DECKY_PLUGIN_SETTINGS_DIR
        self.safe_file = os.path.join(self.settings_dir, "SAFE_MODE")
        self.inject_js: Optional[str] = None
        self.fb_settings: Optional[str] = None
        self.fb_data: Optional[str] = None
        self.fb_templates: Optional[str] = None
        self.template_dir = os.path.join(self.settings_dir, TEMPLATE_DIR_NAME)
        self.fb_task: Optional[asyncio.Task] = None
        self.fb_targets = 0
        self.fb_error = ""
        try:
            os.makedirs(self.template_dir, exist_ok=True)
        except OSError:
            pass
        log.info("Finally 3D Game Cases background part started")

    async def _unload(self):
        await self._stop_watch()

    # ----- basics -----
    async def ping(self) -> Dict[str, Any]:
        return {"ok": True}

    async def get_safe_mode(self) -> bool:
        return os.path.exists(self.safe_file)

    async def set_safe_mode(self, on: bool) -> bool:
        try:
            if on:
                os.makedirs(self.settings_dir, exist_ok=True)
                with open(self.safe_file, "w") as f:
                    f.write("remove this file (or press the switch in the plugin) to turn Finally 3D Game Cases back on\n")
            elif os.path.exists(self.safe_file):
                os.remove(self.safe_file)
            return True
        except OSError as e:
            log.error("safe mode file: %s" % e)
            return False

    # ----- template pictures (frames) from a folder -----
    async def list_templates(self) -> Dict[str, Any]:
        try:
            return {"folder": self.template_dir, "names": await asyncio.to_thread(list_template_files, self.template_dir)}
        except Exception as e:
            log.error("list_templates: %s" % e)
            return {"folder": self.template_dir, "names": []}

    async def get_template(self, name: str) -> Optional[Dict[str, Any]]:
        try:
            return await asyncio.to_thread(read_template, self.template_dir, name)
        except Exception as e:
            log.error("get_template: %s" % e)
            return None

    async def save_report(self, text: str) -> Dict[str, Any]:
        try:
            if not isinstance(text, str) or not text:
                return {"ok": False, "error": "empty report"}
            folder = os.path.join(decky.DECKY_USER_HOME, "Downloads")
            path = write_report(folder, text[:MAX_REPORT])
            return {"ok": True, "path": path}
        except Exception as e:  # never let a report crash the plugin
            log.error("save_report: %s" % e)
            return {"ok": False, "error": str(e)}

    # ----- fallback injection -----
    def _js(self) -> str:
        if self.inject_js is None:
            path = os.path.join(decky.DECKY_PLUGIN_DIR, "dist", "inject.js")
            with open(path, "r", encoding="utf-8") as f:
                self.inject_js = f.read()
        return self.inject_js

    async def _inject_into(self, tab: Dict[str, Any]) -> bool:
        ws = tab["webSocketDebuggerUrl"]
        have = await cdp_eval(ws, "typeof window.__sansoCases")
        if have != "object":
            await cdp_eval(ws, self._js(), timeout=20.0)
        expr = "window.__sansoCases.start(%s,%s)" % (self.fb_settings or "{}", self.fb_data or "null")
        res = await cdp_eval(ws, expr)
        if self.fb_templates:
            await cdp_eval(ws, "window.__sansoCases.setTemplates(%s)" % self.fb_templates, timeout=20.0)
        return res in ("started", "updated")

    async def _inject_all(self) -> int:
        tabs = pick_library_targets(await fetch_tabs())
        n = 0
        for t in tabs:
            try:
                if await self._inject_into(t):
                    n += 1
            except Exception as e:
                self.fb_error = str(e)
                log.error("inject: %s" % e)
        self.fb_targets = n
        return n

    async def _watch(self):
        # keeps the injection alive when Steam reloads the library page; light: one list request every 6 s
        while True:
            try:
                await asyncio.sleep(6)
                tabs = pick_library_targets(await fetch_tabs())
                for t in tabs:
                    ws = t["webSocketDebuggerUrl"]
                    try:
                        if await cdp_eval(ws, "typeof window.__sansoCases", timeout=5.0) != "object" or \
                                await cdp_eval(ws, "document.documentElement.getAttribute('data-sanso-owner') || ''", timeout=5.0) == "":
                            await self._inject_into(t)
                    except Exception as e:
                        self.fb_error = str(e)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                self.fb_error = str(e)

    async def _stop_watch(self):
        if self.fb_task:
            self.fb_task.cancel()
            try:
                await self.fb_task
            except BaseException:
                pass
            self.fb_task = None

    async def fallback_start(self, settings_json: str, data_json: str) -> Dict[str, Any]:
        try:
            self.fb_settings = safe_json(settings_json)
            self.fb_data = safe_json(data_json) if data_json else "null"
            self.fb_error = ""
            n = await self._inject_all()
            if self.fb_task is None:
                self.fb_task = asyncio.create_task(self._watch())
            return {"ok": n > 0, "targets": n, "error": self.fb_error if n == 0 else ""}
        except Exception as e:
            log.error("fallback_start: %s" % e)
            return {"ok": False, "targets": 0, "error": str(e)}

    async def fallback_call(self, name: str, arg_json: str) -> Dict[str, Any]:
        if name not in ALLOWED_CALLS:
            return {"ok": False, "error": "not allowed"}
        try:
            arg = safe_json(arg_json) if arg_json else ""
            if name == "update":
                self.fb_settings = arg
            if name == "setData":
                self.fb_data = arg
            if name == "setTemplates":
                self.fb_templates = arg
            expr = "window.__sansoCases.%s(%s)" % (name, arg)
            values = []
            for t in pick_library_targets(await fetch_tabs()):
                try:
                    v = await cdp_eval(t["webSocketDebuggerUrl"], expr)
                    values.append(v)
                except Exception as e:
                    self.fb_error = str(e)
            return {"ok": len(values) > 0, "values": values}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def fallback_stop(self) -> Dict[str, Any]:
        await self._stop_watch()
        n = 0
        try:
            for t in pick_library_targets(await fetch_tabs()):
                try:
                    await cdp_eval(t["webSocketDebuggerUrl"], "window.__sansoCases && window.__sansoCases.stop()")
                    n += 1
                except Exception:
                    pass
        except Exception:
            pass
        self.fb_targets = 0
        return {"ok": True, "stopped": n}

    async def fallback_status(self) -> Dict[str, Any]:
        return {"active": self.fb_task is not None, "targets": self.fb_targets, "error": self.fb_error}
