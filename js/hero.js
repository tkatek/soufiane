/* Cursor Studio / Soufiane.
 * One finite, deterministic animation. No iframe, canvas, AI API, random cursors,
 * text-animation plugin or external component. GSAP drives the clock when present;
 * the identical choreography uses requestAnimationFrame when it is unavailable.
 * The 4.8s introduction plays once. Replay is explicit and runs at a readable 12s.
 */
(function () {
  'use strict';
  var root = document.querySelector('[data-cursor-studio]');
  if (!root) return;
  if (root.cursorStudio && root.cursorStudio.destroy) root.cursorStudio.destroy();

  var $ = function (s) { return root.querySelector(s); };
  var viewport = $('.hc-viewport'), scene = $('.hc-scene'), artwork = $('.hc-artwork');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var duration = 12, clock = { t: duration }, scale = 1;
  var running = false, visible = true, started = false, destroyed = false;
  var frame = 0, lastTime = 0, speed = 1, tween = null, resizeObserver = null, visibilityObserver = null;
  var dialogObserver = null, focusFrozen = false, currentEngine = 'static';
  var replay = $('[data-hc-replay]'), status = $('[data-hc-status]');
  var folder = $('.hc-folder'), cover = $('.hc-cover'), sheets = [$('.hc-back-sheet-one'), $('.hc-back-sheet-two')];
  var tiles = [$('.hc-brief'), $('.hc-interaction'), $('.hc-showcase'), $('.hc-responsive')];
  var writing = $('.hc-written'), caret = $('.hc-text-caret'), palette = $('.hc-palette');
  var code = $('.hc-code-tag'), selection = $('.hc-selection'), ready = $('.hc-ready');
  var guides = $('.hc-guides'), front = $('.hc-preview-card-front'), back = $('.hc-preview-card-back');
  var stack = $('.hc-stack-badge'), device = $('.hc-device'), check = $('.hc-check-badge');
  var sliderFill = $('.hc-slider-fill'), sliderKnob = $('.hc-slider-knob'), chart = $('.hc-chart-path');
  var fullText = 'Make it\nfeel different.', previousText = null, previousStatus = null;
  var styleCache = new WeakMap(), cleanups = [];
  var cursors = {};
  ['build', 'write', 'style', 'layout', 'motion'].forEach(function (name) {
    cursors[name] = { element: $('[data-hc-cursor="' + name + '"]'), ring: $('[data-hc-cursor="' + name + '"] .hc-click-ring') };
  });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function progress(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(p) { return p * p * (3 - 2 * p); }
  function smooth(t, a, b) { return ease(progress(t, a, b)); }
  function mix(a, b, p) { return a + (b - a) * p; }
  function round(n) { return Math.round(n * 1000) / 1000; }
  function windowOf(t, a, b, c, d) { return smooth(t, a, b) * (1 - smooth(t, c, d)); }
  function put(el, prop, value) {
    if (!el) return;
    var cache = styleCache.get(el);
    if (!cache) { cache = {}; styleCache.set(el, cache); }
    value = String(value);
    if (cache[prop] === value) return;
    cache[prop] = value; el.style[prop] = value;
  }
  function alpha(el, value) { put(el, 'opacity', round(value)); }
  function color(a, b, p) { return 'rgb(' + a.map(function (n, i) { return Math.round(mix(n, b[i], p)); }).join(',') + ')'; }
  function point(t, waypoints) {
    if (t <= waypoints[0][0]) return { x: waypoints[0][1], y: waypoints[0][2] };
    for (var i = 1; i < waypoints.length; i++) {
      if (t <= waypoints[i][0]) {
        var a = waypoints[i - 1], b = waypoints[i], p = smooth(t, a[0], b[0]);
        return { x: mix(a[1], b[1], p), y: mix(a[2], b[2], p) };
      }
    }
    var last = waypoints[waypoints.length - 1]; return { x: last[1], y: last[2] };
  }
  function clickRing(el, t, clicks) {
    var opacity = 0, size = .4;
    clicks.forEach(function (time) {
      var p = (t - time) / .52;
      if (p >= 0 && p <= 1) { opacity = (1 - p) * .85; size = .4 + p * 1.6; }
    });
    alpha(el, opacity); put(el, 'transform', 'scale(' + round(size) + ')');
  }
  var paths = {
    build: [[0, 490, 53], [.95, 155, 133], [1.25, 155, 133], [2.4, 68, 59], [9.5, 68, 59], [11.4, 74, 74]],
    write: [[.6, 24, 270], [2.15, 85, 226], [2.5, 85, 226], [4.3, 159, 252], [5.3, 38, 284], [10.7, 20, 288], [11.5, 12, 296]],
    style: [[1.2, 560, 50], [3.85, 602, 199], [4.5, 602, 199], [6.2, 554, 161], [9.8, 554, 161], [11.4, 579, 166]],
    layout: [[1.9, 446, 510], [4.7, 296, 431], [5, 296, 431], [6.8, 391, 467], [7.5, 430, 481], [10.1, 430, 481], [11.4, 392, 476]],
    motion: [[3, 594, 385], [7.15, 339.5, 258], [7.35, 339.5, 258], [8.85, 509.4, 258], [9.6, 547, 390], [10.2, 547, 390], [11.6, 587, 426]]
  };
  var clicks = { build: [.95], write: [2.15], style: [4.15], layout: [5], motion: [7.3, 9.65] };
  var enters = { build: 0, write: .6, style: 1.2, layout: 1.9, motion: 3 };
  var restingAlpha = { build: .8, write: 0, style: .75, layout: .82, motion: 0 };
  var chartLength = 130;
  try { chartLength = chart.getTotalLength(); } catch (_) {}
  put(chart, 'strokeDasharray', chartLength);

  function render(t) {
    if (destroyed) return;
    t = clamp(t, 0, duration); clock.t = t;
    var open = smooth(t, .95, 2.35), paint = smooth(t, 4.15, 5.5);
    var resizing = smooth(t, 5, 6.8), polish = smooth(t, 7.35, 9.55);
    var settle = smooth(t, 9.8, 11.35), isFinal = t >= duration - .001;
    var lift = Math.sin(progress(t, 9.6, 11.4) * Math.PI) * 6;
    put(folder, 'transform', 'translateY(' + round(7 * (1 - open) - lift) + 'px) rotate(' + round(-2.5 * (1 - open)) + 'deg)');
    alpha(folder, .65 + .35 * open);
    put(cover, 'display', open >= .999 ? 'none' : 'block');
    put(cover, 'transform', 'translateY(' + round(open * 42) + 'px) rotateX(' + round(-106 * open) + 'deg)');
    alpha(cover, 1 - smooth(t, 1.45, 2.25));
    sheets.forEach(function (sheet, i) { put(sheet, 'transform', 'translateY(' + round(open * (i ? -9 : -14)) + 'px) rotate(' + (i ? 3 : -4) + 'deg)'); });
    alpha(guides, windowOf(t, 1.3, 2.3, 8.8, 10) * .16);
    tiles.forEach(function (tile, i) {
      var enter = smooth(t, 1.65 + i * .24, 2.8 + i * .24);
      alpha(tile, .25 + enter * .75);
      var sx = i === 2 ? mix(.72, 1, resizing) : 1;
      var sy = i === 2 ? mix(.78, 1, resizing) : 1;
      put(tile, 'transform', 'translateY(' + round((1 - enter) * 20) + 'px) scale(' + round(sx) + ',' + round(sy) + ')');
    });
    put(tiles[0], 'backgroundColor', color([49, 51, 66], [233, 232, 244], paint));
    put(tiles[1], 'backgroundColor', color([54, 55, 72], [166, 167, 255], paint));
    put(tiles[2], 'backgroundColor', color([31, 33, 46], [51, 49, 78], paint));
    put(tiles[3], 'backgroundColor', color([46, 50, 65], [222, 231, 238], paint));
    put(writing, 'color', color([225, 222, 242], [37, 34, 59], paint));
    put($('.hc-brief .hc-tile-eyebrow'), 'color', color([161, 163, 185], [86, 86, 110], paint));
    put($('.hc-interaction p'), 'color', color([231, 228, 250], [25, 27, 53], paint));
    put($('.hc-interaction .hc-tile-eyebrow'), 'color', color([167, 165, 191], [57, 59, 104], paint));
    put($('.hc-responsive p'), 'color', color([231, 228, 250], [37, 48, 69], paint));
    put($('.hc-responsive .hc-tile-eyebrow'), 'color', color([167, 165, 191], [89, 103, 121], paint));
    var typed = fullText.slice(0, Math.floor(fullText.length * progress(t, 2.2, 4.35)));
    if (typed !== previousText) { writing.textContent = typed; previousText = typed; }
    put(caret, 'display', t > 2.2 && t < 4.5 ? 'block' : 'none');
    alpha(caret, Math.sin(t * 16) > -.2 ? 1 : .1);
    alpha(palette, windowOf(t, 2.8, 3.7, 6.4, 7.1));
    put(palette, 'transform', 'translateX(' + round((1 - smooth(t, 2.8, 3.7)) * 15) + 'px)');
    alpha(code, windowOf(t, 4.2, 4.8, 6.6, 7.4));
    put(code, 'transform', 'translateY(' + round((1 - smooth(t, 4.2, 4.8)) * 10) + 'px) rotate(4deg)');
    alpha(selection, windowOf(t, 4.4, 4.8, 6.9, 7.4));
    put(selection, 'transform', 'scale(' + round(mix(.72, 1, resizing)) + ',' + round(mix(.78, 1, resizing)) + ')');
    var slide = mix(.25, .82, smooth(t, 7.35, 8.85));
    put(sliderFill, 'width', round(slide * 100) + '%'); put(sliderKnob, 'left', round(slide * 100) + '%');
    alpha(front, smooth(t, 2.8, 3.6)); alpha(back, smooth(t, 3, 3.9));
    put(front, 'transform', 'translateY(' + round(26 * (1 - polish)) + 'px) rotate(' + round(mix(-2, -7, polish)) + 'deg)');
    put(back, 'transform', 'translate(' + round(-20 * (1 - polish)) + 'px,' + round(18 * (1 - polish)) + 'px) rotate(' + round(mix(0, 9, polish)) + 'deg)');
    alpha(stack, smooth(t, 7.8, 8.8)); put(stack, 'transform', 'translateY(' + round(12 * (1 - smooth(t, 7.8, 8.8))) + 'px) rotate(3deg)');
    alpha(device, smooth(t, 3.3, 4.1));
    put(device, 'transform', 'translateY(' + round(23 * (1 - polish)) + 'px) rotate(' + round(mix(0, -9, polish)) + 'deg)');
    put(chart, 'strokeDashoffset', round(chartLength * (1 - smooth(t, 8, 9.5))));
    alpha(check, smooth(t, 9.6, 10.2));
    put(check, 'transform', 'scale(' + round(.7 + .3 * smooth(t, 9.6, 10.2)) + ')');
    alpha(ready, settle); put(ready, 'transform', 'translateY(' + round(8 * (1 - settle)) + 'px)');
    Object.keys(cursors).forEach(function (name) {
      var cursor = cursors[name], position = point(t, paths[name]);
      // Keep the layout and motion pointers attached to the handles they drag.
      if (name === 'layout' && t >= 5 && t <= 6.8) {
        position.x = 51 + 340 * mix(.72, 1, resizing); position.y = 303 + 164 * mix(.78, 1, resizing);
      }
      if (name === 'motion' && t >= 7.35 && t <= 8.85) { position.x = 265 + 298 * slide; position.y = 258; }
      put(cursor.element, 'transform', 'translate(' + round(position.x) + 'px,' + round(position.y) + 'px)');
      var opacity = smooth(t, enters[name], enters[name] + .5) * mix(1, restingAlpha[name], smooth(t, 10.2, 11.7));
      alpha(cursor.element, reduced.matches ? 0 : opacity); clickRing(cursor.ring, t, clicks[name]);
    });
    var message = t < 1.8 ? '01 / Open a little possibility.' : t < 4.15 ? '02 / Give the idea a voice.' : t < 5.6 ? '03 / Find the right feeling.' : t < 7.35 ? '04 / Make space for the details.' : t < 10 ? '05 / A little motion. A lot of life.' : 'Good ideas deserve good execution.';
    if (message !== previousStatus) { status.textContent = message; previousStatus = message; }
    root.dataset.hcPhase = isFinal ? 'finished' : t < 1.8 ? 'open' : t < 4.15 ? 'write' : t < 5.6 ? 'style' : t < 7.35 ? 'layout' : t < 10 ? 'motion' : 'finish';
  }

  function sizeScene() {
    if (destroyed) return;
    scale = viewport.clientWidth / 640;
    if (!(scale > 0)) return;
    scene.style.setProperty('--hc-scale', String(scale));
  }
  function isBlocked() {
    return !visible || document.hidden || focusFrozen || !!document.querySelector('#project-dialog[open]');
  }
  function stopClock() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (tween) { tween.kill(); tween = null; }
  }
  function complete() {
    stopClock(); running = false; render(duration);
    replay.disabled = false; replay.querySelector('span').textContent = 'Replay build';
    root.dataset.hcRunning = 'false';
  }
  function nativeTick(now) {
    if (!running || destroyed) return;
    var delta = lastTime ? Math.min((now - lastTime) / 1000, .08) : 0; lastTime = now;
    if (!isBlocked()) render(clock.t + delta * speed);
    if (clock.t >= duration) { complete(); return; }
    frame = requestAnimationFrame(nativeTick);
  }
  function syncPlayback() {
    if (!running || destroyed) return;
    if (tween) { if (isBlocked()) tween.pause(); else tween.resume(); }
    else {
      // Avoid keeping a requestAnimationFrame loop alive in a hidden/offscreen scene.
      if (isBlocked()) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else if (!frame) { lastTime = 0; frame = requestAnimationFrame(nativeTick); }
    }
  }
  function play(explicit) {
    if (destroyed || reduced.matches) { complete(); return; }
    stopClock(); artwork.style.transform = ''; focusFrozen = false;
    speed = explicit ? 1 : duration / 4.8;
    started = true; running = true; render(0);
    root.dataset.hcRunning = 'true';
    replay.disabled = false; replay.querySelector('span').textContent = 'Finish preview';
    if (window.gsap && typeof window.gsap.to === 'function') {
      currentEngine = 'gsap';
      tween = window.gsap.to(clock, { t: duration, duration: duration / speed, ease: 'none', paused: isBlocked(),
        onUpdate: function () { render(clock.t); }, onComplete: complete });
    } else { currentEngine = 'native'; syncPlayback(); }
    root.dataset.hcEngine = currentEngine;
  }
  function onReplay() { if (running) complete(); else play(true); }
  function onReduced() {
    if (reduced.matches) { started = true; complete(); replay.hidden = true; artwork.style.transform = ''; }
    else { replay.hidden = false; render(duration); }
  }
  function onVisibility() { syncPlayback(); }
  function onMotionReady() {
    // Upgrade an in-flight native clock without restarting the scene or duplicating loops.
    if (!running || tween || reduced.matches || !window.gsap || typeof window.gsap.to !== 'function') return;
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    currentEngine = 'gsap'; root.dataset.hcEngine = currentEngine;
    tween = window.gsap.to(clock, { t: duration, duration: Math.max(.01, (duration - clock.t) / speed), ease: 'none', paused: isBlocked(),
      onUpdate: function () { render(clock.t); }, onComplete: complete });
  }
  function onPointer(event) {
    if (running || reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
    var rect = viewport.getBoundingClientRect();
    var x = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
    var y = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
    artwork.style.transform = 'rotateY(' + round(x * 3.5) + 'deg) rotateX(' + round(-y * 2.5) + 'deg)';
  }
  function resetPointer() { artwork.style.transform = ''; }
  function listen(target, name, fn, options) { target.addEventListener(name, fn, options); cleanups.push(function () { target.removeEventListener(name, fn, options); }); }
  function focusIn(event) {
    if (event.target.closest('.hc-project-link,.hc-mobile-project') && running) { complete(); }
  }
  function onKey(event) { if (event.key === 'Escape' && running && root.contains(document.activeElement)) complete(); }
  function destroy() {
    if (destroyed) return;
    stopClock(); running = false; render(duration); destroyed = true;
    cleanups.forEach(function (fn) { fn(); });
    if (resizeObserver) resizeObserver.disconnect();
    if (visibilityObserver) visibilityObserver.disconnect();
    if (dialogObserver) dialogObserver.disconnect();
    if (reduced.removeEventListener) reduced.removeEventListener('change', onReduced); else reduced.removeListener(onReduced);
    delete root.cursorStudio;
  }
  root.cursorStudio = {
    replay: function () { play(true); }, finish: complete, destroy: destroy,
    // Deterministic inspection hook: useful for screenshots and future regression tests.
    seek: function (seconds) { stopClock(); running = false; render(clamp(Number(seconds) || 0, 0, duration)); root.dataset.hcRunning = 'false'; replay.querySelector('span').textContent = 'Replay build'; },
    state: function () { return { time: clock.t, duration: duration, playing: running, engine: currentEngine, scale: scale, reduced: reduced.matches }; }
  };
  root.dataset.hcEnhanced = 'true'; replay.hidden = reduced.matches;
  artwork.style.transition = 'transform 450ms cubic-bezier(.2,.7,.2,1)';
  sizeScene(); render(duration);
  if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(sizeScene); resizeObserver.observe(viewport); }
  else listen(window, 'resize', sizeScene, { passive: true });
  listen(replay, 'click', onReplay); listen(document, 'visibilitychange', onVisibility);
  listen(window, 'portfolio:motionready', onMotionReady);
  listen(root, 'focusin', focusIn); listen(root, 'keydown', onKey);
  listen(viewport, 'pointermove', onPointer, { passive: true }); listen(viewport, 'pointerleave', resetPointer);
  if (reduced.addEventListener) reduced.addEventListener('change', onReduced); else reduced.addListener(onReduced);
  var dialog = document.getElementById('project-dialog');
  if (dialog && 'MutationObserver' in window) { dialogObserver = new MutationObserver(syncPlayback); dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }); }
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !started && !reduced.matches) play(false); else syncPlayback();
    }, { threshold: .12 }); visibilityObserver.observe(root);
  } else if (!reduced.matches) play(false);
  // BFCache restores the same instance; lifecycle remains idempotent.
  listen(window, 'pagehide', function () { if (running) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; if (tween) tween.pause(); } });
  listen(window, 'pageshow', syncPlayback);
})();
