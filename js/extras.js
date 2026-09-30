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

	/* Hero background drifts gently with the mouse */
	var hero = document.querySelector(".arlo_tm_hero_header_wrap");
	var heroBg = document.querySelector(".overlay_image.hero");
	if (hero && heroBg && finePointer && !reduceMotion) {
		heroBg.style.transform = "scale(1.06)";
		hero.addEventListener("mousemove", function (e) {
			var r = hero.getBoundingClientRect();
			var x = (e.clientX - r.left) / r.width - 0.5;
			var y = (e.clientY - r.top) / r.height - 0.5;
			heroBg.style.transform = "scale(1.06) translate(" + (-x * 18) + "px," + (-y * 18) + "px)";
		});
		hero.addEventListener("mouseleave", function () { heroBg.style.transform = "scale(1.06)"; });
	}

	/* Section titles reveal as they scroll into view */
	var titles = document.querySelectorAll(".arlo_tm_title_holder");
	if ("IntersectionObserver" in window && !reduceMotion) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add("aac_in"); io.unobserve(e.target); }
			});
		}, { threshold: 0.4 });
		Array.prototype.forEach.call(titles, function (t) { t.classList.add("aac_reveal"); io.observe(t); });
	}

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
