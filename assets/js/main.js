/* =========================================================
   Twintail Launcher site interactions
   ========================================================= */
(function () {
	"use strict";

	const $  = (sel, ctx = document) => ctx.querySelector(sel);
	const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

	/* ---- sticky nav shadow on scroll ---- */
	const nav = $(".nav");
	const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 12);
	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });

	/* ---- mobile menu ---- */
	const toggle = $(".nav-toggle");
	const menu = $(".mobile-menu");
	if (toggle && menu) {
		toggle.addEventListener("click", () => {
			const open = menu.classList.toggle("open");
			toggle.setAttribute("aria-expanded", String(open));
		});
		$$(".mobile-menu a, .mobile-menu .btn").forEach((el) =>
			el.addEventListener("click", () => {
				menu.classList.remove("open");
				toggle.setAttribute("aria-expanded", "false");
			})
		);
	}

	/* ---- platform-aware download button ---- */
	const detectWindows = () => {
		const p = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "").toLowerCase();
		return p.includes("win");
	};
	const mainBtn = $("#downloadMainBtn");
	if (mainBtn) {
		const label = $(".dl-label", mainBtn);
		if (detectWindows()) {
			// Windows is distributed via winget only. Send users to the download
			// section so they get the install command.
			mainBtn.href = "#download";
			if (label) label.textContent = "Download for Windows";
		} else {
			mainBtn.href = "https://flathub.org/apps/app.twintaillauncher.ttl";
			mainBtn.target = "_blank";
			mainBtn.rel = "noopener";
			if (label) label.textContent = "Download for Linux";
		}
	}

	/* ---- download OS tabs ---- */
	$$(".tab").forEach((tab) => {
		tab.addEventListener("click", () => {
			const target = tab.dataset.target;
			$$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
			$$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === target));
		});
	});
	// preselect tab matching the user's OS
	if (!detectWindows()) {
		const linuxTab = $('.tab[data-target="panel-linux"]');
		if (linuxTab) linuxTab.click();
	}

	/* ---- copy-to-clipboard for install commands ---- */
	$$(".copy-btn").forEach((btn) => {
		btn.addEventListener("click", async () => {
			const text = btn.dataset.copy || "";
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				try { document.execCommand("copy"); } catch {}
				ta.remove();
			}
			btn.classList.add("copied");
			const original = btn.innerHTML;
			btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
			setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = original; }, 1600);
		});
	});

	/* ---- FAQ accordion ---- */
	$$(".faq-item").forEach((item) => {
		const q = $(".faq-q", item);
		const a = $(".faq-a", item);
		q.addEventListener("click", () => {
			const isOpen = item.classList.contains("open");
			$$(".faq-item").forEach((other) => {
				other.classList.remove("open");
				$(".faq-a", other).style.maxHeight = null;
				$(".faq-q", other).setAttribute("aria-expanded", "false");
			});
			if (!isOpen) {
				item.classList.add("open");
				a.style.maxHeight = a.scrollHeight + "px";
				q.setAttribute("aria-expanded", "true");
			}
		});
	});

	/* ---- lightbox for screenshots ---- */
	const lightbox = $("#lightbox");
	if (lightbox) {
		const lbImg = $("img", lightbox);
		const open = (src, alt) => { lbImg.src = src; lbImg.alt = alt || ""; lightbox.classList.add("open"); document.body.style.overflow = "hidden"; };
		const close = () => { lightbox.classList.remove("open"); document.body.style.overflow = ""; };
		$$(".gallery figure").forEach((fig) => {
			const img = $("img", fig);
			fig.addEventListener("click", () => open(img.currentSrc || img.src, img.alt));
		});
		$(".close", lightbox).addEventListener("click", close);
		lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
		document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
	}

	/* ---- scroll reveal (progressive enhancement) ---- */
	const reveals = $$(".reveal");
	const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const revealAll = () => reveals.forEach((el) => el.classList.add("in"));

	if (reveals.length && !reduceMotion && "IntersectionObserver" in window) {
		// Hiding is opt-in via this class, so content stays visible if JS bails.
		document.documentElement.classList.add("reveal-on");
		const io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("in");
					io.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
		reveals.forEach((el) => io.observe(el));
		// Safety net: if the observer never fires (background tab, headless, etc.),
		// force everything visible so the page is never left blank.
		window.addEventListener("load", () =>
			setTimeout(() => { if (!reveals[0].classList.contains("in")) revealAll(); }, 1500)
		);
	} else {
		revealAll();
	}

	/* ---- footer year ---- */
	const yr = $("#year");
	if (yr) yr.textContent = new Date().getFullYear();

	/* ---- live project stats ---- */
	const setStat = (name, value) => {
		const el = $('[data-stat="' + name + '"]');
		if (el && value !== undefined && value !== null && value !== "") {
			el.textContent = String(value);
		}
	};
	const compactNumber = (value) => {
		const n = Number(value);
		if (!Number.isFinite(n)) return null;
		if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace(/\.0$/, "") + "m";
		if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
		return String(Math.round(n));
	};
	const readCache = (key, maxAgeMs) => {
		try {
			const cached = JSON.parse(localStorage.getItem(key) || "null");
			if (cached && Date.now() - cached.savedAt < maxAgeMs) return cached.data;
		} catch {}
		return null;
	};
	const writeCache = (key, data) => {
		try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })); } catch {}
	};
	const fetchJson = async (url) => {
		const res = await fetch(url, { headers: { Accept: "application/json" } });
		if (!res.ok) throw new Error("Stats request failed: " + res.status);
		return res.json();
	};
	/* ---- game icons from official manifests ---- */
	const manifestBaseUrl = "https://raw.githubusercontent.com/TwintailTeam/game-manifests/main/";
	const loadGameIcons = async () => {
		const badges = $$("[data-manifest]");
		if (!badges.length) return;

		const cacheKey = "ttl-game-icons-v2";
		const cached = readCache(cacheKey, 24 * 60 * 60 * 1000) || {};
		const nextCache = { ...cached };

		let availableManifests = null;
		try {
			const repository = await fetchJson(manifestBaseUrl + "repository.json");
			if (Array.isArray(repository.manifests)) availableManifests = new Set(repository.manifests);
		} catch {
			availableManifests = null;
		}

		await Promise.all(badges.map(async (badge) => {
			const manifest = badge.dataset.manifest;
			if (!manifest || (availableManifests && !availableManifests.has(manifest))) return;

			try {
				let iconUrl = cached[manifest];
				if (!iconUrl) {
					const data = await fetchJson(manifestBaseUrl + manifest);
					// The icon lives on a per-version entry; prefer the latest_version
					// match, otherwise fall back to the first version listed.
					const versions = Array.isArray(data?.game_versions) ? data.game_versions : [];
					const preferred = versions.find((v) => v?.metadata?.version === data?.latest_version) || versions[0];
					iconUrl = preferred?.assets?.game_icon;
					if (iconUrl) nextCache[manifest] = iconUrl;
				}
				if (!iconUrl) return;

				const img = new Image();
				img.alt = "";
				img.decoding = "async";
				img.referrerPolicy = "no-referrer";
				img.addEventListener("load", () => {
					badge.textContent = "";
					badge.appendChild(img);
				}, { once: true });
				img.src = iconUrl;
			} catch {
				// Keep the text badge fallback if a manifest or icon host is unavailable.
			}
		}));

		writeCache(cacheKey, nextCache);
	};
	const applyLiveStats = (data) => {
		setStat("supported-games", $$(".games-grid .game-card").length || data.supportedGames);
		setStat("github-stars", compactNumber(data.githubStars) || data.githubStars);
		setStat("flathub-monthly", compactNumber(data.flathubMonthlyInstalls) || data.flathubMonthlyInstalls);
		setStat("flathub-total", compactNumber(data.flathubTotalInstalls) || data.flathubTotalInstalls);
	};
	const loadLiveStats = async () => {
		const cacheKey = "ttl-live-stats-v3";
		const cached = readCache(cacheKey, 6 * 60 * 60 * 1000);
		if (cached) applyLiveStats(cached);

		try {
			// Stats are refreshed server-side by a scheduled GitHub Action and
				// committed to this file, so the page reads them same-origin. No
			// cross-origin requests, no CORS failures, no API rate limits.
			const stats = await fetchJson("assets/data/stats.json");
			const data = {
				githubStars: stats.githubStars,
				flathubMonthlyInstalls: stats.flathubMonthlyInstalls,
				flathubTotalInstalls: stats.flathubTotalInstalls,
				supportedGames: $$(".games-grid .game-card").length
			};
			writeCache(cacheKey, data);
			applyLiveStats(data);
		} catch {
			// Static fallbacks in the HTML stay visible if stats.json is missing.
		}
	};
	loadLiveStats();
	loadGameIcons();

	/* ---- scroll progress bar ---- */
	const progress = document.createElement("div");
	progress.className = "scroll-progress";
	document.body.appendChild(progress);
	const updateProgress = () => {
		const el = document.documentElement;
		const max = el.scrollHeight - el.clientHeight;
		progress.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + "%";
	};
	updateProgress();
	window.addEventListener("scroll", updateProgress, { passive: true });
	window.addEventListener("resize", updateProgress);

	/* ---- staggered reveal delays (cascade items within a group) ---- */
	reveals.forEach((el) => {
		if (!el.parentElement) return;
		const group = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
		const idx = group.indexOf(el);
		if (idx > 0) el.style.transitionDelay = Math.min(idx * 70, 350) + "ms";
	});

	/* ---- count-up stats ---- */
	const animateCount = (el) => {
		const m = el.textContent.trim().match(/^(\d+(?:\.\d+)?)(\D*)$/);
		if (!m) return;
		const target = parseFloat(m[1]);
		const suffix = m[2] || "";
		const decimals = (m[1].split(".")[1] || "").length;
		if (reduceMotion || target === 0) { el.textContent = target + suffix; return; }
		const dur = 1200;
		let start = null;
		const step = (ts) => {
			if (start === null) start = ts;
			const p = Math.min((ts - start) / dur, 1);
			const eased = 1 - Math.pow(1 - p, 3);
			el.textContent = (decimals ? (target * eased).toFixed(decimals) : Math.round(target * eased)) + suffix;
			if (p < 1) requestAnimationFrame(step);
			else el.textContent = target + suffix;
		};
		requestAnimationFrame(step);
	};
	const statsBlock = $(".stats");
	if (statsBlock && "IntersectionObserver" in window) {
		const sio = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					$$(".stat .num", statsBlock).forEach(animateCount);
					sio.disconnect();
				}
			});
		}, { threshold: 0.4 });
		sio.observe(statsBlock);
	}

	/* ---- cursor-follow spotlight on cards ---- */
	if (!reduceMotion && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
		$$(".feature, .game-card").forEach((card) => {
			card.addEventListener("pointermove", (e) => {
				const r = card.getBoundingClientRect();
				card.style.setProperty("--mx", (e.clientX - r.left) + "px");
				card.style.setProperty("--my", (e.clientY - r.top) + "px");
			});
		});
	}

	/* ---- sliding download-tab indicator ---- */
	const tabsBar = $(".tabs");
	if (tabsBar) {
		tabsBar.classList.add("has-indicator");
		const indicator = document.createElement("span");
		indicator.className = "tab-indicator";
		tabsBar.appendChild(indicator);
		const moveIndicator = () => {
			const active = $(".tab.active", tabsBar);
			if (!active) return;
			indicator.style.width = active.offsetWidth + "px";
			indicator.style.transform = "translateX(" + active.offsetLeft + "px)";
		};
		moveIndicator();
		$$(".tab", tabsBar).forEach((t) => t.addEventListener("click", moveIndicator));
		window.addEventListener("resize", moveIndicator);
		window.addEventListener("load", moveIndicator);
	}
})();
