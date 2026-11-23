/* Dearling hero: five prints settle, find a face each, and become the family tree. 18 second loop,
   the idea is on screen by 3.6 s. Pause button freezes on the finished tree. Reduced motion: finished tree, no loop.
   ?t=SECONDS freezes the stage at that time (used for screenshots and measuring). */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var q = new URLSearchParams(location.search);
  var freeze = q.has("t") ? parseFloat(q.get("t")) : null;
  var hero = document.getElementById("hero");
  var stage = document.getElementById("stage");
  var capEl = document.getElementById("stagecap");
  var pauseBtn = document.getElementById("pausebtn");
  if (!stage) return;

  /* face centre (fx, fy) and head width (ff) as fractions of each 4:5 print */
  var FACES = {
    p1952: { src: "assets/p1952.jpg", fx: 0.38, fy: 0.31, ff: 0.2 },
    p1975: { src: "assets/p1975.jpg", fx: 0.30, fy: 0.29, ff: 0.2 },
    p1994: { src: "assets/p1994.jpg", fx: 0.40, fy: 0.33, ff: 0.26 },
    p2008: { src: "assets/p2008.jpg", fx: 0.66, fy: 0.28, ff: 0.2 },
    p2025: { src: "assets/p2025.jpg", fx: 0.70, fy: 0.31, ff: 0.3 }
  };
  var ASPECT = 1.3, LOOP = 18;
  /* stack position (sx, sy, sr) and tree position (tx, ty) as fractions of stage width and height */
  var people = [
    { k: "p1952", name: "Arthur", yr: "1952", sx: 0.33, sy: 0.3, sr: -8, tx: 0.3, ty: 0.09, fl: 0.0 },
    { k: "p1975", name: "Daniel", yr: "1975", sx: 0.64, sy: 0.27, sr: 6, tx: 0.3, ty: 0.335, fl: 1.3 },
    { k: "p1994", name: "Marta", yr: "1994", sx: 0.37, sy: 0.6, sr: -3, tx: 0.66, ty: 0.335, fl: 2.4 },
    { k: "p2008", name: "Rosa", yr: "2008", sx: 0.67, sy: 0.62, sr: 7, tx: 0.48, ty: 0.58, fl: 3.2 },
    { k: "p2025", name: "Mira", yr: "2025", sx: 0.5, sy: 0.47, sr: 2, tx: 0.48, ty: 0.825, fl: 4.1 }
  ];
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "tree-lines");
  svg.setAttribute("aria-hidden", "true");
  stage.appendChild(svg);
  var paths = [0, 1, 2, 3].map(function () {
    var p = document.createElementNS(svgNS, "path");
    p.setAttribute("pathLength", "1");
    p.style.strokeDasharray = "1";
    svg.appendChild(p);
    return p;
  });
  people.forEach(function (p, i) {
    var f = FACES[p.k];
    var el = document.createElement("div");
    el.className = "print";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Photograph from " + p.yr + ", with " + p.name);
    el.innerHTML = '<div class="pic"><img alt="" src="' + f.src + '"><span class="ring"></span></div>';
    el.style.zIndex = 2 + i;
    el.style.boxSizing = "border-box";
    stage.appendChild(el);
    p.el = el; p.pic = el.firstChild; p.ring = p.pic.querySelector(".ring");
    var tag = document.createElement("div");
    tag.className = "tag"; tag.style.zIndex = 20; tag.textContent = p.name;
    stage.appendChild(tag);
    p.tag = tag;
  });

  function sstep(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function phase(T) { // 0 = stack, 1 = tree
    if (T < 1.2) return 0;
    if (T < 3.6) return sstep(0, 1, (T - 1.2) / 2.4);
    if (T < 13) return 1;
    if (T < 16) return 1 - sstep(0, 1, (T - 13) / 3);
    return 0;
  }
  var lastCap = "";
  function render(t) {
    var T = t % LOOP;
    var P = reduce ? 1 : phase(T);
    var S = stage.clientWidth, asp = S < 420 && window.innerWidth < 700 ? 1.55 : ASPECT;
    stage.style.aspectRatio = "1 / " + asp;
    var H = S * asp;
    if (!S) return;
    var sw = S * 0.46, sh = sw * 1.25, d = S * (S < 400 ? 0.21 : 0.2), pad = 8;
    people.forEach(function (p, i) {
      var f = FACES[p.k];
      var fl = reduce ? 0 : 1 - P;
      var fx = Math.sin(t * 0.35 + p.fl) * S * 0.012 * fl;
      var fy = Math.cos(t * 0.29 + p.fl * 1.7) * S * 0.012 * fl;
      var fr = Math.sin(t * 0.22 + p.fl) * 1.4 * fl;
      var cx = lerp(p.sx * S, p.tx * S, P) + fx;
      var cy = lerp(p.sy * H, p.ty * H, P) + fy;
      var rot = lerp(p.sr, 0, P) + fr;
      var w = lerp(sw, d, P), h = lerp(sh, d, P);
      var el = p.el, bw = lerp(pad, 4, P);
      el.style.width = w + "px"; el.style.height = h + "px";
      el.style.borderRadius = lerp(3, 50, P) + "%";
      el.style.border = bw + "px solid #fff";
      el.style.transform = "translate(" + (cx - w / 2) + "px," + (cy - h / 2) + "px) rotate(" + rot + "deg)";
      var scale = lerp(1, (d / f.ff * 0.82) / (sw - 2 * pad), P);
      var picw = (sw - 2 * pad) * scale, cdia = d - 8;
      p.pic.style.width = picw + "px"; p.pic.style.height = picw * 1.25 + "px";
      p.pic.style.left = lerp(0, cdia / 2 - f.fx * picw, P) + "px";
      p.pic.style.top = lerp(0, cdia / 2 - f.fy * picw * 1.25, P) + "px";
      var rIn = reduce ? 0 : sstep(0.2 + i * 0.12, 0.7 + i * 0.12, T) * (1 - sstep(0.02, 0.4, P));
      p.ring.style.opacity = T < 16 ? rIn : 0;
      p.ring.style.left = f.fx * 100 + "%"; p.ring.style.top = f.fy * 100 + "%";
      p.ring.style.width = p.ring.style.height = f.ff * picw + "px";
      p.tag.style.transform = "translate(" + (cx - p.tag.offsetWidth / 2) + "px," + (cy + h / 2 + 8) + "px)";
      p.tag.style.opacity = sstep(0.6, 0.9, P);
    });
    function C(i) { return [people[i].tx * S, people[i].ty * H]; }
    var r = d / 2, a = C(0), dn = C(1), ma = C(2), ro = C(3), mi = C(4), mid = (dn[0] + ma[0]) / 2;
    var defs = [
      "M" + a[0] + " " + (a[1] + r + 48) + " V" + (dn[1] - r - 6),
      "M" + (dn[0] + r + 4) + " " + dn[1] + " H" + (ma[0] - r - 4),
      "M" + mid + " " + dn[1] + " V" + (ro[1] - r - 6),
      "M" + ro[0] + " " + (ro[1] + r + 48) + " V" + (mi[1] - r - 6)
    ];
    var o = 1 - sstep(0.55, 1, P);
    paths.forEach(function (pa, i) {
      pa.setAttribute("d", defs[i]);
      pa.style.strokeDashoffset = o;
      pa.style.opacity = P > 0.5 ? 1 : 0;
    });
    svg.setAttribute("viewBox", "0 0 " + S + " " + H);
    var cap = reduce ? "Photographs become people on your tree" :
      T < 1.2 ? "Five photographs, 1952 to 2025" :
      T < 3.6 ? "Each face becomes a person" :
      T < 13 ? "Placed on the tree as you talk" :
      T < 16 ? "And back to the photographs" : "Five photographs, 1952 to 2025";
    if (cap !== lastCap && capEl) { capEl.textContent = cap; lastCap = cap; }
  }

  var clock = 0, last = null, playing = !reduce && freeze === null;
  function frame(now) {
    if (last === null) last = now;
    if (playing) { clock += (now - last) / 1000; render(clock); }
    last = now;
    if (!reduce && freeze === null) requestAnimationFrame(frame);
  }
  function setPlaying(v) {
    playing = v;
    hero.classList.toggle("paused", !v);
    if (!v) { clock = 8; render(clock); } // park on the finished tree
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", v ? "false" : "true");
      pauseBtn.textContent = v ? "Pause the animation" : "Play the animation";
    }
  }
  if (pauseBtn) {
    if (reduce) pauseBtn.hidden = true;
    pauseBtn.addEventListener("click", function () { setPlaying(!playing); });
  }
  function boot() {
    render(reduce ? 8 : freeze !== null ? freeze : 0);
    if (!reduce && freeze === null) requestAnimationFrame(frame);
  }
  window.addEventListener("resize", function () { render(reduce ? 8 : freeze !== null ? freeze : clock); });
  if (reduce || freeze !== null) hero.classList.add("paused");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
})();
