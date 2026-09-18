#!/usr/bin/env node
/* Local receiver for harvested Ad Library data.
   The browser page POSTs its gzipped payload here so nothing large
   travels through the transcript.
     node receiver.mjs --out <file.json> [--port 3103]

   PORT 3103 IS NOT ARBITRARY. facebook.com ships a strict CSP whose
   connect-src allows exactly two local destinations:
       http://localhost:3103        and        ws://localhost:*
   Anything else -- including http://127.0.0.1:3103, same machine, same port --
   is blocked by CSP and fails as "TypeError: Failed to fetch".
   So: listen on 3103, and have the page POST to http://localhost:3103
   (the hostname must be the literal string "localhost"). */
import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

const argv = Object.fromEntries(process.argv.slice(2).join(' ')
  .split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const OUT = argv.out; const PORT = +(argv.port || 3103);
if (!OUT) { console.error('need --out <file>'); process.exit(1); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': '*'
};

const handler = (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (req.method !== 'POST') { res.writeHead(405, CORS); return res.end('post only'); }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    let out = buf;
    try { if (buf[0] === 0x1f && buf[1] === 0x8b) out = zlib.gunzipSync(buf); } catch (e) {
      res.writeHead(400, CORS); return res.end('bad gzip');
    }
    let n = null;
    try { n = JSON.parse(out.toString('utf8')).length; } catch (e) {
      res.writeHead(400, CORS); return res.end('bad json');
    }
    fs.writeFileSync(OUT, out);
    res.writeHead(200, CORS); res.end('ok ' + n);
    console.log(JSON.stringify({ ok: true, records: n, bytes: out.length, out: OUT }));
    setTimeout(() => process.exit(0), 150);
  });
};

// Bind BOTH loopback stacks. Node binding the name 'localhost' picks one
// (on macOS usually ::1) while Chrome may resolve localhost to 127.0.0.1 —
// the mismatch shows up as a bare "Failed to fetch" with no CSP error.
let up = 0;
for (const host of ['127.0.0.1', '::1']) {
  const s = http.createServer(handler);
  s.on('error', e => { if (e.code !== 'EADDRINUSE' && e.code !== 'EAFNOSUPPORT') console.error(host, e.code); });
  s.listen(PORT, host, () => console.error(`receiver listening on http://${host === '::1' ? '[::1]' : host}:${PORT}` + (++up === 1 ? ' → ' + OUT : '')));
}

setTimeout(() => { console.error('receiver timeout, nothing received'); process.exit(2); }, 180000);
