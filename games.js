const $=id=>document.getElementById(id);
const C=$('mgc'),X=C.getContext('2d');let W,H,dpr;
const NAMES={jump:'장애물 뛰어넘기',dodge:'장애물 피하기',catch:'유자 받기'};
const best=()=>JSON.parse(localStorage.getItem('capy_best_v1')||'{}');
function refreshBest(){const b=best();for(const k in NAMES)$('b_'+k).textContent=b[k]||0}
$('gameBtn').onclick=()=>{refreshBest();$('menuM').classList.add('on')};
$('menuX').onclick=()=>$('menuM').classList.remove('on');
document.querySelectorAll('.gm').forEach(b=>b.onclick=()=>start(b.dataset.g));
let G=null,raf=0;
function size(){dpr=Math.min(devicePixelRatio,2);W=innerWidth;H=innerHeight;C.width=W*dpr;C.height=H*dpr;X.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',size);
function capy(x,y,s=1,flip=1){X.save();X.translate(x,y);X.scale(s*flip,s);
 X.fillStyle='#7a4f2e';[[-18,14],[14,14]].forEach(([a,b])=>{X.beginPath();X.ellipse(a,b,7,10,0,0,7);X.fill()});
 X.fillStyle='#c98f5e';X.beginPath();X.ellipse(0,0,30,20,0,0,7);X.fill();X.beginPath();X.ellipse(24,-12,18,15,0,0,7);X.fill();
 X.fillStyle='#7a4f2e';X.beginPath();X.ellipse(16,-26,5,4,0,0,7);X.fill();X.fillStyle='#5a3a22';X.beginPath();X.ellipse(40,-12,5,4,0,0,7);X.fill();
 X.fillStyle='#111';X.beginPath();X.arc(28,-17,3,0,7);X.fill();X.fillStyle='#ff9e9e';X.beginPath();X.arc(30,-8,3,0,7);X.fill();
 X.fillStyle='#ffb300';X.beginPath();X.arc(20,-30,7,0,7);X.fill();X.restore()}
function rock(x,y,r){X.fillStyle='#8d8d8d';X.beginPath();X.ellipse(x,y,r,r*.8,0,0,7);X.fill();X.fillStyle='#aaa';X.beginPath();X.arc(x-r*.3,y-r*.3,r*.25,0,7);X.fill()}
function yuzu(x,y){X.fillStyle='#ffb300';X.beginPath();X.arc(x,y,13,0,7);X.fill();X.fillStyle='#66bb6a';X.beginPath();X.ellipse(x+3,y-13,6,3,.4,0,7);X.fill()}
function start(k){const s=window.__capy.S;if(s.energy<5){window.__capy.toast('체력이 부족해요… 잠을 재워 주세요 💤');return}
 s.energy-=5;window.__capy.ui();$('menuM').classList.remove('on');$('mg').classList.add('on');$('mgEnd').classList.remove('on');$('mgTitle').textContent=NAMES[k];size();
 G={k,score:0,t:0,over:false,px:W/2,tx:W/2,y:0,vy:0,obs:[],items:[]};cancelAnimationFrame(raf);loop()}
function input(e){if(!G||G.over)return;const x=(e.touches?e.touches[0]:e).clientX;
 if(G.k==='jump'){if(G.y===0)G.vy=13}else G.tx=x<W/2?Math.max(40,G.px-90):Math.min(W-40,G.px+90)}
C.addEventListener('pointerdown',input);
function end(){G.over=true;const s=window.__capy.S,b=best(),sc=Math.floor(G.score);let nb='';
 if(sc>(b[G.k]||0)){b[G.k]=sc;localStorage.setItem('capy_best_v1',JSON.stringify(b));nb='🏆 최고 기록 갱신! '}
 const coin=Math.min(30,Math.floor(sc/5)),xp=Math.min(20,Math.floor(sc/10)+2),hp=Math.min(15,5+Math.floor(sc/20));
 s.coin+=coin;s.exp+=xp;s.happy=Math.min(100,s.happy+hp);window.__capy.ui();
 $('endT').textContent=`게임 끝! ${sc}점`;$('endP').innerHTML=`${nb}<br>최고 기록 ${b[G.k]||0}점<br>🪙 +${coin} · ⭐ 경험치 +${xp} · 💖 행복 +${hp}`;$('mgEnd').classList.add('on')}
function hit(ax,ay,bx,by,r){return Math.hypot(ax-bx,ay-by)<r}
function loop(){raf=requestAnimationFrame(loop);if(!G)return;const g=G;X.clearRect(0,0,W,H);
 X.fillStyle='#bfe3ff';X.fillRect(0,0,W,H);X.fillStyle='#a5d6a7';X.fillRect(0,H*.72,W,H);
 const ground=H*.72;
 if(!g.over){g.t++;}
 if(g.k==='jump'){const sp=5+g.t/400;
  if(!g.over){g.vy-=.6;g.y=Math.max(0,g.y+g.vy);if(g.y===0)g.vy=0;g.score+=.1;
   if(g.t%Math.max(50,Math.floor(100-g.t/60))===0)g.obs.push({x:W+30});g.obs.forEach(o=>o.x-=sp);g.obs=g.obs.filter(o=>o.x>-40)}
  g.obs.forEach(o=>{rock(o.x,ground-12,18);if(!g.over&&Math.abs(o.x-80)<36&&g.y<26)end()});
  capy(80,ground-28-g.y,1);
  if(g.t<120){X.fillStyle='#6b4423';X.font='bold 18px sans-serif';X.textAlign='center';X.fillText('화면을 탭하면 점프!',W/2,H*.4)}}
 else{if(!g.over){g.px+=(g.tx-g.px)*.25;
   const rate=g.k==='dodge'?Math.max(12,40-g.t/80):30;if(g.t%Math.floor(rate)===0)g.obs.push({x:20+Math.random()*(W-40),y:60,v:3+Math.random()*2+g.t/700,f:g.k==='catch'&&Math.random()<.75});
   g.obs.forEach(o=>o.y+=o.v);if(g.k==='dodge')g.score+=.1}
  const py=ground-20;
  g.obs=g.obs.filter(o=>{if(o.f)yuzu(o.x,o.y);else rock(o.x,o.y,16);
   if(!g.over&&hit(o.x,o.y,g.px,py,38)){if(o.f){g.score+=10;return false}end()}
   if(o.y>H){if(g.k==='catch'&&o.f&&!g.over){g.miss=(g.miss||0)+1;if(g.miss>=3)end()}return false}return true});
  capy(g.px,py,1,g.tx<g.px-1?-1:1);
  X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';
  if(g.t<150)X.fillText('화면 왼쪽/오른쪽을 탭해서 움직여요',W/2,H*.4);
  if(g.k==='catch')X.fillText('놓친 유자 '+(g.miss||0)+'/3',W/2,H*.8+30)}
 $('mgScore').textContent=Math.floor(g.score)+'점'}
function home(){cancelAnimationFrame(raf);G=null;$('mg').classList.remove('on')}
$('mgBack').onclick=home;$('endHome').onclick=home;$('again').onclick=()=>start(G.k);
window.__mg={get G(){return G}};
