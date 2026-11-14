/* ChemFluent — background molecules + answer bursts */
(function(){
  const cv=document.getElementById('bgfx'); if(!cv) return;
  const ctx=cv.getContext('2d'), rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W,H,mols=[];
  const COLS=['#2EF2C2','#8B7CFF','#FF5FB7','#3CC8FF','#FFB547'];
  function hex(m){ // benzene-like ring or small chain
    ctx.save(); ctx.translate(m.x,m.y); ctx.rotate(m.a); ctx.strokeStyle=m.c; ctx.globalAlpha=m.o; ctx.lineWidth=1.6; ctx.shadowColor=m.c; ctx.shadowBlur=12;
    ctx.beginPath();
    if(m.k===0){ for(let i=0;i<=6;i++){const t=i*Math.PI/3;ctx[i?'lineTo':'moveTo'](Math.cos(t)*m.s,Math.sin(t)*m.s);} ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,m.s*.55,0,7); }
    else if(m.k===1){ ctx.moveTo(-m.s*1.6,0); for(let i=-1;i<=2;i++) ctx.lineTo(i*m.s*.85,i%2?-m.s*.5:0); }
    else { ctx.arc(0,0,m.s*.3,0,7); for(let i=0;i<3;i++){const t=i*2.094;ctx.moveTo(Math.cos(t)*m.s*.3,Math.sin(t)*m.s*.3);ctx.lineTo(Math.cos(t)*m.s,Math.sin(t)*m.s);} }
    ctx.stroke();
    if(m.k===2){ ctx.fillStyle=m.c; for(let i=0;i<3;i++){const t=i*2.094;ctx.beginPath();ctx.arc(Math.cos(t)*m.s,Math.sin(t)*m.s,3,0,7);ctx.fill();} }
    ctx.restore();
  }
  function resize(){ W=cv.width=innerWidth*devicePixelRatio; H=cv.height=innerHeight*devicePixelRatio;
    mols=Array.from({length:Math.min(22,Math.round(innerWidth/70))},()=>({x:Math.random()*W,y:Math.random()*H,s:(14+Math.random()*26)*devicePixelRatio,a:Math.random()*6,va:(Math.random()-.5)*.003,vx:(Math.random()-.5)*.25,vy:-(.1+Math.random()*.3),k:Math.floor(Math.random()*3),c:COLS[Math.floor(Math.random()*5)],o:.12+Math.random()*.18})); }
  function loop(){ ctx.clearRect(0,0,W,H); for(const m of mols){ m.x+=m.vx; m.y+=m.vy; m.a+=m.va; if(m.y<-80){m.y=H+60;m.x=Math.random()*W;} if(m.x<-80)m.x=W+60; if(m.x>W+80)m.x=-60; hex(m);} if(!rm) requestAnimationFrame(loop); }
  addEventListener('resize',resize); resize(); loop();
  window.fxBurst=function(el){ if(rm||!el) return; const r=el.getBoundingClientRect(), cx=r.left+40, cy=r.top+r.height/2;
    for(let i=0;i<26;i++){ const d=document.createElement('i'); d.className='burst'; const c=COLS[i%5]; d.style.cssText=`left:${cx}px;top:${cy}px;background:${c};box-shadow:0 0 10px ${c}`;
      document.body.appendChild(d); const a=Math.random()*Math.PI*2, s=60+Math.random()*120;
      d.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*s}px,${Math.sin(a)*s}px) scale(.2)`,opacity:0}],{duration:700+Math.random()*400,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>d.remove(); } };
})();
