#!/usr/bin/env node
// Compare pages of our app with the original site, or snapshot the original.
// GET requests only towards the original, except the demo login (POST /entra), which the
// original offers for exactly this purpose. No dependencies: Node 20+.
//
//   node parity.mjs crawl   --out tmp/original-snapshot [--login] [--max 400]
//   node parity.mjs compare --path /o/eumans/consultazione-di-esempio --out tmp/<task>/parity
//                           [--local http://localhost:5173] [--login] [--mask-numbers]
//                           [--lang en]
//
// --login reads the email from PARTECIPA_EMAIL. --lang switches both sessions first with
// GET /lingua/<code>, the request the language link makes: the language lives in the session,
// so it changes nothing outside our own session. Exit code: 0 always for crawl; for compare,
// 0 when the outlines are identical, 1 when they differ, 2 on errors.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ORIGINAL = 'https://prototipo.michelangelogigli.it';
// Never follow: logout, language switch (changes the session), magic links, Cloudflare.
const SKIP = /^\/(esci|lingua\/|entra\/|cdn-cgi\/)/;
// Personal pages: fetched for compare only, never saved by crawl.
const PERSONAL = /^\/io(\/|$|\?)/;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command };
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].replace(/^--/, '');
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) opts[key] = true;
    else { opts[key] = next; i++; }
  }
  return opts;
}

class Client {
  constructor(base) { this.base = base; this.cookies = new Map(); }
  cookieHeader() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '); }
  store(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  async request(path, { method = 'GET', body, headers = {} } = {}) {
    let url = new URL(path, this.base).href;
    for (let hops = 0; hops < 5; hops++) {
      const res = await fetch(url, {
        method, body, redirect: 'manual',
        headers: { 'User-Agent': 'partecipa-parity-check', Cookie: this.cookieHeader(), ...headers },
      });
      this.store(res);
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        url = new URL(res.headers.get('location'), url).href;
        method = 'GET'; body = undefined;
        continue;
      }
      return { status: res.status, type: res.headers.get('content-type') ?? '', text: await res.text(), url };
    }
    throw new Error(`too many redirects from ${path}`);
  }
  form(path, fields) {
    return this.request(path, {
      method: 'POST', body: new URLSearchParams(fields).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
}

const csrfOf = (html) => html.match(/name="csrf" value="([^"]+)"/)?.[1];

async function loginOriginal(client, email) {
  const page = await client.request('/entra?next=/');
  const sent = await client.form('/entra', { csrf: csrfOf(page.text), next: '/', email });
  const link = sent.text.match(/href="([^"]+)" id="link-prova"/)?.[1];
  if (!link) throw new Error('original: demo login link not found (is it still a demo?)');
  const confirm = await client.request(link);
  await client.form(new URL(link).pathname, { csrf: csrfOf(confirm.text) });
}

async function loginLocal(client, email) {
  // Our API (docs/routes.md): magic link with devLink in the dev profile, CSRF via XSRF-TOKEN.
  await client.request('/api/me');
  const xsrf = () => ({ 'X-XSRF-TOKEN': client.cookies.get('XSRF-TOKEN') ?? '', 'Content-Type': 'application/json' });
  const sent = await client.request('/api/auth/magic-link', {
    method: 'POST', body: JSON.stringify({ email, next: '/' }), headers: xsrf(),
  });
  const token = JSON.parse(sent.text).devLink?.split('/').pop();
  if (!token) throw new Error('local: no devLink in the magic-link response (dev profile?)');
  await client.request(`/api/auth/magic-link/${token}`, { method: 'POST', headers: xsrf() });
}

// Reduce a page to what a person reads and can do, one line per block.
function outline(html) {
  const main = (html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html)
    // Comments carry no content; React's server render puts <!-- --> between adjacent texts.
    .replace(/<!--[\s\S]*?-->/g, '');
  const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const attr = (a, name) => a.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  const out = [];
  let skip = 0;
  for (const m of main.matchAll(/<(\/?)([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g)) {
    const [, close, rawTag, attrs = '', text] = m;
    if (text !== undefined) {
      const t = decode(text).replace(/\s+/g, ' ').trim();
      if (t && !skip) out.push(` ${t}`);
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (['script', 'style', 'svg'].includes(tag)) { skip += close ? -1 : 1; skip = Math.max(skip, 0); continue; }
    if (skip || close) { if (close && tag === 'button') out.push(']'); continue; }
    if (/^h[1-6]$/.test(tag)) out.push(`\n${'#'.repeat(+tag[1])} `);
    else if (['p', 'li', 'div', 'tr', 'dt', 'dd', 'label', 'section', 'article', 'header', 'footer'].includes(tag)) out.push('\n');
    if (tag === 'form') out.push(`\n[FORM ${(attr(attrs, 'method') ?? 'get').toUpperCase()} ${attr(attrs, 'action') ?? ''}]`);
    if (tag === 'button') out.push(' [BTN:');
    if (tag === 'a' && attr(attrs, 'href')) out.push(` <a ${attr(attrs, 'href')}>`);
    if (['input', 'select', 'textarea'].includes(tag)) {
      const type = attr(attrs, 'type') ?? tag;
      if (!(type === 'hidden' && attr(attrs, 'name') === 'csrf')) {
        out.push(` <${type} ${attr(attrs, 'name') ?? '?'}${/\brequired\b/.test(attrs) ? ' required' : ''}${type === 'hidden' ? `=${attr(attrs, 'value') ?? ''}` : ''}>`);
      }
    }
    if (tag === 'option') out.push(` (opt ${attr(attrs, 'value') ?? ''})`);
  }
  return out.join('').split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
    .replace(/<a \/cdn-cgi\/l\/email-protection> \[email protected\]/g, '<email>')
    .replace(/\[email protected\]/g, '<email>') + '\n';
}

const maskNumbers = (s) => s.replace(/\d+([.,:/]\d+)*/g, '#');

async function crawl(opts) {
  const out = opts.out ?? 'tmp/original-snapshot';
  const max = Number(opts.max ?? 400);
  const client = new Client(ORIGINAL);
  if (opts.login) await loginOriginal(client, requireEmail());
  mkdirSync(join(out, 'pages'), { recursive: true });
  const seen = new Set(); const queue = ['/']; const index = {}; const outlines = [];
  while (queue.length && seen.size < max) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);
    if (PERSONAL.test(path)) continue;
    const res = await client.request(path);
    const name = (path.replace(/^\//, '') || 'index').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 150)
      + (res.type.includes('html') ? '.html' : '');
    writeFileSync(join(out, 'pages', name), res.text);
    index[path] = { status: res.status, type: res.type, file: name };
    if (res.type.includes('html')) {
      outlines.push(`\n========== ${path}\n${outline(res.text)}`);
      for (const [, href] of res.text.matchAll(/(?:href|src)="([^"#]+)/g)) {
        const u = new URL(href.replace(/&amp;/g, '&'), ORIGINAL + path);
        if (u.origin !== ORIGINAL || SKIP.test(u.pathname)) continue;
        const rel = u.pathname + u.search;
        if (!seen.has(rel)) queue.push(rel);
      }
    }
    await new Promise((r) => setTimeout(r, 150)); // be gentle with the demo server
  }
  writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1));
  writeFileSync(join(out, 'outline.txt'), outlines.join(''));
  writeFileSync(join(out, 'SNAPSHOT.md'), `Crawled ${new Date().toISOString()} from ${ORIGINAL}, ${Object.keys(index).length} URLs, login: ${opts.login ? 'yes' : 'no'}. Personal pages excluded.\n`);
  console.log(`${Object.keys(index).length} URLs saved in ${out}`);
  return 0;
}

async function compare(opts) {
  if (!opts.path) throw new Error('--path is required');
  const out = opts.out ?? 'tmp/parity';
  const local = new Client(opts.local ?? 'http://localhost:5173');
  const original = new Client(ORIGINAL);
  if (opts.login) {
    const email = requireEmail();
    await loginOriginal(original, email);
    await loginLocal(local, email);
  }
  // After the login, which may start a new session.
  if (opts.lang) {
    if (!/^[a-z]{2}$/.test(opts.lang)) throw new Error('--lang takes a language code, e.g. en');
    for (const client of [original, local]) {
      await client.request(`/lingua/${opts.lang}`, { headers: { Referer: `${client.base}/` } });
    }
  }
  const page = opts.path.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'index';
  const slug = opts.lang ? `${page}.${opts.lang}` : page;
  mkdirSync(out, { recursive: true });
  const pages = {};
  for (const [label, client] of [['original', original], ['local', local]]) {
    const res = await client.request(opts.path);
    let text = outline(res.text);
    if (opts['mask-numbers']) text = maskNumbers(text);
    pages[label] = join(out, `${slug}.${label}.txt`);
    writeFileSync(pages[label], `status ${res.status}\n${text}`);
  }
  const diff = spawnSync('diff', ['-u', pages.original, pages.local], { encoding: 'utf8' });
  const diffFile = join(out, `${slug}.diff`);
  writeFileSync(diffFile, diff.stdout);
  const changed = diff.stdout.split('\n').filter((l) => /^[+-][^+-]/.test(l)).length;
  console.log(changed ? `${changed} differing lines, see ${diffFile}` : `identical outlines (${diffFile})`);
  return changed ? 1 : 0;
}

function requireEmail() {
  const email = process.env.PARTECIPA_EMAIL;
  if (!email) throw new Error('set PARTECIPA_EMAIL to log in');
  return email;
}

const opts = parseArgs(process.argv.slice(2));
const commands = { crawl, compare };
if (!commands[opts.command]) {
  console.error('usage: parity.mjs crawl|compare [options] (see the header of this file)');
  process.exit(2);
}
commands[opts.command](opts).then((code) => process.exit(code), (err) => {
  console.error(`error: ${err.message}`);
  process.exit(2);
});
