/* Honest activity display: the owner's screenshot is the immediate fallback.
   Live refresh uses the public GitHub Contributions API; no token or secret is shipped. */
(function () {
  'use strict';
  var chart=document.getElementById('github-calendar'), snapshot=window.GITHUB_SNAPSHOT;
  if(!chart||!snapshot)return;
  var current={snapshot:true,weeks:snapshot.weeks,months:snapshot.months,total:snapshot.total};
  var total=document.getElementById('contribution-total'),badge=document.getElementById('github-source-label'),caption=document.getElementById('github-caption'),tooltip=document.getElementById('github-tooltip');
  var cells=[],active=0,refreshStarted=false;
  function valid(raw){return raw&&Array.isArray(raw.contributions)&&raw.contributions.length>=7&&raw.contributions.length<4000&&raw.contributions.every(function(d){return /^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Number.isFinite(d.count)&&d.count>=0&&Number.isInteger(d.level)&&d.level>=0&&d.level<=4;});}
  function normalize(raw){
    var days=raw.contributions.slice().sort(function(a,b){return a.date.localeCompare(b.date);}).slice(-371);
    var weeks=[],week=[],first=new Date(days[0].date+'T00:00:00Z').getUTCDay();
    for(var n=0;n<first;n++)week.push(null);
    days.forEach(function(day){week.push(day);if(week.length===7){weeks.push(week);week=[];}});
    if(week.length){while(week.length<7)week.push(null);weeks.push(week);}
    weeks=weeks.slice(-53);var months=[],last='';
    weeks.forEach(function(w,i){var d=w.find(function(x){return x;});if(!d)return;var key=d.date.slice(0,7);if(key!==last){months.push({column:i,label:new Date(d.date+'T00:00:00Z').toLocaleDateString('en',{month:'short',timeZone:'UTC'})});last=key;}});
    var count=raw.total&&Number.isFinite(raw.total.lastYear)?raw.total.lastYear:days.reduce(function(sum,d){return sum+d.count;},0);
    return{snapshot:false,weeks:weeks,months:months,total:count};
  }
  function countWeeks(){return innerWidth<600?16:innerWidth<900?32:53;}
  function render(){
    var count=Math.min(countWeeks(),current.weeks.length),start=Math.max(0,current.weeks.length-count),weeks=current.weeks.slice(start);
    chart.replaceChildren();cells=[];active=0;
    chart.setAttribute('role','group');chart.setAttribute('aria-label',current.snapshot?'GitHub activity levels from supplied screenshot':'GitHub contribution calendar');
    var months=document.createElement('div');months.className='calendar-months';months.setAttribute('aria-hidden','true');months.style.gridTemplateColumns='repeat('+count+',minmax(0,1fr))';
    var labels=current.months.filter(function(m){return m.column>=start&&m.column<start+count;});
    labels.forEach(function(m){var span=document.createElement('span');span.textContent=m.label;span.style.gridColumn=String(m.column-start+1)+'/ span '+Math.min(3,count-(m.column-start));span.style.gridRow='1';months.appendChild(span);});
    var body=document.createElement('div');body.className='calendar-body';body.style.gridTemplateColumns='repeat('+count+',minmax(0,1fr))';
    weeks.forEach(function(week,w){var column=document.createElement('div');column.className='calendar-week';week.forEach(function(day,d){
      var btn=document.createElement('button');btn.type='button';btn.className='calendar-day';var level=current.snapshot?day:(day?day.level:0);btn.dataset.level=String(level);btn.tabIndex=-1;
      var text=current.snapshot?'Activity level '+level+' of 4 · supplied snapshot, week '+(start+w+1):day?day.count+' contribution'+(day.count===1?'':'s')+' on '+new Date(day.date+'T00:00:00Z').toLocaleDateString('en',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}):'Outside the reported period';
      btn.setAttribute('aria-label',text);btn.title=text;btn.dataset.description=text;btn.dataset.cell=String(cells.length);cells.push(btn);column.appendChild(btn);
    });body.appendChild(column);});
    var weekdays=document.createElement('div');weekdays.className='calendar-days-labels';weekdays.setAttribute('aria-hidden','true');['Mon','Wed','Fri'].forEach(function(label,i){var span=document.createElement('span');span.textContent=label;span.style.gridRow=String(2+i*2);weekdays.appendChild(span);});
    chart.append(months,body,weekdays);if(cells.length)cells[cells.length-1].tabIndex=0;active=cells.length-1;
    total.innerHTML='<strong>'+Number(current.total).toLocaleString('en-US')+'</strong> '+(current.snapshot?'contributions in the supplied snapshot':'contributions in the last year');
    badge.innerHTML='<span></span>'+(current.snapshot?'Supplied snapshot':'Live GitHub data');
    caption.textContent=current.snapshot?'Owner-supplied screenshot; capture date and daily counts are not provided. '+(count<53?'Showing the last '+count+' pictured weeks.':'Live refresh is attempted when available.'):(count<53?'Showing the latest '+count+' weeks. ':'')+'Public GitHub activity · refreshed '+new Date().toLocaleDateString('en',{month:'short',day:'numeric'})+'.';
    chart.dataset.source=current.snapshot?'snapshot':'live';chart.dataset.weeks=String(count);
  }
  chart.addEventListener('pointerover',function(e){var cell=e.target.closest('.calendar-day');if(cell)tooltip.textContent=cell.dataset.description;});
  chart.addEventListener('focusin',function(e){var cell=e.target.closest('.calendar-day');if(!cell)return;cells[active].tabIndex=-1;active=Number(cell.dataset.cell);cell.tabIndex=0;tooltip.textContent=cell.dataset.description;});
  chart.addEventListener('click',function(e){var cell=e.target.closest('.calendar-day');if(cell)tooltip.textContent=cell.dataset.description;});
  chart.addEventListener('keydown',function(e){var offsets={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1};if(!(e.key in offsets))return;e.preventDefault();var next=Math.max(0,Math.min(cells.length-1,active+offsets[e.key]));cells[next].focus();});
  try{var cache=JSON.parse(localStorage.getItem('soufiane-github-v2')||'null');if(cache&&Date.now()-cache.saved<6*60*60*1000&&valid(cache.data))current=normalize(cache.data);}catch(e){}
  render();var lastCount=countWeeks();window.addEventListener('resize',function(){var now=countWeeks();if(now!==lastCount){lastCount=now;render();}},{passive:true});
  async function refresh(){
    if(refreshStarted)return;refreshStarted=true;
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6500);
    try{
      var response=await fetch('https://github-contributions-api.jogruber.de/v4/'+encodeURIComponent(snapshot.username)+'?y=last',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('Activity unavailable');var raw=await response.json();if(!valid(raw))throw new Error('Invalid activity response');
      current=normalize(raw);render();try{localStorage.setItem('soufiane-github-v2',JSON.stringify({saved:Date.now(),data:raw}));}catch(e){}
    }catch(e){if(current.snapshot)caption.textContent='Live refresh unavailable. Showing the owner-supplied screenshot’s activity levels'+(countWeeks()<53?' (latest '+countWeeks()+' pictured weeks)':'')+'.';}
    finally{clearTimeout(timer);}
  }
  if('IntersectionObserver'in window){var observer=new IntersectionObserver(function(entries){if(entries.some(function(e){return e.isIntersecting;})){observer.disconnect();refresh();}},{rootMargin:'200px'});observer.observe(chart);}else refresh();
})();
