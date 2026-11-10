/* SOUFIANE — cinematic interactions
 * Progressive enhancement: the HTML, links and content work without this file.
 * Native Canvas 2D, Web Animations, IntersectionObserver and <dialog> only.
 * No third-party runtime, scroll hijacking, fake loading screen, or API keys.
 */
(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const root = document.documentElement;
  const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const projectMap = new Map(projects.map(project => [project.id, project]));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = $('#motion-toggle');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeLink = value => /^https?:\/\//i.test(String(value)) ? escapeHTML(value) : '#';
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const canAnimate = typeof Element.prototype.animate === 'function';
  const introAnimations = new Set();
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('soufiane-motion'); } catch (_) { /* Private browsing may disable storage. */ }
  let motionOn = !motionQuery.matches && savedMotion !== 'off';
  let frameId = 0;
  let lastPaint = 0;
  let animationTime = 0;
  let modalOpen = false;
  let scrollProgress = 0;
  let smoothProgress = 0;
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;
  let portalVisible = true;
  let activeTransitions = [];
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };

  // Shared, escaped case-study markup is also used by project/project.js.
  function abstractArtwork(project) {
    const marks = {
      'marrakesh-beauty': 'M B', riadsoq: 'Riadsoq', 'boston-english-center': 'BEC',
      'blossom-word-bloom': '✳', 'cursor-agency-concept': 'CURSOR®',
      'django-projects': '{ dj }', 'laravel-saas-experiments': 'L /',
      'n8n-automation-experiments': 'n8n'
    };
    return `<div class="abstract-art abstract-art--${escapeHTML(project.id)}"><i class="art-orbit art-orbit--one"></i><i class="art-orbit art-orbit--two"></i><strong>${escapeHTML(marks[project.id] || project.name)}</strong><span>${escapeHTML(project.tags[0] || project.type)}</span></div>`;
  }

  // Absolute URLs are supported for future externally hosted project images.
  const imagePath = (src, prefix) => /^(?:https?:|data:image\/)/i.test(src) ? src : prefix + src;

  function renderProject(project, options = {}) {
    const prefix = options.prefix || '';
    const modal = Boolean(options.modal);
    const titleTag = modal ? 'h2' : 'h1';
    const titleId = modal ? 'dialog-project-title' : 'project-title';
    const pageURL = `${prefix}project/index.html?project=${encodeURIComponent(project.id)}`;
    const portfolioURL = modal ? '#projects' : '../index.html#projects';
    const image = project.images[0];
    const cover = image
      ? `<figure class="case-cover"><img src="${escapeHTML(imagePath(image.src, prefix))}" alt="${escapeHTML(image.alt)}" decoding="async"><figcaption>${escapeHTML(image.caption || project.name + ' — project preview')}</figcaption></figure>`
      : `<div class="case-cover" aria-hidden="true">${abstractArtwork(project)}</div>`;
    const paragraphs = project.paragraphs.length
      ? project.paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('')
      : '<p>The previews and links on this page are the material currently available for this portfolio entry. A detailed breakdown of the implementation has not been published yet.</p>';
    const facts = project.features.length ? project.features : project.tags;
    const nextProject = projects[(projects.indexOf(project) + 1) % projects.length];
    return `<article class="case-study" style="--project-accent:${escapeHTML(project.accent)}">
      <div class="case-study-topline"><p class="eyebrow">${escapeHTML(project.type)}</p><span>PROJECT FILE ${escapeHTML(project.number)} / ${projects.length}</span></div>
      <${titleTag} class="case-title" id="${titleId}">${escapeHTML(project.name)}</${titleTag}>
      <p class="case-summary">${escapeHTML(project.summary)}</p>
      <ul class="case-tags" aria-label="Project focus">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      <div class="case-actions">${project.live ? `<a class="button button--primary" href="${safeLink(project.live)}" target="_blank" rel="noopener noreferrer">${project.kind === 'game' ? 'Play the live game' : 'Open live project'} <span aria-hidden="true">↗</span></a>` : ''}
      ${modal ? `<a class="button button--outline" href="${pageURL}">Open project page <span aria-hidden="true">↗</span></a>` : `<a class="button button--outline" href="${portfolioURL}">All projects <span aria-hidden="true">↗</span></a>`}</div>
      ${cover}
      <div class="case-body"><div class="case-overview"><p class="eyebrow">OVERVIEW</p><h3>${escapeHTML(project.headline || 'About this project.')}</h3>${paragraphs}</div><aside class="case-facts"><p class="eyebrow">${project.features.length ? 'PROJECT FOCUS' : 'PROJECT FILE'}</p><ul>${facts.map(fact => `<li>${escapeHTML(fact)}</li>`).join('')}</ul>${!project.paragraphs.length ? '<p class="case-note">Detailed case study in progress. No unpublished technical details or results are implied.</p>' : ''}</aside></div>
      ${project.images.length > 1 ? `<div class="case-gallery">${project.images.slice(1).map(item => `<figure><img src="${escapeHTML(imagePath(item.src, prefix))}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async"><figcaption>${escapeHTML(item.caption || project.name + ' — additional preview')}</figcaption></figure>`).join('')}</div>` : ''}
      <footer class="case-bottom"><span>SOUFIANE EL KHASSIBI / SELECTED WORK</span>${nextProject ? `<a class="case-next" href="${prefix}project/index.html?project=${encodeURIComponent(nextProject.id)}"><span>NEXT PROJECT</span>${escapeHTML(nextProject.name)} ↗</a>` : ''}</footer>
    </article>`;
  }
  window.PortfolioUI = Object.freeze({ renderProject, escapeHTML });

  // Header, native scrolling, mobile navigation and active-section indicator.
  const header = $('.site-header');
  const menuButton = $('.menu-toggle');
  const navigation = $('#site-navigation');
  const navigationLinks = $$('.nav-link');
  const sections = navigationLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  const progressBar = $('.page-progress');
  function closeMenu(restoreFocus = false) {
    if (!menuButton || !navigation) return;
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
    if (restoreFocus && wasOpen) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation?.classList.toggle('is-open', open);
  });
  navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (header && !header.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });

  function updateScrollState() {
    const y = modalOpen ? lastScrollY : window.scrollY;
    const scrollHeight = Math.max(1, root.scrollHeight - window.innerHeight);
    if (!modalOpen) {
      scrollProgress = clamp(y / scrollHeight, 0, 1);
      scrollVelocity = clamp((y - lastScrollY) / 60, -1, 1);
      lastScrollY = y;
    }
    header?.classList.toggle('is-scrolled', y > 20);
    if (progressBar) progressBar.style.transform = `scaleX(${scrollProgress})`;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= window.innerHeight * .38) active = section;
    }
    navigationLinks.forEach(link => {
      const selected = Boolean(active && link.hash === '#' + active.id);
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick || modalOpen) return;
    scrollTick = true;
    requestAnimationFrame(() => { updateScrollState(); scrollTick = false; });
  }, { passive: true });
  updateScrollState();

  // Project filtering keeps every project in the static HTML for no-JS visitors.
  const grid = $('#project-grid');
  const tiles = grid ? $$('.project-tile', grid) : [];
  const filters = $('.project-filters');
  const showAllButton = $('#show-all-projects');
  const projectCount = $('#project-count');
  const FEATURED_COUNT = 6;
  let currentFilter = 'all';
  let showAll = false;
  function updateProjects() {
    let shown = 0;
    tiles.forEach((tile, index) => {
      const project = projectMap.get(tile.dataset.project);
      if (!project) return;
      const matches = currentFilter === 'all'
        || (currentFilter === 'live' && Boolean(project.live))
        || (currentFilter === 'games' && project.kind === 'game')
        || (currentFilter === 'experiments' && project.kind === 'experiment');
      tile.hidden = !matches || (currentFilter === 'all' && !showAll && index >= FEATURED_COUNT);
      if (!tile.hidden) shown += 1;
    });
    if (projectCount) projectCount.textContent = `${String(shown).padStart(2, '0')} / ${projects.length} PROJECTS SHOWN`;
    if (showAllButton) {
      showAllButton.hidden = currentFilter !== 'all' || tiles.length <= FEATURED_COUNT;
      showAllButton.setAttribute('aria-expanded', String(showAll));
      showAllButton.innerHTML = showAll ? 'Show selected projects <span aria-hidden="true">↑</span>' : `Explore all ${projects.length} projects <span aria-hidden="true">↓</span>`;
    }
    $$('.filter-button').forEach(button => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    requestAnimationFrame(updateScrollState);
  }
  if (tiles.length && projectMap.size) {
    if (filters) filters.hidden = false;
    updateProjects();
    filters?.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      currentFilter = button.dataset.filter;
      updateProjects();
    });
    showAllButton?.addEventListener('click', () => {
      showAll = !showAll;
      updateProjects();
      if (showAll) tiles[FEATURED_COUNT]?.querySelector('a')?.focus({ preventScroll: true });
      else showAllButton.scrollIntoView({ block: 'center', behavior: motionOn ? 'smooth' : 'auto' });
    });
  }

  // Accessible process tabs: click/tap, Arrow keys, Home and End.
  const processTabs = $$('.process-tab');
  const processSteps = [
    ['Understand', 'Start with the people and the problem.'],
    ['Shape', 'Plan a clear, thoughtful experience.'],
    ['Engineer', 'Build reliable systems across the stack.'],
    ['Deliver', 'Test, refine, and get it ready to ship.']
  ];
  function selectProcess(index, focus = false) {
    processTabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    const title = $('#process-title');
    const description = $('#process-description');
    const panel = $('#process-panel');
    if (title) title.textContent = processSteps[index][0];
    if (description) description.textContent = processSteps[index][1];
    panel?.setAttribute('aria-labelledby', `process-tab-${index}`);
    const lab = $('.process-lab');
    if (lab) lab.dataset.step = String(index);
    if (focus) processTabs[index].focus();
  }
  processTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProcess(index));
    tab.addEventListener('keydown', event => {
      const destinations = { ArrowRight: (index + 1) % 4, ArrowLeft: (index + 3) % 4, Home: 0, End: 3 };
      if (Object.prototype.hasOwnProperty.call(destinations, event.key)) {
        event.preventDefault(); selectProcess(destinations[event.key], true);
      }
    });
  });

  // Reveal only below-the-fold elements. Failure never hides the entire page.
  let revealObserver;
  if ('IntersectionObserver' in window && canAnimate) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        const wasPending = element.classList.contains('reveal-pending');
        element.classList.remove('reveal-pending');
        revealObserver.unobserve(element);
        if (motionOn && wasPending) {
          const animation = element.animate([
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 680, easing: 'cubic-bezier(.22,1,.36,1)' });
          introAnimations.add(animation);
          animation.finished.catch(() => {}).finally(() => introAnimations.delete(animation));
        }
      }
    }, { threshold: .06, rootMargin: '0px 0px -20px 0px' });
    $$('[data-reveal]').forEach(element => {
      if (motionOn && (element.getBoundingClientRect().top > window.innerHeight * .94 || element.hidden)) {
        element.classList.add('reveal-pending');
        revealObserver.observe(element);
      }
    });
  }
  if (motionOn && canAnimate) {
    $$('.hero-copy .availability, .hero-name, .hero-line, .hero-description, .hero-actions, .hero-bottom').forEach((element, index) => {
      const animation = element.animate([
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 900, delay: index * 75, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      introAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => introAnimations.delete(animation));
    });
  }

  // Small pointer-only effects. Never replace the cursor or touch gestures.
  $$('.project-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!motionOn || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
      card.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
      card.style.setProperty('--shine-x', `${x * 100}%`);
      card.style.setProperty('--shine-y', `${y * 100}%`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg');
    });
  });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!motionOn || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .065}px, ${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
    }, { passive: true });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
  $('.hero')?.addEventListener('pointermove', event => {
    if (!motionOn || !finePointer.matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.x = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
    pointer.y = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
  }, { passive: true });
  $('.hero')?.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });

  // Native canvas scenes. All geometry is generated at runtime, not an image.
  function setupCanvas(selector) {
    const canvas = $(selector);
    if (!canvas) return null;
    let context;
    try { context = canvas.getContext('2d', { alpha: true }); } catch (_) { return null; }
    if (!context) return null;
    return { canvas, context, width: 1, height: 1, dpr: 1 };
  }
  const portal = setupCanvas('#portal-canvas');
  const ambient = setupCanvas('#ambient-canvas');
  function sizeCanvas(scene) {
    if (!scene) return;
    const rect = scene.canvas.getBoundingClientRect();
    scene.width = Math.max(1, rect.width);
    scene.height = Math.max(1, rect.height);
    scene.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 740 ? 1.25 : 1.6);
    const width = Math.round(scene.width * scene.dpr);
    const height = Math.round(scene.height * scene.dpr);
    if (scene.canvas.width !== width || scene.canvas.height !== height) {
      scene.canvas.width = width; scene.canvas.height = height;
      scene.context.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
    }
  }
  const TAU = Math.PI * 2;
  const noise = n => { const value = Math.sin(n * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };

  function paintPortal(time) {
    if (!portal) return;
    const { context: ctx, width: w, height: h } = portal;
    ctx.clearRect(0, 0, w, h);
    const small = window.innerWidth < 740;
    const cx = w * .5 + pointer.smoothX * 19;
    const cy = h * .5 + pointer.smoothY * 15;
    const radius = Math.min(w * .345, h * (small ? .43 : .37));
    const spin = time * .075;
    const turn = -.42 + Math.sin(time * .16) * .055 + pointer.smoothX * .065;
    const ct = Math.cos(turn), st = Math.sin(turn);
    const glow = ctx.createRadialGradient(cx, cy, radius * .14, cx, cy, radius * 1.4);
    glow.addColorStop(0, 'rgba(5,9,18,0)');
    glow.addColorStop(.28, 'rgba(37,68,133,.07)');
    glow.addColorStop(.65, 'rgba(47,84,157,.115)');
    glow.addColorStop(1, 'rgba(9,18,38,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

    function point(depth, angle) {
      const a = angle + depth * 1.55 + spin;
      const warp = 1 + .085 * Math.sin(a * 3 - depth * 6 + time * .17) * depth + .025 * Math.sin(a * 7 + depth * 11);
      const r = radius * (.215 + .85 * Math.pow(depth, 1.14)) * warp;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * .79;
      return [cx + x * ct - y * st + 9 * Math.sin(depth * 4 + spin) * depth,
              cy + x * st + y * ct + 5 * Math.cos(depth * 6 + spin) * depth];
    }

    const rings = small ? 28 : 48;
    const segments = small ? 64 : 96;
    for (let ring = 0; ring < rings; ring += 1) {
      const depth = (ring / rings + time * .023) % 1;
      const fade = Math.sin(Math.PI * depth) * .75 + .15;
      for (let arc = 0; arc < 4; arc += 1) {
        const shine = arc === 3 ? 1 : arc === 1 ? .65 : .32;
        const opacity = (.12 + depth * .38) * fade * shine;
        ctx.beginPath();
        for (let step = 0; step <= segments / 4; step += 1) {
          const angle = (arc / 4 + step / segments) * TAU;
          const [x, y] = point(depth, angle);
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${Math.round(93 + depth * 67)},${Math.round(130 + depth * 60)},240,${opacity})`;
        ctx.lineWidth = arc === 3 ? 1.05 : .7;
        ctx.stroke();
      }
    }

    // Long filaments connect the rings and reveal the tunnel's depth.
    for (let filament = 0; filament < 18; filament += 1) {
      ctx.beginPath();
      for (let step = 0; step <= 50; step += 1) {
        const d = step / 50;
        const [x, y] = point(d, filament / 18 * TAU + d * 1.1);
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = filament % 4 === 0 ? 'rgba(146,183,255,.21)' : 'rgba(87,135,227,.09)';
      ctx.lineWidth = filament % 4 === 0 ? .9 : .55; ctx.stroke();
    }

    // Two luminous curved edges; deliberately no flashing or bloom overload.
    for (let edge = 0; edge < 2; edge += 1) {
      ctx.beginPath();
      for (let step = 0; step <= 75; step += 1) {
        const a = -.7 + edge * Math.PI + step / 75 * 1.5;
        const [x, y] = point(.85 + edge * .07, a);
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.shadowColor = '#6494ff'; ctx.shadowBlur = small ? 8 : 14;
      ctx.strokeStyle = edge === 0 ? 'rgba(166,200,255,.64)' : 'rgba(88,139,247,.55)';
      ctx.lineWidth = edge === 0 ? 1.65 : 1.2; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const core = ctx.createRadialGradient(cx, cy, radius * .06, cx, cy, radius * .31);
    core.addColorStop(0, '#06080d'); core.addColorStop(.53, '#06080d'); core.addColorStop(1, 'rgba(6,8,13,0)');
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(turn); ctx.scale(1, .82);
    ctx.translate(-cx, -cy); ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(cx, cy, radius * .32, 0, TAU); ctx.fill(); ctx.restore();

    for (let star = 0; star < (small ? 18 : 35); star += 1) {
      const a = noise(star + 1) * TAU + time * .009;
      const r = radius * (1.05 + noise(star + 40) * .48);
      const alpha = .13 + noise(star + 70) * .23;
      ctx.fillStyle = `rgba(159,193,248,${alpha})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .82, noise(star + 90) > .9 ? 1.2 : .65, 0, TAU); ctx.fill();
    }
  }

  function paintAmbient(time) {
    if (!ambient) return;
    const { context: ctx, width: w, height: h } = ambient;
    ctx.clearRect(0, 0, w, h);
    const travel = motionOn ? smoothProgress : 0;
    const drift = time * .085;
    const glowX = w * (.76 + .12 * Math.sin(travel * 4));
    const glowY = h * (.45 + .2 * Math.sin(travel * 7 + .6));
    const glow = ctx.createRadialGradient(glowX, glowY, 5, glowX, glowY, w * .55);
    glow.addColorStop(0, 'rgba(36,71,130,.09)'); glow.addColorStop(1, 'rgba(6,8,13,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    for (let line = 0; line < 9; line += 1) {
      ctx.beginPath();
      for (let step = 0; step <= 70; step += 1) {
        const f = step / 70;
        const x = f * w;
        const y = h * (.57 + .17 * Math.sin(f * 5 + drift + travel * 5))
          + Math.sin(f * 7 + line * .07 + travel * 3) * 45 + line * 9;
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(101,143,216,${.035 + line * .006 + Math.abs(scrollVelocity) * .025})`;
      ctx.lineWidth = .7; ctx.stroke();
    }
    for (let star = 0; star < 23; star += 1) {
      const x = noise(star + 150) * w;
      const y = ((noise(star + 230) + time * .0007) % 1) * h;
      ctx.fillStyle = `rgba(151,180,231,${.08 + noise(star + 300) * .12})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  function paintStill() {
    pointer.smoothX = 0; pointer.smoothY = 0;
    paintPortal(animationTime || 8); paintAmbient(animationTime || 8);
  }
  function stopLoop() { if (frameId) cancelAnimationFrame(frameId); frameId = 0; }
  function frame(now) {
    frameId = 0;
    if (!motionOn || document.hidden || modalOpen) return;
    const fps = portal && portalVisible ? (window.innerWidth < 740 ? 30 : 60) : 24;
    const targetInterval = 1000 / fps;
    if (now - lastPaint >= targetInterval - .5) {
      const dt = Math.min((now - lastPaint) / 1000, .07);
      animationTime += dt; lastPaint = now;
      pointer.smoothX = lerp(pointer.smoothX, pointer.x, .06);
      pointer.smoothY = lerp(pointer.smoothY, pointer.y, .06);
      smoothProgress = lerp(smoothProgress, scrollProgress, .055);
      scrollVelocity *= .94;
      if (portalVisible) paintPortal(animationTime);
      paintAmbient(animationTime);
    }
    frameId = requestAnimationFrame(frame);
  }
  function startLoop() {
    if (!portal && !ambient) return;
    if (!frameId && motionOn && !document.hidden && !modalOpen) {
      lastPaint = performance.now(); frameId = requestAnimationFrame(frame);
    }
  }
  function resizeScenes() {
    sizeCanvas(portal); sizeCanvas(ambient); paintStill(); updateScrollState();
    if (window.innerWidth > 740) closeMenu();
  }
  resizeScenes();
  if (portal) $('.portal-stage')?.classList.add('canvas-ready');
  if ('IntersectionObserver' in window && portal) {
    const portalObserver = new IntersectionObserver(entries => { portalVisible = entries[0].isIntersecting; }, { rootMargin: '80px' });
    portalObserver.observe(portal.canvas);
  }
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeScenes, 100);
  }, { passive: true });
  if ('ResizeObserver' in window && portal) {
    const resizeObserver = new ResizeObserver(() => { sizeCanvas(portal); paintPortal(animationTime || 8); });
    resizeObserver.observe(portal.canvas);
  }

  function applyMotionPreference() {
    motionOn = !motionQuery.matches && savedMotion !== 'off';
    root.dataset.motion = motionOn ? 'on' : 'off';
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.disabled = motionQuery.matches;
      motionButton.setAttribute('aria-pressed', String(motionOn));
      motionButton.setAttribute('aria-label', motionQuery.matches ? 'Reduced motion follows your device accessibility setting' : motionOn ? 'Pause decorative animations' : 'Enable decorative animations');
      $('.motion-label', motionButton).textContent = motionQuery.matches ? 'Reduced motion' : motionOn ? 'Motion on' : 'Motion off';
      $('.motion-icon', motionButton).textContent = motionOn ? 'Ⅱ' : '▷';
    }
    if (motionOn) startLoop();
    else {
      stopLoop(); paintStill();
      $$('.reveal-pending').forEach(element => { element.classList.remove('reveal-pending'); revealObserver?.unobserve(element); });
      introAnimations.forEach(animation => { try { animation.finish(); } catch (_) { animation.cancel(); } });
      activeTransitions.forEach(animation => { try { animation.finish(); } catch (_) { /* Already finished. */ } });
      $$('.magnetic').forEach(button => { button.style.transform = ''; });
    }
  }
  motionButton?.addEventListener('click', () => {
    savedMotion = motionOn ? 'off' : 'on';
    try { localStorage.setItem('soufiane-motion', savedMotion); } catch (_) { /* Optional preference only. */ }
    applyMotionPreference();
  });
  motionQuery.addEventListener('change', applyMotionPreference);
  document.addEventListener('visibilitychange', () => {
    root.dataset.documentHidden = String(document.hidden);
    if (document.hidden) stopLoop(); else startLoop();
  });
  applyMotionPreference();

  // Modal case studies. Focus stays in the native dialog; links remain genuine
  // project pages for new tabs, no-JS visitors and shareable URLs.
  const dialog = $('#project-dialog');
  const dialogContent = $('#dialog-content');
  const stage = $('#transition-stage');
  const closeButton = $('.dialog-close');
  const permalink = $('#dialog-permalink');
  let currentProjectId = null;
  let returnFocus = null;
  let sourceCard = null;
  let savedScroll = 0;
  let transitionToken = 0;
  let previousRestoration = 'auto';
  let previousHash = '#projects';
  let closeRequested = false;
  const supportsDialog = Boolean(dialog && typeof dialog.showModal === 'function');

  function cancelTransition() {
    transitionToken += 1;
    activeTransitions.forEach(animation => animation.cancel());
    activeTransitions = [];
    stage?.replaceChildren();
    if (sourceCard) sourceCard.style.visibility = '';
    sourceCard = null;
    dialog?.classList.remove('is-entering', 'is-leaving');
  }
  function recordAnimation(element, frames, timing) {
    const animation = element.animate(frames, timing);
    activeTransitions.push(animation);
    return animation;
  }

  async function animateCardOpen(project, anchor, rect) {
    if (!stage || !dialog || !rect || !anchor || !canAnimate || !motionOn) return;
    const token = transitionToken;
    dialog.classList.add('is-entering');
    const clone = $('.project-card__front', anchor)?.cloneNode(true);
    if (!clone) { dialog.classList.remove('is-entering'); return; }
    $$('[id]', clone).forEach(element => element.removeAttribute('id'));
    $$('img', clone).forEach(image => { image.loading = 'eager'; });
    const ghost = document.createElement('div');
    ghost.className = 'flying-card';
    ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--project-accent:${project.accent}`;
    const wingLeft = document.createElement('div');
    wingLeft.className = 'transition-wing';
    wingLeft.innerHTML = '<span>PROJECT FILE / OVERVIEW</span>' + (project.images[0] ? `<img src="${escapeHTML(project.images[0].src)}" alt="">` : `<strong>${escapeHTML(project.name)}</strong><i></i>`);
    const wingRight = document.createElement('div');
    wingRight.className = 'transition-wing';
    wingRight.innerHTML = `<span>THE DETAILS</span><strong>${escapeHTML(project.tags.slice(0, 2).join(' / '))}</strong><i></i>`;
    const shell = document.createElement('div'); shell.className = 'flip-shell';
    const front = document.createElement('div'); front.className = 'flip-face flip-face--front'; front.append(clone);
    const back = document.createElement('div'); back.className = 'flip-face flip-face--back';
    back.innerHTML = `<span>PROJECT FILE ${escapeHTML(project.number)} / ${projects.length}</span><strong>${escapeHTML(project.name)}</strong><small>UNFOLDING THE DETAILS ↗</small>`;
    shell.append(front, back); ghost.append(wingLeft, wingRight, shell); stage.append(ghost);
    sourceCard = anchor; anchor.style.visibility = 'hidden';
    const vw = root.clientWidth, vh = window.innerHeight;
    const scale = Math.min(1.03, vw * .72 / rect.width, vh * .65 / rect.height);
    const dx = vw / 2 - (rect.left + rect.width / 2);
    const dy = vh / 2 - (rect.top + rect.height / 2);
    const easing = 'cubic-bezier(.22,.8,.25,1)';
    recordAnimation(ghost, [
      { transform: 'translate3d(0,0,0) scale(1)' },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})` }
    ], { duration: 700, easing, fill: 'forwards' });
    const flip = recordAnimation(shell, [
      { transform: 'rotateX(0) rotateY(0) rotateZ(0)' },
      { transform: 'rotateX(-180deg) rotateY(-7deg) rotateZ(3deg)' }
    ], { duration: 720, easing, fill: 'forwards' });
    [wingLeft, wingRight].forEach((wing, index) => {
      const side = index === 0 ? -1 : 1;
      const spread = rect.width * (vw < 740 ? .59 : .7);
      recordAnimation(wing, [
        { opacity: 0, transform: 'translate(-50%,-50%) scale(.75) rotate(0)' },
        { opacity: .95, transform: `translate(calc(-50% + ${side * spread}px),calc(-50% + ${side * 22}px)) scale(1) rotate(${side * 14}deg)` }
      ], { duration: 510, delay: 170, easing, fill: 'forwards' });
    });
    try { await flip.finished; } catch (_) { return; }
    if (token !== transitionToken || !dialog.open) return;
    dialog.classList.remove('is-entering');
    const reveal = recordAnimation(dialogContent, [
      { opacity: 0, transform: 'translateY(24px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 380, easing, fill: 'both' });
    recordAnimation(ghost, [
      { opacity: 1, transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})` },
      { opacity: 0, transform: `translate3d(${dx}px,${dy - 15}px,0) scale(${scale * 1.05})` }
    ], { duration: 220, easing, fill: 'forwards' });
    try { await reveal.finished; } catch (_) { return; }
    if (token !== transitionToken) return;
    stage.replaceChildren();
    if (sourceCard) sourceCard.style.visibility = '';
    sourceCard = null;
    activeTransitions.forEach(animation => animation.cancel()); activeTransitions = [];
  }

  function projectFromHash() {
    if (!location.hash.startsWith('#project/')) return null;
    try { return decodeURIComponent(location.hash.slice(9)); } catch (_) { return null; }
  }

  function openProject(id, anchor = null, options = {}) {
    const project = projectMap.get(id);
    if (!project || !supportsDialog || !dialogContent) return false;
    const rect = anchor?.getBoundingClientRect();
    const wasOpen = dialog.open;
    closeRequested = false;
    cancelTransition();
    if (!wasOpen) {
      savedScroll = window.scrollY;
      lastScrollY = savedScroll;
      returnFocus = anchor || document.activeElement;
      previousHash = location.hash.startsWith('#project/') ? '#projects' : location.hash;
      previousRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
    }
    if (options.history !== false && projectFromHash() !== id) {
      history.pushState({ ...history.state, portfolioModal: true }, '', '#project/' + encodeURIComponent(id));
    }
    currentProjectId = id;
    dialogContent.innerHTML = renderProject(project, { modal: true });
    if (permalink) permalink.href = `project/index.html?project=${encodeURIComponent(id)}`;
    if (!wasOpen) {
      document.body.style.setProperty('--locked-scroll', `-${savedScroll}px`);
      document.body.classList.add('has-project-open');
      try { dialog.showModal(); }
      catch (_) {
        document.body.classList.remove('has-project-open');
        document.body.style.removeProperty('--locked-scroll');
        history.scrollRestoration = previousRestoration;
        window.location.href = `project/index.html?project=${encodeURIComponent(id)}`;
        return false;
      }
    }
    modalOpen = true; stopLoop(); closeMenu();
    dialog.scrollTop = 0;
    closeButton?.focus({ preventScroll: true });
    if (options.animate !== false && rect && motionOn) animateCardOpen(project, anchor, rect);
    return true;
  }

  async function closeProjectView() {
    if (!dialog?.open || dialog.classList.contains('is-leaving')) return;
    const interruptedFlip = dialog.classList.contains('is-entering') || Boolean(stage?.childElementCount);
    cancelTransition();
    const token = transitionToken;
    dialog.classList.add('is-leaving');
    if (motionOn && canAnimate && !interruptedFlip) {
      const animation = recordAnimation(dialogContent, [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(12px)' }
      ], { duration: 160, easing: 'ease-out' });
      try { await animation.finished; } catch (_) { return; }
    }
    if (token !== transitionToken) return;
    dialog.close();
    cancelTransition();
    modalOpen = false; currentProjectId = null; closeRequested = false;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    document.body.classList.remove('has-project-open');
    document.body.style.removeProperty('--locked-scroll');
    window.scrollTo(0, savedScroll);
    if (returnFocus instanceof HTMLElement && returnFocus.isConnected && returnFocus.getClientRects().length) {
      returnFocus.focus({ preventScroll: true });
    }
    await nextFrame();
    root.style.scrollBehavior = previousScrollBehavior;
    history.scrollRestoration = previousRestoration;
    updateScrollState(); startLoop();
  }

  function requestClose() {
    if (!dialog?.open || closeRequested) return;
    closeRequested = true;
    const ownsHistoryEntry = history.state?.portfolioModal === true && projectFromHash() === currentProjectId;
    const closedURL = new URL(location.href);
    closedURL.hash = previousHash || '#projects';
    // Close immediately rather than waiting for an asynchronous history traversal.
    // In particular, aborting a half-finished flip must never leave the page locked.
    closeProjectView();
    if (ownsHistoryEntry) history.back();
    else history.replaceState(history.state, '', closedURL);
  }
  grid?.addEventListener('click', event => {
    const anchor = event.target.closest('.project-card');
    if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !supportsDialog) return;
    const id = anchor.closest('[data-project]')?.dataset.project;
    if (!projectMap.has(id)) return;
    event.preventDefault(); openProject(id, anchor);
  });
  closeButton?.addEventListener('click', requestClose);
  dialog?.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog?.addEventListener('click', event => { if (event.target === dialog) requestClose(); });
  window.addEventListener('popstate', () => {
    const id = projectFromHash();
    if (id && projectMap.has(id)) openProject(id, null, { history: false, animate: false });
    else if (dialog?.open) closeProjectView();
  });
  const initialProject = projectFromHash();
  if (initialProject && projectMap.has(initialProject)) {
    openProject(initialProject, null, { history: false, animate: false });
  }
  // A page restored from the back/forward cache should never retain a scroll lock.
  window.addEventListener('pageshow', event => {
    if (event.persisted && !dialog?.open) {
      modalOpen = false; document.body.classList.remove('has-project-open');
      document.body.style.removeProperty('--locked-scroll'); resizeScenes(); startLoop();
    }
  });
})();
