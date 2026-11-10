/* Studio Chapters — two real project stories, followed by an invitation.
 * Intro: 4.8 seconds per project. Replay/individual chapter: 12 seconds each.
 * Equal timing; separate 0.75s folder changes. No forced scrolling or AI calls. */
(function () {
  'use strict';
  var root=document.querySelector('[data-cursor-studio]'),C=window.StudioCraft;
  if(!root||!C)return;
  if(root.cursorStudio&&root.cursorStudio.destroy)root.cursorStudio.destroy();
  var original=root.innerHTML,originalClass=root.className;
  var esc=C.escape,sm=C.smooth,mix=C.mix,r=C.round,pr=C.progress,clamp=C.clamp;
  var projects=window.PORTFOLIO_PROJECTS||[],data={};projects.forEach(function(p){data[p.id]=p;});
  var stories=[
    {id:'powergym',name:'Gym Manager',fullName:'Gym Manager / PowerGym',type:'BUSINESS PLATFORM',brief:'Run your gym.\nIn one place.',benefit:'Members, plans, payments and analytics — one connected workspace.',note:'Mobile layout study; the animated trend is illustrative.',cover:'One workspace.\nA clearer overview.',tech:['Laravel','PHP','MySQL'],features:['Members & plans','Payments & expenses','Coaches & schedules'],color:'#b5a8f5'},
    {id:'invoiceflow',name:'InvoiceFlow',fullName:'InvoiceFlow',type:'FLUTTER MOBILE APP',brief:'Less admin.\nMore clarity.',benefit:'Invoices, clients, products and expenses — designed around a mobile workflow.',note:'Flutter mobile app · real interface screens.',cover:'Less paperwork.\nMore possibility.',tech:['Flutter'],features:['Invoices & clients','Products & point of sale','Expenses'],color:'#c9a9e9'}
  ];
  var arrow='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  var folderIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V5a2 2 0 0 1 2-2h5l3 4h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2V7Z"/></svg>';
  function skin(cover){return '<svg class="'+(cover?'cs-cover-skin':'cs-folder-skin')+'" viewBox="0 0 656 430" preserveAspectRatio="none"><defs><linearGradient id="cs-skin-'+(cover?'cover':'open')+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+(cover?'#3e3159':'#29263b')+'"/><stop offset="1" stop-color="#15141f"/></linearGradient></defs><path d="M27 1H310Q332 1 332 24V25Q332 48 355 48H629Q655 48 655 75V403Q655 429 629 429H27Q1 429 1 403V27Q1 1 27 1Z" fill="url(#cs-skin-'+(cover?'cover':'open')+')" stroke="#645779"/></svg>';}
  var cursorNames=['Build','Write','Style','Layout','Polish'],colors=['#bba7f3','#e0c1ea','#d4a4ed','#8bd5e4','#c7c5f0'];
  root.classList.add('is-chapter-studio');
  root.innerHTML='<div class="cs-heading"><span><i aria-hidden="true"></i>From a brief to a working product.</span><small>THE MAKING OF</small></div>'+
    '<div class="cs-chapters" role="group" aria-label="Project stories"><button class="cs-tab" type="button" data-cs-tab="0" aria-pressed="true"><b>01</b> Gym Manager</button><button class="cs-tab" type="button" data-cs-tab="1" aria-pressed="false"><b>02</b> InvoiceFlow</button><button class="cs-tab" type="button" data-cs-tab="2" aria-pressed="false"><b>03</b> More work</button></div>'+
    '<p class="sr-only">An illustrated build sequence. Cursors open, style and arrange two project folders. This is a choreographed presentation, not a live AI session. Use the chapter buttons to revisit either project.</p>'+
    '<div class="cs-viewport"><div class="cs-stage"><div class="cs-art" aria-hidden="true"><div class="cs-ambient"></div><div class="cs-sheet"></div><div class="cs-sheet"></div><div class="cs-folder hc-folder"></div><div class="cs-palette"><i></i><i></i><i></i></div><div class="cs-benefit-chips"></div>'+cursorNames.map(function(n,i){return C.cursor(n,colors[i]);}).join('')+'</div>'+
    '<div class="cs-outro" hidden><small>03 / THE REST OF THE COLLECTION</small><h2>Two stories.<br>More to explore.</h2><p>Web platforms, mobile interfaces and playful experiences. Open the collection.</p><a href="#projects" class="cs-outro-link" data-cs-explore>Explore all projects <span>↗</span></a><div class="cs-mini-folders" aria-hidden="true"><span>&lt;/&gt;</span><span>✳</span><span>↗</span></div></div></div></div>'+
    '<div class="cs-summary"><div><strong data-cs-name></strong><p data-cs-benefit></p></div><a class="cs-action" href="project/index.html?project=powergym" data-open-project="powergym">View project '+arrow+'</a></div>'+
    '<div class="cs-footer"><span data-cs-status></span><button type="button" class="cs-control" data-cs-control aria-label="Pause the project story"><span data-cs-control-icon>Ⅱ</span><span data-cs-control-text>Pause story</span></button></div>';
  var $=function(s){return root.querySelector(s);},$$=function(s){return Array.from(root.querySelectorAll(s));};
  var viewport=$('.cs-viewport'),stage=$('.cs-stage'),art=$('.cs-art'),folder=$('.cs-folder'),outro=$('.cs-outro'),palette=$('.cs-palette'),chips=$('.cs-benefit-chips'),status=$('[data-cs-status]'),control=$('[data-cs-control]'),action=$('.cs-action'),tabs=$$('[data-cs-tab]'),cursors=$$('.craft-cursor');
  var selected=-1,mode='all',chapterSeconds=4.8,gap=.75,finished=false,manualPause=false,focusHold=false,hoverHold=false,dead=false;
  var els={},lastText='',lastStatus='',cache=new WeakMap(),resizeObserver=null;
  var total=function(){return mode==='all'?chapterSeconds*2+gap*2:chapterSeconds;};
  function put(el,key,value){if(!el)return;value=String(value);var o=cache.get(el);if(!o){o={};cache.set(el,o);}if(o[key]!==value){o[key]=value;el.style[key]=value;}}
  function alpha(el,n){put(el,'opacity',r(n));}
  function visibleWindow(t,a,b,c,d){return sm(t,a,b)*(1-sm(t,c,d));}
  function message(text){if(lastStatus!==text){status.textContent=text;lastStatus=text;}}
  function setControl(){var paused=manualPause||focusHold||hoverHold;control.querySelector('[data-cs-control-icon]').textContent=finished?'↻':paused?'▶':'Ⅱ';control.querySelector('[data-cs-control-text]').textContent=finished?'Replay stories':paused?'Resume story':'Pause story';control.setAttribute('aria-label',finished?'Replay both project stories':paused?'Resume the project story':'Pause the project story');control.hidden=C.reduced.matches;}
  function gymTiles(){
    var src=data.powergym&&data.powergym.images&&data.powergym.images[0]?data.powergym.images[0].src:'project/assets/powergym-analytics.png';
    return '<div class="cs-chart cs-tile"><div class="cs-chart-head"><span>See the business clearly.</span><small>ILLUSTRATIVE TREND</small></div><svg viewBox="0 0 250 60" fill="none"><path d="M2 50H248M2 27H248" stroke="#493b691e"/><path class="cs-chart-line cs-chart-secondary" pathLength="1" d="M3 42C35 52 41 21 71 39S108 46 132 35 169 42 191 26 220 32 247 18" stroke="#7a659d" stroke-width="2"/><path class="cs-chart-line" pathLength="1" d="M3 48C27 52 38 20 62 28S91 44 117 21 156 38 180 14 221 21 247 4" stroke="#38224e" stroke-width="3"/></svg><div class="cs-chart-tags"><span>Revenue</span><span>Expenses</span><span>Profit trends</span></div></div>'+
      '<div class="cs-preview cs-tile"><div class="cs-preview-top"><span>ANALYTICS / OVERVIEW</span><span>REAL PROJECT ↗</span></div><div class="cs-dashboard"><img src="'+esc(src)+'" width="1093" height="768" alt="" decoding="async"></div><div class="cs-stack"><b>La</b> Laravel <span>·</span> PHP <span>·</span> MySQL</div></div>'+
      '<div class="cs-mobile cs-tile"><span class="cs-eyebrow">MOBILE LAYOUT STUDY</span><strong>Your gym.<br>At a glance.</strong><div class="cs-phone"><div class="cs-phone-ui"><strong>PowerGym <span>↗</span></strong><small>Your daily overview</small><div class="cs-mobile-pills"><span>Members</span><span>Plans</span></div><svg viewBox="0 0 100 35" fill="none"><path d="M1 28 17 24 32 28 45 16 61 20 75 9 99 3" stroke="#7a64ac" stroke-width="2"/></svg><div class="cs-phone-row"><span>Memberships</span><i></i></div><div class="cs-phone-row"><span>Payments</span><i></i></div><div class="cs-phone-row"><span>Schedules</span><i></i></div></div></div><span class="cs-mobile-note">Responsive concept / not a native-app claim</span></div>';
  }
  function invoiceTiles(){return '<div class="cs-chart cs-tile"><div class="cs-chart-head"><span>A clearer mobile interface.</span><small>UI DESIGN STUDY</small></div><div class="cs-design-controls"><span>Hierarchy</span><span>Spacing</span><span>Contrast</span></div><div class="cs-style-line"><i></i><b></b></div></div>'+
    '<div class="cs-preview cs-tile cs-invoice-preview"><div class="cs-preview-top"><span>ACTUAL MOBILE SCREENS</span><span>FLUTTER ↗</span></div><div class="cs-invoice-phones"><div class="cs-invoice-phone"><img src="assets/images/studio/invoice-products.webp" width="210" height="382" alt="" decoding="async"></div><div class="cs-invoice-phone"><img src="assets/images/studio/invoice-dashboard.webp" width="206" height="381" alt="" decoding="async"></div><div class="cs-invoice-phone"><img src="assets/images/studio/invoice-invoices.webp" width="211" height="384" alt="" decoding="async"></div></div><span class="cs-annotation">Invoices + clients + products</span></div>'+
    '<div class="cs-mobile cs-tile cs-invoice-mobile"><span class="cs-eyebrow">CONNECTED WORKFLOWS</span><strong>See every<br>expense.</strong><div class="cs-phone"><img src="assets/images/studio/invoice-expenses.webp" width="221" height="396" alt="" decoding="async"></div></div>';}
  function mount(index){
    if(selected===index)return;selected=index;var s=stories[index];art.hidden=false;outro.hidden=true;alpha(art,1);alpha(folder,1);root.dataset.chapter=s.id;
    folder.innerHTML=skin(false)+'<div class="cs-folder-title">'+folderIcon+'<span>'+esc(s.name)+'</span><small>0'+(index+1)+'</small></div><div class="cs-project-top">'+s.type+'</div>'+
      '<div class="cs-brief cs-tile"><span class="cs-eyebrow">THE BRIEF</span><p class="cs-typed">'+esc(s.brief)+'</p></div>'+(index===0?gymTiles():invoiceTiles())+
      '<div class="cs-selection"><i></i><i></i><i></i><i></i><small>resize ↔</small></div><div class="cs-cover">'+skin(true)+'<div class="cs-cover-content"><small>0'+(index+1)+' / SELECTED PROJECT</small><strong>'+esc(s.name)+'</strong><p>'+esc(s.cover).replace('\n','<br>')+'</p><span>'+s.tech.map(esc).join(' · ')+'</span></div></div>';
    chips.innerHTML=s.features.map(function(f){return '<span>'+esc(f)+'</span>';}).join('');
    els={cover:$('.cs-cover'),brief:$('.cs-brief'),typed:$('.cs-typed'),chart:$('.cs-chart'),preview:$('.cs-preview'),mobile:$('.cs-mobile'),selection:$('.cs-selection'),dashboard:$('.cs-dashboard'),stack:$('.cs-stack'),phone:$('.cs-mobile .cs-phone'),annotation:$('.cs-annotation'),phones:$$('.cs-invoice-phone'),lines:$$('.cs-chart-line'),slide:$('.cs-style-line i'),knob:$('.cs-style-line b')};
    lastText='';$('[data-cs-name]').textContent=s.fullName;$('[data-cs-benefit]').textContent=s.benefit;
    action.href='project/index.html?project='+s.id;action.dataset.openProject=s.id;action.removeAttribute('data-cs-explore');action.innerHTML='View project '+arrow;action.setAttribute('aria-label','View the '+s.fullName+' project');
    tabs.forEach(function(t,i){t.setAttribute('aria-pressed',String(i===index));t.style.setProperty('--progress',i<index?1:0);});
  }
  var paths=[
    [[0,600,32],[.9,91,87],[1.25,91,87],[2.5,41,61],[10,41,61],[11.8,12,33]],
    [[.45,8,254],[2.1,87,194],[2.4,87,194],[4.35,188,225],[5.6,31,303],[11.5,5,320]],
    [[1,680,30],[3.75,694,224],[4.1,694,224],[5.4,623,175],[8.8,623,175],[11.5,690,174]],
    [[1.6,456,532],[4.8,388,438],[5.1,388,438],[7.1,461,469],[9.9,476,482],[11.5,510,520]],
    [[2.2,690,392],[7.4,324,202],[8.1,390,210],[8.8,455,188],[9.35,540,187],[10,596,370],[11.5,676,410]]
  ];
  function scene(t){
    var s=stories[selected],open=sm(t,.9,2.25),paint=sm(t,4.05,5.5),resize=sm(t,5.1,7.1),polish=sm(t,7.4,9.8),finish=sm(t,10.1,11.7);
    put(folder,'transform','translateY('+r((1-open)*8)+'px) rotate('+r(-2.5*(1-open))+'deg)');alpha(folder,1);alpha(art,1);
    put(els.cover,'display',open>.999?'none':'block');put(els.cover,'transform','rotateX('+r(-103*open)+'deg)');alpha(els.cover,1-sm(t,1.4,2.25));
    [els.brief,els.chart,els.preview,els.mobile].forEach(function(el,i){var p=sm(t,1.65+i*.18,2.75+i*.18);alpha(el,.2+.8*p);put(el,'transform','translateY('+r((1-p)*17)+'px)'+(i===2?' scale('+r(mix(.82,1,resize))+','+r(mix(.85,1,resize))+')':''));});
    put(els.brief,'filter','saturate('+r(.15+.85*paint)+') brightness('+r(.5+.5*paint)+')');put(els.chart,'backgroundColor',paint>.5?s.color:'#81778e');
    var text=s.brief.slice(0,Math.floor(s.brief.length*pr(t,2.15,4.35)));if(lastText!==text){els.typed.textContent=text;lastText=text;}
    alpha(palette,visibleWindow(t,2.7,3.6,6.25,6.85));
    alpha(els.selection,visibleWindow(t,4.7,5.05,7.25,7.8));put(els.selection,'transform','scale('+r(mix(.82,1,resize))+','+r(mix(.85,1,resize))+')');
    if(els.dashboard){put(els.dashboard,'transform','translateY('+r(17*(1-polish))+'px) rotate('+r(mix(0,-4,polish))+'deg)');alpha(els.stack,sm(t,8,9));put(els.stack,'transform','translateY('+r(12*(1-sm(t,8,9)))+'px) rotate(2deg)');}
    els.lines.forEach(function(el,i){put(el,'strokeDasharray','1');put(el,'strokeDashoffset',r(1-sm(t,7.4+i*.15,9.4)));});
    if(els.slide){put(els.slide,'transform','scaleX('+r(mix(.15,1,polish))+')');put(els.knob,'left',r(75*mix(.15,1,polish))+'%');}
    els.phones.forEach(function(el,i){var x=(i-1)*18*polish,y=(1-polish)*30+(i===1?0:12),angle=(i-1)*9*polish;put(el,'transform','translate('+r(x)+'px,'+r(y)+'px) rotate('+r(angle)+'deg)');});
    if(els.annotation){alpha(els.annotation,sm(t,8.3,9.4));put(els.annotation,'transform','translateY('+r(12*(1-sm(t,8.3,9.4)))+'px) rotate(-3deg)');}
    put(els.phone,'transform','translateY('+r(17*(1-polish))+'px) rotate('+r((selected===0?7:-6)*polish)+'deg)');
    alpha(chips,finish);put(chips,'transform','translateY('+r(6*(1-finish))+'px)');
    cursors.forEach(function(el,i){var pos=C.path(t,paths[i]);if(i===3&&t>=5.1&&t<=7.1){pos.x=54+407*mix(.82,1,resize);pos.y=261+208*mix(.85,1,resize);}put(el,'transform','translate('+r(pos.x)+'px,'+r(pos.y)+'px)');el.classList.toggle('cursor-label-left',pos.x>610);el.classList.toggle('cursor-label-above',pos.y>480);alpha(el,C.reduced.matches?0:sm(t,i*.45,i*.45+.45)*(1-sm(t,10.5,11.9)));var ring=el.querySelector('i'),hit=[.9,2.15,4.05,5.1,9.75][i],pulse=pr(t,hit,hit+.5);alpha(ring,t>=hit&&t<=hit+.5?1-pulse:0);put(ring,'transform','scale('+r(.5+pulse*1.5)+')');});
    var phase=t<1.7?'Opening the folder':t<4.05?'Writing the brief':t<5.1?'Applying the theme':t<7.4?'Arranging the interface':t<10?'Connecting the details':'Ready to explore';
    root.dataset.chapterPhase=t>=11.99?'finished':phase.toLowerCase().replaceAll(' ','-');
    message(t>=11.99?s.note:'0'+(selected+1)+' / '+s.name+' · '+phase);tabs[selected].style.setProperty('--progress',r(t/12));
  }
  function showMore(){
    art.hidden=true;outro.hidden=false;put(outro,'transform','translateY(0px) rotate(0deg)');alpha(outro,1);root.dataset.chapter='more';root.dataset.chapterPhase='finished';
    tabs.forEach(function(t,i){t.setAttribute('aria-pressed',String(i===2));t.style.setProperty('--progress',1);});
    $('[data-cs-name]').textContent='The rest of the collection';$('[data-cs-benefit]').textContent='Explore all '+projects.length+' projects — platforms, mobile work and interactive experiences.';
    action.href='#projects';delete action.dataset.openProject;action.setAttribute('data-cs-explore','');action.setAttribute('aria-label','Explore all projects');action.innerHTML='Explore all projects '+arrow;
    message('Choose a folder above to revisit a project.');
  }
  function render(time){
    if(dead)return;
    root.dataset.storyTime=r(time);
    if(mode==='single'){mount(singleIndex);scene(Math.min(12,time/chapterSeconds*12));return;}
    var a=chapterSeconds,b=a+gap,c=b+chapterSeconds,end=c+gap;
    if(time<a){mount(0);scene(time/a*12);}
    else if(time<b){var p=pr(time,a,b);if(p<.5){mount(0);scene(12);put(els.cover,'display','block');alpha(els.cover,p*2);put(els.cover,'transform','rotateX('+r(-100*(1-p*2))+'deg)');put(folder,'transform','translateX('+r(-36*p*2)+'px) rotate('+r(-2*p*2)+'deg)');}else{mount(1);scene(0);put(folder,'transform','translateX('+r(46*(1-(p-.5)*2))+'px) rotate('+r(2*(1-(p-.5)*2))+'deg)');}}
    else if(time<c){mount(1);scene((time-b)/chapterSeconds*12);}
    else{showMore();var v=sm(time,c,end);put(outro,'transform','translateY('+r(30*(1-v))+'px) rotate('+r(-2*(1-v))+'deg)');alpha(outro,v);}
  }
  var singleIndex=0,clock=C.clock({element:root,duration:total(),render:render,complete:function(){finished=true;manualPause=false;if(mode==='all')showMore();else{mount(singleIndex);scene(12);}root.dataset.storyPlaying='false';setControl();}});
  function start(all,index,intro){mode=all?'all':'single';singleIndex=index||0;chapterSeconds=intro?4.8:12;finished=false;manualPause=false;root.dataset.storyPlaying='true';root.dataset.chapterSeconds=chapterSeconds;clock.play(total());setControl();}
  function hold(){if(finished)return;if(manualPause||focusHold||hoverHold)clock.pause();else clock.resume();setControl();}
  function choose(index){if(index===2){clock.seek(total());showMore();finished=true;root.dataset.storyPlaying='false';setControl();return;}selected=-1;start(false,index,false);}
  function onClick(e){var tab=e.target.closest('[data-cs-tab]');if(tab){choose(Number(tab.dataset.csTab));return;}if(e.target.closest('[data-cs-control]')){if(finished){selected=-1;start(true,0,false);}else{manualPause=!(manualPause||focusHold||hoverHold);focusHold=false;hoverHold=false;hold();}return;}var explore=e.target.closest('[data-cs-explore]');if(explore){var allFilter=document.querySelector('[data-filter="all"]'),all=document.querySelector('#show-all-projects');if(allFilter&&!allFilter.classList.contains('is-active'))allFilter.click();if(all&&!all.hidden)all.click();clock.pause();}}
  root.addEventListener('click',onClick);
  function onFocus(e){if(e.target===action){focusHold=true;hold();}}
  function onBlur(e){if(e.target===action){focusHold=false;hold();}}
  root.addEventListener('focusin',onFocus);root.addEventListener('focusout',onBlur);
  function enter(){hoverHold=true;hold();}function leave(){hoverHold=false;hold();}
  action.addEventListener('pointerenter',enter);action.addEventListener('pointerleave',leave);
  function resize(){var scale=viewport.clientWidth/720;if(scale>0)stage.style.setProperty('--cs-scale',String(scale));}
  if('ResizeObserver'in window){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);}else window.addEventListener('resize',resize);
  function preference(){if(C.reduced.matches){clock.finish();if(mode==='all'){selected=-1;mount(0);scene(12);}finished=true;setControl();}}
  C.reduced.addEventListener('change',preference);
  root.cursorStudio={
    getState:function(){return Object.assign({chapter:root.dataset.chapter,chapterPhase:root.dataset.chapterPhase,mode:mode,secondsPerChapter:chapterSeconds,finished:finished},clock.getState());},
    selectChapter:function(i){choose(i);},
    seekChapter:function(i,t){mode='single';singleIndex=i;chapterSeconds=12;selected=-1;clock.play(12);clock.seek(clamp(t,0,12));finished=t>=12;setControl();},
    replay:function(){selected=-1;start(true,0,false);},
    finish:function(){clock.finish();},
    destroy:function(){dead=true;clock.destroy();if(resizeObserver)resizeObserver.disconnect();else window.removeEventListener('resize',resize);C.reduced.removeEventListener('change',preference);root.removeEventListener('click',onClick);root.removeEventListener('focusin',onFocus);root.removeEventListener('focusout',onBlur);action.removeEventListener('pointerenter',enter);action.removeEventListener('pointerleave',leave);root.innerHTML=original;root.className=originalClass;}
  };
  resize();mount(0);
  if(C.reduced.matches){mode='single';singleIndex=0;scene(12);finished=true;setControl();}else start(true,0,true);
})();
