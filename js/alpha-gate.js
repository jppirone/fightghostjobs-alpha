// ============================================================================================================
// ALPHA ONLY - js/alpha-gate.js - a crude, deliberate deterrent for alpha.fightghostjobs.com. NOT security.
//
// It stops someone who stumbles on the alpha address from browsing the pilot's sample and test employer data.
// Anyone who reads this file can see the password; that is accepted. It is a classic (non-module) script loaded
// in the <head> of every page so the page stays hidden until the password is given once per browser (localStorage).
//
// This is the same mechanism as stage's js/stage-gate.js, adapted for this second, still-private environment
// (not a public launch). As a second guard it does nothing unless the page is served from the alpha host
// (HOST below).
// ============================================================================================================
(function () {
  "use strict";
  var HOST = "alpha.fightghostjobs.com", KEY = "fgj_alpha_gate", PASSWORD = "FGJAlphaPilot!";
  if (location.hostname !== HOST) return;
  var open = false;
  try { open = localStorage.getItem(KEY) === "open"; } catch (e) { open = false; }
  if (open) return;

  var root = document.documentElement;
  root.setAttribute("data-alpha-gate", "locked");
  var style = document.createElement("style");
  style.textContent = 'html[data-alpha-gate="locked"] body > :not(#alphaGate) { display: none !important; }' +
    " #alphaGate { max-width: 360px; margin: 120px auto 0; padding: 0 16px; display: flex; flex-direction: column; gap: 12px; font-family: 'Work Sans', system-ui, sans-serif; }" +
    " #alphaGate h1 { font-size: 20px; font-weight: 700; margin: 0; }" +
    " #alphaGate p { margin: 0; font-size: 14px; line-height: 1.5; }" +
    " #alphaGate input { font: inherit; padding: 8px 10px; border: 1px solid #999; border-radius: 4px; }" +
    " #alphaGate button { font: inherit; padding: 8px 14px; border: 1px solid #333; border-radius: 4px; background: #333; color: #fff; cursor: pointer; align-self: flex-start; }" +
    " #alphaGate .gate-msg { font-size: 13px; min-height: 1.5em; }";
  (document.head || root).appendChild(style);

  function el(tag, text) { var n = document.createElement(tag); if (text) n.textContent = text; return n; }

  function build() {
    if (document.getElementById("alphaGate")) return;
    var form = el("form"); form.id = "alphaGate"; form.setAttribute("autocomplete", "off");
    var label = el("label", "Password"); label.htmlFor = "alphaGatePassword";
    var input = el("input"); input.type = "password"; input.id = "alphaGatePassword"; input.required = true;
    var msg = el("p"); msg.className = "gate-msg";
    form.appendChild(el("h1", "FightGhostJobs alpha"));
    form.appendChild(el("p", "This is a private pilot environment. It holds sample and test data, not the registry. Enter the password to continue."));
    form.appendChild(label); form.appendChild(input); form.appendChild(el("button", "Continue")); form.appendChild(msg);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === PASSWORD) {
        try { localStorage.setItem(KEY, "open"); } catch (e2) { /* the page opens for this load anyway */ }
        root.removeAttribute("data-alpha-gate");
        form.parentNode.removeChild(form);
      } else {
        msg.textContent = "That is not the password.";
        input.value = "";
        input.focus();
      }
    });
    document.body.appendChild(form);
    input.focus();
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
