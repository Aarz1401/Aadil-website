/*
 * Small interaction layer on top of the Arlo template - Aadil Chasmawala 2026
 * Sidebar progress, hero name reveal, title reveals, card tilt, local clock.
 */
(function () {
	"use strict";

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(pointer: fine)").matches;

	/* Sidebar scroll progress */
	var bar = document.querySelector(".aac_progress span");
	function onScroll() {
		var max = document.documentElement.scrollHeight - window.innerHeight;
		if (bar) bar.style.transform = "scaleY(" + (max > 0 ? window.scrollY / max : 0) + ")";
	}
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	/* Hero name: split into letters, reveal once the preloader lifts */
	var name = document.querySelector(".name_holder h3");
	if (name) {
		var i = 0;
		(function split(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (child) {
				if (child.nodeType === 3) {
					var frag = document.createDocumentFragment();
					child.textContent.split("").forEach(function (ch) {
						if (ch === " ") { frag.appendChild(document.createTextNode(" ")); return; }
						var s = document.createElement("span");
						s.className = "aac_char";
						s.textContent = ch;
						s.style.transitionDelay = (i++ * 45) + "ms";
						frag.appendChild(s);
					});
					node.replaceChild(frag, child);
				} else if (child.nodeType === 1) {
					split(child);
				}
			});
		})(name);

		var preloader = document.querySelector(".arlo_tm_preloader");
		var reveal = function () { setTimeout(function () { name.classList.add("aac_ready"); }, reduceMotion ? 0 : 450); };
		if (!preloader || preloader.classList.contains("loaded")) {
			reveal();
		} else {
			new MutationObserver(function (m, obs) {
				if (preloader.classList.contains("loaded")) { obs.disconnect(); reveal(); }
			}).observe(preloader, { attributes: true, attributeFilter: ["class"] });
		}
	}

	var hero = document.querySelector(".arlo_tm_hero_header_wrap");

	/* Section titles reveal as they scroll into view */
	var titles = document.querySelectorAll(".arlo_tm_title_holder");
	if ("IntersectionObserver" in window && !reduceMotion) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) {
					e.target.classList.add("aac_in");
					var h = e.target.querySelector("h3");
					if (h) decode(h);
					io.unobserve(e.target);
				}
			});
		}, { threshold: 0.4 });
		Array.prototype.forEach.call(titles, function (t) { t.classList.add("aac_reveal"); io.observe(t); });
	}

	/* Title text resolves out of scrambled characters, left to right */
	function decode(el) {
		var target = el.textContent;
		var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
		var frame = 0, total = 22;
		el.setAttribute("aria-label", target);
		(function step() {
			var done = Math.floor((frame / total) * target.length);
			var out = "";
			for (var k = 0; k < target.length; k++) {
				var c = target.charAt(k);
				out += (k < done || c === " ") ? c : glyphs.charAt(Math.floor(Math.random() * glyphs.length));
			}
			el.textContent = out;
			if (frame++ < total) { setTimeout(step, 35); } else { el.textContent = target; }
		})();
	}

	/* Hero: faint constellation of nodes that drift and link up near the cursor */
	var net = document.querySelector(".aac_net");
	if (net && net.getContext) {
		var ctx = net.getContext("2d");
		var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
		var nodes = [], mouse = { x: -9999, y: -9999 }, running = false, visible = true;
		var LINK = 130;
		/* A brief brightening around one point, fired by navigation or returning to the hero */
		var pulse = 0, pcx = 0, pcy = 0;
		var firePulse = function () {
			if (reduceMotion) return;
			pcx = W * (0.25 + Math.random() * 0.5);
			pcy = H * (0.25 + Math.random() * 0.5);
			pulse = 1;
		};
		var boost = function (x, y) {
			if (pulse < 0.01) return 1;
			var dx = x - pcx, dy = y - pcy, r = Math.max(W, H) * 0.35;
			var k = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / r);
			return 1 + pulse * k * 3;
		};

		var size = function () {
			var r = net.getBoundingClientRect();
			W = r.width; H = r.height;
			net.width = W * dpr; net.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			var count = Math.min(70, Math.round((W * H) / 18000));
			nodes = [];
			for (var n = 0; n < count; n++) {
				nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
			}
		};

		var draw = function () {
			ctx.clearRect(0, 0, W, H);
			for (var a = 0; a < nodes.length; a++) {
				var p = nodes[a];
				if (!reduceMotion) {
					p.x += p.vx; p.y += p.vy;
					if (p.x < 0 || p.x > W) p.vx *= -1;
					if (p.y < 0 || p.y > H) p.vy *= -1;
				}
				for (var b = a + 1; b < nodes.length; b++) {
					var q = nodes[b], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
					if (d < LINK) {
						ctx.strokeStyle = "rgba(0,173,181," + Math.min(0.6, 0.18 * (1 - d / LINK) * boost((p.x + q.x) / 2, (p.y + q.y) / 2)) + ")";
						ctx.lineWidth = 1;
						ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
					}
				}
				var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
				if (md < LINK * 1.4) {
					ctx.strokeStyle = "rgba(0,173,181," + (0.35 * (1 - md / (LINK * 1.4))) + ")";
					ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
				}
				var bp = boost(p.x, p.y);
				ctx.fillStyle = "rgba(0,173,181," + Math.min(1, 0.55 * bp) + ")";
				ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * (bp > 1.5 ? 1.4 : 1), 0, Math.PI * 2); ctx.fill();
			}
			pulse *= 0.965;
		};

		var loop = function () {
			if (!running) return;
			draw();
			requestAnimationFrame(loop);
		};
		var update = function () {
			var should = visible && !document.hidden && !reduceMotion;
			if (should && !running) { running = true; requestAnimationFrame(loop); }
			if (!should) running = false;
		};

		size();
		draw();
		window.addEventListener("resize", function () { size(); draw(); });
		document.addEventListener("visibilitychange", update);
		if (hero && finePointer) {
			hero.addEventListener("mousemove", function (e) {
				var r = net.getBoundingClientRect();
				mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
			});
			hero.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });
		}
		if ("IntersectionObserver" in window) {
			new IntersectionObserver(function (en) {
				var was = visible;
				visible = en[0].isIntersecting;
				if (visible && !was) firePulse();
				update();
			}).observe(net);
		}
		Array.prototype.forEach.call(document.querySelectorAll(".anchor_nav a, .arlo_tm_mobile_menu a"), function (a) {
			a.addEventListener("click", firePulse);
		});
		update();
	}

	/* RewriteSafe cover: run the robot along its safe path on hover */
	Array.prototype.forEach.call(document.querySelectorAll(".aac_robot"), function (svg) {
		var card = svg.closest(".inner_list");
		var motion = svg.querySelector("animateMotion");
		if (card && motion && motion.beginElement) {
			var bot = svg.querySelector(".bot");
			card.addEventListener("mouseenter", function () { motion.beginElement(); bot.classList.add("go"); });
		}
	});

	/* Experience: a teal line grows down the left edge as you scroll, ticking past each row */
	var expWrap = document.querySelector(".aac_experience");
	if (expWrap) {
		var tl = document.createElement("div");
		tl.className = "aac_timeline";
		tl.innerHTML = "<span></span>";
		expWrap.appendChild(tl);
		var tlFill = tl.firstChild, ticks = [];

		var layoutTimeline = function () {
			var cards = Array.prototype.filter.call(expWrap.querySelectorAll("#experience_list > li"), function (li) { return li.offsetParent !== null; });
			if (!cards.length) return;
			var wr = expWrap.getBoundingClientRect();
			var first = cards[0].querySelector(".inner").getBoundingClientRect();
			var last = cards[cards.length - 1].getBoundingClientRect();
			tl.style.left = (first.left - wr.left - 22) + "px";
			tl.style.top = (first.top - wr.top) + "px";
			tl.style.height = (last.bottom - first.top) + "px";
			ticks.forEach(function (t) { tl.removeChild(t); });
			ticks = [];
			var seen = {};
			cards.forEach(function (li) {
				var top = Math.round(li.querySelector(".inner").getBoundingClientRect().top - first.top);
				if (seen[top]) return;
				seen[top] = true;
				var b = document.createElement("b");
				b.style.top = top + 24 + "px";
				b.dataset.y = top + 24;
				tl.appendChild(b);
				ticks.push(b);
			});
			progressTimeline();
		};
		var progressTimeline = function () {
			var r = tl.getBoundingClientRect();
			var p = reduceMotion ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.65 - r.top) / r.height));
			tlFill.style.transform = "scaleY(" + p + ")";
			var reach = p * r.height;
			ticks.forEach(function (t) { t.classList.toggle("on", +t.dataset.y <= reach); });
		};
		window.addEventListener("scroll", progressTimeline, { passive: true });
		window.addEventListener("resize", layoutTimeline);
		window.addEventListener("load", layoutTimeline);
		Array.prototype.forEach.call(document.querySelectorAll('.aac_filter[data-target="#experience_list"] a'), function (a) {
			a.addEventListener("click", function () { setTimeout(layoutTimeline, 450); });
		});
		layoutTimeline();
	}

	/* Paper links: small tooltip with venue and authorship */
	var papers = {
		"doi.org/10.1145/3786148.3788627": "GREENS '26 &middot; ACM &middot; ICSE 2026 workshop, Rio de Janeiro &middot; 2nd author",
		"arxiv.org/abs/2506.01774": "arXiv 2025 &middot; CECAM-Lorentz workshop, Lausanne &middot; co-author"
	};
	var tip = document.createElement("div");
	tip.className = "aac_tip";
	tip.setAttribute("role", "tooltip");
	document.body.appendChild(tip);
	var showTip = function (a, html) {
		tip.innerHTML = html;
		var r = a.getBoundingClientRect();
		tip.style.left = "0px"; tip.style.top = "0px";
		var tw = tip.offsetWidth, th = tip.offsetHeight;
		var left = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
		tip.style.left = left + "px";
		tip.style.top = (r.top - th - 10) + "px";
		tip.classList.add("show");
	};
	var hideTip = function () { tip.classList.remove("show"); };
	Array.prototype.forEach.call(document.querySelectorAll("a[href]"), function (a) {
		Object.keys(papers).forEach(function (key) {
			if (a.href.indexOf(key) !== -1) {
				a.addEventListener("mouseenter", function () { showTip(a, papers[key]); });
				a.addEventListener("focus", function () { showTip(a, papers[key]); });
				a.addEventListener("mouseleave", hideTip);
				a.addEventListener("blur", hideTip);
			}
		});
	});
	window.addEventListener("scroll", hideTip, { passive: true });

	/* Project cards: gentle 3D tilt and light sheen */
	if (finePointer && !reduceMotion) {
		Array.prototype.forEach.call(document.querySelectorAll(".aac_tilt .inner_list"), function (card) {
			card.addEventListener("mousemove", function (e) {
				var r = card.getBoundingClientRect();
				var x = (e.clientX - r.left) / r.width;
				var y = (e.clientY - r.top) / r.height;
				card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 6) + "deg) rotateY(" + ((x - 0.5) * 6) + "deg) translateY(-4px)";
				card.style.setProperty("--aac-x", (x * 100) + "%");
				card.style.setProperty("--aac-y", (y * 100) + "%");
			});
			card.addEventListener("mouseleave", function () { card.style.transform = ""; });
		});
	}

	/* Live local time in Abu Dhabi */
	var clock = document.getElementById("aac_clock");
	if (clock && window.Intl) {
		var fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
		var tick = function () { clock.textContent = fmt.format(new Date()) + " GST (UTC+4)"; };
		tick();
		setInterval(tick, 15000);
	}
})();
