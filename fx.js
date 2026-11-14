/* ChemFluent — line-art molecules drifting in the notebook margins + fizz bubbles on correct answers */
(function(){
  const cv=document.getElementById('bgfx'); if(!cv) return;
  const ctx=cv.getContext('2d'), rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FILL=['#FF6B4A','#3D6BFF','#FFC93C','#2EC4A0','#A66CFF'];
  let W,H,mols=[];
  const ink=()=>getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#1D1B3A';
  function draw(m){
    ctx.save(); ctx.translate(m.x,m.y); ctx.rotate(m.a); ctx.globalAlpha=m.o; ctx.strokeStyle=ink(); ctx.lineWidth=2*devicePixelRatio; ctx.lineJoin='round';
    const s=m.s;
    if(m.k===0){ ctx.beginPath(); for(let i=0;i<=6;i++){const t=i*Math.PI/3+Math.PI/6;ctx[i?'lineTo':'moveTo'](Math.cos(t)*s,Math.sin(t)*s);} ctx.stroke();
      ctx.beginPath(); for(let i=0;i<3;i++){const t1=(2*i)*Math.PI/3+Math.PI/6, t2=t1+Math.PI/3; ctx.moveTo(Math.cos(t1)*s*.72,Math.sin(t1)*s*.72); ctx.lineTo(Math.cos(t2)*s*.72,Math.sin(t2)*s*.72);} ctx.stroke(); }
    else if(m.k===1){ ctx.beginPath(); ctx.moveTo(-s*1.5,s*.25); for(let i=-1;i<=2;i++) ctx.lineTo(i*s*.8,i%2?-s*.25:s*.25); ctx.stroke(); }
    else { const pts=[[0,0],[s,-s*.5],[-s,-s*.5],[0,s*1.1]]; ctx.beginPath(); for(let i=1;i<4;i++){ctx.moveTo(0,0);ctx.lineTo(pts[i][0],pts[i][1]);} ctx.stroke();
      pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p[0],p[1],(i?6:9)*devicePixelRatio,0,7);ctx.fillStyle=i?'#FFFDF7':m.f;ctx.fill();ctx.stroke();}); }
    ctx.restore();
  }
  function resize(){ W=cv.width=innerWidth*devicePixelRatio; H=cv.height=innerHeight*devicePixelRatio;
    mols=Array.from({length:Math.min(14,Math.round(innerWidth/110))},()=>({x:Math.random()*W,y:Math.random()*H,s:(16+Math.random()*20)*devicePixelRatio,a:Math.random()*6,va:(Math.random()-.5)*.004,vx:(Math.random()-.5)*.2,vy:-(.08+Math.random()*.22),k:Math.floor(Math.random()*3),f:FILL[Math.floor(Math.random()*5)],o:.13+Math.random()*.1})); }
  function loop(){ ctx.clearRect(0,0,W,H); for(const m of mols){ m.x+=m.vx; m.y+=m.vy; m.a+=m.va; if(m.y<-80){m.y=H+60;m.x=Math.random()*W;} if(m.x<-80)m.x=W+60; if(m.x>W+80)m.x=-60; draw(m);} if(!rm) requestAnimationFrame(loop); }
  addEventListener('resize',resize); resize(); loop();
  window.fxFizz=function(el){ if(rm||!el) return; const r=el.getBoundingClientRect();
    for(let i=0;i<22;i++){ const d=document.createElement('i'); d.className='fizz'; const sz=6+Math.random()*16, x=r.left+Math.random()*r.width, y=r.top+r.height/2;
      d.style.cssText=`left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${FILL[i%5]}`; document.body.appendChild(d);
      d.animate([{transform:'translate(0,0) scale(.3)',opacity:1},{transform:`translate(${(Math.random()-.5)*60}px,${-80-Math.random()*140}px) scale(1)`,opacity:0}],{duration:800+Math.random()*600,easing:'cubic-bezier(.3,.6,.4,1)'}).onfinish=()=>d.remove(); } };
})();
