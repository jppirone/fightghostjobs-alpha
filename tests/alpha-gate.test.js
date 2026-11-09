// alpha-gate.test.js - the alpha password gate on its two hosts (prompt JW, November 9, 2026). js/alpha-gate.js must engage on alpha.fightghostjobs.com AND app.fightghostjobs.com and do
// nothing on any other host; its salt, hash and rounds handling must stay exactly as it was. The script is run in a small stand-in page (no browser, no network), the way a browser loads it.
//   node --test tests/alpha-gate.test.js
// The password, the salt and the hash are never printed or compared as text here: the handling lines are pinned by a digest, and a wrong password must stay locked.
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = fs.readFileSync(path.join(ROOT, "js", "alpha-gate.js"), "utf8").replace(/\r\n/g, "\n");

// the part of the gate that holds the salt, hash, rounds and unlock tag handling (everything after the host list on the variable line); pinned by its digest
function handlingOf(src) { const m = /,\s*(KEY = "fgj_alpha_gate", SALT = [^\n]*?VER = HASH\.slice\(0, 16\);)/.exec(src); return m ? m[1] : null; }

// a stand-in page: just enough document, window and storage for the gate to build its form and for a test to look at it
function page(src, hostname, storage) {
  const made = [];
  const mk = (tag) => {
    const n = { tag, children: [], attrs: {}, listeners: {}, style: {}, parentNode: null, textContent: "", value: "", disabled: false };
    n.appendChild = (c) => { c.parentNode = n; n.children.push(c); return c; };
    n.removeChild = (c) => { n.children = n.children.filter((x) => x !== c); c.parentNode = null; };
    n.setAttribute = (k, v) => { n.attrs[k] = String(v); };
    n.removeAttribute = (k) => { delete n.attrs[k]; };
    n.addEventListener = (ev, fn) => { (n.listeners[ev] = n.listeners[ev] || []).push(fn); };
    n.focus = () => {};
    made.push(n);
    return n;
  };
  const root = mk("html"), body = mk("body"), head = mk("head");
  const doc = { documentElement: root, body, head, createElement: mk, getElementById: (id) => made.find((n) => n.id === id && n.parentNode) || null, addEventListener() {} };
  const store = Object.assign({}, storage || {});
  const win = { crypto: globalThis.crypto };
  const ctx = vm.createContext({ document: doc, window: win, location: { hostname }, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }, atob, btoa, TextEncoder, Uint8Array, Promise, console });
  vm.runInContext(src, ctx);
  const form = doc.getElementById("alphaGate");
  return { root, body, form, store, locked: root.attrs["data-alpha-gate"] === "locked", styled: head.children.length > 0 };
}
const submit = async (p, pw) => {
  const input = p.form.children.find((c) => c.tag === "input"), button = p.form.children.find((c) => c.tag === "button"), msg = p.form.children.find((c) => c.className === "gate-msg");
  input.value = pw;
  for (const fn of p.form.listeners.submit) fn({ preventDefault() {} });
  for (let i = 0; i < 200 && !(button.disabled === false || p.form.parentNode === null); i++) await new Promise((r) => setTimeout(r, 25));
  return { msg: msg.textContent, open: p.form.parentNode === null, locked: p.root.attrs["data-alpha-gate"] === "locked" };
};

const ENGAGE = ["alpha.fightghostjobs.com", "app.fightghostjobs.com"];
const OFF = ["stage.fightghostjobs.com", "www.fightghostjobs.com", "fightghostjobs.com", "localhost", "127.0.0.1", "", "app.fightghostjobs.com.evil.example", "evil.example", "xapp.fightghostjobs.com", "alpha.fightghostjobs.com.evil.example", "sub.app.fightghostjobs.com"];

// every finding as a short text; an empty list means the gate is right (negative controls feed planted sources through the same function)
async function findings(src) {
  const out = [];
  for (const h of ENGAGE) {
    let p; try { p = page(src, h); } catch (e) { out.push("script fails on " + h + ": " + e.message); continue; }
    if (!p.locked || !p.form) out.push("the gate does not engage on " + h);
    else {
      const r = await submit(p, "not the password " + Math.random());
      if (r.open || !r.locked || !/not the password/.test(r.msg)) out.push("a wrong password does not stay locked on " + h);
    }
  }
  for (const h of OFF) {
    let p; try { p = page(src, h); } catch (e) { out.push("script fails on " + h + ": " + e.message); continue; }
    if (p.locked || p.form || p.styled) out.push("the gate engages on " + JSON.stringify(h) + " and it must not");
  }
  // an unlock is remembered only with the current hash version; a stale tag asks again; the right tag stays open (the tag is derived from the file itself, nothing is printed)
  const hash = /HASH = "([^"]+)"/.exec(src);
  if (hash) {
    const ver = hash[1].slice(0, 16);
    const open = page(src, "app.fightghostjobs.com", { fgj_alpha_gate: "open", fgj_alpha_gate_v: ver });
    if (open.locked || open.form) out.push("an unlock with the current version does not stay open on app");
    const stale = page(src, "app.fightghostjobs.com", { fgj_alpha_gate: "open", fgj_alpha_gate_v: "0000000000000000" });
    if (!stale.locked) out.push("an unlock from an older password does not lock again");
  } else out.push("no hash line found");
  const h = handlingOf(src);
  if (h === null) out.push("the salt, hash and rounds line was not found in the expected shape");
  else if (crypto.createHash("sha256").update(h).digest("hex") !== HANDLING_DIGEST_VALUE) out.push("the salt, hash, rounds or tag handling changed");
  if (!/PBKDF2/.test(src) || !/iterations: ITER/.test(src) || !/toB64\(bits\) === HASH/.test(src)) out.push("the PBKDF2 comparison changed");
  return out;
}
const HANDLING_DIGEST_VALUE = "4c6597ca36cd3d76dbe6cad1edacd4079013e6c3653ed38319e0b15b88cb999a";   // sha256 of that part as it was on alpha main before this prompt

test("the alpha gate engages on alpha.fightghostjobs.com and app.fightghostjobs.com, nowhere else, and keeps its password handling", async () => {
  assert.deepEqual(await findings(GATE), []);
});
test("the host list is written once and holds exactly the two hosts", () => {
  const m = /var HOSTS = \[([^\]]*)\]/.exec(GATE);
  assert.ok(m, "var HOSTS = [...] is there");
  assert.deepEqual(m[1].split(",").map((s) => s.trim().replace(/"/g, "")), ENGAGE);
  const code = GATE.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  assert.equal(code.split("HOSTS").length - 1, 2, "HOSTS is used by the declaration and by the one check");
  assert.ok(GATE.includes("if (HOSTS.indexOf(location.hostname) === -1) return;"));
});

// negative controls: one planted defect each; the check must find it
const PLANTS = [
  ["app host missing", (s) => s.replace('["alpha.fightghostjobs.com", "app.fightghostjobs.com"]', '["alpha.fightghostjobs.com"]')],
  ["alpha host missing", (s) => s.replace('["alpha.fightghostjobs.com", "app.fightghostjobs.com"]', '["app.fightghostjobs.com"]')],
  ["stage host added", (s) => s.replace('"app.fightghostjobs.com"]', '"app.fightghostjobs.com", "stage.fightghostjobs.com"]')],
  ["any host of the company added", (s) => s.replace('"app.fightghostjobs.com"]', '"app.fightghostjobs.com", "www.fightghostjobs.com"]')],
  ["host check dropped", (s) => s.replace("if (HOSTS.indexOf(location.hostname) === -1) return;", "")],
  ["host check inverted", (s) => s.replace("=== -1) return;", "!== -1) return;")],
  ["host check by prefix", (s) => s.replace("if (HOSTS.indexOf(location.hostname) === -1) return;", "if (!HOSTS.some(function (h) { return location.hostname.indexOf(h) === 0; })) return;")],
  ["host check by suffix", (s) => s.replace("if (HOSTS.indexOf(location.hostname) === -1) return;", "if (!HOSTS.some(function (h) { return location.hostname.slice(-h.length) === h; })) return;")],
  ["the unlock tag is no longer compared", (s) => s.replace('&& localStorage.getItem(TAG) === VER', "")],
  ["the rounds changed", (s) => s.replace("ITER = 310000", "ITER = 1000")],
  ["every password accepted", (s) => s.replace("toB64(bits) === HASH", "true")],
  ["the hash version tag shortened", (s) => s.replace("VER = HASH.slice(0, 16)", "VER = HASH.slice(0, 4)")],
];
for (const [name, plant] of PLANTS) {
  test("negative control: " + name, async () => {
    const planted = plant(GATE);
    assert.notEqual(planted, GATE, "the plant changed the file (a plant that changes nothing proves nothing)");
    assert.notDeepEqual(await findings(planted), [], "the check found nothing");
  });
}
