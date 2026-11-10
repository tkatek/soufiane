/* Construction Studio V4 — actual DOM construction, not cursors over finished cards.
 * The semantic content exists at all times. Decorative typing is aria-hidden.
 * GSAP drives one labelled clock per scene; native rAF follows identical keyframes.
 * No framework, network requests or synthetic GitHub contribution data.
 */
(function () {
 'use strict';
 var C=window.StudioCraft;if(!C)return;
 if(window.PortfolioCursorScenes&&window.PortfolioCursorScenes.destroy)window.PortfolioCursorScenes.destroy();
 var $=function(s,r){return (r||document).querySelector(s);};
 var $$=function(s,r){return Array.from((r||document).querySelectorAll(s));};
 var scenes=[],byRoot=new WeakMap(),destroyed=false,observer=null,raf=0;
 var reduced=C.reduced,mobile=matchMedia('(max-width:767px)');
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function p(t,a,b){return clamp((t-a)/Math.max(.001,b-a),0,1);}
 function smooth(t,a,b){var q=p(t,a,b);return q*q*(3-2*q);}
 function lerp(a,b,q){return a+(b-a)*q;}
 function round(x){return Math.round(x*1000)/1000;}
 function emit(root,active){document.dispatchEvent(new CustomEvent('portfolio:construction',{detail:{root:root,active:active}}));}
 var colours=['#b8a7f4','#86d6e3','#d2b4f0'];
 function Scene(root,kind,index){
  this.root=root;this.kind=kind;this.index=index||0;this.state='ready';this.time=0;this.duration=kind==='heading'?2.9:kind==='note'?3.5:kind==='project'?4.1:4.8;
  this.saves=new Map();this.classes=[];this.tasks=[];this.types=[];this.surfaces=[];this.graph=null;this.clock=null;this.native=0;this.last=0;this.mutator=null;
  root.classList.add('bc-root');root.dataset.buildState='ready';root.dataset.buildKind=kind;byRoot.set(root,this);root.craftScene=this;
  this.interrupt=this.finish.bind(this,'interaction');root.addEventListener('pointerdown',this.interrupt,true);root.addEventListener('focusin',this.interrupt,true);root.addEventListener('keydown',this.interrupt,true);
 }
 Scene.prototype.save=function(el,key){if(!el)return;var map=this.saves.get(el);if(!map){map={};this.saves.set(el,map);}if(!(key in map))map[key]=[el.style.getPropertyValue(key),el.style.getPropertyPriority(key)];};
 Scene.prototype.style=function(el,key,value){if(!el)return;this.save(el,key);el.style.setProperty(key,String(value));};
 Scene.prototype.addClass=function(el,name){if(el&&!el.classList.contains(name)){el.classList.add(name);this.classes.push([el,name]);}};
 Scene.prototype.reveal=function(el,a,b,kind){if(!el)return;this.tasks.push({el:el,a:a,b:b,kind:kind||'rise',last:-1});this.addClass(el,'bc-unit');};
 Scene.prototype.type=function(el,a,b){
  if(!el||el.querySelector('a,button,input,textarea')||!el.textContent.trim())return;
  var original=Array.from(el.childNodes),semantic=document.createElement('span'),visual=document.createElement('span');semantic.className='bc-semantic';visual.className='bc-type-visual';visual.setAttribute('aria-hidden','true');
  original.forEach(function(node){visual.appendChild(node.cloneNode(true));semantic.appendChild(node);});
  $$('.bc-type-visual',visual).forEach(function(n){n.remove();});
  $$('[id]',visual).forEach(function(n){n.removeAttribute('id');});
  var walker=document.createTreeWalker(visual,NodeFilter.SHOW_TEXT),nodes=[],chars=[],node;
  while((node=walker.nextNode()))nodes.push(node);
  var segmenter=window.Intl&&Intl.Segmenter?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
  nodes.forEach(function(text){var frag=document.createDocumentFragment();var glyphs=segmenter?Array.from(segmenter.segment(text.nodeValue),function(x){return x.segment;}):Array.from(text.nodeValue);glyphs.forEach(function(g){var span=document.createElement('span');span.className='bc-char';span.textContent=g;frag.appendChild(span);chars.push(span);});text.replaceWith(frag);});
  el.append(semantic,visual);this.addClass(el,'bc-typing');
  var item={el:el,semantic:semantic,visual:visual,original:original,chars:chars,a:a,b:b,count:-1,caret:null};this.types.push(item);return item;
 };
 Scene.prototype.surface=function(el,green){if(!el)return;this.surfaces.push(el);this.addClass(el,'bc-surface');if(green)this.addClass(el,'bc-green');this.style(el,'--bc-paint','0');this.style(el,'--bc-border','0');};
 Scene.prototype.plan=function(){
  var s=this,r=s.root,k=s.kind;
  function one(q){return $(q,r);}function many(q){return $$(q,r);}
  function write(q,a,b){return s.type(one(q),a,b);}
  function show(q,a,b,kind){s.reveal(one(q),a,b,kind);}
  function batch(q,a,span,kind){var nodes=many(q);nodes.forEach(function(el,i){var d=span*i/Math.max(1,nodes.length-1);s.reveal(el,a+d,a+d+.46,kind||'chip');});}
  s.frameTarget=r;
  if(k==='heading'){
   write('h2',.25,1.65);show('.eyebrow',.12,.55,'wipe');show(':scope > p',1,1.7);s.frameTarget=one('h2')||r;s.compact=true;
  }else if(k==='project'){
   s.surface(r);write('.project-name-row h3',.8,1.8);show('.project-visual',.95,2,'image');show('.project-number',.75,1);show('.project-category',1.25,1.7);show('.project-summary',1.75,2.4,'wipe');show('.project-category-label',.9,1.25);show('.project-kicker',.8,1.3);show('.round-arrow',2.9,3.35,'chip');batch('.tech-tags > *',2.5,.35);show('.project-links',3,3.55);show('.project-live',3,3.55);show('.project-meta',3,3.5);show('.project-copy > .eyebrow',.9,1.3);
   // Cover all noninteractive labels without hiding the real card anchor.
   many('.project-copy > *').forEach(function(el){if(el.matches('.project-name-row,.tech-tags,p,.eyebrow'))return;if(!s.tasks.some(function(x){return x.el===el;}))s.reveal(el,2.5,3);});
   s.resizeTarget=one('.project-visual');
  }else if(k==='about'){
   var rows=many('.story-row');rows.forEach(function(row,i){s.type($('h3',row),.4+i*.42,1.6+i*.42);s.reveal($('p',row),1.2+i*.4,2+i*.4,'wipe');s.reveal($(':scope > span',row),.2+i*.25,.7+i*.25,'chip');});
   write('blockquote',2.5,3.65);s.frameTarget=one('blockquote')||r;
  }else if(k==='experience'){
   s.surface(r);write('h3',.5,1.6);show('.panel-heading > svg',1.2,1.65,'chip');batch('.timeline-item',1.1,1.35,'timeline');batch('.timeline-block > .eyebrow',.9,.5,'wipe');s.resizeTarget=r;
  }else if(k==='toolkit'){
   s.surface(r);write('h3',.5,1.55);write(':scope > p',1.2,2.2);show('.toolkit-top',.75,1.25,'wipe');batch('.skill-chip',2.05,1.0,'chip');s.resizeTarget=one('.skill-grid');
  }else if(k==='note'){
   write('h3',.45,1.65);show('.eyebrow',.3,.85,'wipe');show('.note-number',.25,.7,'chip');show('.note-plus',2.2,2.7,'chip');s.frameTarget=one('summary')||r;s.compact=true;
  }else if(k==='process'){
   s.surface(r);write('.process-intro h3',.45,1.8);show('.process-intro .eyebrow',.3,.8,'wipe');show('.process-intro > p:not(.eyebrow)',1.2,2.1,'wipe');batch('.process-tabs button',1.5,.8,'chip');
   // Only the deck container is presented. process-deck.js retains every card transform.
   show('.cd-deck',1.25,2.65,'image');show('.cd-orbits',2.5,3.4,'wipe');show('.cd-hint',3.3,3.8);show('.cd-counter',3.3,3.8);s.resizeTarget=one('.cd-deck');
  }else if(k==='contact-copy'){
   write('h2',.35,2.2);write(':scope > p:not(.contact-location)',1.45,3.05);write('.contact-email > span',2.45,3.7);show('.contact-email > svg',3.25,3.75,'chip');batch('.contact-links a',3.25,.4,'chip');show('.contact-location',3.6,4.1);s.frameTarget=one('h2')||r;
   s.style(one('.contact-email'),'border-color','transparent');
  }else if(k==='portrait'){
   var frame=one('.portrait-frame');s.surface(frame);s.frameTarget=frame||r;s.resizeTarget=frame;
   show('.portrait-frame img',.85,2.05,'image');show('.portrait-caption',2.6,3.25,'wipe');show('.portrait-stamp',3,3.8,'sticker');
  }else if(k==='github'){
   s.surface(r,true);write('.github-heading h3',.45,1.55);show('.github-heading .eyebrow',.3,.75,'wipe');show('.github-heading a',3.2,3.8);show('.github-summary',3.25,3.9,'wipe');show('.github-bottom',3.5,4.15,'wipe');show('#github-tooltip',3.5,4.15,'wipe');
   s.bindGraph();var chart=one('#github-calendar');if(chart){s.mutator=new MutationObserver(function(){if(s.state==='complete')return;try{s.bindGraph();s.render(s.time);}catch(error){s.fail(error);}});s.mutator.observe(chart,{childList:true});}
  }
 };
 Scene.prototype.bindGraph=function(){
  var chart=$('#github-calendar',this.root);if(!chart)return;
  this.addClass(chart,'bc-calendar-building');
  var gr=chart.getBoundingClientRect(),rb=this.root.getBoundingClientRect();this.graphBox={x:gr.left-rb.left,y:gr.top-rb.top+26,w:gr.width,h:Math.max(30,gr.height-26)};var s=this,weeks=$$('.calendar-week',chart),levels=['#192624','#14472c','#21723b','#38a154','#72d47c'];
  this.graph={chart:chart,weeks:weeks,cells:[],labels:$$('.calendar-months span,.calendar-days-labels span',chart)};
  weeks.forEach(function(week,wi){$$('.calendar-day',week).forEach(function(cell,di){s.graph.cells.push({el:cell,w:wi,d:di,bg:levels[Number(cell.dataset.level)]||levels[0],last:-1,ink:-1});});});
 };
 Scene.prototype.prepare=function(){
  if(this.state!=='ready')return;if(reduced.matches)return this.finish('reduced');
  try{
   this.plan();var r=this.root;suspendReveal(r);r.classList.add('bc-prepared');if(this.compact)r.classList.add('bc-compact');
   var layer=this.layer=document.createElement('div');layer.className='bc-layer';layer.setAttribute('aria-hidden','true');
   var green=this.kind==='github',roles=mobile.matches?['Build','Write']:(this.kind==='heading'||this.kind==='note'?['Build','Write']:['Build','Write','Style']);if(this.kind==='portrait')roles=mobile.matches?['Resize','Place']:['Resize','Place','Style'];if(this.kind==='github')roles=mobile.matches?['Grid','Write']:['Grid','Write','Color'];
   layer.innerHTML=roles.map(function(name,i){return C.cursor(name,colours[i]);}).join('')+'<div class="bc-outline"><i></i><i></i><i></i><i></i><span>FRAME / AUTO LAYOUT</span></div><span class="bc-dimension"></span><div class="bc-palette"><div class="bc-palette-title">'+(green?'Activity colors':'Style properties')+'<span>FILL / 04</span></div><div class="bc-swatches">'+(green?['#192624','#21723b','#38a154','#72d47c']:['#111524','#b5a4f5','#8bd1e3','#e2dbf4']).map(function(c){return '<i class="bc-swatch" style="--swatch:'+c+'"></i>';}).join('')+'</div><div class="bc-palette-meta"><span class="bc-palette-value">'+(green?'Neutral → activity':'Spacing · 08 px')+'</span><span class="bc-spacing"><i></i></span></div></div><i class="bc-caret"></i><span class="bc-stage-tag">01 / DRAW THE FRAME</span>';
   r.appendChild(layer);this.pointers=$$('.craft-cursor',layer);this.outline=$('.bc-outline',layer);this.dimension=$('.bc-dimension',layer);this.palette=$('.bc-palette',layer);this.caret=$('.bc-caret',layer);this.tag=$('.bc-stage-tag',layer);this.swatches=$$('.bc-swatch',layer);this.slider=$('.bc-spacing i',layer);this.pvalue=$('.bc-palette-value',layer);
   this.state='prepared';r.dataset.buildState='prepared';this.measure();this.tasks.forEach(function(task){if(task.kind==='chip'){var e=task.el.getBoundingClientRect(),g=task.el.parentElement.getBoundingClientRect();task.dx=(g.left+g.width/2-e.left-e.width/2)*.18;}});this.render(0);
  }catch(error){this.fail(error);}
 };
 function suspendReveal(root){
  // Old generic reveals would fade the complete scene at the same time. Construction owns this root.
  if(root.getAnimations)root.getAnimations().forEach(function(a){a.cancel();});
  if(window.gsap)window.gsap.killTweensOf(root);
  if(root.classList.contains('reveal')){root.style.opacity='1';root.style.transform='none';}
 }
 Scene.prototype.measure=function(){
  var b=this.root.getBoundingClientRect(),f=(this.frameTarget||this.root).getBoundingClientRect();this.bounds={w:b.width,h:b.height};
  this.frame={x:clamp(f.left-b.left,3,Math.max(3,b.width-30)),y:clamp(f.top-b.top,3,Math.max(3,b.height-30)),w:Math.max(20,Math.min(f.width,b.width-6)),h:Math.max(20,Math.min(f.height,b.height-6))};
  var pw=Math.min(mobile.matches?193:216,b.width-24),ph=113;
  this.panel={x:Math.max(12,b.width-pw-18),y:Math.max(12,b.height-ph-(this.kind==='heading'?5:28)),w:pw,h:ph};
  Object.assign(this.palette.style,{left:this.panel.x+'px',top:this.panel.y+'px'});
 };
 Scene.prototype.render=function(time){
  if(!this.layer)return;this.time=clamp(time,0,this.duration);var t=this.time*4.8/this.duration,s=this,b=this.bounds,fr=this.frame;
  var stage=t<.95?'frame':t<2.05?'write':t<2.95?'style':t<4.1?'arrange':'finish';this.root.dataset.buildPhase=stage;
  var draw=smooth(t,.08,1.15),exit=1-smooth(t,3.6,4.3),outlineW=lerp(Math.min(36,fr.w),fr.w,draw),outlineH=lerp(Math.min(28,fr.h),fr.h,draw);
  Object.assign(this.outline.style,{left:fr.x+'px',top:fr.y+'px',width:outlineW+'px',height:outlineH+'px',opacity:String(smooth(t,0,.17)*exit)});
  this.outline.querySelector('span').style.opacity=String((1-smooth(t,.7,1.4))*draw);
  Object.assign(this.dimension.style,{left:clamp(fr.x+outlineW-92,5,b.w-98)+'px',top:clamp(fr.y+outlineH-23,8,b.h-24)+'px',opacity:String(smooth(t,.25,.6)*exit)});this.dimension.textContent=Math.round(outlineW)+' × '+Math.round(outlineH);
  this.surfaces.forEach(function(el){s.style(el,'--bc-paint',smooth(t,2.48,3.1));s.style(el,'--bc-border',smooth(t,1.1,1.65)*.38);});
  this.types.forEach(function(item){var count=Math.floor(p(t,item.a,item.b)*item.chars.length);if(count!==item.count){var low=Math.max(0,Math.min(count,item.count)),high=Math.max(count,item.count);for(var i=low;i<high;i++)if(item.chars[i])item.chars[i].style.opacity=i<count?'1':'0';item.count=count;
    if(count>0){var g=item.chars[Math.min(count-1,item.chars.length-1)].getBoundingClientRect(),rb=s.root.getBoundingClientRect();item.caret={x:clamp(g.right-rb.left+2,3,b.w-4),y:clamp(g.top-rb.top+2,2,b.h-18),h:Math.max(14,Math.min(g.height-4,65))};}
   }s.style(item.el,'--bc-type-accent',t>=2.48?'#b6a7ff':'#bfc6db');});
  this.tasks.forEach(function(task){var q=smooth(t,task.a,task.b);if(q===task.last)return;task.last=q;var el=task.el;s.style(el,'opacity',q);
   if(task.kind==='wipe'||task.kind==='timeline'){s.style(el,'clip-path','inset(0 '+round((1-q)*(task.kind==='timeline'?0:100))+'% '+round((1-q)*(task.kind==='timeline'?100:0))+'% 0)');}
   else{s.style(el,'translate',round((task.kind==='sticker'?-24:task.kind==='chip'?(task.dx||-12):0)*(1-q))+'px '+round((task.kind==='image'?28:task.kind==='sticker'?-25:16)*(1-q))+'px');s.style(el,'scale',round(lerp(task.kind==='image'?.82:task.kind==='sticker'?.65:task.kind==='chip'?.86:.98,1,q)));if(task.kind==='image')s.style(el,'clip-path','inset(0 '+round((1-q)*65)+'% '+round((1-q)*32)+'% 0 round 12px)');}
  });
  if(this.kind==='contact-copy')this.style($('.contact-email',this.root),'border-color',t<3?'transparent':'#3d4057');
  if(this.graph){var g=this.graph,n=g.weeks.length;g.labels.forEach(function(el,i){var q=smooth(t,.8+i*.025,1.15+i*.025);s.style(el,'opacity',q);s.style(el,'translate','0 '+round((1-q)*6)+'px');});
   g.cells.forEach(function(cell){var d=(cell.w/Math.max(1,n-1))*.9+cell.d*.045,q=smooth(t,.95+d,1.45+d),ink=smooth(t,2.5+d*.55,2.85+d*.55);if(cell.last!==q){s.style(cell.el,'opacity',q);s.style(cell.el,'scale',lerp(.05,1,q));s.style(cell.el,'translate','0 '+round((1-q)*9)+'px');cell.last=q;}if(cell.ink!==ink){s.style(cell.el,'background-color',ink>=1?cell.bg:'color-mix(in srgb, '+cell.bg+' '+Math.round(ink*100)+'%, #252735)');s.style(cell.el,'border-color',ink<.5?'#645c784d':'#eaffee08');cell.ink=ink;}});
  }
  var panelAlpha=smooth(t,1.75,2.05)*(1-smooth(t,3.65,4.05));this.palette.style.opacity=panelAlpha;this.palette.style.transform='translateY('+round((1-panelAlpha)*10)+'px) scale('+round(.92+panelAlpha*.08)+')';
  this.swatches.forEach(function(el,i){el.classList.toggle('is-chosen',t>=2.48&&i===(s.kind==='github'?2:1));});this.slider.style.left=round(5+smooth(t,2.85,3.35)*40)+'px';this.pvalue.textContent=this.kind==='github'?(t<2.48?'Neutral → activity':'Actual activity levels'):(t<2.48?'Spacing · 08 px':t<2.95?'Fill · Lavender':'Spacing · 24 px');
  var writing=this.types.find(function(item){return t>=item.a&&t<item.b&&item.caret;});
  this.caret.style.opacity=writing?'1':'0';if(writing)Object.assign(this.caret.style,{left:writing.caret.x+'px',top:writing.caret.y+'px',height:writing.caret.h+'px'});
  var sx=this.panel.x+(this.kind==='github'?100:65),sy=this.panel.y+55;
  this.pointers.forEach(function(pointer,i){var points,pos,alpha=smooth(t,i*.12,i*.12+.28)*(1-smooth(t,4.0+i*.09,4.55+i*.08));
   if(i===0){if(t<1.2)pos={x:fr.x+outlineW,y:fr.y+outlineH};else if(s.pointers.length<3)pos=C.path(t,[[1.2,fr.x+fr.w,fr.y+fr.h],[1.8,sx-28,sy-16],[2.25,sx,sy],[2.55,sx,sy],[3.2,s.panel.x+155,s.panel.y+94],[3.8,s.panel.x+190,s.panel.y+94],[4.6,b.w-30,b.h-22]]);else pos=C.path(t,[[1.2,fr.x+fr.w,fr.y+fr.h],[2,fr.x+fr.w*.75,fr.y+fr.h*.65],[3.5,fr.x+fr.w-9,fr.y+fr.h-9],[4.6,b.w-25,b.h-20]]);}
   else if(i===1){pos=writing?{x:writing.caret.x+6,y:writing.caret.y+writing.caret.h+3}:C.path(t,[[0,14,30],[.4,fr.x+18,fr.y+35],[2.5,fr.x+fr.w*.35,fr.y+fr.h*.6],[3.5,fr.x+fr.w*.65,fr.y+fr.h*.85],[4.6,30,b.h-18]]);}
   else pos=C.path(t,[[0,b.w-25,15],[1.65,sx-35,sy-18],[2.25,sx,sy],[2.55,sx,sy],[3.2,s.panel.x+150,s.panel.y+94],[3.8,s.panel.x+190,s.panel.y+94],[4.6,b.w-26,28]]);
   if(s.kind==='github'&&i===0&&t>=1.15&&t<2.5&&s.graphBox){var gb=s.graphBox;pos={x:gb.x+gb.w*p(t,1.15,2.5),y:gb.y+gb.h*.52};}pos.x=clamp(pos.x,3,b.w-19);pos.y=clamp(pos.y,3,b.h-26);pointer.style.transform='translate('+round(pos.x)+'px,'+round(pos.y)+'px)';pointer.style.opacity=alpha;
   pointer.classList.toggle('cursor-label-left',pos.x>b.w-90);pointer.classList.toggle('cursor-label-above',pos.y>b.h-57);var click=(i===2||(s.pointers.length<3&&i===0))?p(t,2.43,2.78):p(t,.15,.45),pulse=pointer.querySelector('i');pulse.style.opacity=click>0&&click<1?1-click:0;pulse.style.transform='scale('+(1+click*2)+')';
  });
  this.tag.style.opacity=smooth(t,.05,.3)*(1-smooth(t,4.1,4.5));this.tag.textContent=stage==='frame'?'01 / DRAW THE FRAME':stage==='write'?'02 / WRITE THE CONTENT':stage==='style'?'03 / CHOOSE THE STYLE':stage==='arrange'?'04 / FIT. SPACE. REFINE.':'BUILT / READY TO EXPLORE';
 };
 Scene.prototype.start=function(){
  if(this.state==='ready')this.prepare();if(this.state!=='prepared'||reduced.matches)return;
  this.state='playing';this.root.dataset.buildState='playing';this.root.classList.remove('bc-prepared');this.root.classList.add('bc-active');emit(this.root,true);
  var s=this;
  if(window.gsap&&typeof gsap.timeline==='function'){
   this.engine='gsap';var driver={t:0};this.clock=gsap.timeline({onComplete:function(){s.finish('completed');}});['frame','write','style','arrange','finish'].forEach(function(label,i){s.clock.addLabel(label,[0,.55,2.05,2.95,4.1][i]*s.duration/4.8);});this.clock.to(driver,{t:this.duration,duration:this.duration,ease:'none',onUpdate:function(){try{s.render(driver.t);}catch(e){s.fail(e);}}},0);
  }else{this.engine='native';this.last=0;this.tick();}
  this.root.dataset.buildEngine=this.engine;
 };
 Scene.prototype.tick=function(now){
  if(this.state!=='playing'||document.hidden)return;var s=this;if(now){var dt=this.last?Math.min(.08,(now-this.last)/1000):0;this.last=now;try{this.render(this.time+dt);}catch(error){return this.fail(error);}if(this.time>=this.duration)return this.finish('completed');}
  this.native=requestAnimationFrame(function(t){s.tick(t);});
 };
 Scene.prototype.stop=function(){if(this.clock){this.clock.kill();this.clock=null;}if(this.native)cancelAnimationFrame(this.native);this.native=0;this.last=0;};
 Scene.prototype.cleanup=function(){
  this.stop();if(this.mutator){this.mutator.disconnect();this.mutator=null;}
  this.types.forEach(function(item){item.visual.remove();item.original.forEach(function(node){item.el.insertBefore(node,item.semantic);});item.semantic.remove();});this.types=[];
  this.saves.forEach(function(map,el){Object.keys(map).forEach(function(key){var prior=map[key];if(prior[0])el.style.setProperty(key,prior[0],prior[1]);else el.style.removeProperty(key);});});this.saves.clear();
  this.classes.forEach(function(pair){pair[0].classList.remove(pair[1]);});this.classes=[];this.tasks=[];this.surfaces=[];this.graph=null;if(this.layer)this.layer.remove();this.layer=null;this.root.classList.remove('bc-active','bc-prepared','bc-compact');
 };
 Scene.prototype.finish=function(reason){
  if(this.state==='complete')return;this.cleanup();this.state='complete';this.root.dataset.buildState='complete';this.root.dataset.buildPhase='complete';this.root.dataset.buildFinish=typeof reason==='string'?reason:'interaction';emit(this.root,false);
 };
 Scene.prototype.fail=function(error){console.warn('Construction scene settled safely:',this.kind,error);this.finish('fallback');};
 Scene.prototype.seek=function(time){if(this.state==='complete'){this.state='ready';this.time=0;}if(this.state==='ready')this.prepare();if(!this.layer)return;this.stop();this.state='paused';this.root.dataset.buildState='paused';this.root.classList.add('bc-active');this.render(time);};
 Scene.prototype.getState=function(){return{kind:this.kind,state:this.state,time:round(this.time),duration:this.duration,engine:this.engine||'none',phase:this.root.dataset.buildPhase};};
 Scene.prototype.destroy=function(){this.cleanup();this.root.classList.remove('bc-root');this.root.removeEventListener('pointerdown',this.interrupt,true);this.root.removeEventListener('focusin',this.interrupt,true);this.root.removeEventListener('keydown',this.interrupt,true);delete this.root.craftScene;delete this.root.dataset.buildState;delete this.root.dataset.buildKind;};
 function register(selector,kind){$$(selector).forEach(function(root,i){if(byRoot.has(root))return;var scene=new Scene(root,kind,i);scenes.push(scene);});}
 // Split tall sections into components so phone visitors see each one being constructed.
 register('main .section-heading','heading');register('#project-grid .project-card','project');register('.about-story','about');register('.experience-card','experience');register('#process-lab','process');register('.toolkit-card','toolkit');register('.note-row','note');register('#github-activity','github');register('.contact-copy','contact-copy');register('.contact-portrait','portrait');
 function visible(root){return !root.hidden&&!!root.getClientRects().length;}
 function scan(){raf=0;if(destroyed)return;scenes.forEach(function(scene){if(scene.state==='complete'||scene.state==='paused')return;var r=scene.root;if(!visible(r)){if(scene.state==='playing'||scene.state==='prepared')scene.finish('hidden');return;}var b=r.getBoundingClientRect();if(b.bottom<85){scene.finish('passed');return;}if(scene.state==='ready'&&b.top<innerHeight+220)scene.prepare();if(scene.state==='prepared'&&b.top<innerHeight-65&&b.bottom>110)scene.start();if(scene.state==='playing'&&(b.bottom<70||b.top>innerHeight+70))scene.finish('left-viewport');});}
 function schedule(){if(!raf)raf=requestAnimationFrame(scan);}
 if('IntersectionObserver'in window){observer=new IntersectionObserver(schedule,{rootMargin:'220px 0px',threshold:0});scenes.forEach(function(s){observer.observe(s.root);});}
 window.addEventListener('scroll',schedule,{passive:true});
 function resize(){scenes.forEach(function(s){if(s.state==='playing'||s.state==='prepared')s.finish('resize');});schedule();}
 window.addEventListener('resize',resize,{passive:true});
 function preference(){if(reduced.matches)scenes.forEach(function(s){s.finish('reduced');});}
 reduced.addEventListener('change',preference);
 function visibilityChange(){scenes.forEach(function(s){if(s.state!=='playing')return;if(document.hidden){if(s.clock)s.clock.pause();if(s.native)cancelAnimationFrame(s.native);s.native=0;s.last=0;}else{if(s.clock)s.clock.resume();else s.tick();}});}
 document.addEventListener('visibilitychange',visibilityChange);
 function filters(e){if(e.target.closest('[data-filter],#show-all-projects,.cs-outro-link')){$$('.project-card').forEach(function(el){var s=byRoot.get(el);if(s&&s.state!=='complete')s.finish('collection-interaction');});}}
 document.addEventListener('click',filters,true);
 function selection(){var sel=window.getSelection();if(sel&&!sel.isCollapsed){scenes.forEach(function(s){if(s.state!=='complete'&&sel.anchorNode&&s.root.contains(sel.anchorNode))s.finish('selection');});}}
 document.addEventListener('selectionchange',selection);
 function projectPhase(e){if(e.detail&&e.detail.phase==='opening')scenes.forEach(function(s){if(s.state==='playing')s.finish('project-open');});}
 window.addEventListener('portfolio:projectphase',projectPhase);
 function resolve(selector){return typeof selector==='string'?byRoot.get($(selector)):byRoot.get(selector);}
 window.PortfolioConstruction={version:'4.0.0',scenes:scenes,inspect:function(){return scenes.map(function(s){return s.getState();});},finishAll:function(){scenes.forEach(function(s){s.finish('manual');});},seek:function(selector,time){var s=resolve(selector);if(s)s.seek(time);return s&&s.getState();},replay:function(selector){var s=resolve(selector);if(!s)return;s.cleanup();s.state='ready';s.time=0;s.prepare();s.start();return s.getState();},destroy:function(){destroyed=true;if(observer)observer.disconnect();if(raf)cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);reduced.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibilityChange);document.removeEventListener('click',filters,true);document.removeEventListener('selectionchange',selection);window.removeEventListener('portfolio:projectphase',projectPhase);scenes.forEach(function(s){s.destroy();});}};
 window.PortfolioCursorScenes=window.PortfolioConstruction;
 preference();schedule();
})();
