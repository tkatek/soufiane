/* Dedicated, shareable project pages. Uses the same data as the animated viewer. */
(() => {
  'use strict';
  const container = document.querySelector('#case-study-main');
  const data = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const id = new URLSearchParams(window.location.search).get('project');
  const project = data.find(item => item.id === id);
  if (!container || !window.PortfolioUI) return;
  if (!project) {
    document.title = 'Project Not Found | Soufiane El Khassibi';
    container.innerHTML = '<div class="container project-loading"><p class="eyebrow">PROJECT NOT FOUND</p><h1>Let’s get you back<br>to the work.</h1><p>This project link is missing or invalid.</p><a class="button button--primary" href="../index.html#projects">Explore all projects ↗</a></div>';
    return;
  }
  container.innerHTML = window.PortfolioUI.renderProject(project, { prefix: '../' });
  document.title = `${project.name} | Soufiane El Khassibi`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = project.summary;
  // Keep canonical URLs specific to each project, not the generic project route.
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = `https://soufianeelkhassibi.online/project/index.html?project=${encodeURIComponent(project.id)}`;
  document.head.append(canonical);
})();
