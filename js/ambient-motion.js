/* Adds no new canvas, network calls or dependencies; reuses the existing background. */
(function () {
 'use strict';
 var host=document.querySelector('.ambient-scene');
 if(!host||host.dataset.constructionAmbient)return;
 host.dataset.constructionAmbient='true';host.classList.add('bc-ambient');
 var light=document.createElement('div');light.className='bc-ambient-focus';
 var line=document.createElement('div');line.className='bc-ambient-line';
 host.append(light,line);
 var reduced=matchMedia('(prefers-reduced-motion: reduce)'),active=new Set();
 function visibility(){host.classList.toggle('bc-paused',document.hidden||reduced.matches||!!document.querySelector('#project-dialog[open]'));}
 function building(event){var d=event.detail;if(!d||!d.root)return;
  if(d.active){active.add(d.root);var r=d.root.getBoundingClientRect();light.style.transform='translate3d('+Math.max(-100,r.left+r.width/2-360)+'px,'+Math.max(-120,r.top+r.height/2-260)+'px,0)';}
  else active.delete(d.root);
  light.classList.toggle('is-building',active.size>0&&!reduced.matches);
 }
 document.addEventListener('portfolio:construction',building);
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('portfolio:projectphase',visibility);
 reduced.addEventListener('change',visibility);visibility();
 window.PortfolioAmbient={destroy:function(){document.removeEventListener('portfolio:construction',building);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('portfolio:projectphase',visibility);reduced.removeEventListener('change',visibility);light.remove();line.remove();host.classList.remove('bc-ambient','bc-paused');delete host.dataset.constructionAmbient;}};
})();
