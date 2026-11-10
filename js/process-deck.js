/* A fixed-size, interruption-safe process deck.
 * Capture-phase listeners deliberately retire the old single-card click handlers,
 * without replacing the rest of script.js or the owner's newer portfolio changes. */
(function () {
  'use strict';
  var C=window.StudioCraft,lab=document.querySelector('#process-lab'),panel=document.querySelector('#process-panel');
  if(!C||!lab||!panel)return;
  if(lab.craftDeck&&lab.craftDeck.destroy)lab.craftDeck.destroy();
  var tabs=Array.from(lab.querySelectorAll('[data-step]'));if(tabs.length!==4)return;
  var original=panel.innerHTML,originalLabClass=lab.className;
  var steps=[
    {label:'01 / DISCOVERY',icon:'◎',title:'Start with a better question.',description:'Understand the people, the problem, and what a useful solution should do.',tag:'People first'},
    {label:'02 / DESIGN',icon:'◇',title:'Give the idea a clear shape.',description:'Plan the flow, explore the interface, and make the important things feel effortless.',tag:'Clarity before decoration'},
    {label:'03 / DEVELOPMENT',icon:'⌘',title:'Connect every moving part.',description:'Build reliable interfaces, data models and workflows that work together as one product.',tag:'Thoughtful engineering'},
    {label:'04 / DELIVERY',icon:'↗',title:'Refine. Test. Put it out there.',description:'Check the details, test the real experience, and get the product ready for people to use.',tag:'Ready for the real world'}
  ];
  Array.from(panel.querySelectorAll('*')).forEach(function(el){if(el.getAnimations)el.getAnimations().forEach(function(a){a.cancel();});if(window.gsap)gsap.killTweensOf(el);});
  lab.classList.add('craft-process');
  panel.innerHTML='<div class="cd-orbits" aria-hidden="true"></div><div class="cd-deck">'+steps.map(function(s,i){return '<article class="cd-card" data-cd-index="'+i+'" aria-hidden="'+(i!==0)+'"><div class="cd-card-top"><span>'+C.escape(s.label)+'</span><span class="cd-dots" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="cd-icon" aria-hidden="true">'+C.escape(s.icon)+'</div><h4>'+C.escape(s.title)+'</h4><p>'+C.escape(s.description)+'</p><div class="cd-card-footer"><span>'+C.escape(s.tag)+'</span><b aria-hidden="true">↗</b></div></article>';}).join('')+'</div><p class="cd-hint">Swipe the cards · or choose a step</p><div class="cd-counter" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  panel.setAttribute('aria-label','How I build: use the tabs or swipe the cards');
  var deck=panel.querySelector('.cd-deck'),cards=Array.from(panel.querySelectorAll('.cd-card')),dots=Array.from(panel.querySelectorAll('.cd-counter i'));
  var current=0,version=0,handles=[],gesture=null,dead=false,isAnimating=false;
  function stop(){version++;handles.forEach(function(h){h.cancel();});handles=[];isAnimating=false;}
  function pose(depth){return 'translate3d('+depth*10+'px,'+depth*8+'px,0) rotate('+(depth===0?-4:depth===1?1:depth===2?5:8)+'deg)';}
  function state(){
    cards.forEach(function(c,i){var depth=(i-current+4)%4;c.style.zIndex=String(10-depth);c.setAttribute('aria-hidden',String(i!==current));});
    tabs.forEach(function(t,i){t.classList.toggle('is-active',i===current);t.setAttribute('aria-selected',String(i===current));t.tabIndex=i===current?0:-1;});
    dots.forEach(function(d,i){d.classList.toggle('is-current',i===current);});panel.setAttribute('aria-labelledby',tabs[current].id);panel.dataset.deckIndex=current;
  }
  function settle(){cards.forEach(function(c,i){var depth=(i-current+4)%4;c.style.transform=pose(depth);c.style.opacity=depth===3?'0':depth===2?'.52':depth===1?'.76':'1';});state();panel.dataset.deckState='idle';isAnimating=false;}
  function move(index,options){
    options=options||{};index=(index+4)%4;if(dead)return;
    if(index===current){if(gesture||isAnimating){stop();settle();}return;}
    var previous=current,direction=options.direction||((index-previous+4)%4===3?-1:1);
    stop();current=index;state();
    if(C.reduced.matches||options.instant){settle();return;}
    var token=version;isAnimating=true;panel.dataset.deckState='moving';
    // Every destination is a fixed-size card. No scale/width/height tween, no text swap.
    cards.forEach(function(c,i){var depth=(i-current+4)%4;if(i===previous){c.style.zIndex='15';var h=C.animate(c,{transform:'translate3d('+(-direction*Math.min(145,deck.clientWidth*.42))+'px,-17px,0) rotate('+(-direction*13)+'deg)',opacity:'0'},{duration:280,ease:'power2.in'});handles.push(h);h.finished.then(function(ok){if(!ok||token!==version)return;c.style.transform=pose(depth);c.style.zIndex=String(10-depth);if(depth<3){var follow=C.animate(c,{opacity:depth===1?'.76':'.52'},{duration:180});handles.push(follow);}});}else{
      if(i===current&&parseFloat(getComputedStyle(c).opacity)<.05){c.style.transform='translate3d('+(direction*40)+'px,12px,0) rotate('+(direction*6)+'deg)';c.style.opacity='0';}
      handles.push(C.animate(c,{transform:pose(depth),opacity:depth===3?'0':depth===2?'.52':depth===1?'.76':'1'},{duration:480,ease:'power3.out'}));
    }});
    Promise.all(handles.map(function(h){return h.finished;})).then(function(){if(token!==version||dead)return;settle();});
  }
  function clicked(e){var t=e.target.closest('[data-step]');if(!t||!lab.contains(t))return;e.preventDefault();e.stopImmediatePropagation();move(Number(t.dataset.step));}
  function keyed(e){var t=e.target.closest('[data-step]'),inPanel=panel.contains(e.target);if(!t&&!inPanel)return;var keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];if(keys.indexOf(e.key)<0)return;e.preventDefault();e.stopImmediatePropagation();var next=e.key==='Home'?0:e.key==='End'?3:(current+((e.key==='ArrowRight'||e.key==='ArrowDown')?1:3))%4;move(next);if(t)tabs[next].focus({preventScroll:true});}
  lab.addEventListener('click',clicked,true);lab.addEventListener('keydown',keyed,true);
  function down(e){if(e.button!==0||e.isPrimary===false||e.target.closest('a,button,input,textarea'))return;stop();settle();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastT:performance.now(),velocity:0,axis:'',dx:0};}
  function drag(e){if(!gesture||e.pointerId!==gesture.id)return;var dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>10){gesture.axis=Math.abs(dx)>Math.abs(dy)*1.25?'x':'y';if(gesture.axis==='x'){try{panel.setPointerCapture(e.pointerId);}catch(_){}panel.dataset.deckState='dragging';}}
    if(gesture.axis!=='x')return;if(e.cancelable)e.preventDefault();var now=performance.now();gesture.velocity=(e.clientX-gesture.lastX)/Math.max(1,now-gesture.lastT);gesture.lastX=e.clientX;gesture.lastT=now;gesture.dx=dx;
    var bounded=C.clamp(dx,-deck.clientWidth*.65,deck.clientWidth*.65);cards[current].style.transform='translate3d('+bounded+'px,0px,0) rotate('+(-4+bounded*.045)+'deg)';cards[current].style.opacity=String(1-Math.min(.35,Math.abs(bounded)/deck.clientWidth*.4));
  }
  function up(e){if(!gesture||e.pointerId!==gesture.id)return;var g=gesture;gesture=null;try{if(panel.hasPointerCapture(e.pointerId))panel.releasePointerCapture(e.pointerId);}catch(_){}
    if(g.axis==='x'&&(Math.abs(g.dx)>Math.max(42,deck.clientWidth*.17)||(Math.abs(g.velocity)>.55&&Math.abs(g.dx)>20))){move(current+(g.dx<0?1:-1),{direction:g.dx<0?1:-1});}else{handles.push(C.animate(cards[current],{transform:pose(0),opacity:'1'},{duration:240}));var id=version;handles[handles.length-1].finished.then(function(){if(id===version)settle();});}
  }
  function cancel(e){if(!gesture)return;if(e&&e.type==='lostpointercapture'&&e.target!==panel)return;if(e&&e.pointerId!==undefined&&e.pointerId!==gesture.id)return;gesture=null;stop();settle();}
  panel.addEventListener('pointerdown',down);panel.addEventListener('pointermove',drag,{passive:false});panel.addEventListener('pointerup',up);panel.addEventListener('pointercancel',cancel);panel.addEventListener('lostpointercapture',cancel);
  function resize(){cancel();stop();settle();}
  window.addEventListener('resize',resize,{passive:true});C.reduced.addEventListener('change',resize);
  settle();
  function intro(){
    if(C.reduced.matches||dead||gesture||isAnimating)return;
    stop();var token=version;panel.dataset.deckState='assembling';isAnimating=true;
    cards.forEach(function(c,i){var depth=(i-current+4)%4;c.style.transform='translate3d(0px,24px,0) rotate(-1deg)';c.style.opacity=depth===3?'0':'.45';handles.push(C.animate(c,{transform:pose(depth),opacity:depth===3?'0':depth===2?'.52':depth===1?'.76':'1'},{duration:700,delay:depth*70}));});
    Promise.all(handles.map(function(h){return h.finished;})).then(function(){if(token===version&&!dead)settle();});
  }
  lab.craftDeck={select:move,intro:intro,getState:function(){return {index:current,moving:isAnimating,gesture:!!gesture,version:version};},destroy:function(){dead=true;stop();lab.removeEventListener('click',clicked,true);lab.removeEventListener('keydown',keyed,true);panel.removeEventListener('pointerdown',down);panel.removeEventListener('pointermove',drag);panel.removeEventListener('pointerup',up);panel.removeEventListener('pointercancel',cancel);panel.removeEventListener('lostpointercapture',cancel);window.removeEventListener('resize',resize);C.reduced.removeEventListener('change',resize);panel.innerHTML=original;lab.className=originalLabClass;}};
})();
