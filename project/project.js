(function () {
  'use strict';
  var params = new URLSearchParams(location.search), id = params.get('project');
  var project = (window.PORTFOLIO_PROJECTS || []).find(function (item) { return item.id === id; });
  var root = document.getElementById('case-study-main');
  if (!root) return;
  if (!project) {
    root.innerHTML = '<div class="wrap project-loading"><p class="eyebrow">Project collection</p><h1>Project not found.</h1><p>This link does not match an available project. Explore the complete portfolio below.</p><a class="button button-primary" href="../index.html#projects">Explore all projects ↗</a></div>';
    document.title = 'Project not found | Soufiane El Khassibi'; return;
  }
  root.innerHTML = window.ProjectView.render(project, { prefix:'../', modal:false });
  document.title = project.name + ' | Soufiane El Khassibi';
  var meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = project.summary;
  var m = window.PortfolioMotion;
  if (m && !m.reduced) {
    m.animate(root.querySelector('.detail-heading'), [{ opacity:0,transform:'translateY(18px)' },{ opacity:1,transform:'translateY(0px)' }], {duration:650});
    m.animate(root.querySelector('.detail-cover'), [{ opacity:0,transform:'translateY(30px)' },{ opacity:1,transform:'translateY(0px)' }], {duration:800,delay:100});
  }
})();
