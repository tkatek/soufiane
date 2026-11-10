/* Studio Chapters / shared motion utilities. No network requests or dependencies.
 * Uses the site's GSAP when available; the native clock follows the same scene.
 * A clock stops scheduling work when it is paused, hidden or off screen. */
(function () {
  'use strict';
  if (window.StudioCraft) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var clocks = new Set();
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function progress(t, a, b) { return clamp((t-a)/(b-a), 0, 1); }
  function ease(p) { return p*p*(3-2*p); }
  function smooth(t,a,b) { return ease(progress(t,a,b)); }
  function mix(a,b,p) { return a+(b-a)*p; }
  function round(n) { return Math.round(n*1000)/1000; }
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function path(t, points) {
    if(t<=points[0][0]) return {x:points[0][1],y:points[0][2]};
    for(var i=1;i<points.length;i++) if(t<=points[i][0]) {var a=points[i-1],b=points[i],p=smooth(t,a[0],b[0]); return {x:mix(a[1],b[1],p),y:mix(a[2],b[2],p)};}
    var last=points[points.length-1];return {x:last[1],y:last[2]};
  }
  var cursorSVG='<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 2 21 17l-8 1 4 8-4 2-4-8-6 5Z"/></svg>';
  function cursor(name, color) {return '<div class="craft-cursor" style="--cursor-color:'+color+'" aria-hidden="true">'+cursorSVG+'<span>'+escape(name)+'</span><i></i></div>';}
  function clock(options) {
    var elapsed=0,duration=options.duration||1,frame=0,last=0,tween=null,dead=false,wanted=false,visible=true,userPaused=false;
    var model={t:0}, engine='native', observer=null;
    function blocked(){return !wanted||userPaused||!visible||document.hidden||!!document.querySelector('#project-dialog[open]');}
    function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(tween){tween.kill();tween=null;}}
    function draw(t){elapsed=clamp(t,0,duration);model.t=elapsed;options.render(elapsed,duration);}
    function end(){stop();wanted=false;draw(duration);if(options.complete)options.complete();}
    function tick(now){frame=0;if(dead||blocked())return;var dt=last?Math.max(0,(now-last)/1000):0;last=now;draw(elapsed+dt);if(elapsed>=duration)end();else frame=requestAnimationFrame(tick);}
    function sync(){
      if(dead)return;
      if(blocked()){if(tween)tween.pause();if(frame)cancelAnimationFrame(frame);frame=0;last=0;return;}
      if(elapsed>=duration){end();return;}
      if(window.gsap && typeof gsap.to==='function'){
        if(frame)cancelAnimationFrame(frame);frame=0;last=0;engine='gsap';
        if(tween)tween.resume();else {model.t=elapsed;tween=gsap.to(model,{t:duration,duration:duration-elapsed,ease:'none',onUpdate:function(){draw(model.t);},onComplete:end});}
      }else if(!frame){engine='native';frame=requestAnimationFrame(tick);}
      if(options.element)options.element.dataset.craftEngine=engine;
    }
    function preference(){if(reduced.matches){api.finish();}}
    var api={
      play:function(seconds,from){stop();duration=seconds||duration;elapsed=from||0;wanted=true;userPaused=false;draw(elapsed);if(reduced.matches)end();else sync();},
      finish:end,
      pause:function(){userPaused=true;sync();},
      resume:function(){userPaused=false;sync();},
      seek:function(t){stop();wanted=false;draw(t);},
      sync:sync,
      getState:function(){return {time:elapsed,duration:duration,playing:wanted&&!userPaused,paused:userPaused,visible:visible,engine:engine};},
      destroy:function(){dead=true;stop();if(observer)observer.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('portfolio:projectphase',sync);window.removeEventListener('portfolio:motionready',sync);reduced.removeEventListener('change',preference);clocks.delete(api);}
    };
    if(options.element && 'IntersectionObserver' in window){observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.015});observer.observe(options.element);}
    document.addEventListener('visibilitychange',sync);window.addEventListener('portfolio:projectphase',sync);window.addEventListener('portfolio:motionready',sync);reduced.addEventListener('change',preference);clocks.add(api);
    return api;
  }
  function animate(el, to, opts) {
    opts=opts||{};var cancelled=false,animation=null,tween=null,resolver;
    var promise=new Promise(function(r){resolver=r;});
    function finish(){if(cancelled)return;Object.keys(to).forEach(function(k){el.style[k]=to[k];});if(animation)animation.cancel();resolver(true);}
    if(reduced.matches || !el){if(el)Object.assign(el.style,to);resolver(true);}
    else if(window.gsap){var computed=getComputedStyle(el),initial={};Object.keys(to).forEach(function(k){initial[k]=computed[k];});tween=gsap.fromTo(el,initial,Object.assign({},to,{duration:(opts.duration||500)/1000,delay:(opts.delay||0)/1000,ease:opts.ease||'power3.out',overwrite:'auto',onComplete:finish}));}
    else if(el.animate){var style=getComputedStyle(el),from={};Object.keys(to).forEach(function(k){from[k]=style[k];});animation=el.animate([from,to],{duration:opts.duration||500,delay:opts.delay||0,easing:'cubic-bezier(.22,.75,.2,1)',fill:'both'});animation.finished.then(finish,function(){resolver(false);});}
    else finish();
    return {finished:promise,cancel:function(){if(cancelled)return;var style=getComputedStyle(el),frozen={};Object.keys(to).forEach(function(k){frozen[k]=style[k];});cancelled=true;if(tween)tween.kill();if(animation)animation.cancel();Object.assign(el.style,frozen);resolver(false);}};
  }
  window.StudioCraft={clamp:clamp,progress:progress,smooth:smooth,mix:mix,round:round,path:path,escape:escape,cursor:cursor,clock:clock,animate:animate,reduced:reduced};
})();
