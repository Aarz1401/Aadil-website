// Aadil Chasmawala — site interactions (no dependencies besides EmailJS)
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  $("#year").textContent = new Date().getFullYear();
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $("#kbd-hint").textContent = "Ctrl K";

  /* ---------- Toast ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* ---------- Theme ---------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    $('meta[name="theme-color"]').setAttribute("content", t === "light" ? "#f6f7f9" : "#0a0e13");
  }
  function toggleTheme() { setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light"); }
  $("#theme-toggle").addEventListener("click", toggleTheme);

  /* ---------- Nav: scrolled state, progress, active link, mobile menu ---------- */
  var nav = $("#nav"), progress = $("#progress");
  var navLinks = $$("#nav-links a");
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); });

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle("active", i === current); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var menuBtn = $("#menu-btn"), linksEl = $("#nav-links");
  menuBtn.addEventListener("click", function () {
    var open = linksEl.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  navLinks.forEach(function (a) { a.addEventListener("click", function () { linksEl.classList.remove("open"); }); });

  /* ---------- Cursor glow + card spotlight ---------- */
  var glow = $("#cursor-glow");
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  } else {
    glow.remove();
  }
  $$(".p-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Portrait tilt ---------- */
  var portrait = $("#portrait .portrait");
  if (portrait && !reduceMotion) {
    $("#portrait").addEventListener("pointermove", function (e) {
      var r = this.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = "perspective(800px) rotateY(" + x * 10 + "deg) rotateX(" + -y * 10 + "deg)";
    });
    $("#portrait").addEventListener("pointerleave", function () { portrait.style.transform = ""; });
  }

  /* ---------- Typing effect ---------- */
  var phrases = [
    "AI agents that work inside Outlook and Teams.",
    "tools that measure software's energy use.",
    "neural nets that recognise chess style.",
    "IDEs that know who wrote the code.",
    "bridges between code and capital."
  ];
  var typedEl = $("#typed");
  if (reduceMotion) {
    typedEl.textContent = phrases[0];
  } else {
    var pi = 0, ci = 0, deleting = false;
    (function tick() {
      var p = phrases[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = p.slice(0, ci);
      var delay = deleting ? 28 : 55;
      if (!deleting && ci === p.length) { deleting = true; delay = 1900; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  /* ---------- Hero particle network ---------- */
  var canvas = $("#hero-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [], W = 0, H = 0, mouse = { x: -9999, y: -9999 }, running = true;
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, (W * H) / 16000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
      }
    }
    function accent() { return getComputedStyle(root).getPropertyValue("--accent").trim() || "#2dd4bf"; }
    function hexToRgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function frame() {
      if (!running) return;
      var rgb = hexToRgb(accent()).join(",");
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = dxm * dxm + dym * dym;
        if (dm < 22000) { p.x += dxm * 0.012; p.y += dym * 0.012; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 15000) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (1 - d / 15000) * 0.28 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(" + rgb + ",0.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      running = vis;
    }).observe(canvas);
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    requestAnimationFrame(frame);
  }

  /* ---------- Reveal on scroll + counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
    var start = performance.now(), dur = 1400;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(animateCount);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
    $$("[data-count]").forEach(animateCount);
  }

  /* ---------- Filters (experience + projects) ---------- */
  function setupFilter(groupSel, itemsSel) {
    var group = $(groupSel);
    var items = $$(itemsSel);
    var buttons = $$(".filter", group);
    buttons.forEach(function (b) {
      var f = b.dataset.filter;
      var n = f === "all" ? items.length : items.filter(function (it) { return it.dataset.cat.split(" ").indexOf(f) > -1; }).length;
      var c = document.createElement("span"); c.className = "count"; c.textContent = n; b.appendChild(c);
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.classList.toggle("active", x === b); });
        items.forEach(function (it) {
          var show = f === "all" || it.dataset.cat.split(" ").indexOf(f) > -1;
          it.classList.toggle("hidden", !show);
          if (show) it.classList.add("in");
        });
      });
    });
  }
  setupFilter('[data-filter-group="exp"]', "#timeline .t-item");
  setupFilter('[data-filter-group="proj"]', "#projects-grid .p-card");

  /* ---------- Marquee: duplicate content for seamless loop ---------- */
  var track = $("#marquee-track");
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- CV switcher ---------- */
  var cvFrame = $("#cv-frame"), cvDl = $("#cv-download"), cvOpen = $("#cv-open");
  function showCv(path) {
    $$(".cv-tab").forEach(function (t) { t.classList.toggle("active", t.dataset.cv === path); });
    cvFrame.src = path + "#view=FitH";
    cvDl.href = path; cvOpen.href = path;
  }
  $$(".cv-tab").forEach(function (t) { t.addEventListener("click", function () { showCv(t.dataset.cv); }); });

  /* ---------- Copy email ---------- */
  function copy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast("Copied " + text); }, function () { toast(text); });
    } else { toast(text); }
  }
  $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { copy(b.dataset.copy); }); });

  /* ---------- Contact form (EmailJS) ---------- */
  var form = $("#contact-form"), status = $("#form-status"), sendBtn = $("#send-btn");
  if (window.emailjs) emailjs.init({ publicKey: "tlU9kO8tl_vQFrqKn" });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!window.emailjs) {
      status.className = "form-status err";
      status.textContent = "Couldn't load the mail service. Please email aac10066@nyu.edu directly.";
      return;
    }
    sendBtn.disabled = true;
    status.className = "form-status";
    status.textContent = "Sending…";
    emailjs.sendForm("service_ad4uzxw", "template_ph28jx9", form).then(function () {
      status.className = "form-status ok";
      status.textContent = "Thanks! Your message is on its way. I'll get back to you soon.";
      form.reset();
    }, function () {
      status.className = "form-status err";
      status.textContent = "Something went wrong. Please email aac10066@nyu.edu directly.";
    }).then(function () { sendBtn.disabled = false; });
  });

  /* ---------- Command palette ---------- */
  var palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
  function go(id) { return function () { $(id).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }; }
  function open(url) { return function () { window.open(url, "_blank", "noopener"); }; }
  var commands = [
    { g: "Navigate", icon: "fa-house", label: "Home", run: go("#home") },
    { g: "Navigate", icon: "fa-user", label: "About", run: go("#about") },
    { g: "Navigate", icon: "fa-briefcase", label: "Experience", run: go("#experience") },
    { g: "Navigate", icon: "fa-code", label: "Projects", run: go("#projects") },
    { g: "Navigate", icon: "fa-toolbox", label: "Skills", run: go("#skills") },
    { g: "Navigate", icon: "fa-trophy", label: "Awards", run: go("#awards") },
    { g: "Navigate", icon: "fa-envelope", label: "Contact", run: go("#contact") },
    { g: "CV", icon: "fa-microchip", label: "Open Technical CV", run: open("CV/Aadil_Chasmawala_CV_Technical.pdf") },
    { g: "CV", icon: "fa-briefcase", label: "Open Business CV", run: open("CV/Aadil_Chasmawala_CV_Business.pdf") },
    { g: "Actions", icon: "fa-copy", label: "Copy email address", run: function () { copy("aac10066@nyu.edu"); } },
    { g: "Actions", icon: "fa-circle-half-stroke", label: "Toggle light / dark theme", run: toggleTheme },
    { g: "Links", icon: "fa-github", brand: true, label: "GitHub · Aarz1401", run: open("https://github.com/Aarz1401") },
    { g: "Links", icon: "fa-linkedin", brand: true, label: "LinkedIn", run: open("https://www.linkedin.com/in/aadil-chasmawala/") },
    { g: "Links", icon: "fa-scroll", label: "Paper · Greening AI-enabled Systems (arXiv)", run: open("https://arxiv.org/abs/2506.01774") }
  ];
  var filtered = commands, sel = 0, lastFocus = null;

  function render() {
    var q = pInput.value.trim().toLowerCase();
    filtered = commands.filter(function (c) { return (c.label + " " + c.g).toLowerCase().indexOf(q) > -1; });
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);
    pList.innerHTML = "";
    if (!filtered.length) {
      pList.innerHTML = '<li class="palette-empty">No results</li>';
      return;
    }
    var lastGroup = null;
    filtered.forEach(function (c, i) {
      if (c.g !== lastGroup) {
        var h = document.createElement("li"); h.className = "palette-group"; h.textContent = c.g; pList.appendChild(h);
        lastGroup = c.g;
      }
      var li = document.createElement("li");
      li.className = "palette-item" + (i === sel ? " selected" : "");
      li.innerHTML = '<i class="' + (c.brand ? "fa-brands " : "fa-solid ") + c.icon + '"></i><span></span>';
      li.lastChild.textContent = c.label;
      li.addEventListener("mousemove", function () { if (sel !== i) { sel = i; highlight(); } });
      li.addEventListener("click", function () { runCmd(c); });
      pList.appendChild(li);
    });
  }
  function highlight() {
    $$(".palette-item", pList).forEach(function (el, i) { el.classList.toggle("selected", i === sel); });
    var s = $(".palette-item.selected", pList);
    if (s) s.scrollIntoView({ block: "nearest" });
  }
  function openPalette() {
    lastFocus = document.activeElement;
    palette.classList.add("open");
    pInput.value = ""; sel = 0; render();
    setTimeout(function () { pInput.focus(); }, 0);
  }
  function closePalette() {
    palette.classList.remove("open");
    if (lastFocus) lastFocus.focus();
  }
  function runCmd(c) { closePalette(); c.run(); }

  $("#palette-open").addEventListener("click", openPalette);
  palette.addEventListener("click", function (e) { if (e.target === palette) closePalette(); });
  pInput.addEventListener("input", function () { sel = 0; render(); });
  pInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); highlight(); }
    else if (e.key === "Enter" && filtered[sel]) { e.preventDefault(); runCmd(filtered[sel]); }
  });
  document.addEventListener("keydown", function (e) {
    var typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.classList.contains("open") ? closePalette() : openPalette();
    } else if (e.key === "Escape" && palette.classList.contains("open")) {
      closePalette();
    } else if (e.key === "/" && !typing && !palette.classList.contains("open")) {
      e.preventDefault(); openPalette();
    }
  });
})();
