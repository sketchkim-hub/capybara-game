const $=id=>document.getElementById(id);
const C=$('mgc'),X=C.getContext('2d');let W,H,dpr;
const NAMES={jump:'장애물 뛰어넘기',dodge:'장애물 피하기',catch:'유자 받기'};
const ANAME={feed:'🍉 먹이 주기',walk:'🌳 산책하기',exercise:'🏃 운동하기',play:'🧶 공놀이',study:'📚 공부하기',trick:'🎵 재롱 연습',sleep:'💤 재우기'};
const DIFF={
 easy:{id:'easy',n:'쉬움',speed:3.0,gap:52,win:28,notes:8,reward:0.85,label:'🌱 쉬움'},
 normal:{id:'normal',n:'보통',speed:4.2,gap:38,win:20,notes:10,reward:1.0,label:'⭐ 보통'},
 hard:{id:'hard',n:'어려움',speed:5.6,gap:28,win:14,notes:12,reward:1.25,label:'🔥 어려움'},
 veryhard:{id:'veryhard',n:'매우어려움',speed:7.2,gap:20,win:10,notes:14,reward:1.5,label:'💀 매우어려움'}
};
let pickedDiff='normal';

const best=()=>JSON.parse(localStorage.getItem('capy_best_v1')||'{}');
function refreshBest(){const b=best();for(const k in NAMES)$('b_'+k).textContent=b[k]||0}
$('gameBtn').onclick=()=>{refreshBest();$('menuM').classList.add('on')};
$('menuX').onclick=()=>$('menuM').classList.remove('on');
document.querySelectorAll('.gm').forEach(b=>b.onclick=()=>startHub(b.dataset.g));
let G=null,raf=0,mode='hub'; // hub | action
function size(){dpr=Math.min(devicePixelRatio,2);W=innerWidth;H=innerHeight;C.width=W*dpr;C.height=H*dpr;X.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',()=>{if(G)size()});
function capy(x,y,s=1,flip=1,open=0){X.save();X.translate(x,y);X.scale(s*flip,s);
 X.fillStyle='#7a4f2e';[[-18,14],[14,14]].forEach(([a,b])=>{X.beginPath();X.ellipse(a,b,7,10,0,0,7);X.fill()});
 X.fillStyle='#c98f5e';X.beginPath();X.ellipse(0,0,30,20,0,0,7);X.fill();X.beginPath();X.ellipse(24,-12,18,15,0,0,7);X.fill();
 X.fillStyle='#7a4f2e';X.beginPath();X.ellipse(16,-26,5,4,0,0,7);X.fill();X.fillStyle='#5a3a22';X.beginPath();X.ellipse(40,-12,5,4,0,0,7);X.fill();
 if(open>0){X.fillStyle='#3e2723';X.beginPath();X.ellipse(38,-6,6,4+open*6,0,0,7);X.fill()}
 X.fillStyle='#111';X.beginPath();X.arc(28,-17,3,0,7);X.fill();X.fillStyle='#ff9e9e';X.beginPath();X.arc(30,-8,3,0,7);X.fill();
 X.fillStyle='#ffb300';X.beginPath();X.arc(20,-30,7,0,7);X.fill();X.restore()}
function rock(x,y,r){X.fillStyle='#8d8d8d';X.beginPath();X.ellipse(x,y,r,r*.8,0,0,7);X.fill();X.fillStyle='#aaa';X.beginPath();X.arc(x-r*.3,y-r*.3,r*.25,0,7);X.fill()}
function yuzu(x,y,r=13){X.fillStyle='#ffb300';X.beginPath();X.arc(x,y,r,0,7);X.fill();X.fillStyle='#66bb6a';X.beginPath();X.ellipse(x+3,y-r,6,3,.4,0,7);X.fill()}
function food(x,y,kind){if(kind==='🍉'){X.fillStyle='#e53935';X.beginPath();X.arc(x,y,14,0,7);X.fill();X.fillStyle='#43a047';X.beginPath();X.arc(x,y,14,Math.PI*.15,Math.PI*.85);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(x+2,y+2,7,0,7);X.fill()}
 else if(kind==='🥕'){X.fillStyle='#ff7043';X.beginPath();X.moveTo(x,y+16);X.lineTo(x-8,y-8);X.lineTo(x+8,y-8);X.fill();X.fillStyle='#66bb6a';X.fillRect(x-3,y-18,6,10)}
 else{yuzu(x,y)}}
function flower(x,y){X.fillStyle='#ef5350';for(let i=0;i<5;i++){X.beginPath();X.arc(x+Math.cos(i*1.26)*7,y+Math.sin(i*1.26)*7,5,0,7);X.fill()}X.fillStyle='#ffeb3b';X.beginPath();X.arc(x,y,4,0,7);X.fill()}
function puddle(x,y,w){X.fillStyle='#64b5f6aa';X.beginPath();X.ellipse(x,y,w,10,0,0,7);X.fill()}
function hit(ax,ay,bx,by,r){return Math.hypot(ax-bx,ay-by)<r}
function openMG(title){$('menuM').classList.remove('on');$('mg').classList.add('on');$('mgEnd').classList.remove('on');$('mgTitle').textContent=title;$('again').style.display=mode==='hub'?'block':'none';size()}
function startHub(k){const s=window.__capy.S;if(s.energy<5){window.__capy.toast('체력이 부족해요… 잠을 재워 주세요 💤');return}
 s.energy-=5;window.__capy.ui();mode='hub';openMG(NAMES[k]);
 G={k,score:0,t:0,over:false,px:W/2,tx:W/2,y:0,vy:0,obs:[],items:[],miss:0};cancelAnimationFrame(raf);loop()}
function beginAction(a,diffId){mode='action';openMG(ANAME[a]+(a==='exercise'&&diffId?' · '+DIFF[diffId].n:''));
 const base={k:a,score:0,t:0,over:false,done:false,hits:0,miss:0,need:8,px:W/2,tx:W/2,y:0,vy:0,obs:[],items:[],seq:[],player:[],show:true,phase:'show',beat:0,hold:0,cards:[],flipped:[],matched:0,blanket:0,ball:null,cues:[],cueI:0,diff:diffId||null,rewardMul:1,speed:4.2,win:20};
 if(a==='feed'){base.need=8;base.px=W/2}
 if(a==='walk'){base.need=6;base.px=W*0.28;base.tx=base.px;base.dist=0;base.jy=0;base.jvy=0;base.coyote=8;base.jumpBuf=0;base.jumped=0}
 if(a==='exercise'){const D=DIFF[diffId||'normal'];base.rewardMul=D.reward;base.speed=D.speed;base.win=D.win;base.need=D.notes;base.cues=[];
  let t=55;for(let i=0;i<D.notes;i++){base.cues.push({t:t,lane:Math.floor(Math.random()*4),hit:false,missed:false});t+=D.gap+(i%3===0?4:0)}}
 if(a==='play'){base.ball={x:W/2,y:H*.35,vy:0};base.need=10;base.bounces=0}
 if(a==='study'){const pairs=['🍉','🍊','🥕','🌿'];const deck=[...pairs,...pairs].sort(()=>Math.random()-.5);base.cards=deck.map((e,i)=>({e,i,open:false,gone:false}));base.need=4;base.flipped=[];base.limit=12*60}
 if(a==='trick'){const n=3+Math.floor(Math.random()*2);base.seq=[];for(let i=0;i<n;i++)base.seq.push(Math.floor(Math.random()*4));base.player=[];base.phase='show';base.showI=-1;base.showT=0;base.round=0;base.need=2}
 if(a==='sleep'){base.blanket=.12;base.need=1}
 G=base;cancelAnimationFrame(raf);loop()}
window.__startAction=function(a){if(a==='exercise'){pickedDiff='normal';
  document.querySelectorAll('#diffList button').forEach(b=>b.classList.toggle('sel',b.dataset.d==='normal'));
  $('diffM').classList.add('on');return}
 beginAction(a)};
$('diffGo').onclick=()=>{$('diffM').classList.remove('on');beginAction('exercise',pickedDiff)};
$('diffX').onclick=()=>$('diffM').classList.remove('on');
document.querySelectorAll('#diffList button').forEach(b=>b.onclick=()=>{pickedDiff=b.dataset.d;document.querySelectorAll('#diffList button').forEach(x=>x.classList.toggle('sel',x===b))});
const ptr={down:false,x:0,y:0,sx:0,sy:0};
function onDown(e){if(!G||G.over)return;const t=e.touches?e.touches[0]:e;ptr.down=true;ptr.x=t.clientX;ptr.y=t.clientY;ptr.sx=t.clientX;ptr.sy=t.clientY;ptr.t0=performance.now();
 if(mode==='action'&&G.k==='walk'){if(inJumpBtn(t.clientX,t.clientY)){ptr.jumpBtn=true;doWalkJump(true)}else{G.tx=Math.max(40,Math.min(W-40,t.clientX));ptr.jumpBtn=false}}
 else handleTap(t.clientX,t.clientY);e.preventDefault()}
function onMove(e){if(!G||G.over||!ptr.down)return;const t=e.touches?e.touches[0]:e;ptr.x=t.clientX;ptr.y=t.clientY;
 if(mode==='action'){if(G.k==='walk'){if(ptr.jumpBtn){if(!inJumpBtn(t.clientX,t.clientY)){ptr.jumpBtn=false;releaseWalkJump()}}else G.tx=Math.max(40,Math.min(W-40,t.clientX))}
  else if(G.k==='feed')G.tx=Math.max(40,Math.min(W-40,t.clientX));
  if(G.k==='sleep'){const dy=t.clientY-ptr.sy;if(dy>0)G.blanket=Math.min(1,G.blanket+dy/220);ptr.sy=t.clientY}}
 e.preventDefault()}
function onUp(e){if(G&&!G.over&&mode==='action'&&G.k==='walk'){if(ptr.jumpBtn)releaseWalkJump();
  else{const dt=performance.now()-(ptr.t0||0);const dx=Math.abs(ptr.x-ptr.sx),dy=Math.abs(ptr.y-ptr.sy);if(dt<200&&dx<18&&dy<18)doWalkJump(false)}}
 ptr.down=false;ptr.jumpBtn=false}
function inJumpBtn(x,y){const bx=W-78,by=H-110,bw=64,bh=64;return x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh}
function doWalkJump(holdable){if(!G||G.k!=='walk'||G.over)return;G.jumpBuf=10;G.jumpHoldable=!!holdable;G.jumpHold=0;tryWalkJump()}
function tryWalkJump(){if(!G||G.k!=='walk')return;const can=G.jy<=0&&(G.coyote>0||G.jy===0);if(can&&G.jumpBuf>0){G.jvy=G.jumpHoldable?8.0:6.0;G.jy=.1;G.coyote=0;G.jumpBuf=0;G.holdingJump=!!G.jumpHoldable;G.jumped++}}
function releaseWalkJump(){if(!G||G.k!=='walk')return;G.holdingJump=false;if(G.jvy>2.5)G.jvy*=.48}
C.addEventListener('pointerdown',onDown);C.addEventListener('pointermove',onMove);C.addEventListener('pointerup',onUp);C.addEventListener('pointercancel',onUp);
function handleTap(x,y){if(mode==='hub'){if(G.k==='jump'){if(G.y===0)G.vy=13}else G.tx=x<W/2?Math.max(40,G.px-90):Math.min(W-40,G.px+90);return}
 if(G.k==='feed')G.tx=x;
 if(G.k==='exercise'){const lane=exLaneAt(x,y);if(lane<0){G.miss++;return}const cue=G.cues.find(c=>c.lane===lane&&!c.hit&&!c.missed&&Math.abs(G.t-c.t)<(G.win||20));if(cue){cue.hit=true;G.hits++;G.score+=10;G.flashLane=lane;G.flashT=12}else G.miss++}
 if(G.k==='play'&&G.ball){if(Math.abs(x-G.ball.x)<60&&Math.abs(y-G.ball.y)<80&&G.ball.vy>0){G.ball.vy=-11-Math.random()*2;G.bounces++;G.hits++;G.score+=10}}
 if(G.k==='study'){const cols=4,gap=12,cw=(W-40-gap*3)/4,ch=cw,ox=20,oy=H*.28;const i=Math.floor((x-ox)/(cw+gap)),j=Math.floor((y-oy)/(ch+gap));const idx=j*cols+i;
  if(idx>=0&&idx<G.cards.length&&!G.cards[idx].gone&&!G.cards[idx].open&&G.flipped.length<2){G.cards[idx].open=true;G.flipped.push(idx);
   if(G.flipped.length===2){const[a,b]=G.flipped;if(G.cards[a].e===G.cards[b].e){G.cards[a].gone=G.cards[b].gone=true;G.matched++;G.hits++;G.score+=25;G.flipped=[]}else setTimeout(()=>{if(!G||G.over)return;G.cards[a].open=G.cards[b].open=false;G.flipped=[];G.miss++},450)}}}
 if(G.k==='trick'&&G.phase==='input'){const btn=btnAt(x,y);if(btn>=0){G.player.push(btn);G.flash=btn;G.flashT=12;
   if(G.player[G.player.length-1]!==G.seq[G.player.length-1]){G.miss++;G.phase='fail';G.failT=40}
   else if(G.player.length===G.seq.length){G.hits++;G.score+=20;G.round++;if(G.round>=G.need)finishAction(1);else{G.seq.push(Math.floor(Math.random()*4));G.player=[];G.phase='show';G.showI=-1;G.showT=0}}}}}
function btnAt(x,y){const r=42,cx=[W*.25,W*.75,W*.25,W*.75],cy=[H*.42,H*.42,H*.62,H*.62];for(let i=0;i<4;i++)if(hit(x,y,cx[i],cy[i],r+10))return i;return -1}
function exLaneAt(x,y){const ty=H*.62,r=42;for(let i=0;i<4;i++){const cx=W*((i+.5)/4);if(hit(x,y,cx,ty,r+16))return i}return -1}
function finishAction(q){if(G.over)return;G.over=true;G.quality=Math.max(0,Math.min(1,q));
 const res=window.__capy.finishAction(G.k,G.quality,G.rewardMul||1);
 $('endT').textContent=`완료! ${Math.round(G.quality*100)}점`;
 $('endP').innerHTML=`${res.msg}<br>🪙 +${res.coin} · ⭐ 경험치 +${res.xp}<br>${G.diff?('난이도 '+DIFF[G.diff].n+' · 보상 ×'+DIFF[G.diff].reward+'<br>'):''}성과에 따라 보상이 달라져요`;
 $('again').style.display='none';$('mgEnd').classList.add('on')}
function endHub(){G.over=true;const s=window.__capy.S,b=best(),sc=Math.floor(G.score);let nb='';
 if(sc>(b[G.k]||0)){b[G.k]=sc;localStorage.setItem('capy_best_v1',JSON.stringify(b));nb='🏆 최고 기록 갱신! '}
 const coin=Math.min(30,Math.floor(sc/5)),xp=Math.min(20,Math.floor(sc/10)+2),hp=Math.min(15,5+Math.floor(sc/20));
 s.coin+=coin;s.exp+=xp;s.happy=Math.min(100,s.happy+hp);window.__capy.ui();
 $('endT').textContent=`게임 끝! ${sc}점`;$('endP').innerHTML=`${nb}<br>최고 기록 ${b[G.k]||0}점<br>🪙 +${coin} · ⭐ 경험치 +${xp} · 💖 행복 +${hp}`;$('again').style.display='block';$('mgEnd').classList.add('on')}
function loop(){raf=requestAnimationFrame(loop);if(!G)return;
 if(mode==='hub')loopHub();else loopAction()}
function loopHub(){const g=G;X.clearRect(0,0,W,H);X.fillStyle='#bfe3ff';X.fillRect(0,0,W,H);X.fillStyle='#a5d6a7';X.fillRect(0,H*.72,W,H);const ground=H*.72;
 if(!g.over)g.t++;
 if(g.k==='jump'){const sp=5+g.t/400;if(!g.over){g.vy-=.6;g.y=Math.max(0,g.y+g.vy);if(g.y===0)g.vy=0;g.score+=.1;if(g.t%Math.max(50,Math.floor(100-g.t/60))===0)g.obs.push({x:W+30});g.obs.forEach(o=>o.x-=sp);g.obs=g.obs.filter(o=>o.x>-40)}
  g.obs.forEach(o=>{rock(o.x,ground-12,18);if(!g.over&&Math.abs(o.x-80)<36&&g.y<26)endHub()});capy(80,ground-28-g.y,1);if(g.t<120){X.fillStyle='#6b4423';X.font='bold 18px sans-serif';X.textAlign='center';X.fillText('화면을 탭하면 점프!',W/2,H*.4)}}
 else{if(!g.over){g.px+=(g.tx-g.px)*.25;const rate=g.k==='dodge'?Math.max(12,40-g.t/80):30;if(g.t%Math.floor(rate)===0)g.obs.push({x:20+Math.random()*(W-40),y:60,v:3+Math.random()*2+g.t/700,f:g.k==='catch'&&Math.random()<.75});g.obs.forEach(o=>o.y+=o.v);if(g.k==='dodge')g.score+=.1}
  const py=ground-20;g.obs=g.obs.filter(o=>{if(o.f)yuzu(o.x,o.y);else rock(o.x,o.y,16);if(!g.over&&hit(o.x,o.y,g.px,py,38)){if(o.f){g.score+=10;return false}endHub()}if(o.y>H){if(g.k==='catch'&&o.f&&!g.over){g.miss=(g.miss||0)+1;if(g.miss>=3)endHub()}return false}return true});
  capy(g.px,py,1,g.tx<g.px-1?-1:1);X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';if(g.t<150)X.fillText('화면 왼쪽/오른쪽을 탭해서 움직여요',W/2,H*.4);if(g.k==='catch')X.fillText('놓친 유자 '+(g.miss||0)+'/3',W/2,H*.8+30)}
 $('mgScore').textContent=Math.floor(g.score)+'점'}
function loopAction(){const g=G;X.clearRect(0,0,W,H);if(!g.over)g.t++;
 if(g.k==='feed')actFeed(g);else if(g.k==='walk')actWalk(g);else if(g.k==='exercise')actEx(g);else if(g.k==='play')actPlay(g);else if(g.k==='study')actStudy(g);else if(g.k==='trick')actTrick(g);else if(g.k==='sleep')actSleep(g);
 if(!g.over&&g.t>18*60){const q=Math.max(0,Math.min(1,(g.hits||0)/Math.max(1,g.need||1)));if(g.k==='sleep')finishAction(g.blanket||0);else finishAction(q)}
 $('mgScore').textContent=g.k==='sleep'?Math.round((g.blanket||0)*100)+'%':(Math.floor(g.score)+'점')}
function actFeed(g){X.fillStyle='#fff3e0';X.fillRect(0,0,W,H);X.fillStyle='#ffe0b2';X.fillRect(0,H*.7,W,H*.3);
 g.px+=(g.tx-g.px)*.2;const mouthY=H*.55;capy(g.px,mouthY,1.4,1,.8);
 if(!g.over&&g.t%28===0)g.items.push({x:40+Math.random()*(W-80),y:70,v:2.5+Math.random()*1.5,kind:['🍉','🥕','🍊'][g.t%3]});
 g.items=g.items.filter(it=>{it.y+=it.v;food(it.x,it.y,it.kind);
  if(!g.over&&hit(it.x,it.y,g.px+28,mouthY-18,48)){g.hits++;g.score+=10;return false}
  if(it.y>H*.85){g.miss++;return false}return true});
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';
 X.fillText(`받은 먹이 ${g.hits}/${g.need} · 놓침 ${g.miss}`,W/2,H*.18);
 if(g.t<90)X.fillText('좌우로 움직여 입을 맞추세요!',W/2,H*.28);
 if(!g.over&&(g.hits>=g.need||g.t>16*60||g.miss>=5))finishAction(Math.max(0,g.hits/g.need)*(1-Math.min(.5,g.miss*.08)))}
function actWalk(g){X.fillStyle='#b3e5fc';X.fillRect(0,0,W,H);X.fillStyle='#81c784';X.fillRect(0,H*.65,W,H);
 const ground=H*.65, bodyY=()=>ground-28-g.jy;
 if(!g.over){
  // auto-run forward; left/right follow target
  g.dist+=4.2;g.score+=.12;g.px+=(g.tx-g.px)*.22;
  // jump physics: hold jump button = higher; short tap = hop; coyote kept
  if(g.jy<=0){g.jy=0;g.jvy=0;g.holdingJump=false;g.coyote=Math.min(8,(g.coyote||0)+1)}
  else{g.coyote=0;if(g.holdingJump&&ptr.jumpBtn&&(g.jumpHold||0)<12&&g.jvy>0){g.jumpHold=(g.jumpHold||0)+1;g.jvy=Math.min(13.2,g.jvy+.55)}
   const grav=g.holdingJump&&ptr.jumpBtn&&g.jvy>0?.5:.8;g.jvy-=grav;g.jy+=g.jvy;if(g.jy>88){g.jy=88;if(g.jvy>0)g.jvy=0}if(g.jy<=0){g.jy=0;g.jvy=0;g.holdingJump=false;g.coyote=8}}
  if(g.jumpBuf>0){g.jumpBuf--;tryWalkJump()}
  // spawn: rocks need jump, puddles also jumpable; flowers
  if(g.t%48===0)g.obs.push({x:W+30,y:ground-10,type:Math.random()<.55?'rock':'puddle',w:18+Math.random()*14,h:g.t});
  if(g.t%52===0)g.items.push({x:W+16,y:ground-36-Math.random()*50,got:false});
  const sp=5.2;g.obs.forEach(o=>o.x-=sp);g.items.forEach(it=>it.x-=sp);
 }
 // draw + collide
 g.obs=g.obs.filter(o=>{
  if(o.type==='puddle')puddle(o.x,ground-4,o.w);else rock(o.x,ground-14,17);
  const half=o.type==='puddle'?o.w+4:20;
  const near=Math.abs(o.x-g.px)<half;
  // short hop clears puddles; full(er) jump clears rocks
  const cleared=g.jy>(o.type==='puddle'?12:28);
  if(!g.over&&near&&!cleared&&!o.hit){o.hit=true;g.miss++;g.score=Math.max(0,g.score-3)}
  return o.x>-50});
 g.items=g.items.filter(it=>{flower(it.x,it.y);
  if(!g.over&&hit(it.x,it.y,g.px,bodyY(),40)){g.hits++;g.score+=12;return false}
  return it.x>-30});
 // capybara
 const bob=g.jy>0?0:Math.sin(g.t*.45)*2;
 capy(g.px,bodyY()+bob,1,g.tx<g.px-2?-1:1);
 // jump button
 const bx=W-78,by=H-110;X.fillStyle=(ptr.jumpBtn||g.jy>0)?'#ffb74d':'#ff9800';roundRect(bx,by,64,72,18);X.fillStyle='#fff';X.font='bold 12px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('길게↑',bx+32,by+48);X.font='bold 14px sans-serif';X.fillText('점프',bx+32,by+30);X.font='18px serif';X.fillText('⬆',bx+32,by+12);
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textBaseline='alphabetic';
 X.fillText(`꽃 ${g.hits}/${g.need} · 부딪힘 ${g.miss}`,W/2,H*.15);
 if(g.t<160){X.fillText('짧게=살짝 점프 · 점프 길게=높이! 돌은 높이 넘기',W/2,H*.25)}
 if(!g.over&&(g.hits>=g.need||g.dist>2400||g.t>18*60))finishAction(Math.max(.2,Math.min(1,(g.hits/g.need)*.85+(g.dist/2600)*.15)*(1-Math.min(.45,g.miss*.1))))}
function actEx(g){X.fillStyle='#ffe0b2';X.fillRect(0,0,W,H);X.fillStyle='#ffcc80';X.fillRect(0,H*.72,W,H);
 const ty=H*.62, cols=['#ef5350','#42a5f5','#66bb6a','#ffa726'], labels=['①','②','③','④'];
 // 4 target rings
 for(let i=0;i<4;i++){const cx=W*((i+.5)/4);X.strokeStyle=cols[i];X.lineWidth=5;X.beginPath();X.arc(cx,ty,36,0,7);X.stroke();
  X.fillStyle=(g.flashLane===i&&g.flashT>0)?'#fff8e1':'#ffffffcc';X.beginPath();X.arc(cx,ty,28,0,7);X.fill();
  X.fillStyle=cols[i];X.font='bold 18px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(labels[i],cx,ty);
  // lane guides
  X.strokeStyle='#0001';X.lineWidth=1;X.beginPath();X.moveTo(cx,80);X.lineTo(cx,ty-40);X.stroke()}
 if(g.flashT>0)g.flashT--;
 const sp=g.speed||4.2,win=g.win||20;
 g.cues.forEach(c=>{const cx=W*((c.lane+.5)/4);const dy=(c.t-g.t)*sp;const y=ty-dy;if(y<-50||y>H) ; else{
  X.fillStyle=c.hit?'#66bb6a':c.missed?'#ef535088':cols[c.lane];X.beginPath();X.arc(cx,y,22,0,7);X.fill();X.strokeStyle='#fff';X.lineWidth=2;X.stroke()}
  if(!g.over&&!c.hit&&!c.missed&&g.t>c.t+win){c.missed=true;g.miss++}});
 capy(W/2,H*.82,.95);X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 const dn=g.diff&&DIFF[g.diff]?DIFF[g.diff].n:'보통';
 X.fillText(`원 4개 · 난이도 ${dn}`,W/2,H*.15);
 X.fillText(`성공 ${g.hits}/${g.cues.length} · 놓침 ${g.miss}`,W/2,H*.21);
 if(g.t<100)X.fillText('노트와 같은 색 원을 타이밍에 탭!',W/2,H*.27);
 const done=g.cues.every(c=>c.hit||c.missed);
 if(!g.over&&done)finishAction(g.hits/g.cues.length)}
function actPlay(g){X.fillStyle='#e1f5fe';X.fillRect(0,0,W,H);X.fillStyle='#c8e6c9';X.fillRect(0,H*.75,W,H);
 const b=g.ball;if(!g.over){b.vy+=.35;b.y+=b.vy;if(b.y>H*.72){b.y=H*.72;b.vy=0;g.miss++;if(g.miss>=3)finishAction(Math.min(1,g.bounces/g.need)*.7)}}
 X.fillStyle='#ec407a';X.beginPath();X.arc(b.x,b.y,22,0,7);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(b.x-6,b.y-6,6,0,7);X.fill();
 capy(W/2,H*.78,1);X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';
 X.fillText(`튕기기 ${g.bounces}/${g.need} · 바닥 ${g.miss}/3`,W/2,H*.16);if(g.t<90)X.fillText('공이 내려올 때 탭해서 튕기세요!',W/2,H*.26);
 if(!g.over&&g.bounces>=g.need)finishAction(Math.min(1,.5+g.bounces/g.need*.5)*(1-g.miss*.1))}
function actStudy(g){X.fillStyle='#e3f2fd';X.fillRect(0,0,W,H);const cols=4,gap=12,cw=(W-40-gap*3)/4,ch=cw,ox=20,oy=H*.28;
 g.cards.forEach((c,i)=>{const col=i%4,row=Math.floor(i/4),x=ox+col*(cw+gap),y=oy+row*(ch+gap);
  X.fillStyle=c.gone?'#c8e6c9':c.open?'#fff':'#64b5f6';roundRect(x,y,cw,ch,12);if(c.open||c.gone){X.font=`${cw*.45}px serif`;X.textAlign='center';X.textBaseline='middle';X.fillText(c.e,x+cw/2,y+ch/2)}});
 const left=Math.max(0,Math.ceil((g.limit-g.t)/60));X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 X.fillText(`짝 맞추기 ${g.matched}/4 · ⏱ ${left}초`,W/2,H*.18);if(g.t<80)X.fillText('같은 그림을 찾아 짝을 맞추세요',W/2,H*.24);
 if(!g.over&&(g.matched>=4||g.t>=g.limit))finishAction(g.matched/4)}
function roundRect(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath();X.fill()}
function actTrick(g){X.fillStyle='#fff8e1';X.fillRect(0,0,W,H);const labels=['👆','👏','💫','🍊'],cols=['#ef9a9a','#90caf9','#a5d6a7','#ffe082'];
 const cx=[W*.25,W*.75,W*.25,W*.75],cy=[H*.42,H*.42,H*.62,H*.62];
 if(g.phase==='show'){g.showT++;if(g.showT===20)g.showI++;if(g.showI>=g.seq.length){g.phase='input';g.player=[]} }
 if(g.phase==='fail'){g.failT--;if(g.failT<=0){if(g.miss>=3)finishAction(Math.min(1,g.hits/g.need)*.5);else{g.phase='show';g.showI=-1;g.showT=0;g.player=[]}}}
 for(let i=0;i<4;i++){const lit=(g.phase==='show'&&g.seq[g.showI]===i)||g.flash===i;X.fillStyle=lit?'#fff':cols[i];X.beginPath();X.arc(cx[i],cy[i],48,0,7);X.fill();X.fillStyle='#6b4423';X.font='32px serif';X.textAlign='center';X.textBaseline='middle';X.fillText(labels[i],cx[i],cy[i])}
 if(g.flashT>0){g.flashT--;if(g.flashT===0)g.flash=-1}
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 X.fillText(g.phase==='show'?'패턴을 기억하세요…':g.phase==='fail'?'앗! 다시…':`따라 하세요 (${g.player.length}/${g.seq.length})`,W/2,H*.18);
 X.fillText(`성공 라운드 ${g.hits}/${g.need}`,W/2,H*.24);capy(W/2,H*.82,.9)}
function actSleep(g){X.fillStyle='#1a237e';X.fillRect(0,0,W,H);for(let i=0;i<20;i++){X.fillStyle='#fff8';X.beginPath();X.arc((i*97+g.t)%W,((i*53)%(H*.5)),2,0,7);X.fill()}
 const bedY=H*.62;X.fillStyle='#5d4037';X.fillRect(W*.1,bedY,W*.8,18);X.fillStyle='#f8bbd0';X.beginPath();X.ellipse(W*.3,bedY,40,18,0,0,7);X.fill();
 capy(W*.45,bedY-10,1.1);X.globalAlpha=.45+g.blanket*.55;X.fillStyle='#7e57c2';X.fillRect(W*.18,bedY-40,W*.6*Math.max(.25,g.blanket),56);X.fillStyle='#b39ddb';X.fillRect(W*.18,bedY-40,W*.6*Math.max(.25,g.blanket),10);X.globalAlpha=1;
 X.fillStyle='#fff';X.font='bold 16px sans-serif';X.textAlign='center';X.fillText('담요를 아래로 쓸어 덮어 주세요',W/2,H*.2);
 X.fillText(`${Math.round(g.blanket*100)}%`,W/2,H*.28);
 if(!g.over&&g.blanket>=1){g.blanket=1;finishAction(1)}
 if(!g.over&&g.t>20*60)finishAction(g.blanket)}
function home(){cancelAnimationFrame(raf);G=null;$('mg').classList.remove('on');$('again').style.display='block'}
$('mgBack').onclick=()=>{if(mode==='action'&&G&&!G.over){finishAction(Math.max(0,(G.hits||0)/Math.max(1,G.need||1)*.5));return}home()};
$('endHome').onclick=home;$('again').onclick=()=>{if(mode==='hub'&&G)startHub(G.k)};
window.__mg={get G(){return G},get mode(){return mode}};
