/* Rewatch: a real <audio> narration drives the player. Five photographs crossfade and the caption changes as the voice
   reaches each line. The audio is a computer voice reading the sample text (a real Dearling story plays the teller's own
   recorded voice). The voice is one take per photograph, joined with 1 s gaps. Times below are word timestamps from a
   local speech-to-text pass over the finished file, so a caption can be off by a few tenths of a second. */
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
  var sp = [0, 30.31, 69.19, 96.99, 128.58]; /* where each photograph's passage starts being spoken */
  var at = sp.map(function (s, k) { return k ? s - 0.5 : 0; }); /* photograph changes half a second ahead, in the gap */
  /* [start second, photograph, caption] */
  var CAP = [
    [0.0, 0, "Now this is us, nineteen fifty-two, outside the first place we rented."],
    [5.92, 0, "Ines is laughing because I'd said something daft. I couldn't tell you what. We had nothing, mind."],
    [12.28, 0, "A kettle, a bed, a landlady you could hear from the street."],
    [16.3, 0, "But Sundays we took the ferry over to the harbour, threepence each, and felt like millionaires."],
    [23.12, 0, "I can still smell it. Diesel, and wet rope, and chips with far too much vinegar."],
    [30.31, 1, "Now this one is, what, seventy-six. No."],
    [35.33, 1, "Seventy-five, because Rosa's in that checked frock and she wasn't walking yet."],
    [40.31, 1, "That's Daniel holding her, and Marta, and Marta's mother on the end, who never smiled for a photograph in her life."],
    [47.75, 1, "Look at her now, though. That's Rosa's doing."],
    [51.77, 1, "Daniel carried the basket when he was little, wicker, the handle mended with a bootlace."],
    [57.39, 1, "Oh, I could tell you about that bootlace. No. Now, where was I."],
    [64.45, 1, "Daniel complained the whole way up the hill. Every Sunday."],
    [69.19, 2, "Marta and her candles. Every birthday, too many on the cake, and Ines would count them out loud."],
    [76.53, 2, "Marta would say, it's a celebration, Ines, not an inspection."],
    [81.47, 2, "Look at Daniel at the back, clapping like he's at the opera."],
    [85.45, 2, "We ate that cake half in the dark, because a bulb had gone and he'd see to it on Saturday."],
    [91.25, 2, "Ninety-four, that was. I believe that bulb was changed in ninety-six."],
    [96.99, 3, "This is not our harbour. Different shore altogether, but the same grey-blue water."],
    [103.41, 3, "Rosa had brought the children, and a tub of grapes, and far too much watermelon."],
    [108.59, 3, "That's Theo with his face in it, and Mira, nearly three, wearing the rest."],
    [113.71, 3, "I sat there with one on each side of me and I told them about the ferry."],
    [119.33, 3, "And I found I had to stop for a minute. So I ate some watermelon."],
    [125.61, 3, "It's a very good way of not talking."],
    [128.58, 4, "And this is last year. Or this year, I lose track. Marta and Mira at the dough, Sunday of course."],
    [136.6, 4, "Marta's gone grey and I have not said a word."],
    [140.52, 4, "That rolling pin was Ines's mother's, and it has a crack in it, and nobody will hear of a new one."],
    [147.26, 4, "You'll have noticed Ines isn't in any of the others. She was always holding the camera."],
    [152.92, 4, "That one in fifty-two, I think I tricked her."]
  ];
  var who = [["arthur", "ines"], ["daniel", "marta", "rosa"], ["daniel", "marta"], ["arthur", "rosa", "theo"], ["marta", "mira"]];
  var frozen = q.has("t") ? parseFloat(q.get("t")) : null;
  var t = frozen !== null ? frozen : 0, idx = -1, cidx = -1, raf = 0;
  function total() { return isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 155.74; }
  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function paint() {
    var i = 0; at.forEach(function (a, k) { if (t >= a) i = k; });
    if (i !== idx) {
      idx = i;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      lines.forEach(function (l, k) { l.classList.toggle("now", k === i); });
      thumbs.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
      Object.keys(faces).forEach(function (n) { faces[n].classList.toggle("lit", who[i].indexOf(n) > -1); });
      yr.textContent = slides[i].getAttribute("data-year");
    }
    var c = 0; CAP.forEach(function (x, k) { if (t >= x[0] - 0.1) c = k; });
    if (c !== cidx) { cidx = c; sub.textContent = CAP[c][2]; }
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
  lines.forEach(function (l, k) { l.addEventListener("click", function () { seek(sp[k] + 0.05); }); });
  thumbs.forEach(function (b, k) { b.addEventListener("click", function () { seek(sp[k] + 0.05); }); });
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
  var rb = document.getElementById("readbtn"), rt = document.getElementById("readtxt");
  rb.addEventListener("click", function () { var open = rb.getAttribute("aria-expanded") !== "true"; rb.setAttribute("aria-expanded", open ? "true" : "false"); rt.hidden = !open; rb.textContent = open ? "Hide the story" : "Read the story"; });
  setBtn(); paint();
})();
