/* Purposeful, finite cursor choreography for the rest of the portfolio.
 * Nothing is hidden until an observer loads; content and links always exist.
 * Decorative pointers are local, aria-hidden, and cannot capture real input. */
(function () {
  'use strict';
  var C=window.StudioCraft;if(!C)return;
  var configurations=[
    {selector:'#project-grid',name:'work',roles:['Arrange','Preview','Details'],targets:['.project-card:not([hidden]) .project-visual','.project-card:not([hidden]) .project-name-row','.project-card:not([hidden]) .tech-tags'],animate:['.project-card:not([hidden]) .project-visual img','.project-card:not([hidden]) .project-copy'],kind:'cards'},
    {selector:'.about-grid',name:'about',roles:['Write','Connect','Polish'],targets:['.story-row h3','.experience-card','.about-story blockquote'],animate:['.story-row h3','.timeline-item'],kind:'write'},
    {selector:'#process-lab',name:'process',roles:['Plan','Build','Refine'],targets:['.process-intro h3','.process-tabs','.cd-deck'],animate:['.process-intro .eyebrow','.process-tabs button'],kind:'process'},
    {selector:'.toolkit-card',name:'toolkit',roles:['Interface','Systems','Connect'],targets:['h3','.skill-grid','.skill-chip:last-child'],animate:['.skill-chip'],kind:'chips'},
    {selector:'#notes .notes-list',name:'notes',roles:['Write','Edit','Refine'],targets:['.note-row h3','.note-row:nth-child(2) h3','.note-row:nth-child(3) h3'],animate:['.note-row h3'],kind:'write'},
    {selector:'#github-activity',name:'activity',roles:['Arrange','Review','Polish'],targets:['.github-heading','.github-calendar','.github-summary'],animate:['.github-heading h3'],kind:'activity'},
    {selector:'.contact-grid',name:'contact',roles:['Write','Compose','Connect'],targets:['.contact-copy h2','.portrait-frame','.contact-email'],animate:['.portrait-stamp','.contact-links a'],kind:'contact'}
  ];
  // Resolve the actual notes wrapper rather than assuming every portfolio revision names it the same way.
  var notes=document.querySelector('.note-row');if(notes)configurations[4].selector='#'+(notes.parentElement.id||(notes.parentElement.id='craft-notes-list'));
  var scenes=[],observer=null;
  function setup(root,config,index){
    if(root.dataset.craftAttached)return;root.dataset.craftAttached='true';root.classList.add('craft-scope');root.dataset.craftState='ready';
    var mobile=matchMedia('(max-width:767px)'),count=mobile.matches?2:3,layer=document.createElement('div');layer.className='craft-layer';layer.setAttribute('aria-hidden','true');
    var roleNames=config.roles.slice();if(config.name==='toolkit'){var first=['Interface','Systems','Connect'][index%3];roleNames=[first,'Arrange','Polish'];}
    layer.innerHTML=roleNames.slice(0,count).map(function(name,i){return C.cursor(name,['#b7a3ed','#8dd3e0','#dbb6e9'][i]);}).join('')+Array.from({length:count},function(_,i){return '<div class="craft-target-mark craft-mark-'+i+'"></div>';}).join('');root.appendChild(layer);
    var pointers=Array.from(layer.querySelectorAll('.craft-cursor')),marks=Array.from(layer.querySelectorAll('.craft-target-mark'));
    var started=false,finished=false,clock=null,rects=[],targets=[],effects=[],dimensions={w:1,h:1};
    function locate(){
      var bounds=root.getBoundingClientRect();dimensions={w:bounds.width,h:bounds.height};targets=[];
      config.targets.forEach(function(sel){var list=Array.from(root.querySelectorAll(sel));var candidate=list.find(function(el){var r=el.getBoundingClientRect();return r.top<innerHeight-25&&r.bottom>70;})||list[0];if(candidate)targets.push(candidate);});
      if(!targets.length)targets=[root];
      rects=pointers.map(function(_,i){var target=targets[Math.min(i,targets.length-1)],b=target.getBoundingClientRect(),left=C.clamp(b.left-bounds.left+8,8,Math.max(8,bounds.width-48)),top=C.clamp(b.top-bounds.top+8,8,Math.max(8,bounds.height-32));return {x:left,y:top,w:Math.min(b.width,Math.max(10,bounds.width-left)),h:Math.min(b.height,Math.max(10,bounds.height-top))};});
    }
    function end(){finished=true;root.dataset.craftState='finished';pointers.forEach(function(p){p.style.opacity=0;});effects.forEach(function(a){try{a.cancel();}catch(_){}});effects=[];}
    function render(time){
      var duration=4.6;
      pointers.forEach(function(pointer,i){var b=rects[i];if(!b)return;var offset=i*.38,local=time-offset,enter=C.smooth(local,0,.55),active=enter*(1-C.smooth(local,3.05,3.8));
        var startX=i%2?dimensions.w-36:8,startY=Math.max(10,b.y-28),endX=C.clamp(b.x+b.w*.78,12,Math.max(12,dimensions.w-70)),endY=C.clamp(b.y+Math.min(b.h*.6,85),12,Math.max(12,dimensions.h-44));
        var p=C.path(local,[[0,startX,startY],[.7,b.x+8,b.y+8],[1.3,b.x+8,b.y+8],[2.5,endX,endY],[3.25,endX+12,endY+8],[3.8,endX+20,endY+15]]);
        pointer.style.transform='translate('+C.round(p.x)+'px,'+C.round(p.y)+'px)';pointer.style.opacity=String(C.reduced.matches?0:C.round(active));pointer.classList.toggle('cursor-label-left',p.x>dimensions.w-95);pointer.classList.toggle('cursor-label-above',p.y>dimensions.h-60);
        var pulse=C.progress(local,.85,1.35);pointer.querySelector('i').style.opacity=local>=.85&&local<=1.35?1-pulse:0;pointer.querySelector('i').style.transform='scale('+(0.4+pulse*1.7)+')';
        var mark=marks[i],underline=config.kind==='write'||(config.kind==='contact'&&i===0);Object.assign(mark.style,{left:b.x+'px',top:(underline?b.y+b.h+2:b.y)+'px',width:Math.max(12,b.w-4)+'px',height:underline?'2px':Math.min(b.h,dimensions.h-b.y-8)+'px',opacity:String(C.round(C.smooth(local,.85,1.3)*(1-C.smooth(local,2.7,3.25)))),transform:'scaleX('+C.round(underline?C.smooth(local,.8,2):1)+')'});
      });
      if(time>=duration-.01)end();
    }
    function animateContent(){
      if(config.kind==='process'&&root.craftDeck&&root.craftDeck.intro)root.craftDeck.intro();
      // Child-only assembly avoids interfering with the layout/hover/deck transform owners.
      var nodes=[];config.animate.forEach(function(sel){nodes=nodes.concat(Array.from(root.querySelectorAll(sel)));});nodes=nodes.filter(function(el){var b=el.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight;}).slice(0,mobile.matches?10:18);
      nodes.forEach(function(el,i){if(!el.animate)return;var style=getComputedStyle(el),base=style.transform==='none'?'':style.transform;var frames;
        if(config.kind==='chips')frames=[{opacity:.45,transform:base+' translateY(13px) rotate(-3deg)'},{opacity:1,transform:base||'none'}];
        else if(config.kind==='contact'&&el.classList.contains('portrait-stamp'))frames=[{opacity:.4,transform:base+' translateY(-17px) rotate(-14deg)'},{opacity:1,transform:base||'none'}];
        else if(config.kind==='write')frames=[{clipPath:'inset(0 16% 0 0)',opacity:.55},{clipPath:'inset(0 0% 0 0)',opacity:1}];
        else frames=[{opacity:.6,transform:base+' translateY(12px)'},{opacity:1,transform:base||'none'}];
        var animation=el.animate(frames,{duration:620,delay:280+Math.min(i,8)*85,easing:'cubic-bezier(.22,.75,.2,1)',fill:'none'});effects.push(animation);
      });
    }
    function start(){if(started||C.reduced.matches){if(C.reduced.matches)end();return;}started=true;locate();root.dataset.craftState='playing';animateContent();clock=C.clock({element:root,duration:4.6,render:render,complete:end});clock.play(4.6);}
    function interrupt(e){if(!started||finished)return;if(e.type==='pointerdown'&&e.pointerType==='touch')return;if(clock)clock.finish();else end();}
    // Reading/using a section takes priority over decorative choreography.
    root.addEventListener('focusin',interrupt);root.addEventListener('pointerdown',interrupt);
    function resize(){if(started&&!finished)locate();}
    window.addEventListener('resize',resize,{passive:true});
    var api={root:root,start:start,finish:function(){if(clock)clock.finish();else end();},getState:function(){return {name:config.name,started:started,finished:finished,clock:clock&&clock.getState()};},destroy:function(){if(clock)clock.destroy();end();layer.remove();root.removeEventListener('focusin',interrupt);root.removeEventListener('pointerdown',interrupt);window.removeEventListener('resize',resize);root.classList.remove('craft-scope');delete root.dataset.craftAttached;delete root.dataset.craftState;}};
    scenes.push(api);root.craftScene=api;
  }
  configurations.forEach(function(config){Array.from(document.querySelectorAll(config.selector)).forEach(function(el,i){setup(el,config,i);});});
  if('IntersectionObserver'in window){observer=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){observer.unobserve(en.target);en.target.craftScene.start();}});},{threshold:.025,rootMargin:'-70px 0px -40px 0px'});scenes.forEach(function(scene){observer.observe(scene.root);});}else scenes.forEach(function(scene){scene.finish();});
  function preference(){if(C.reduced.matches)scenes.forEach(function(scene){scene.finish();});}
  C.reduced.addEventListener('change',preference);
  window.PortfolioCursorScenes={scenes:scenes,destroy:function(){if(observer)observer.disconnect();C.reduced.removeEventListener('change',preference);scenes.forEach(function(scene){scene.destroy();});}};
})();
