/* Original WebGL artwork: a softly deformed, reflective portal.
   No external 3D engine, model, video, paid component or .riv asset is required. */
(function () {
  'use strict';
  var art = document.getElementById('hero-art'), canvas = document.getElementById('portal-canvas');
  if (!art || !canvas) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target = { x:0, y:0, mode:0 }, state = { x:0, y:0, mode:0 };
  var visible = true, raf = 0, then = 0, elapsed = 8, destroyed = false;
  var gl;
  try { gl = canvas.getContext('webgl', { alpha:true, antialias:false, depth:false, stencil:false, premultipliedAlpha:false, powerPreference:'low-power' }); } catch (e) {}
  var api = window.PORTFOLIO_HERO = { webgl:!!gl, frames:0, visible:true };
  if (!gl) { startFallback(); setupControls(); return; }
  var vertex = 'attribute vec2 aPosition; varying vec2 vUV; void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}';
  var fragment = `
    precision highp float;
    varying vec2 vUV;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uMode;
    const float PI = 3.14159265;
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    vec3 objectSpace(vec3 p){
      p.xz=rot(.22+uPointer.x*.2+sin(uTime*.16)*.08)*p.xz;
      p.yz=rot(-.22+uPointer.y*.15)*p.yz;
      p.xy=rot(uTime*.09)*p.xy;
      return p;
    }
    float scene(vec3 position){
      vec3 p=objectSpace(position);
      float a=atan(p.y,p.x);
      float orbit=smoothstep(.1,1.,uMode)*(1.-smoothstep(1.1,2.,uMode));
      float pulse=smoothstep(1.1,2.,uMode);
      float radius=.98+.075*sin(a*3.+uTime*.35)+.035*cos(a*5.-uTime*.17);
      radius+=pulse*.04*sin(uTime*1.8);
      float thickness=.265+.035*sin(a*3.-uTime*.28);
      p.z+=.16*sin(a*3.+uTime*.2)+orbit*.09*cos(a*2.-uTime*.8);
      return length(vec2(length(p.xy)-radius,p.z))-thickness;
    }
    vec3 normalAt(vec3 p){vec2 e=vec2(.0017,0.);return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));}
    vec3 studio(vec3 r, float angle){
      float top=pow(max(dot(r,normalize(vec3(-.3,.8,1.))),0.),9.);
      float left=pow(max(dot(r,normalize(vec3(-.8,-.35,.7))),0.),14.);
      float right=pow(max(dot(r,normalize(vec3(.8,.35,.4))),0.),20.);
      float strip=pow(.5+.5*sin(r.x*6.5+r.z*5.+r.y*2.5),26.);
      vec3 tint=mix(vec3(.23,.36,1.),vec3(.55,.36,.9),.5+.5*sin(angle+uTime*.13));
      tint=mix(tint,vec3(.18,.63,.86),smoothstep(1.,2.,uMode)*.6);
      vec3 c=vec3(.035,.055,.105)+tint*(.18+strip*.4);
      c+=top*vec3(.75,.86,1.)*1.7;
      c+=left*vec3(.18,.5,1.)*1.6;
      c+=right*vec3(.8,.6,1.)*1.3;
      c+=strip*vec3(.34,.49,.95)*.35;
      return c;
    }
    void main(){
      vec2 uv=(vUV-.5)*2.; uv.x*=uResolution.x/uResolution.y;
      uv.y-=.025; uv-=uPointer*.018;
      vec3 ro=vec3(0.,0.,4.15); vec3 rd=normalize(vec3(uv*1.26,-3.0));
      float travel=0., nearest=10.; bool hit=false; vec3 p;
      for(int i=0;i<68;i++){
        p=ro+rd*travel; float d=scene(p); nearest=min(nearest,d);
        if(d<.0015){hit=true;break;}
        travel+=max(d*.7,.004);
        if(travel>7.)break;
      }
      vec3 col=vec3(.18,.27,.66); float alpha=0.;
      float halo=exp(-pow((length(uv)-.81)*4.6,2.))*.085;
      halo+=exp(-pow((length(uv)-.96)*11.,2.))*.03;
      alpha=halo; col=vec3(.23,.31,.82);
      if(hit){
        vec3 n=normalAt(p),v=normalize(ro-p),r=reflect(-v,n);
        float a=atan(p.y,p.x);
        float fresnel=pow(1.-max(dot(n,v),0.),3.);
        col=studio(r,a);
        float light=max(dot(n,normalize(vec3(-.6,.9,1.))),0.);
        col+=light*vec3(.075,.09,.18);
        col+=fresnel*vec3(.35,.52,.98)*.9;
        col*=.88+.12*sin(a*4.+uTime*.23);
        col=pow(max(col,vec3(0.)),vec3(.78));
        alpha=1.;
      }
      gl_FragColor=vec4(clamp(col,0.,1.),alpha);
    }`;
  function compile(type, source) {
    var shader = gl.createShader(type); gl.shaderSource(shader,source);gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { var message=gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message); }
    return shader;
  }
  var program, vs, fs;
  try {
    vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Portal link failed');
    gl.useProgram(program);
  } catch(error) { api.webgl=false;api.error=String(error);startFallback();setupControls();return; }
  var buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  var position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  var uniforms={resolution:gl.getUniformLocation(program,'uResolution'),pointer:gl.getUniformLocation(program,'uPointer'),time:gl.getUniformLocation(program,'uTime'),mode:gl.getUniformLocation(program,'uMode')};
  var sizeRatio = Math.min(devicePixelRatio || 1, innerWidth<768 ? 1 : 1.25);
  function resize(){
    var rect=art.getBoundingClientRect(),max=innerWidth<768?520:760;
    var ratio=Math.min(sizeRatio,max/Math.max(rect.width,rect.height));
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));gl.viewport(0,0,canvas.width,canvas.height);draw();
  }
  function draw(){
    if(destroyed||gl.isContextLost())return;
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform2f(uniforms.pointer,state.x,state.y);gl.uniform1f(uniforms.time,elapsed);gl.uniform1f(uniforms.mode,state.mode);gl.drawArrays(gl.TRIANGLES,0,6);api.frames++;
  }
  function tick(now){
    raf=0;if(destroyed||!visible||document.hidden||reduced)return;
    var rate=innerWidth<768?1000/30:1000/45;
    if(now-then>=rate){
      var delta=Math.min((now-then)/1000,.06);then=now;elapsed+=delta;
      state.x+=(target.x-state.x)*.055;state.y+=(target.y-state.y)*.055;state.mode+=(target.mode-state.mode)*.055;draw();
    }
    raf=requestAnimationFrame(tick);
  }
  function start(){if(!raf&&!reduced&&visible&&!document.hidden&&!destroyed){then=performance.now();raf=requestAnimationFrame(tick);}}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}}
  // Software-rendered chrome surface for browsers without WebGL. Still interactive;
  // never substitutes a static image or a non-working “demo” for the hero.
  function startFallback(){
    var fallbackCanvas=document.createElement('canvas');fallbackCanvas.id='portal-canvas-fallback';fallbackCanvas.setAttribute('aria-hidden','true');art.appendChild(fallbackCanvas);
    var ctx=fallbackCanvas.getContext('2d',{alpha:true});if(!ctx){fallbackCanvas.remove();art.dataset.renderer='css';return;}
    art.classList.add('has-canvas');art.dataset.renderer='canvas';api.renderer='canvas';
    var width=0,height=0,last=0,clock=7,loop=0,isVisible=true,segments=innerWidth<768?92:132,slices=36;
    var points=[],faces=[],cos=Math.cos,sin=Math.sin,TAU=Math.PI*2;
    function rotate(v,ax,ay,az){var x=v[0],y=v[1]*cos(ax)-v[2]*sin(ax),z=v[1]*sin(ax)+v[2]*cos(ax);var xx=x*cos(ay)+z*sin(ay),zz=-x*sin(ay)+z*cos(ay);return[xx*cos(az)-y*sin(az),xx*sin(az)+y*cos(az),zz];}
    function paint(){
      ctx.clearRect(0,0,width,height);var unit=Math.min(width,height)*.295,midX=width/2,midY=height*.485;
      var glow=ctx.createRadialGradient(midX,midY,unit*.48,midX,midY,unit*1.6);glow.addColorStop(0,'rgba(67,76,164,0)');glow.addColorStop(.6,'rgba(93,100,215,.1)');glow.addColorStop(1,'rgba(93,100,215,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      var ax=-.35+state.y*.12,ay=.28+state.x*.16,az=clock*.055;
      var pulse=Math.max(0,state.mode-1),orbit=Math.sin(Math.min(state.mode,1)*Math.PI/2)*(1-pulse),speed=clock*.28;
      points.length=0;faces.length=0;
      for(var i=0;i<=segments;i++){
        var u=i/segments*TAU,r=1+.065*sin(3*u+speed)+.025*cos(5*u-speed)+pulse*.035*sin(clock*1.8);
        for(var j=0;j<=slices;j++){
          var v=j/slices*TAU,thick=.255+.04*sin(3*u-speed*.8),z=.12*sin(3*u+speed*.65)+orbit*.09*cos(2*u-speed);
          var p=rotate([(r+thick*cos(v))*cos(u),(r+thick*cos(v))*sin(u),z+thick*sin(v)],ax,ay,az);
          var n=rotate([cos(v)*cos(u),cos(v)*sin(u),sin(v)],ax,ay,az),perspective=4.6/(4.6-p[2]);
          points.push({x:midX+p[0]*unit*perspective,y:midY-p[1]*unit*perspective,z:p[2],n:n,u:u});
        }
      }
      for(var a=0;a<segments;a++)for(var b=0;b<slices;b++){
        var index=a*(slices+1)+b,A=points[index],B=points[index+slices+1],C=points[index+slices+2],D=points[index+1];
        var nz=(A.n[2]+B.n[2]+C.n[2]+D.n[2])*.25;if(nz<-.08)continue;
        faces.push({p:[A,B,C,D],z:(A.z+B.z+C.z+D.z)*.25});
      }
      faces.sort(function(a,b){return a.z-b.z;});
      function shade(n,u){
        var nx=n[0],ny=n[1],nz=Math.max(.01,n[2]);var rz=2*nz*nz-1,rx=2*nz*nx,ry=2*nz*ny;
        var strip=Math.pow(.5+.5*sin(rx*5+rz*6+ry*2),16),top=Math.pow(Math.max(0,ry*.66+rz*.73-rx*.17),8),rim=Math.pow(1-nz,2.4),blue=.5+.5*sin(u+clock*.13),shadow=.73+.27*Math.max(0,ny*.6+nz*.8);
        return 'rgb('+Math.round(Math.min(255,(28+135*strip+170*top+78*rim+blue*15)*shadow))+','+Math.round(Math.min(255,(37+145*strip+175*top+98*rim+(1-blue)*22+pulse*15)*shadow))+','+Math.round(Math.min(255,(75+157*strip+173*top+159*rim)*shadow))+')';
      }
      points.forEach(function(p){p.color=shade(p.n,p.u);});
      faces.forEach(function(f){var p=f.p;
        var gradient=ctx.createLinearGradient((p[0].x+p[1].x)*.5,(p[0].y+p[1].y)*.5,(p[2].x+p[3].x)*.5,(p[2].y+p[3].y)*.5);
        gradient.addColorStop(0,p[0].color);gradient.addColorStop(1,p[3].color);ctx.fillStyle=ctx.strokeStyle=gradient;ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(var k=1;k<4;k++)ctx.lineTo(p[k].x,p[k].y);ctx.closePath();ctx.fill();ctx.stroke();
      });api.frames++;
    }
    function resize2D(){var box=art.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,(innerWidth<768?520:740)/Math.max(box.width,box.height));width=fallbackCanvas.width=Math.round(box.width*ratio);height=fallbackCanvas.height=Math.round(box.height*ratio);paint();}
    function frame(now){loop=0;if(!isVisible||document.hidden||reduced)return;var rate=innerWidth<768?1000/24:1000/30;if(now-last>=rate){clock+=Math.min((now-last)/1000,.07);last=now;state.x+=(target.x-state.x)*.08;state.y+=(target.y-state.y)*.08;state.mode+=(target.mode-state.mode)*.08;paint();}loop=requestAnimationFrame(frame);}
    function run(){if(!loop&&isVisible&&!document.hidden&&!reduced){last=performance.now();loop=requestAnimationFrame(frame);}}
    function pause(){if(loop)cancelAnimationFrame(loop);loop=0;}
    api.renderFallback=function(){state.mode=target.mode;paint();run();};
    art.addEventListener('pointermove',function(e){if(reduced||e.pointerType==='touch')return;var r=art.getBoundingClientRect();target.x=(e.clientX-r.left)/r.width*2-1;target.y=1-(e.clientY-r.top)/r.height*2;},{passive:true});
    art.addEventListener('pointerleave',function(){target.x=target.y=0;});
    new ResizeObserver(resize2D).observe(art);
    new IntersectionObserver(function(entries){isVisible=entries[0].isIntersecting;api.visible=isVisible;if(isVisible)run();else pause();},{rootMargin:'30px'}).observe(art);
    document.addEventListener('visibilitychange',function(){if(document.hidden)pause();else run();});
    window.addEventListener('portfolio:motionchange',function(e){reduced=e.detail.reduced;pause();if(reduced){state.x=state.y=0;paint();}else run();});
    window.addEventListener('pagehide',pause);window.addEventListener('pageshow',run);resize2D();run();
  }

  function setupControls(){
    art.querySelectorAll('[data-orb-mode]').forEach(function(btn){btn.addEventListener('click',function(){
      target.mode=Number(btn.dataset.orbMode);art.dataset.orbMode=btn.dataset.orbMode;
      art.querySelectorAll('[data-orb-mode]').forEach(function(b){var selected=b===btn;b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));});
      if(gl&&program){if(reduced){state.mode=target.mode;draw();}else start();}
      if(api.renderFallback)api.renderFallback();
      var fallback=art.querySelector('.orb-fallback');if(fallback)fallback.style.filter='hue-rotate('+(target.mode*30)+'deg) drop-shadow(0 0 28px #707bff70)';
    });});
  }
  setupControls();
  art.addEventListener('pointermove',function(event){
    if(reduced||event.pointerType==='touch')return;var r=art.getBoundingClientRect();target.x=(event.clientX-r.left)/r.width*2-1;target.y=1-(event.clientY-r.top)/r.height*2;
    var a=art.querySelector('.orbit-label-a'),b=art.querySelector('.orbit-label-b');
    a.style.transform='translate('+target.x*6+'px,'+target.y*-5+'px) rotate(7deg)';b.style.transform='translate('+target.x*-8+'px,'+target.y*5+'px) rotate(-7deg)';
  },{passive:true});
  art.addEventListener('pointerleave',function(){target.x=0;target.y=0;art.querySelector('.orbit-label-a').style.transform='';art.querySelector('.orbit-label-b').style.transform='';});
  var observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;api.visible=visible;if(visible)start();else stop();},{rootMargin:'30px'});observer.observe(art);
  var ro=new ResizeObserver(resize);ro.observe(art);
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else start();});
  window.addEventListener('portfolio:motionchange',function(e){reduced=e.detail.reduced;stop();state.x=state.y=0;if(reduced)draw();else start();});
  canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();stop();art.classList.remove('has-webgl');api.webgl=false;});
  canvas.addEventListener('webglcontextrestored',function(){location.reload();});
  window.addEventListener('pagehide',function(){stop();});
  window.addEventListener('pageshow',function(){start();});
  resize();art.classList.add('has-webgl');art.dataset.renderer='webgl';start();
})();
