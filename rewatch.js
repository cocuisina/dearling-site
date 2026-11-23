/* Rewatch: five photographs crossfade as the story plays, faces light up as their names come up. 112 second story. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var q = new URLSearchParams(location.search);
  var player = document.getElementById("player");
  var slides = [].slice.call(player.querySelectorAll(".slide"));
  var lines = [].slice.call(document.querySelectorAll("#tr button"));
  var thumbs = [].slice.call(document.querySelectorAll("#strip button"));
  var bars = [].slice.call(document.querySelectorAll("#bars i"));
  var faces = {}; [].forEach.call(document.querySelectorAll(".fp"), function (f) { faces[f.getAttribute("data-f")] = f; });
  var sub = document.getElementById("sub"), yr = document.getElementById("yr"), now = document.getElementById("now"), btn = document.getElementById("play"), track = document.getElementById("track");
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var TOTAL = 112, at = [0, 22, 45, 67, 90];
  var who = [["arthur", "ines"], ["daniel", "marta", "rosa"], ["daniel", "marta"], ["arthur", "rosa", "theo"], ["marta", "mira"]];
  var t = q.has("t") ? parseFloat(q.get("t")) : 8, playing = !reduce && !q.has("t"), speed = 1, idx = -1;
  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function paint() {
    var i = 0; at.forEach(function (a, k) { if (t >= a) i = k; });
    if (i !== idx) {
      idx = i;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      lines.forEach(function (l, k) { l.classList.toggle("now", k === i); });
      thumbs.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
      Object.keys(faces).forEach(function (n) { faces[n].classList.toggle("lit", who[i].indexOf(n) > -1); });
      sub.textContent = lines[i].textContent; yr.textContent = slides[i].getAttribute("data-year");
    }
    now.textContent = fmt(t);
    var k = Math.round(t / TOTAL * bars.length); bars.forEach(function (b, j) { b.classList.toggle("on", j < k); });
    track.setAttribute("aria-valuenow", Math.round(t)); track.setAttribute("aria-valuetext", fmt(t) + " of " + fmt(TOTAL));
  }
  function setBtn() { btn.innerHTML = playing ? PAUSE : PLAY; btn.setAttribute("aria-label", playing ? "Pause story" : "Play story"); player.classList.toggle("paused", !playing); }
  btn.addEventListener("click", function () { playing = !playing; setBtn(); });
  lines.forEach(function (l, k) { l.addEventListener("click", function () { t = at[k] + 0.5; paint(); }); });
  thumbs.forEach(function (b, k) { b.addEventListener("click", function () { t = at[k] + 0.5; paint(); }); });
  document.getElementById("back15").addEventListener("click", function () { t = Math.max(0, t - 15); paint(); });
  document.getElementById("fwd15").addEventListener("click", function () { t = Math.min(TOTAL - 1, t + 15); paint(); });
  document.getElementById("speed").addEventListener("click", function (e) { speed = speed === 1 ? 1.5 : speed === 1.5 ? 0.75 : 1; e.currentTarget.textContent = "Speed " + speed + "x"; });
  track.addEventListener("click", function (e) { var r = track.getBoundingClientRect(); t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (TOTAL - 1); paint(); });
  track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { t = Math.min(TOTAL - 1, t + 5); paint(); } if (e.key === "ArrowLeft") { t = Math.max(0, t - 5); paint(); } });
  var last = performance.now();
  function tick(n) { var dt = (n - last) / 1000; last = n; if (playing) { t += dt * speed; if (t >= TOTAL) t = 0; paint(); } requestAnimationFrame(tick); }
  setBtn(); paint();
  if (!reduce) requestAnimationFrame(tick);
})();
