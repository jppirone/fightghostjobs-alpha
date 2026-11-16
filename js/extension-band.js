// extension-band.js (prompt NT, November 16, 2026) - the thin band at the top of the app pages that points to the FightGhostJobs Chrome extension in the Chrome Web Store, stacked directly above the Shortcut band.
// The band is plain markup in each page (it shows by default, for everyone). This file does two things only:
//   1. when the person pressed "Don't show again" on an earlier visit, it hides the band before the page is painted (this script sits directly after the band, so there is no flash);
//   2. when the person presses "Don't show again", it hides the band and remembers that in this browser under ONE key of its own (not the key of the Shortcut band).
// Storage may be blocked (private window, site data off): every storage call is inside try/catch, and when it fails the band simply shows again on the next visit. No error is shown or thrown.
// No request is made, nothing is counted, no analytics. The key is read and written here and nowhere else. There is no check whether the extension is installed.
(function () {
  var KEY = "fgj.extensionBand.dismissed";
  var band = document.getElementById("extBand");
  if (!band) return;
  var dismissed = false;
  try { dismissed = window.localStorage.getItem(KEY) === "1"; } catch (e) { dismissed = false; }
  if (dismissed) { band.hidden = true; return; }
  var close = document.getElementById("extBandClose");
  if (!close) return;
  close.addEventListener("click", function () {
    band.hidden = true;
    try { window.localStorage.setItem(KEY, "1"); } catch (e) { /* storage blocked: the band shows again next visit */ }
    // focus goes on to the next control in the page: the Shortcut band's button when that band is still shown, else the logo link
    var sc = document.getElementById("scBand");
    var next = sc && !sc.hidden ? document.getElementById("scBandClose") : document.querySelector(".nav-logo");
    if (next && next.focus) next.focus();
  });
})();
