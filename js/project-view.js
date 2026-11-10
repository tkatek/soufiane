/* Shared semantic case-study renderer: used by the dialog and ordinary project URLs. */
(function () {
  'use strict';
  var symbolMap = { Laravel:'La', PHP:'php', MySQL:'SQL', Flutter:'Fl', JavaScript:'JS', HTML:'H5', CSS:'C3', JSON:'{}', Django:'Dj', Python:'Py', n8n:'n8n' };
  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function safeUrl(value) { return /^(https?:\/\/|\.\.\/|[a-z0-9][^:]*$)/i.test(value || '') ? escape(value) : '#'; }
  function symbol(tech) { return '<span class="tech-symbol" data-tech="' + escape(tech) + '">' + escape(symbolMap[tech] || tech.slice(0,2)) + '</span>'; }
  function arrow() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>'; }
  function asset(src, prefix) { return /^(https?:)\/\//i.test(src) ? src : (prefix || '') + src; }
  function cover(project, prefix) {
    if (project.images.length) return '<img src="' + safeUrl(asset(project.images[0].src,prefix)) + '" alt="' + escape(project.images[0].alt) + '" width="1280" height="800" decoding="async">';
    return '<div class="project-monogram" aria-hidden="true"><span>' + escape(project.name.split(' ')[0].slice(0,2).toUpperCase()) + '</span><i></i><i></i></div>';
  }
  function techCards(project) {
    var items = project.stack.map(function (name) { return { name:name, label:'Technology', tech:true }; });
    var features = project.scope && project.scope.length ? project.scope : project.features;
    features.forEach(function (name) {
      if (items.length < 4 && !items.some(function (x) { return x.name === name; })) items.push({ name:name, label:'Project feature', tech:false });
    });
    if (!items.length) items.push({ name:project.category, label:'Project type', tech:false });
    return items.slice(0,4);
  }
  function render(project, options) {
    options = options || {}; var prefix = options.prefix || '', modal = options.modal === true;
    var hID = modal ? 'dialog-project-title' : 'project-title';
    var features = project.scope && project.scope.length ? project.scope : project.features;
    var controls = project.live ? '<a class="button button-primary" href="' + safeUrl(project.live) + '" target="_blank" rel="noopener noreferrer">Open live project ' + arrow() + '</a>' : '';
    if (modal) controls += '<a class="button button-outline" href="project/index.html?project=' + escape(project.id) + '">Open full page ' + arrow() + '</a>';
    var paragraphs = project.paragraphs.map(function (p) { return '<p>' + escape(p) + '</p>'; }).join('');
    var narrative = ['challenge','approach','outcome'].map(function (key) {
      if (!project[key]) return '';
      var title = {challenge:'The challenge',approach:'The approach',outcome:'What I built'}[key];
      return '<h3>' + title + '</h3><p>' + escape(project[key]) + '</p>';
    }).join('');
    var stack = project.stack.length ? '<div class="detail-stack">' + project.stack.map(function (t) { return '<div class="detail-stack-row">' + symbol(t) + '<span>' + escape(t) + '</span></div>'; }).join('') + '</div>' : '<p>' + escape(project.stackNote || 'Technology details have not been added to this project.') + '</p>';
    var gallery = project.images.slice(1).map(function (im) { return '<figure><img src="' + safeUrl(asset(im.src,prefix)) + '" alt="' + escape(im.alt) + '" loading="lazy" decoding="async"><figcaption>' + escape(im.caption || im.alt) + '</figcaption></figure>'; }).join('');
    return '<article class="detail-page" data-project-detail="' + escape(project.id) + '" style="--accent:' + escape(project.accent) + '"><div class="wrap">' +
      '<header class="detail-heading"><div class="detail-kicker"><span>' + escape(project.number) + ' / 17</span><span>' + escape(project.category) + '</span></div>' +
      '<h1 class="detail-title" id="' + hID + '" tabindex="-1">' + escape(project.name) + '</h1><div class="detail-lead-row"><p class="detail-summary">' + escape(project.summary) + '</p></div><div class="detail-actions">' + controls + '</div></header>' +
      '<div class="detail-cover">' + cover(project,prefix) + '</div>' +
      (project.images.length ? '<p class="detail-caption">' + escape(project.images[0].caption || project.images[0].alt) + '</p>' : '') +
      '<div class="detail-grid"><div class="detail-story"><section class="detail-section"><p class="eyebrow">The project</p><h2>' + escape(project.brief || project.headline || project.name) + '</h2>' + paragraphs + narrative +
      (project.detailStatus ? '<p>' + escape(project.detailStatus) + '</p>' : '') + '</section></div>' +
      '<aside class="detail-side"><section class="detail-panel"><h3>Technology stack</h3>' + stack + '</section>' +
      (features.length ? '<section class="detail-panel"><h3>Inside the project</h3><ul class="feature-list">' + features.map(function (t) { return '<li>' + escape(t) + '</li>'; }).join('') + '</ul></section>' : '') + '</aside></div>' +
      (gallery ? '<section class="detail-gallery" aria-label="More project screenshots">' + gallery + '</section>' : '') +
      '<footer class="detail-end"><div><p class="eyebrow">Have something in mind?</p><p>Let’s make something useful together.</p></div><a class="button button-outline" href="mailto:sofianlkhassibi10@gmail.com">Start a conversation ' + arrow() + '</a></footer>' +
      '</div></article>';
  }
  window.ProjectView = {render:render,escape:escape,symbol:symbol,arrow:arrow,cover:cover,techCards:techCards};
})();
