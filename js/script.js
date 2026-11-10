(function () {
  'use strict';
  var M=window.PortfolioMotion,V=window.ProjectView,projects=window.PORTFOLIO_PROJECTS||[];
  if(!M||!V)return;
  var $=function(s,r){return(r||document).querySelector(s);},$$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var header=$('.site-header'),nav=$('#site-navigation'),menu=$('.menu-toggle');
  function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open');}
  if(menu&&nav){menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open);});nav.addEventListener('click',function(e){if(e.target.closest('a'))closeMenu();});document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});document.addEventListener('click',function(e){if(!header.contains(e.target))closeMenu();});}
  var progress=$('.scroll-progress'),glowA=$('.ambient-glow-a'),glowB=$('.ambient-glow-b'),scrollPending=false,scrollGSAP=false;
  function scrollUpdate(){scrollPending=false;var y=window.scrollY,range=document.documentElement.scrollHeight-innerHeight;if(header)header.classList.toggle('is-scrolled',y>15);if(progress)progress.style.transform='scaleX('+(range>0?Math.min(1,y/range):0)+')';if(!M.reduced&&!scrollGSAP){if(glowA)glowA.style.transform='translate3d('+Math.sin(y*.0006)*80+'px,'+Math.min(400,y*.08)+'px,0)';if(glowB)glowB.style.transform='translate3d('+Math.cos(y*.0005)*70+'px,'+(-Math.min(250,y*.04))+'px,0)';}}
  window.addEventListener('scroll',function(){if(!scrollPending){scrollPending=true;requestAnimationFrame(scrollUpdate);}},{passive:true});scrollUpdate();
  function gsapScroll(){if(!window.gsap||!window.ScrollTrigger||M.reduced||scrollGSAP)return;scrollGSAP=true;gsap.to('.ambient-glow-a',{y:360,x:-100,ease:'none',scrollTrigger:{trigger:'main',start:'top top',end:'bottom bottom',scrub:1.5}});gsap.to('.ambient-glow-b',{y:-240,x:130,ease:'none',scrollTrigger:{trigger:'main',start:'top top',end:'bottom bottom',scrub:2}});gsap.to('.ribbon-inner strong',{y:-5,stagger:.04,ease:'none',scrollTrigger:{trigger:'.skills-ribbon',start:'top bottom',end:'bottom top',scrub:1}});}
  window.addEventListener('portfolio:motionready',gsapScroll);
  window.addEventListener('portfolio:motionchange',function(e){if(e.detail.reduced){if(window.ScrollTrigger)ScrollTrigger.getAll().forEach(function(t){t.kill();});scrollGSAP=false;[glowA,glowB].forEach(function(el){if(el)el.style.transform='none';});$$('.reveal,.title-line,.hero-description,.hero-actions,.availability').forEach(function(el){el.style.opacity='1';el.style.transform='none';});}else gsapScroll();});
  // Everything is visible by default; reveal effects never act as a loading gate.
  if('IntersectionObserver'in window){var revealObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;revealObserver.unobserve(entry.target);if(!M.reduced)M.animate(entry.target,[{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'translateY(0px)'}],{duration:680});});},{threshold:.08,rootMargin:'0px 0px -25px 0px'});$$('.reveal').forEach(function(el){revealObserver.observe(el);});}
  if(!M.reduced){$$('.hero-title .title-line').forEach(function(el,i){M.animate(el,[{opacity:0,transform:'translateY(34px)'},{opacity:1,transform:'translateY(0px)'}],{duration:850,delay:80+i*100});});M.animate($('.hero-description'),[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0px)'}],{duration:650,delay:260});M.animate($('.hero-actions'),[{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0px)'}],{duration:650,delay:350});}
  // Fine-pointer effects never interfere with touch scrolling or clicks.
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  $$('.project-card,.spotlight-card').forEach(function(card){var base=null;card.addEventListener('pointerenter',function(){if(fine.matches&&!M.reduced)base=card.getBoundingClientRect();});card.addEventListener('pointermove',function(e){if(!fine.matches||M.reduced||e.pointerType==='touch')return;var r=base||card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));card.style.setProperty('--mx',x*100+'%');card.style.setProperty('--my',y*100+'%');if(card.classList.contains('project-card'))card.style.transform='perspective(1200px) rotateX('+((.5-y)*3)+'deg) rotateY('+((x-.5)*3.5)+'deg)';},{passive:true});card.addEventListener('pointerleave',function(){base=null;card.style.transform='';});});
  $$('[data-magnetic]').forEach(function(el){el.addEventListener('pointermove',function(e){if(!fine.matches||M.reduced)return;var r=el.getBoundingClientRect();el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.08)+'px,'+((e.clientY-r.top-r.height/2)*.1)+'px)';},{passive:true});el.addEventListener('pointerleave',function(){el.style.transform='';});});
  // Filter/show-all keeps all 17 projects in static HTML for links, search and no-JS reading.
  var cards=$$('.project-card'),filters=$$('[data-filter]'),more=$('#show-all-projects'),filter='all',expanded=false,filterController=null;
  function applyFilter(initial){
    if(filterController)filterController.abort();filterController=new AbortController();var signal=filterController.signal;
    var state=window.Flip&&!M.reduced&&!initial?Flip.getState(cards.filter(function(c){return !c.hidden;})):null;
    cards.forEach(function(c){c.hidden=filter==='all'?(!expanded&&c.dataset.featured!=='true'):c.dataset.category!==filter;});
    var shown=cards.filter(function(c){return !c.hidden;});
    if(more){more.hidden=filter!=='all'||expanded;more.setAttribute('aria-expanded',String(expanded));}
    filters.forEach(function(b){var active=b.dataset.filter===filter;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));if(b.dataset.filter==='all')b.innerHTML=(expanded?'All work':'Selected')+' <span>'+(expanded?'17':'06')+'</span>';});
    var count=$('#project-count');if(count)count.textContent=shown.length+' projects shown.';
    if(!initial&&!M.reduced){if(state){Flip.from(state,{duration:.55,ease:'power3.inOut',absolute:true,onEnter:function(els){return gsap.fromTo(els,{opacity:0,y:20},{opacity:1,y:0,duration:.4});}});}else shown.forEach(function(c,i){M.animate(c,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0px)'}],{duration:430,delay:Math.min(i,5)*35,signal:signal});});}
    if(window.ScrollTrigger)requestAnimationFrame(function(){ScrollTrigger.refresh();});
  }
  filters.forEach(function(b){b.addEventListener('click',function(){filter=b.dataset.filter;applyFilter(false);});});if(more)more.addEventListener('click',function(){expanded=true;applyFilter(false);});applyFilter(true);
  // A real stateful, keyboard-operable process component, not a looping video.
  var steps=[{label:'01 / DISCOVERY',icon:'?',title:'Start with a better question.',description:'Understand the people, the problem, and what a useful solution should do.',tag:'People first'},{label:'02 / DESIGN',icon:'✳',title:'Give the idea a clear shape.',description:'Plan the flow, explore the interface, and make the important things feel effortless.',tag:'Clarity before decoration'},{label:'03 / DEVELOPMENT',icon:'</>',title:'Connect every moving part.',description:'Build reliable interfaces, data models and workflows that work together as one product.',tag:'Thoughtful engineering'},{label:'04 / DELIVERY',icon:'↗',title:'Refine. Test. Put it out there.',description:'Check the details, test the real experience, and get the product ready for people to use.',tag:'Ready for the real world'}];
  var processTabs=$$('[data-step]'),processCard=$('#process-card'),processController=null,currentStep=0;
  async function setStep(index){if(!steps[index])return;if(processController)processController.abort();processController=new AbortController();var signal=processController.signal;currentStep=index;processTabs.forEach(function(t,i){t.classList.toggle('is-active',i===index);t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;});$('#process-panel').setAttribute('aria-labelledby','process-tab-'+index);
    await M.animate(processCard,[{opacity:1,transform:'translateY(0px) rotateX(0deg)'},{opacity:0,transform:'translateY(-22px) rotateX(15deg)'}],{duration:190,signal:signal});if(signal.aborted)return;var s=steps[index];$('#process-step-label').textContent=s.label;$('#process-icon').textContent=s.icon;$('#process-title').textContent=s.title;$('#process-description').textContent=s.description;$('#process-tag').textContent=s.tag;await M.animate(processCard,[{opacity:0,transform:'translateY(24px) rotateX(-12deg)'},{opacity:1,transform:'translateY(0px) rotateX(0deg)'}],{duration:470,ease:'back.out(1.3)',signal:signal});}
  processTabs.forEach(function(t,i){t.addEventListener('click',function(){setStep(i);});t.addEventListener('keydown',function(e){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var next=e.key==='Home'?0:e.key==='End'?3:(currentStep+(e.key==='ArrowRight'?1:3))%4;processTabs[next].focus();setStep(next);});});
  // Shared-element card → stack cards → full project. Explicit cancellable state machine.
  var dialog=$('#project-dialog'),content=$('#dialog-content'),stage=$('#transition-stage'),scroller=$('#dialog-scroll');
  var state='idle',controller=null,currentProject=null,opener=null,savedScroll=0,baseHash='#projects',ownsHistory=false,closingPromise=null;
  function phase(name){if(dialog)dialog.dataset.phase=name;window.dispatchEvent(new CustomEvent('portfolio:projectphase',{detail:{phase:name,project:currentProject&&currentProject.id}}));}
  function focusTitle(){var h=$('#dialog-project-title');if(h)h.focus({preventScroll:true});}
  function lock(){savedScroll=window.scrollY;document.body.style.top=-savedScroll+'px';document.body.classList.add('locked');}
  function unlock(){document.body.classList.remove('locked');document.body.style.top='';var html=document.documentElement,previous=html.style.scrollBehavior;html.style.scrollBehavior='auto';window.scrollTo(0,savedScroll);requestAnimationFrame(function(){html.style.scrollBehavior=previous;scrollUpdate();});}
  function finalOpen(){stage.replaceChildren();stage.style.display='';stage.style.background='';content.style.opacity='1';content.style.transform='none';state='open';phase('open');focusTitle();}
  async function cinematic(project,sourceRect,signal){
    stage.style.display='block';
    var stageRect=stage.getBoundingClientRect(),w=stageRect.width,h=stageRect.height;
    if(M.reduced||!sourceRect||h<420){content.style.opacity='1';await M.animate(content,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0px)'}],{duration:350,signal:signal});if(!signal.aborted)finalOpen();return;}
    stage.style.background='transparent';
    var wash=document.createElement('div');wash.className='flight-wash';Object.assign(wash.style,{position:'absolute',inset:'0',background:'radial-gradient(ellipse at 50% 45%,#28335b50,transparent 65%),#0a0d16'});stage.appendChild(wash);
    var wide=w>=1000,cardW=wide?Math.min(520,w*.46):Math.min(490,w-38),cardH=wide?330:300;
    var x=(w-cardW)/2,y=Math.max(28,(h-cardH)/2-(wide?10:60));
    var plane=document.createElement('div');plane.className='flight-card';plane.style.setProperty('--accent',project.accent);plane.style.width=cardW+'px';plane.style.height=cardH+'px';
    var features=(project.scope.length?project.scope:project.features).slice(0,4);
    plane.innerHTML='<div class="flight-rotor"><div class="flight-face flight-front">'+V.cover(project,'')+'<div>'+V.escape(project.name)+'<span>'+V.escape(project.category)+'</span></div></div><div class="flight-face flight-back"><div class="flight-back-top"><span>'+V.escape(project.category)+'</span><span>'+project.number+' / 17</span></div><div><h3>'+V.escape(project.name)+'</h3><p>'+V.escape(project.brief||project.summary)+'</p><div class="flight-back-features">'+features.map(function(t){return'<span>'+V.escape(t)+'</span>';}).join('')+'</div></div><div class="flight-back-footer"><span>Behind the interface</span>'+V.arrow()+'</div></div></div>';
    stage.appendChild(plane);var rotor=$('.flight-rotor',plane),back=$('.flight-back',plane);
    var fromX=sourceRect.left-stageRect.left,fromY=sourceRect.top-stageRect.top;
    plane.style.transformOrigin='0 0';
    phase('lift');await M.animate(plane,[{transform:'translate('+fromX+'px,'+fromY+'px) scale('+(sourceRect.width/cardW)+','+(sourceRect.height/cardH)+')',opacity:.7},{transform:'translate('+x+'px,'+y+'px) scale(1,1)',opacity:1}],{duration:440,signal:signal});if(signal.aborted)return;
    phase('flip');await M.animate(rotor,[{transform:'rotateX(0deg)'},{transform:'rotateX(-180deg)'}],{duration:640,ease:'power3.inOut',easing:'cubic-bezier(.65,0,.35,1)',signal:signal});if(signal.aborted)return;
    var chips=V.techCards(project).slice(0,wide?4:3),elements=[];
    var captionEl=document.createElement('div');captionEl.className='flight-label';captionEl.textContent=project.stack.length?'The stack. The details. The full story.':'The features. The details. The full story.';stage.appendChild(captionEl);
    phase('tech');var fan=chips.map(function(item,i){
      var el=document.createElement('div');el.className='flight-tech';el.innerHTML=V.symbol(item.name)+'<div><strong>'+V.escape(item.name)+'</strong><small>'+V.escape(item.label)+'</small></div>';stage.appendChild(el);elements.push(el);
      var chipW=wide?190:Math.min(140,(w-44-(chips.length-1)*8)/chips.length);el.style.width=chipW+'px';
      var destX,destY,angle;
      if(wide){var left=i%2===0,row=Math.floor(i/2);destX=left?x-214:x+cardW+24;destY=y+38+row*148;angle=left?-8:8;}else{destX=(w-(chips.length*chipW+(chips.length-1)*8))/2+i*(chipW+8);destY=y+cardH+22;angle=(i-(chips.length-1)/2)*4;}
      el.dataset.destX=destX;el.dataset.destY=destY;
      return M.animate(el,[{opacity:0,transform:'translate('+(x+cardW/2-chipW/2)+'px,'+(y+cardH*.55)+'px) scale(.72)'},{opacity:1,transform:'translate('+destX+'px,'+destY+'px) rotate('+angle+'deg) scale(1)'}],{duration:440,delay:i*40,ease:'back.out(1.25)',signal:signal});
    });await Promise.all(fan);if(signal.aborted)return;
    await M.wait(180,signal);if(signal.aborted)return;
    phase('handoff');content.style.opacity='1';var target=$('.detail-cover',content).getBoundingClientRect(),tx=target.left-stageRect.left,ty=target.top-stageRect.top;
    var imageLayer=document.createElement('div');imageLayer.className='flight-handoff';Object.assign(imageLayer.style,{position:'absolute',inset:'0',padding:innerWidth<768?'10px':'24px',background:'radial-gradient(ellipse at 50% 20%,#273049,#0c101c)',opacity:'0'});imageLayer.innerHTML=V.cover(project,'');var image=imageLayer.querySelector('img');if(image)Object.assign(image.style,{width:'100%',height:'100%',objectFit:'contain',borderRadius:'7px'});back.appendChild(imageLayer);
    var reveal=M.animate(content,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0px)'}],{duration:600,delay:60,signal:signal});
    var handoff=M.animate(plane,[{transform:'translate('+x+'px,'+y+'px) scale(1,1)',width:cardW+'px',height:cardH+'px'},{transform:'translate('+tx+'px,'+ty+'px) scale(1,1)',width:target.width+'px',height:target.height+'px'}],{duration:680,ease:'power3.inOut',signal:signal});
    M.animate(imageLayer,[{opacity:0},{opacity:1}],{duration:240,signal:signal});M.animate(wash,[{opacity:1},{opacity:0}],{duration:500,signal:signal});M.animate(captionEl,[{opacity:1},{opacity:0}],{duration:180,signal:signal});
    elements.forEach(function(el,i){M.animate(el,[{opacity:1},{opacity:0,transform:'translate('+(tx+target.width/2-75)+'px,'+(ty+target.height/2-40)+'px) scale(.65)'}],{duration:370,delay:i*25,signal:signal});});
    await Promise.all([handoff,reveal]);if(signal.aborted)return;await M.animate(plane,[{opacity:1},{opacity:0}],{duration:140,signal:signal});if(!signal.aborted)finalOpen();
  }
  async function openProject(id,source,push){
    var project=projects.find(function(p){return p.id===id;});if(!project||!dialog||state!=='idle')return;
    state='opening';currentProject=project;opener=source||document.activeElement;controller=new AbortController();var signal=controller.signal;
    var rect=source?($('.project-visual',source.closest('.project-card'))||source).getBoundingClientRect():null;
    baseHash=location.hash.indexOf('#project/')===0?'#projects':(location.hash||'#projects');ownsHistory=push!==false;
    if(ownsHistory)history.pushState(Object.assign({},history.state,{portfolioProject:id}),'','#project/'+encodeURIComponent(id));
    closeMenu();content.innerHTML=V.render(project,{modal:true});content.style.opacity='0';scroller.scrollTop=0;$('#dialog-project-index').textContent=project.number+' / 17 — '+project.name;
    lock();dialog.style.opacity='1';dialog.showModal();$('#dialog-close').focus({preventScroll:true});phase('opening');
    try{await cinematic(project,rect,signal);}catch(error){if(!signal.aborted){console.warn('Using direct project view after transition interruption.',error);finalOpen();}}
  }
  async function closeProject(fromHistory){
    if(state==='idle')return;if(state==='closing')return closingPromise;
    state='closing';phase('closing');if(controller)controller.abort();
    if(!fromHistory){if(ownsHistory&&history.state&&history.state.portfolioProject){ownsHistory=false;history.back();}else{history.replaceState(history.state,'',baseHash||'#projects');}}
    closingPromise=(async function(){await M.animate(dialog,[{opacity:1},{opacity:0}],{duration:180});dialog.close();stage.replaceChildren();stage.style.display='';stage.style.background='';content.replaceChildren();content.style.opacity='';content.style.transform='';dialog.style.opacity='1';unlock();state='idle';currentProject=null;phase('idle');if(opener&&opener.isConnected&&opener.focus)opener.focus({preventScroll:true});opener=null;})();
    return closingPromise;
  }
  document.addEventListener('click',function(e){var link=e.target.closest('[data-open-project]');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openProject(link.dataset.openProject,link,true);});
  if(dialog){$('#dialog-close').addEventListener('click',function(){closeProject(false);});$('#dialog-back').addEventListener('click',function(e){e.preventDefault();closeProject(false);});dialog.addEventListener('cancel',function(e){e.preventDefault();closeProject(false);});dialog.addEventListener('keydown',function(e){if(e.key==='Escape'&&state!=='idle'){e.preventDefault();closeProject(false);}});}
  function syncHistory(){var match=location.hash.match(/^#project\/([^/]+)$/);if(match){var id;try{id=decodeURIComponent(match[1]);}catch(e){return;}if(state==='idle')openProject(id,null,false);else if(currentProject&&currentProject.id!==id)closeProject(true).then(function(){openProject(id,null,false);});}else if(state!=='idle'&&state!=='closing')closeProject(true);}
  window.addEventListener('popstate',syncHistory);window.addEventListener('hashchange',syncHistory);
  window.addEventListener('resize',function(){if(innerWidth>=768)closeMenu();if(state==='opening'){controller.abort();finalOpen();}scrollUpdate();},{passive:true});
  window.addEventListener('portfolio:motionchange',function(){if(state==='opening'){controller.abort();finalOpen();}if(processController){processController.abort();processCard.style.opacity='1';processCard.style.transform='none';}});
  window.PortfolioApp={getState:function(){return state;},openProject:openProject,closeProject:closeProject};
  syncHistory();
  // Active section indication without a forced scrolling library.
  if(nav&&'IntersectionObserver'in window){var sections=$$('main>section[id]');var sectionObserver=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){$$('a',nav).forEach(function(a){if(a.hash==='#'+en.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'-20% 0px -65% 0px',threshold:0});sections.forEach(function(s){sectionObserver.observe(s);});}
})();
