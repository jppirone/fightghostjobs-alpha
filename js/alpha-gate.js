// ============================================================================================================
// ALPHA ONLY - js/alpha-gate.js - a crude, deliberate deterrent for alpha.fightghostjobs.com. NOT security.
//
// It stops someone who stumbles on the alpha address from browsing the pilot's sample and test employer data. The password itself is NOT in this file: only a salted
// PBKDF2-SHA256 hash of it (310000 rounds), so reading this file does not reveal it. It is a classic (non-module) script loaded in the <head> of every page so the page
// stays hidden until the password is given once per browser (localStorage). As a second guard it does nothing unless the page is served from the alpha host (HOST below).
// ============================================================================================================
(function () {
  "use strict";
  var HOST = "alpha.fightghostjobs.com", KEY = "fgj_alpha_gate", SALT = "UyipNuN6xRITENPL/6e+Uw==", HASH = "zxrC34IgwkGcF7DkxW/ZkY9zLFAtvYecGV8l6nl3tg0=", ITER = 310000, TAG = KEY + "_v", VER = HASH.slice(0, 16);
  if (location.hostname !== HOST) return;
  var open = false;
  // unlocked only if it was unlocked with THIS password: a browser that entered an older password is asked again
  try { open = localStorage.getItem(KEY) === "open" && localStorage.getItem(TAG) === VER; } catch (e) { open = false; }
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
  function fromB64(s) { var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function toB64(buf) { var a = new Uint8Array(buf), s = ""; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function matches(pw) {
    if (!window.crypto || !window.crypto.subtle) return Promise.reject(new Error("no crypto"));
    return window.crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]).then(function (k) {
      return window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64(SALT), iterations: ITER, hash: "SHA-256" }, k, 256);
    }).then(function (bits) { return toB64(bits) === HASH; });
  }

  function build() {
    if (document.getElementById("alphaGate")) return;
    var form = el("form"); form.id = "alphaGate"; form.setAttribute("autocomplete", "off");
    var label = el("label", "Password"); label.htmlFor = "alphaGatePassword";
    var input = el("input"); input.type = "password"; input.id = "alphaGatePassword"; input.required = true;
    var msg = el("p"); msg.className = "gate-msg";
    var button = el("button", "Continue");
    form.appendChild(el("h1", "FightGhostJobs alpha"));
    form.appendChild(el("p", "This is a private pilot environment. It holds sample and test data, not the registry. Enter the password to continue."));
    form.appendChild(label); form.appendChild(input); form.appendChild(button); form.appendChild(msg);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      button.disabled = true; msg.textContent = "Checking...";
      matches(input.value).then(function (ok) {
        if (ok) {
          try { localStorage.setItem(KEY, "open"); localStorage.setItem(TAG, VER); } catch (e2) { /* the page opens for this load anyway */ }
          root.removeAttribute("data-alpha-gate");
          form.parentNode.removeChild(form);
        } else {
          msg.textContent = "That is not the password.";
          input.value = ""; button.disabled = false; input.focus();
        }
      }, function () { msg.textContent = "This page must be opened over https."; button.disabled = false; });
    });
    document.body.appendChild(form);
    input.focus();
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
