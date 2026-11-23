/* Rewatch: a real <audio> narration drives the player. Five photographs crossfade and the caption changes as the voice
   reaches each line. The audio is a computer voice reading the sample text (a real Dearling story plays the teller's own
   recorded voice). Line start times are the exact lengths of the five separately generated clips plus a 0.9 s pause. */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var player = document.getElementById("player");
  var audio = document.getElementById("narration");
  var slides = [].slice.call(player.querySelectorAll(".slide"));
  var lines = [].slice.call(document.querySelectorAll("#tr button"));
  var thumbs = [].slice.call(document.querySelectorAll("#strip button"));
  var bars = [].slice.call(document.querySelectorAll("#bars i"));
  var faces = {}; [].forEach.call(document.querySelectorAll(".fp"), function (f) { faces[f.getAttribute("data-f")] = f; });
  var sub = document.getElementById("sub"), yr = document.getElementById("yr"), now = document.getElementById("now"), btn = document.getElementById("play"), track = document.getElementById("track");
  var totalEl = document.getElementById("total"), errEl = document.getElementById("aerr");
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var at = [0, 6.07, 12.57, 21.13, 27.21];
  var who = [["arthur", "ines"], ["daniel", "marta", "rosa"], ["daniel", "marta"], ["arthur", "rosa", "theo"], ["marta", "mira"]];
  var frozen = q.has("t") ? parseFloat(q.get("t")) : null;
  var t = frozen !== null ? frozen : 0, idx = -1, raf = 0;
  function total() { return isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 31.87; }
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
    var T = total();
    now.textContent = fmt(t); totalEl.textContent = fmt(T);
    var k = Math.round(t / T * bars.length); bars.forEach(function (b, j) { b.classList.toggle("on", j < k); });
    track.setAttribute("aria-valuemax", Math.round(T));
    track.setAttribute("aria-valuenow", Math.round(t)); track.setAttribute("aria-valuetext", fmt(t) + " of " + fmt(T));
  }
  function setBtn() {
    var p = !audio.paused;
    btn.innerHTML = p ? PAUSE : PLAY; btn.setAttribute("aria-label", p ? "Pause story" : "Play story");
    player.classList.toggle("paused", !p);
  }
  function loop() { t = audio.currentTime; paint(); if (!audio.paused) raf = requestAnimationFrame(loop); }
  var pending = null; /* a seek asked for before the file has loaded waits for its metadata */
  function seek(s) {
    s = Math.max(0, Math.min(total() - 0.05, s)); t = s;
    if (audio.readyState === 0) pending = s;
    else { try { audio.currentTime = s; } catch (e) {} }
    paint();
  }
  function showErr(on) { errEl.hidden = !on; }
  btn.addEventListener("click", function () {
    if (audio.paused) {
      [].forEach.call(document.querySelectorAll("audio"), function (a) { if (a !== audio) a.pause(); });
      showErr(false);
      var p = audio.play();
      if (p && p.catch) p.catch(function () { if (audio.error || audio.networkState === 3) showErr(true); });
    } else audio.pause();
  });
  audio.addEventListener("play", function () { setBtn(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
  audio.addEventListener("pause", function () { setBtn(); });
  audio.addEventListener("ended", function () { setBtn(); t = audio.currentTime; paint(); });
  audio.addEventListener("timeupdate", function () { t = audio.currentTime; paint(); });
  audio.addEventListener("loadedmetadata", function () {
    if (pending !== null) { try { audio.currentTime = pending; } catch (e) {} pending = null; }
    paint();
  });
  audio.addEventListener("error", function () { setBtn(); showErr(true); });
  lines.forEach(function (l, k) { l.addEventListener("click", function () { seek(at[k] + 0.05); }); });
  thumbs.forEach(function (b, k) { b.addEventListener("click", function () { seek(at[k] + 0.05); }); });
  document.getElementById("back15").addEventListener("click", function () { seek(t - 15); });
  document.getElementById("fwd15").addEventListener("click", function () { seek(t + 15); });
  var speed = 1;
  document.getElementById("speed").addEventListener("click", function (e) { speed = speed === 1 ? 1.5 : speed === 1.5 ? 0.75 : 1; audio.playbackRate = speed; e.currentTarget.textContent = "Speed " + speed + "x"; });
  track.addEventListener("click", function (e) { var r = track.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total()); });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); seek(t + 5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seek(t - 5); }
    else if (e.key === "Home") { e.preventDefault(); seek(0); }
    else if (e.key === "End") { e.preventDefault(); seek(total() - 0.1); }
  });
  setBtn(); paint();
})();
