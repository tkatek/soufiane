/* GSAP 3.13 + ScrollTrigger + Flip, with a real browser-native fallback.
   CDN failure must never leave text hidden or prevent project navigation. */
(function () {
  'use strict';
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  var running = new Set();
  var Motion = window.PortfolioMotion = { reduced: media.matches, engine: 'native', ready: null };
  Motion.animate = function (element, frames, options) {
    options = Object.assign({ duration: 500, easing: 'cubic-bezier(.22,.75,.2,1)', ease: 'power3.inOut' }, options || {});
    if (!element) return Promise.resolve(false);
    var first = frames[0], last = frames[frames.length - 1];
    if (options.signal && options.signal.aborted) return Promise.resolve(false);
    if (Motion.reduced || !options.duration) { Object.assign(element.style, last); return Promise.resolve(true); }
    return new Promise(function (resolve) {
      var finished = false, animation, tween;
      function done(success) {
        if (finished) return;
        finished = true;
        if (options.signal) options.signal.removeEventListener('abort', abort);
        running.delete(abort);
        resolve(success);
      }
      function abort() {
        if (tween) tween.kill();
        if (animation) animation.cancel();
        done(false);
      }
      running.add(abort);
      if (options.signal) options.signal.addEventListener('abort', abort, { once: true });
      if (window.gsap && frames.length === 2) {
        tween = window.gsap.fromTo(element, Object.assign({}, first), Object.assign({}, last, {
          duration: options.duration / 1000, delay: (options.delay || 0) / 1000,
          ease: options.ease, overwrite: 'auto',
          onComplete: function () { done(true); }, onInterrupt: function () { done(false); }
        }));
      } else if (element.animate) {
        animation = element.animate(frames, { duration: options.duration, delay: options.delay || 0, easing: options.easing, fill: 'both' });
        animation.finished.then(function () {
          if (!finished) {
            Object.assign(element.style, last);
            animation.cancel();
            done(true);
          }
        }, function () { done(false); });
      } else { Object.assign(element.style, last); done(true); }
    });
  };
  Motion.wait = function (ms, signal) {
    if (Motion.reduced) return Promise.resolve(true);
    return new Promise(function (resolve) {
      if (signal && signal.aborted) return resolve(false);
      var timer = setTimeout(function () { if (signal) signal.removeEventListener('abort', stop); resolve(true); }, ms);
      function stop() { clearTimeout(timer); resolve(false); }
      if (signal) signal.addEventListener('abort', stop, { once: true });
    });
  };
  function onPreference(event) {
    Motion.reduced = event.matches;
    if (event.matches) { running.forEach(function (abort) { abort(); }); }
    window.dispatchEvent(new CustomEvent('portfolio:motionchange', { detail: { reduced: event.matches } }));
  }
  if (media.addEventListener) media.addEventListener('change', onPreference); else media.addListener(onPreference);
  function load(src, timeout) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script'); var timer;
      script.src = src; script.async = true; script.crossOrigin = 'anonymous';
      script.onload = function () { clearTimeout(timer); resolve(); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('Motion CDN unavailable')); };
      timer = setTimeout(function () { script.remove(); reject(new Error('Motion CDN timed out')); }, timeout || 4500);
      document.head.appendChild(script);
    });
  }
  function source(file) {
    return load('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/' + file, 4000)
      .catch(function () { return load('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/' + file, 3500); });
  }
  Motion.ready = (async function () {
    try {
      if (!window.gsap) await source('gsap.min.js');
      Motion.engine = 'gsap'; document.documentElement.dataset.motionEngine = 'gsap';
      await Promise.allSettled([
        source('ScrollTrigger.min.js').then(function () { window.gsap.registerPlugin(window.ScrollTrigger); }),
        source('Flip.min.js').then(function () { window.gsap.registerPlugin(window.Flip); })
      ]);
      window.dispatchEvent(new Event('portfolio:motionready'));
      return true;
    } catch (error) {
      document.documentElement.dataset.motionEngine = 'native';
      return false;
    }
  })();
  document.documentElement.dataset.motionEngine = 'native';
})();
