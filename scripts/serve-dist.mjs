// Minimal static server for the exported web build. Adds the COOP/COEP
// headers wa-sqlite (expo-sqlite web engine) requires for SharedArrayBuffer.
// Usage: node scripts/serve-dist.mjs [port]
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist", import.meta.url));
const port = Number(process.argv[2] || 8082);

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

// Dev-only reset page: wipes the browser-side gaffer.db (OPFS + IndexedDB)
// so the app starts fresh. Same origin as the app, so storage is accessible.
const RESET_PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Clear Gaffer data</title>
<style>body{background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}.card{max-width:420px;text-align:center;padding:32px}h1{font-size:22px}a{color:#60a5fa;font-weight:700}</style></head>
<body><div class="card"><h1 id="status">Clearing Gaffer data…</h1>
<p id="detail" style="color:#94a3b8;font-size:13px"></p>
<p style="margin-top:20px"><a href="/" id="done" style="display:none">← Back to Gaffer (fresh start)</a></p></div>
<script>
(async () => {
  const detail = (m) => (document.getElementById('detail').textContent = m);
  try {
    // OPFS files used by the wa-sqlite engine (main db + journal/wal).
    const root = await navigator.storage.getDirectory();
    for (const name of ['gaffer.db', 'gaffer.db-wal', 'gaffer.db-shm', 'gaffer.db-journal']) {
      try { await root.removeEntry(name, { recursive: true }); } catch {}
    }
    // IndexedDB fallback databases.
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && db.name.includes('gaffer')) { indexedDB.deleteDatabase(db.name); }
      }
    }
    document.getElementById('status').textContent = 'Done — Gaffer data cleared.';
    detail('Close any open Gaffer tab first, then click the link to start fresh.');
    document.getElementById('done').style.display = 'inline';
  } catch (e) {
    document.getElementById('status').textContent = 'Could not clear automatically.';
    detail('Open DevTools → Application → Storage → "Clear site data" for this origin, then reload.');
  }
})();
</script></body></html>`;

createServer(async (req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pathname === "/reset") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
    res.end(RESET_PAGE);
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file)] || "application/octet-stream",
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
    res.end(body);
  } catch {
    // SPA fallback to the index route (expo-router static export).
    try {
      const body = await readFile(join(root, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  }
}).listen(port, () => {
  console.log(`Serving gaffer dist on http://localhost:${port}`);
});
