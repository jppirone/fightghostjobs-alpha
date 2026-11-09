// DERIVED FOR ALPHA (prompt JW, November 9, 2026) from the stage run-all (tests/run-all.js) by the derivation script in the ops repository (alpha-site-checks/derive-alpha-checks.mjs). Do not edit by hand: change the stage file or the derivation, then derive again.
// What differs from stage: alpha's project address; the password gate is js/alpha-gate.js on TWO hosts (alpha and app); the findings about the stage test suite (test files and run-all steps that only stage carries) and the check of the stage SQL/edge tools (S71) are not made here; the wording rule S66 does not read the gate page text (the gate goes away at launch).
// run-all.js - everything that can be checked without a network or a secret. Run: node tests/run-all.js   (or: npm test)
// FULL RUN (the default, no arguments): every step below, exactly as always. After each step it prints how long the step took; at the end the total and the ten slowest tests (the node test runner reports a time per TEST, not per file;
// the step name says which file).
// QUICK MODE, for building only (never evidence for a push): node tests/run-all.js --quick              the unit and API tests plus the static site rules
//                                                            node tests/run-all.js --quick <name> ...    and also the named test file(s), main tests only (its negative controls are skipped), e.g. --quick search-recap
// A quick run does NOT run the negative controls (static or browser) and does NOT run the browser tests unless one is named. Its first and last line say so.
// BROWSERS (prompt BB2, October 10, 2026): every step has a time limit (limitMin below); a step that exceeds it is stopped together with the test files and browsers below it and is reported as FAILED with the reason. Before the first
// step, a sweep stops browsers of test processes that no longer exist and removes marker profile folders older than a day that no process uses. The LAST step is the leak check (tests/leak-check.js): it counts the browser processes
// and profile folders that carry the test marker after everything else has closed what it opened, prints LEAK: <count> with their ids and names, and fails.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStep, stopCurrentStep } from "./step-runner.js";
import { sweepStale, reapOrphans } from "./browser-clean.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const steps = [
  ["unit + API tests", [path.join(here, "unit.test.js"), path.join(here, "cdp-limit.test.js"), path.join(here, "api.test.js"), path.join(here, "locations.test.js"), path.join(here, "dashboard.test.js"), path.join(here, "edit.test.js"), path.join(here, "schedule.test.js"), path.join(here, "roster.test.js"), path.join(here, "ai-notes.test.js"), path.join(here, "comments.test.js"), path.join(here, "analytics.test.js"), path.join(here, "contest.test.js"), path.join(here, "staff-scope.unit.test.js"), path.join(here, "linkpanel.test.js"), path.join(here, "unsaved.test.js"), path.join(here, "account-menu.test.js"), path.join(here, "signin-handoff.test.js"), path.join(here, "scroll-lock.test.js"), path.join(here, "code-entry-unit.test.js"), path.join(here, "fragment-prefill.unit.test.js"), path.join(here, "registered.unit.test.js"), path.join(here, "place.unit.test.js"), path.join(here, "policy-link.unit.test.js"), path.join(here, "rows-panels.unit.test.js"), path.join(here, "rows-panels.mutants.test.js"), path.join(here, "place-text.unit.test.js"), path.join(here, "register-bj.unit.test.js"), path.join(here, "register-bk.unit.test.js"), path.join(here, "kio.unit.test.js"), path.join(here, "intent.unit.test.js"), path.join(here, "alpha-gate.test.js")], true],
  ["the KIO ID (prompt BQ): a lookup by the ID alone, the mismatch notice, the extension's k fragment, the answers, the employer's ID block with its copy buttons, My openings with the 18 character ID, the short link receiving page, an unmigrated database (real browser)", [path.join(here, "kio-id.test.js")], true],
  ["My openings and the editor (prompt BR): Closed and Expired with the real day, closed and expired rows last in both Closes directions, one clean Status pill at 1093, 1100 and 1366 pixels, the editor's saved line gone at the next change, the 14 days counted from the day it was added (real browser)", [path.join(here, "br.test.js")], true],
  ["the KIO ID on the search page (prompt BS): the recap shows the ID in its shown form however it was typed, the mismatch notice names what was entered and says to check the copy, nothing of an earlier search stays when a new attempt begins or the page refuses an ID, the short link path fills the box and searches nothing (real browser)", [path.join(here, "bs.test.js")], true],
  ["the label KIO ID everywhere a person sees it (prompt BU): My openings header and column rule at 1093, 1100 and 1366 pixels, the editor, the Add confirmation, the search page's words, the comments page, the staff view, a sweep of every page for the old words; a draft whose publish window ended sorts with the ended rows in both Closes directions (real browser)", [path.join(here, "bu.test.js")], true],
  ["the follow-ups of BV: a draft whose publish window ended says Ended, the My openings filter finds a KIO ID typed with its hyphens, the home page sample card shows a whole valid KIO ID, the candidate comments page shows the whole KIO ID with the req number still masked (real browser)", [path.join(here, "bv.test.js")], true],
  ["the unsaved bar on the Add page is gone the moment the opening is added, by Enter, Space, the mouse, Enter in a field, Save draft and the bar's own Save draft, with no later input; it stays while the request is in flight and after a failed add (real keys and mouse, real browser)", [path.join(here, "bw.test.js")], true],
  ["after an opening is added the keyboard focus is on the confirmation heading by every key and button, with no later input; the first Tab goes to Copy ID; nothing moves in flight or after a failed add; no live region is added (real keys and mouse, real browser)", [path.join(here, "bx.test.js")], true],
  ["the staff search (scope=all) finds an opening by its KIO ID alone in every status, with the staff view's word and the whole ID; an invalid ID is refused, an unknown one says it is not registered; a person who is not staff gets the candidate behavior; before the database change the page falls back to the normal search (real browser)", [path.join(here, "by.test.js")], true],
  ["My openings reworked, in a browser set up like John's screen (classic scroll bar, fonts loaded, 1354 pixels and 5 percent less): no Applicant cap column, the day added under the title, the Status column only in a view that can hold more than one status, a flag in words inside 7 days, the Expiring pill, the Sort by box (six options, blanks last, with a pill and a search, defaults, kept across pills, announced), the table fitted to the card, the keyboard order and the phone list (real browser)", [path.join(here, "my-openings-bp.test.js")], true],
  ["browser helper: closes its browser and removes its folder, a failed start leaves nothing, a hung close is stopped; a browser left open makes the leak check fire, a step that never ends is stopped by its time limit (real browser)", [path.join(here, "leak-check.test.js")], true],
  ["search engines: every page and robots.txt keep them out on stage, and the tool that switches production on (no browser)", [path.join(here, "indexing.test.js")], true],
  ["the gentle refine hints of the title search (October 20, 2026): the lists and the two sentences, with the filler words left out (no browser)", [path.join(here, "refine-hint.unit.test.js")], true],
  ["the link count pills of the opening tile (prompt LK, October 23, 2026): the words, the counts, the exact tooltips (no browser)", [path.join(here, "link-pills.unit.test.js")], true],
  ["the opening tile and the details window (prompt LM, October 23, 2026): the two paragraphs byte for byte unchanged, the buttons by the counts, the AI pills, the policy pill, the words (no browser)", [path.join(here, "lm-cleanup.unit.test.js")], true],
  ["reader-v3 in the stage site and the flag orderAssumed (prompt JE, November 8, 2026): the copies are the files of the extension at reader-v3, the lines named in the prompt through the page's own readFragment with the reader's flag, the flag is a boolean and never set for an unflagged or KIO ID reading, the note words, the 13 sentences, and 11 planted breakages (no browser)", [path.join(here, "order-note.unit.test.js")], true],
  ["the phone entry (prompt IB, November 3, 2026): the 13 sentences letter for letter, the x parser, the 600 character cut, the mapping and the notes, the readings, the hook, the computer test and the link setting (no browser)", [path.join(here, "phone-entry.unit.test.js")], true],
  ["the staff page Companies to invite (prompt IV, November 6, 2026): the dates, the inputs, the sort, the words and the answer checks of js/staff-invite-model.js and api.js (no browser)", [path.join(here, "staff-invite.unit.test.js")], true],
  ["the optional source of the Shortcut address and the search form (prompt JD, November 7, 2026): the key s of the address (empty, missing, repeated, a bad escape, 300 characters, an encoded & and #, s before x, s alone), the limit of 120 characters, the saved search, the words, the markup of the field, the 13 pinned sentences untouched (no browser)", [path.join(here, "source-capture.unit.test.js")], true],
  ["the optional source: planted breakages of the address reader, the limit, the saved search and the field markup, each must make the unit test fail (no browser)", [path.join(here, "source-capture.mutants.test.js")], true],
  ["the moved sentences of the search page are the old sentences (prompt JB, November 7, 2026): the notes cut into the shown part and the remainder join back into the old words, the hidden sentences letter for letter, the approved short texts, 14 breakages and 3 plants at nothing (no browser)", [path.join(here, "info-panel.unit.test.js")], true],
  ["static site rules", [path.join(here, "site-check.js")], false],
  ["static rules: negative controls", [path.join(here, "site-check.controls.js")], false],
  ["browser leak check: no browser process and no profile folder carries the test marker (starts no browser)", [path.join(here, "leak-check.js")], false],
];
// The time limit of one step, in minutes. Chosen from the measured times (reports\browser-cleanup-report.txt): the slowest healthy browser step takes about 10 minutes and the static controls about 18; the longest test
// timeout inside a browser file is 58 minutes, so a browser step gets 60 and the test's own timeout still fires first. FGJ_STEP_LIMIT_SCALE multiplies every limit; FGJ_STEP_LIMIT_MIN sets one limit for every step.
// TEST1 (October 13, 2026): the static controls now get 90 minutes, not 45. The overnight full run (NIGHT1) was stopped at 45 after 1104 controls: the file grew (more than 1150 controls) and each control copies and checks the
// whole repository, which grew too (about 2.8 seconds per control, 17.6 minutes in all on October 7). The step still has a limit: a run that is stopped at 90 minutes is a finding, not a pass.
// JN (November 8, 2026): the static controls now get 150 minutes, not 90. The push check of November 8 was stopped at 90 minutes after 1566 controls (it took 66 minutes 43 seconds on November 6): prompts JB, JD, JE, JK and JL added controls. John chose 150 and not to split the file.
function limitMin(files) {
  if (process.env.FGJ_STEP_LIMIT_MIN) return Number(process.env.FGJ_STEP_LIMIT_MIN);
  const base = path.basename(files[0]);
  // the first prefix of the file name that matches (most specific first); every other file is a browser step
  const byPrefix = [["site-check.controls", 150], ["site-check", 5], ["leak-check.test", 15], ["leak-check", 5], ["unit.test", 15], ["indexing", 15]];
  const hit = byPrefix.find(([p]) => base.startsWith(p));
  return (hit ? hit[1] : 60) * (Number(process.env.FGJ_STEP_LIMIT_SCALE) || 1);
}
const QUICK_BANNER = "QUICK RUN, NOT A FULL RUN, NOT EVIDENCE FOR A PUSH";
const args = process.argv.slice(2), quick = args[0] === "--quick";
let list = steps;
if (quick) {
  console.log(QUICK_BANNER);
  list = [steps[0], steps.find((x) => x[0] === "static site rules")];
  for (const a of args.slice(1)) {
    const base = a.replace(/\.js$/, "").replace(/\.test$/, "");
    const file = path.join(here, base + ".test.js");
    if (!fs.existsSync(file)) { console.log("quick mode: no test file tests/" + base + ".test.js"); console.log(QUICK_BANNER); process.exit(2); }
    list.push(["quick: " + base + " (main tests only; its negative controls skipped)", [file], true, true]);
  }
  if (args.length > 1) list.push(steps.find((x) => path.basename(x[1][0]) === "leak-check.js"));
}
const fmt = (ms) => { const s = ms / 1000; return s < 120 ? s.toFixed(1) + " s" : Math.floor(s / 60) + " min " + String(Math.round(s % 60)).padStart(2, "0") + " s"; };
const t00 = Date.now(), slow = [];
console.log("started " + new Date(t00).toLocaleTimeString());
{
  const s = sweepStale();
  console.log("start of suite sweep: stopped " + s.stopped.length + " browser(s) of test processes that are gone, removed " + s.removed.length + " marker folder(s) older than a day, left " + s.kept.length + " younger marker folder(s)" + (s.notRemoved.length ? "; could not remove: " + s.notRemoved.join(", ") : ""));
}
// Ctrl+C or a terminate request: stop the step that is running (with the test files and browsers below it), remove the folders it left, and end. Nothing is stopped by program name.
for (const sig of ["SIGINT", "SIGTERM", "SIGBREAK", "SIGHUP"]) {
  try {
    process.on(sig, () => {
      stopCurrentStep();
      const r = reapOrphans({ since: t00 - 1000 });
      console.log("interrupted (" + sig + "): the running step was stopped; " + r.stopped.length + " leftover browser process(es) stopped, " + r.removed.length + " profile folder(s) removed" + (r.notRemoved.length ? "; could not remove: " + r.notRemoved.join(", ") : ""));
      process.exit(130);
    });
  } catch { /* this signal does not exist here */ }
}
let failed = 0;
(async () => {
  for (const [name, files, isTest, skipControls] of list) {
    const lim = limitMin(files);
    console.log("-> starting: " + name + " (time limit " + lim + " min)");
    const r = await runStep(isTest ? ["--test", ...(skipControls ? ["--test-skip-pattern=negative controls"] : []), ...files] : files, { limitMs: lim * 60000, env: { FGJ_SUITE_START: String(t00) } });
    const out = r.out;
    for (const m of out.matchAll(/^[✔✖] (.+?) \((\d+(?:\.\d+)?)ms\)$/gm)) slow.push([Number(m[2]), name, m[1]]);
    const tail = out.trim().split("\n").filter((l) => /^(ℹ (tests|pass|fail|cancelled)|site-check|caught|MISSED|DIRTY|clean|FINDING|LEAK|browser leak check|browser cleanup)/.test(l)).slice(-60);
    const ok = r.status === 0;
    console.log("== " + name + ": " + (ok ? "PASS" : "FAIL") + " (" + fmt(r.ms) + ")");
    if (r.timedOut) console.log("   STOPPED BY THE STEP TIME LIMIT of " + lim + " min: the step and the test files and browsers below it were stopped" + (r.reaped ? " (" + r.reaped.found + " leftover browser process(es) and folder(s) found, " + r.reaped.stopped.length + " stopped, " + r.reaped.removed.length + " folder(s) removed)" : ""));
    if (!ok || process.env.VERBOSE) console.log(tail.join("\n"));
    else console.log(tail.filter((l) => /^(ℹ (tests|pass|fail|cancelled)|site-check|browser leak check)/.test(l)).join("\n"));
    // a failed step also prints what failed (the failing test names and the first assertion or error lines), so the exact message is in the log
    if (!ok) console.log(out.split("\n").filter((l) => /^\s*(✖ |AssertionError|Error|TypeError|ReferenceError|SyntaxError)/.test(l)).slice(0, 30).join("\n"));
    if (!ok) console.log("---- full output of the failed step ----\n" + out + "\n---- end of the full output ----");
    if (!ok) failed++;
  }
  const total = Date.now() - t00;
  slow.sort((a, b) => b[0] - a[0]);
  console.log("TOTAL " + fmt(total) + " (" + (failed ? failed + " step(s) FAILED" : "every step passed") + "); finished " + new Date().toLocaleTimeString());
  console.log("TEN SLOWEST TESTS (a time per test; the step name shows the file):");
  for (const [ms, step, test] of slow.slice(0, 10)) console.log("  " + fmt(ms).padStart(10) + "  " + test.slice(0, 90) + "  [" + step.slice(0, 50) + "]");
  if (quick) console.log(QUICK_BANNER);
  process.exit(failed ? 1 : 0);
})();
