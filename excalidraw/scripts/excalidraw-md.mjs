#!/usr/bin/env node
// Convert between .excalidraw (plain JSON) and Obsidian .excalidraw.md, and
// check/repair .excalidraw.md files the way the Obsidian Excalidraw plugin parses them.
//
//   node excalidraw-md.mjs extract <in.excalidraw.md> [out.excalidraw]   # stdout without out
//   node excalidraw-md.mjs pack    <in.excalidraw> <out.excalidraw.md>   # keeps out's frontmatter + back-of-card
//   node excalidraw-md.mjs check   <file.excalidraw.md>                  # exit 1 on problems
//   node excalidraw-md.mjs repair  <file.excalidraw.md>                  # unglue text, fix ids, rewrite
//
// Setup once: cd ~/.agents/skills/excalidraw/scripts && npm i
import fs from "node:fs";
import crypto from "node:crypto";

let LZ;
try {
  LZ = (await import("lz-string")).default;
} catch {
  console.error("lz-string missing. Run: cd ~/.agents/skills/excalidraw/scripts && npm i");
  process.exit(2);
}

// The plugin finds text blocks with /\s\^(.{8})[\n]+/: any other id length corrupts the file.
// pack/repair rename to the plugin's own nanoid alphabet; `_` parses but breaks [[file#^id]] links.
const GOOD_ID = /^[A-Za-z0-9]{8}$/;
const PARSEABLE_ID = /^[A-Za-z0-9_-]{8}$/;
const BLOCK_RE = /\s\^(.{8})[\n]+/g;
const BLOCKREF_LEN = 12; // " ^12345678\n\n".length, as hard-coded in the plugin

function readScene(md) {
  const c = md.match(/```compressed-json\n([\s\S]*?)```/);
  if (c) return JSON.parse(LZ.decompressFromBase64(c[1].replace(/\s/g, "")));
  const j = md.match(/\n##? Drawing\n```json\n([\s\S]*?)```/);
  if (j) return JSON.parse(j[1]);
  throw new Error("no ## Drawing json/compressed-json block");
}

// Text the plugin will attach to each id, replicating ExcalidrawData.loadData().
function parseTextSection(md) {
  const start = md.search(/^##? Text Elements\n/m);
  if (start < 0) return [];
  let sec = md.slice(start).replace(/^##? Text Elements\n/, "");
  const end = sec.search(/^(%%|##? (Element Links|Embedded Files|Drawing))\s*$/m);
  if (end >= 0) sec = sec.slice(0, end);
  const out = [];
  let pos = 0;
  for (const m of sec.matchAll(BLOCK_RE)) {
    out.push({ id: m[1], text: sec.slice(pos, m.index) });
    pos = m.index + BLOCKREF_LEN;
  }
  return out;
}

function newId(taken) {
  let s;
  do s = crypto.randomBytes(12).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  while (s.length < 8 || taken.has(s));
  taken.add(s);
  return s;
}

function fixIds(scene) {
  const els = scene.elements;
  const taken = new Set(els.map((e) => e.id));
  const ren = {};
  for (const e of els) if (!GOOD_ID.test(e.id)) ren[e.id] = newId(taken);
  const r = (id) => ren[id] ?? id;
  for (const e of els) {
    e.id = r(e.id);
    if (e.containerId) e.containerId = r(e.containerId);
    if (e.frameId) e.frameId = r(e.frameId);
    e.boundElements?.forEach((b) => (b.id = r(b.id)));
    if (e.startBinding) e.startBinding.elementId = r(e.startBinding.elementId);
    if (e.endBinding) e.endBinding.elementId = r(e.endBinding.elementId);
  }
  return Object.keys(ren).length;
}

const DEFAULT_HEAD =
  "---\ntags:\n  - excalidraw\nexcalidraw-plugin: parsed\n---\n\n" +
  "==⚠ Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== " +
  "You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. " +
  "For more info check in plugin settings under 'Saving'\n\n";

function toMd(scene, existingMd) {
  const renamed = fixIds(scene);
  const texts = scene.elements.filter((e) => e.type === "text" && !e.isDeleted);
  for (const e of texts) {
    e.originalText ??= e.text;
    e.rawText = e.originalText;
  }
  if (scene.elements.some((e) => e.type === "image" && !e.isDeleted))
    console.error("warning: image elements need ## Embedded Files entries; insert images from Obsidian instead");
  // Everything before "# Excalidraw Data" (frontmatter, back-of-card notes) is preserved.
  // "%%" right above it = "fade out" mode: the whole data block is one comment.
  const m = existingMd?.match(/^(%%\n+)?# Excalidraw Data$/m);
  const head = m ? existingMd.slice(0, m.index) : DEFAULT_HEAD;
  const commented = !!m?.[1];
  const b64 = LZ.compressToBase64(JSON.stringify(scene, null, "\t")).match(/.{1,256}/g).join("\n\n");
  const md =
    head +
    (commented ? "%%\n" : "") +
    "# Excalidraw Data\n\n## Text Elements\n" +
    texts.map((e) => `${e.rawText} ^${e.id}\n\n`).join("") +
    (commented ? "" : "%%\n") +
    "## Drawing\n```compressed-json\n" + b64 + "\n```\n%%";
  return { md, renamed };
}

function check(md) {
  const scene = readScene(md);
  const byId = new Map(scene.elements.map((e) => [e.id, e]));
  const problems = [];
  const bad = scene.elements.filter((e) => !PARSEABLE_ID.test(e.id)).map((e) => e.id);
  if (bad.length) problems.push(`${bad.length} ids not 8 chars [A-Za-z0-9_-]: ${bad.slice(0, 8).join(", ")}${bad.length > 8 ? ", …" : ""}`);
  const seen = new Set();
  for (const { id, text } of parseTextSection(md)) {
    seen.add(id);
    const e = byId.get(id);
    if (!e) continue; // plugin ignores unknown ids
    if (e.type === "text" && text !== e.originalText)
      problems.push(`text ${id}: block ${JSON.stringify(text.slice(0, 60))} ≠ json ${JSON.stringify(e.originalText.slice(0, 60))}`);
    if (e.type === "text" && / \^[A-Za-z0-9_-]+\n\n/.test(e.originalText))
      problems.push(`text ${id}: glued with other blocks (${e.originalText.split(/ \^[A-Za-z0-9_-]+\n\n/).length} chunks)`);
  }
  for (const e of scene.elements)
    if (e.type === "text" && !e.isDeleted && !seen.has(e.id))
      problems.push(`text ${e.id}: missing from ## Text Elements`);
  return { scene, problems };
}

// Cascadia (fontFamily 3) is monospace: advance width 1200/2048 em.
function remeasure(e, byId) {
  if (e.fontFamily !== 3) return console.error(`warning: ${e.id} fontFamily ${e.fontFamily}: size not recomputed, check the render`);
  const lines = e.text.split("\n");
  e.width = Math.max(...lines.map((l) => [...l].length)) * e.fontSize * (1200 / 2048);
  e.height = lines.length * e.fontSize * (e.lineHeight ?? 1.25);
  const c = e.containerId && byId.get(e.containerId);
  if (c) {
    e.x = c.x + (c.width - e.width) / 2;
    e.y = c.y + (c.height - e.height) / 2;
    console.error(`note: container ${c.id} may have auto-grown around glued text; check its size in the render`);
  }
  e.version = (e.version ?? 1) + 1;
}

const [cmd, a, b] = process.argv.slice(2);
const read = (f) => fs.readFileSync(f, "utf8");
switch (cmd) {
  case "extract": {
    const json = JSON.stringify(readScene(read(a)), null, "\t");
    b ? fs.writeFileSync(b, json) : process.stdout.write(json + "\n");
    break;
  }
  case "pack": {
    const { md, renamed } = toMd(JSON.parse(read(a)), fs.existsSync(b) ? read(b) : null);
    fs.writeFileSync(b, md);
    const { problems } = check(md);
    if (problems.length) throw new Error(`packed file fails check:\n${problems.join("\n")}`);
    console.log(`${b}: ok (${renamed} ids renamed)`);
    break;
  }
  case "check": {
    const { problems } = check(read(a));
    console.log(problems.length ? `${a}:\n  ${problems.join("\n  ")}` : `${a}: ok`);
    process.exit(problems.length ? 1 : 0);
  }
  case "repair": {
    const md = read(a);
    const scene = readScene(md);
    const byId = new Map(scene.elements.map((e) => [e.id, e]));
    const fixed = [];
    // The JSON keeps the plugin's last good text; the glued part is everything up to the last block ref.
    for (const e of scene.elements.filter((e) => e.type === "text")) {
      const parts = e.originalText.split(/ \^[A-Za-z0-9_-]+\n\n/);
      if (parts.length < 2) continue;
      e.text = e.originalText = parts.at(-1);
      remeasure(e, byId);
      fixed.push(e.id);
    }
    const backup = `/tmp/${a.split("/").pop()}.${Date.now()}.bak`;
    fs.copyFileSync(a, backup);
    const { md: out, renamed } = toMd(scene, md);
    fs.writeFileSync(a, out);
    const { problems } = check(out);
    if (problems.length) throw new Error(`repaired file still fails check:\n${problems.join("\n")}`);
    console.log(`${a}: ok (${fixed.length} texts unglued, ${renamed} ids renamed, backup ${backup})`);
    break;
  }
  default:
    console.error("usage: excalidraw-md.mjs extract|pack|check|repair <file> [file]");
    process.exit(2);
}
