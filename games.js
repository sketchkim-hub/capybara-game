import {
  HUB_GAMES, HUB_GAME_ORDER, HUB_DIFF, HUB_DIFF_ORDER, HUB_DEFAULT_DIFF, HUB_LABELS, HUB_ENERGY_MSG, BEST_KEY,
  gameParams, difficultyMenu, diffSummary, spendEnergy, hubReward, applyHubReward,
  createRun, claimRun, forfeitRun, normalizeBest, bestScore, recordBest,
  jumpInterval, jumpSpeed, dodgeInterval, fallSpeed, catchInterval,
} from './hub.js';

const $=id=>document.getElementById(id);
const C=$('mgc'),X=C.getContext('2d');let W,H,dpr;
const ANAME={feed:'🍉 먹이 주기',walk:'🌳 산책하기',exercise:'🏃 운동하기',play:'🧶 공놀이',study:'📚 공부하기',trick:'🎵 재롱 연습',sleep:'💤 재우기'};
const DIFF={
 easy:{id:'easy',n:'쉬움',speed:2.4,gap:58,win:32,notes:8,reward:0.85,mul:.72,spawn:1.25,tol:1.35,time:1.4},
 normal:{id:'normal',n:'보통',speed:4.2,gap:38,win:20,notes:10,reward:1.0,mul:1,spawn:1,tol:1,time:1},
 hard:{id:'hard',n:'어려움',speed:6.4,gap:26,win:13,notes:12,reward:1.25,mul:1.45,spawn:.72,tol:.72,time:.75},
 veryhard:{id:'veryhard',n:'매우어려움',speed:9.0,gap:18,win:9,notes:16,reward:1.5,mul:1.9,spawn:.55,tol:.55,time:.55}
};
let pickedDiff='normal', pendingAction=null;
let pendingHub=null, hubPicked=HUB_DEFAULT_DIFF;

function readBest(){
  let raw={};
  try{raw=JSON.parse(localStorage.getItem(BEST_KEY)||'{}');}catch{raw={};}
  const norm=normalizeBest(raw);
  if(JSON.stringify(raw)!==JSON.stringify(norm)) localStorage.setItem(BEST_KEY, JSON.stringify(norm));
  return norm;
}
function writeBest(store){localStorage.setItem(BEST_KEY, JSON.stringify(store));}
function refreshBest(){const b=readBest();for(const k of HUB_GAME_ORDER){const el=$('b_'+k);if(el)el.textContent=bestScore(b,k,'normal');}}
$('gameBtn').onclick=()=>{refreshBest();$('menuM').classList.add('on')};
$('menuX').onclick=()=>$('menuM').classList.remove('on');
document.querySelectorAll('.gm').forEach(b=>b.onclick=()=>openHubDiff(b.dataset.g));
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
function openMG(title){$('menuM').classList.remove('on');$('mg').classList.add('on');$('mgEnd').classList.remove('on');$('mgTitle').textContent=title;$('again').style.display=mode==='hub'?'block':'none';if($('toast'))$('toast').style.opacity=0;size()}
function beginAction(a,diffId){const D=DIFF[diffId||'normal'];mode='action';openMG(ANAME[a]+' · '+D.n);
 const base={k:a,score:0,t:0,over:false,done:false,hits:0,miss:0,need:8,px:W/2,tx:W/2,y:0,vy:0,obs:[],items:[],seq:[],player:[],show:true,phase:'show',beat:0,hold:0,cards:[],flipped:[],matched:0,blanket:0,ball:null,cues:[],cueI:0,diff:diffId||'normal',rewardMul:D.reward,speed:D.speed,win:D.win,mul:D.mul,spawn:D.spawn,tol:D.tol,time:D.time,missLimit:5};
 if(a==='feed'){base.need=Math.max(5,Math.round(8*D.mul));base.px=W/2;base.foodEvery=Math.max(14,Math.round(28*D.spawn));base.foodSp=2.2*D.mul;base.missLimit=Math.max(2,Math.round(5*D.tol))}
 if(a==='walk'){base.need=Math.max(4,Math.round(6*D.mul));base.px=W*0.28;base.tx=base.px;base.dist=0;base.jy=0;base.jvy=0;base.coyote=8;base.jumpBuf=0;base.jumped=0;base.walkSp=5.2*D.mul;base.obsEvery=Math.max(22,Math.round(48*D.spawn));base.flowerEvery=Math.max(28,Math.round(52*D.spawn))}
 if(a==='exercise'){base.need=D.notes;base.cues=[];let t=55;for(let i=0;i<D.notes;i++){base.cues.push({t:t,lane:Math.floor(Math.random()*4),hit:false,missed:false});t+=D.gap+(i%3===0?4:0)}}
 if(a==='play'){base.ball={x:W/2,y:H*.35,vy:0};base.need=Math.max(6,Math.round(10*D.mul));base.bounces=0;base.grav=.28+.12*D.mul;base.missLimit=Math.max(2,Math.round(3*D.tol))}
 if(a==='study'){const pairs=['🍉','🍊','🥕','🌿'];const deck=[...pairs,...pairs].sort(()=>Math.random()-.5);base.cards=deck.map((e,i)=>({e,i,open:false,gone:false}));base.need=4;base.flipped=[];base.limit=Math.round(12*60*D.time)}
 if(a==='trick'){const n=Math.max(2,Math.round(2.5*D.mul));base.seq=[];for(let i=0;i<n;i++)base.seq.push(Math.floor(Math.random()*4));base.player=[];base.phase='show';base.showI=-1;base.showT=0;base.round=0;base.need=Math.max(2,Math.round(2*D.mul));base.showPace=Math.max(10,Math.round(20*D.time))}
 if(a==='sleep'){base.blanket=D.id==='easy'?.22:.08;base.need=1;base.blanketRate=1/Math.max(140,Math.round(210*D.mul))}
 G=base;cancelAnimationFrame(raf);loop()}
window.__startAction=function(a){pendingAction=a;pickedDiff='normal';
  document.querySelectorAll('#diffList button').forEach(b=>b.classList.toggle('sel',b.dataset.d==='normal'));
  const titles={feed:'🍉 먹이 난이도',walk:'🌳 산책 난이도',exercise:'🏃 운동 난이도',play:'🧶 놀이 난이도',study:'📚 공부 난이도',trick:'🎵 재롱 난이도',sleep:'💤 잠 난이도'};
  if($('diffTitle'))$('diffTitle').textContent=titles[a]||'난이도 선택';
  const dm=$('diffM');dm.style.zIndex='50';dm.classList.add('on')};
function pickDiff(d){pickedDiff=d;document.querySelectorAll('#diffList button').forEach(x=>x.classList.toggle('sel',x.dataset.d===d))}
function startPickedAction(){const a=pendingAction;if(!a)return;const S=window.__capy.S,A=window.__capy.ACT[a];
  if(S.energy<(A.need||0)){window.__capy.toast('너무 피곤해요… 잠을 재워 주세요 💤');return}
  if(a!=='feed'&&a!=='sleep'&&S.hunger<10){window.__capy.toast('배고파요! 먹이를 주세요 🍉');return}
  $('diffM').classList.remove('on');beginAction(a,pickedDiff)}
$('diffGo').onclick=startPickedAction;
$('diffX').onclick=()=>{$('diffM').classList.remove('on');pendingAction=null};
document.querySelectorAll('#diffList button').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();pickDiff(b.dataset.d)};
 b.ontouchend=e=>{e.preventDefault();pickDiff(b.dataset.d)}});
$('diffM').addEventListener('click',e=>{if(e.target===e.currentTarget){$('diffM').classList.remove('on');pendingAction=null}});

function openHubDiff(k){if(!HUB_GAMES[k])return;pendingHub=k;hubPicked=HUB_DEFAULT_DIFF;
  const menu=difficultyMenu(k);
  $('hubDiffTitle').textContent=menu.title+' 난이도';
  $('hubDiffDesc').textContent=HUB_GAMES[k].blurb+' · 기본은 보통. 높을수록 어렵고 보상이 커요';
  const store=readBest();
  const list=$('hubDiffList');list.innerHTML='';
  for(const level of menu.levels){
    const b=document.createElement('button');b.type='button';b.dataset.d=level.id;
    if(level.selected)b.classList.add('sel');
    const lab=document.createElement('span');lab.className='lab';lab.textContent=level.label;
    const sm=document.createElement('small');sm.textContent=`최고 ${bestScore(store,k,level.id)}점 · ${level.summary}`;
    b.append(lab,sm);
    b.onclick=e=>{e.preventDefault();e.stopPropagation();pickHub(level.id)};
    list.appendChild(b);
  }
  $('hubDiffM').classList.add('on')}
function pickHub(id){if(!HUB_DIFF[id])return;hubPicked=id;document.querySelectorAll('#hubDiffList button').forEach(x=>x.classList.toggle('sel',x.dataset.d===id))}
function beginHub(k,diffId){if(!HUB_GAMES[k])return false;
  const diff=HUB_DIFF[diffId]?diffId:HUB_DEFAULT_DIFF;
  const S=window.__capy.S;
  const gate=spendEnergy(S.energy);
  if(!gate.ok){window.__capy.toast(gate.message||HUB_ENERGY_MSG);return false}
  if(G&&G.run&&!G.run.paid)forfeitRun(G.run);
  S.energy=gate.energy;window.__capy.ui();
  mode='hub';
  const D=gameParams(k,diff);
  $('hubDiffM').classList.remove('on');
  openMG(HUB_GAMES[k].name+' · '+D.label);
  G={k,diff,D,run:createRun(k,diff),score:0,t:0,over:false,px:W/2,tx:W/2,y:0,vy:0,obs:[],items:[],miss:0,lives:D.lives,maxLives:D.lives,hold:0,inv:0,combo:0};
  if(k==='mole')initMole(G);
  if(k==='match')initMatch(G);
  if(k==='balance')initBalance(G);
  cancelAnimationFrame(raf);loop();return true}
$('hubDiffGo').onclick=()=>{if(pendingHub)beginHub(pendingHub,hubPicked||HUB_DEFAULT_DIFF)};
$('hubDiffX').onclick=()=>$('hubDiffM').classList.remove('on');
$('hubDiffM').addEventListener('click',e=>{if(e.target===e.currentTarget)$('hubDiffM').classList.remove('on')});

const ptr={down:false,x:0,y:0,sx:0,sy:0};
function onDown(e){if(!G||G.over)return;const t=e.touches?e.touches[0]:e;ptr.down=true;ptr.x=t.clientX;ptr.y=t.clientY;ptr.sx=t.clientX;ptr.sy=t.clientY;ptr.t0=performance.now();
 if(mode==='hub'&&G.k==='balance'){G.hold=t.clientX<W/2?-1:1;e.preventDefault();return}
 if(mode==='action'&&G.k==='walk'){if(inJumpBtn(t.clientX,t.clientY)){ptr.jumpBtn=true;doWalkJump(true)}else{G.tx=Math.max(40,Math.min(W-40,t.clientX));ptr.jumpBtn=false}}
 else handleTap(t.clientX,t.clientY);e.preventDefault()}
function onMove(e){if(!G||G.over||!ptr.down)return;const t=e.touches?e.touches[0]:e;ptr.x=t.clientX;ptr.y=t.clientY;
 if(mode==='hub'&&G.k==='balance'){G.hold=t.clientX<W/2?-1:1;e.preventDefault();return}
 if(mode==='action'){if(G.k==='walk'){if(ptr.jumpBtn){if(!inJumpBtn(t.clientX,t.clientY)){ptr.jumpBtn=false;releaseWalkJump()}}else G.tx=Math.max(40,Math.min(W-40,t.clientX))}
  else if(G.k==='feed')G.tx=Math.max(40,Math.min(W-40,t.clientX));
  if(G.k==='sleep'){const dy=t.clientY-ptr.sy;if(dy>0)G.blanket=Math.min(1,G.blanket+dy*(G.blanketRate||1/220));ptr.sy=t.clientY}}
 e.preventDefault()}
function onUp(e){if(G&&G.k==='balance')G.hold=0;
 if(G&&!G.over&&mode==='action'&&G.k==='walk'){if(ptr.jumpBtn)releaseWalkJump();
  else{const dt=performance.now()-(ptr.t0||0);const dx=Math.abs(ptr.x-ptr.sx),dy=Math.abs(ptr.y-ptr.sy);if(dt<200&&dx<18&&dy<18)doWalkJump(false)}}
 ptr.down=false;ptr.jumpBtn=false}
function inJumpBtn(x,y){const bx=W-78,by=H-110,bw=64,bh=64;return x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh}
function doWalkJump(holdable){if(!G||G.k!=='walk'||G.over)return;G.jumpBuf=10;G.jumpHoldable=!!holdable;G.jumpHold=0;tryWalkJump()}
function tryWalkJump(){if(!G||G.k!=='walk')return;const can=G.jy<=0&&(G.coyote>0||G.jy===0);if(can&&G.jumpBuf>0){G.jvy=G.jumpHoldable?8.0:6.0;G.jy=.1;G.coyote=0;G.jumpBuf=0;G.holdingJump=!!G.jumpHoldable;G.jumped++}}
function releaseWalkJump(){if(!G||G.k!=='walk')return;G.holdingJump=false;if(G.jvy>2.5)G.jvy*=.48}
C.addEventListener('pointerdown',onDown);C.addEventListener('pointermove',onMove);C.addEventListener('pointerup',onUp);C.addEventListener('pointercancel',onUp);
function handleTap(x,y){if(mode==='hub'){
  if(G.k==='jump'){if(G.y===0)G.vy=13}
  else if(G.k==='dodge'||G.k==='catch')G.tx=x<W/2?Math.max(40,G.px-90):Math.min(W-40,G.px+90);
  else if(G.k==='mole')whack(x,y);
  else if(G.k==='match')flipCard(x,y);
  return}
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
function loseLife(g,ignoreInv){if(!g||g.over)return false;if(g.inv>0&&!ignoreInv)return false;g.lives-=1;if(!ignoreInv)g.inv=36;if(g.lives<=0)endHub();return true}
function endHub(){if(!G||G.over||!G.run||G.run.paid||G.run.forfeited)return;
 const reward=claimRun(G.run,G.score);if(!reward)return;G.over=true;
 const s=window.__capy.S,store=readBest();
 const isBest=recordBest(store,G.k,G.diff,reward.score);writeBest(store);
 const next=applyHubReward(s,reward);s.coin=next.coin;s.exp=next.exp;s.happy=next.happy;window.__capy.ui();
 const bestN=bestScore(store,G.k,G.diff);
 $('endT').textContent=`게임 끝! ${reward.score}점`;
 $('endP').innerHTML=`${isBest?'🏆 최고 기록 갱신!':''}<br>${reward.label} · 이 난이도 최고 ${bestN}점<br>🪙 +${reward.coin} · ⭐ 경험치 +${reward.xp} · 💖 행복 +${reward.happy}<br>보상 ×${reward.reward}`;
 $('again').style.display='block';$('mgEnd').classList.add('on')}
function loop(){raf=requestAnimationFrame(loop);if(!G)return;
 if(mode==='hub')loopHub();else loopAction()}
function loopHub(){const g=G;if(!g.over)g.t++;if(g.inv>0&&!g.over)g.inv--;
 X.clearRect(0,0,W,H);
 if(g.k==='jump')stepJump(g);
 else if(g.k==='dodge')stepFall(g,false);
 else if(g.k==='catch')stepFall(g,true);
 else if(g.k==='mole')stepMole(g);
 else if(g.k==='match')stepMatch(g);
 else if(g.k==='balance')stepBalance(g);
 $('mgScore').textContent=Math.floor(g.score)+'점'}
function sky(ground,skyC,dirt){X.fillStyle=skyC;X.fillRect(0,0,W,H);X.fillStyle=dirt;X.fillRect(0,ground,W,H-ground)}
function caption(text,y,size=16){X.fillStyle='#6b4423';X.font=`bold ${size}px "Apple SD Gothic Neo","Noto Sans KR",sans-serif`;X.textAlign='center';X.textBaseline='alphabetic';X.fillText(text,W/2,y)}
function stepJump(g){const ground=H*.72;sky(ground,'#bfe3ff','#a5d6a7');
 if(!g.over){const sp=jumpSpeed(g.t,g.diff);g.vy-=.6;g.y=Math.max(0,g.y+g.vy);if(g.y===0)g.vy=0;g.score+=.1;
  const interval=jumpInterval(g.t,g.diff);if(g.t%interval===0)g.obs.push({x:W+30,hit:false});
  g.obs.forEach(o=>o.x-=sp);g.obs=g.obs.filter(o=>o.x>-40)}
 g.obs.forEach(o=>{rock(o.x,ground-12,g.D.rockR);if(!g.over&&!o.hit&&g.inv<=0&&Math.abs(o.x-80)<g.D.hitPad&&g.y<g.D.timing){o.hit=true;loseLife(g)}});
 if(g.inv>0)X.globalAlpha=.55;capy(80,ground-28-g.y,1);X.globalAlpha=1;
 caption(`${g.D.label} · 목숨 ${Math.max(0,g.lives)}`,H*.18);
 if(g.t<130)caption(HUB_GAMES.jump.hint,H*.30,18)}
function stepFall(g,isCatch){const ground=H*.72;sky(ground,'#bfe3ff','#a5d6a7');
 if(!g.over){g.px+=(g.tx-g.px)*.25;
  if(!isCatch)g.score+=.1;
  const rate=isCatch?catchInterval(g.diff):dodgeInterval(g.t,g.diff);
  if(rate>0&&g.t%rate===0){const fruit=isCatch&&Math.random()>=g.D.rockChance;
   g.obs.push({x:20+Math.random()*(W-40),y:60,v:fallSpeed(g.t,Math.random(),g.diff),f:fruit,hit:false})}
  g.obs.forEach(o=>o.y+=o.v)}
 const py=ground-20,rad=isCatch?16:(g.D.radius||16),hitR=g.D.timing;
 g.obs=g.obs.filter(o=>{if(o.f)yuzu(o.x,o.y);else rock(o.x,o.y,rad);
  if(!g.over&&!o.hit&&hit(o.x,o.y,g.px,py,hitR)){
   if(o.f){o.hit=true;g.score+=10;return false}
   if(g.inv>0)return true;
   o.hit=true;
   if(isCatch&&g.D.rockInstant){endHub();return false}
   if(isCatch){g.miss++;if(g.miss>=g.D.lives)endHub();return false}
   loseLife(g);return false}
  if(o.y>H){if(isCatch&&o.f&&!g.over){g.miss++;if(g.miss>=g.D.lives)endHub()}return false}
  return true});
 if(g.inv>0)X.globalAlpha=.55;capy(g.px,py,1,g.tx<g.px-1?-1:1);X.globalAlpha=1;
 caption(isCatch?`${g.D.label} · 실수 ${g.miss}/${g.D.lives}`:`${g.D.label} · 목숨 ${Math.max(0,g.lives)}`,H*.18);
 if(g.t<150)caption(isCatch?HUB_GAMES.catch.hint:HUB_GAMES.dodge.hint,H*.30,18)}
function holePos(i){const col=i%3,row=(i/3)|0,r=Math.min(40,W*0.1);return {x:W*(0.2+col*0.3),y:H*(0.36+row*0.155),r}}
function initMole(g){g.holes=Array.from({length:9},()=>null);g.spawnT=0;g.combo=0;g.holes[4]={kind:'mole',t:g.D.timing,max:g.D.timing}}
function whack(x,y){if(!G||G.over||G.k!=='mole')return;
 for(let i=0;i<9;i++){const p=holePos(i);if(Math.hypot(x-p.x,y-p.y)>p.r+18)continue;
  const h=G.holes[i];if(!h||h.t<=0||!h.kind)continue;
  if(h.kind==='mole'){G.combo=(G.combo||0)+1;G.score+=10+Math.min(12,G.combo*2);h.t=0;h.kind=null}
  else{G.combo=0;h.t=0;h.kind=null;loseLife(G,true)}
  return}}
function drawMole(x,y,r,pop){const rise=r*(0.2+1.25*pop);
 X.fillStyle='#5d4037';X.beginPath();X.ellipse(x-r*.4,y-rise*.95,r*.16,r*.22,0,0,7);X.fill();X.beginPath();X.ellipse(x+r*.4,y-rise*.95,r*.16,r*.22,0,0,7);X.fill();
 X.beginPath();X.ellipse(x,y-rise*.35,r*.72,r*.9,0,0,7);X.fill();
 X.fillStyle='#a1887f';X.beginPath();X.arc(x,y-rise*.72,r*.46,0,7);X.fill();
 X.fillStyle='#fff';X.beginPath();X.arc(x-r*.16,y-rise*.8,r*.1,0,7);X.fill();X.beginPath();X.arc(x+r*.16,y-rise*.8,r*.1,0,7);X.fill();
 X.fillStyle='#111';X.beginPath();X.arc(x-r*.15,y-rise*.78,r*.05,0,7);X.fill();X.beginPath();X.arc(x+r*.15,y-rise*.78,r*.05,0,7);X.fill();
 X.fillStyle='#e57373';X.beginPath();X.ellipse(x,y-rise*.58,r*.12,r*.08,0,0,7);X.fill()}
function stepMole(g){X.fillStyle='#d7ccc8';X.fillRect(0,0,W,H);X.fillStyle='#a5d6a7';X.fillRect(0,0,W,H*.16);
 if(!g.over){g.spawnT++;const alive=g.holes.filter(h=>h&&h.kind&&h.t>0).length;
  if(g.spawnT>=g.D.spawn&&alive<g.D.maxUp){g.spawnT=0;const free=[];for(let i=0;i<9;i++)if(!g.holes[i]||!g.holes[i].kind)free.push(i);
   if(free.length){const i=free[Math.floor(Math.random()*free.length)];const rock=Math.random()<g.D.rockChance;g.holes[i]={kind:rock?'rock':'mole',t:g.D.timing,max:g.D.timing}}}
  for(let i=0;i<9;i++){const h=g.holes[i];if(!h||!h.kind||h.t<=0)continue;h.t--;if(h.t<=0&&h.kind==='mole'&&!g.over){h.kind=null;g.combo=0;loseLife(g,true)}else if(h.t<=0)h.kind=null}
  if(!g.over&&g.t>=g.D.roundFrames)endHub()}
 for(let i=0;i<9;i++){const p=holePos(i),h=g.holes[i];
  X.fillStyle='#8d6e63';X.beginPath();X.ellipse(p.x,p.y+8,p.r*1.02,p.r*0.46,0,0,7);X.fill();
  X.fillStyle='#4e342e';X.beginPath();X.ellipse(p.x,p.y+6,p.r*0.7,p.r*0.24,0,0,7);X.fill();
  const pop=h&&h.kind&&h.t>0?Math.max(0.35,Math.min(1,h.t/7,(h.max-h.t)/7+0.45)):0;
  if(h&&h.kind==='mole'&&pop>0)drawMole(p.x,p.y,p.r,pop);
  if(h&&h.kind==='rock'&&pop>0)rock(p.x,p.y-p.r*0.55*pop,p.r*0.5);}
 capy(W*0.16,H*0.9,.62);
 const left=Math.max(0,Math.ceil((g.D.roundFrames-g.t)/60));
 caption(`${g.D.label} · 목숨 ${Math.max(0,g.lives)} · ${left}초`,H*.12);
 if(g.t<120)caption(HUB_GAMES.mole.hint,H*.2,18)}
const CITRUS=[
 {n:'귤',c:'#ff9800',leaf:'#2e7d32'},{n:'한라봉',c:'#ef6c00',leaf:'#1b5e20'},{n:'유자',c:'#fdd835',leaf:'#7cb342'},{n:'오렌지',c:'#e65100',leaf:'#388e3c'},
 {n:'레몬',c:'#fff59d',leaf:'#689f38'},{n:'자몽',c:'#f48fb1',leaf:'#2e7d32'},{n:'청귤',c:'#9ccc65',leaf:'#33691e'},{n:'금귤',c:'#ffb300',leaf:'#558b2f'}];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
function initMatch(g){const n=g.D.pairs;const deck=[];for(let i=0;i<n;i++)deck.push(i,i);shuffle(deck);
 g.cards=deck.map(id=>({id,open:g.D.peek>0,gone:false}));g.peek=g.D.peek;g.flip=[];g.lock=0;g.matched=0;g.left=g.D.seconds*60;g.mismatch=0}
function cardGeom(g){const cols=g.D.cols,rows=Math.ceil(g.cards.length/cols),gap=10,maxW=W-24,availH=H*0.62;
 let cw=(maxW-gap*(cols-1))/cols,ch=cw*1.2;
 const usedH=ch*rows+gap*(rows-1);
 if(usedH>availH){ch=(availH-gap*(rows-1))/rows;cw=Math.min(cw,ch/1.05)}
 else if(usedH<availH*0.72){const grow=Math.min(1.35,(availH*0.78)/usedH);cw*=grow;ch*=grow;if(cols*cw+(cols-1)*gap>maxW){const s=maxW/(cols*cw+(cols-1)*gap);cw*=s;ch*=s}}
 const gridW=cols*cw+(cols-1)*gap;return {cols,rows,gap,cw,ch,ox:(W-gridW)/2,oy:Math.max(H*0.2,(H*0.78-rows*ch-(rows-1)*gap)/2)}}
function cardAt(g,x,y){const m=cardGeom(g);const i=Math.floor((x-m.ox)/(m.cw+m.gap)),j=Math.floor((y-m.oy)/(m.ch+m.gap));
 if(i<0||j<0||i>=m.cols)return -1;const idx=j*m.cols+i;if(idx<0||idx>=g.cards.length)return -1;
 const cx=m.ox+i*(m.cw+m.gap),cy=m.oy+j*(m.ch+m.gap);
 if(x<cx||y<cy||x>cx+m.cw||y>cy+m.ch)return -1;return idx}
function citrusDraw(x,y,r,info){X.fillStyle=info.c;X.beginPath();X.arc(x,y,r,0,7);X.fill();X.fillStyle='#ffffff55';X.beginPath();X.arc(x-r*.28,y-r*.28,r*.22,0,7);X.fill();
 X.fillStyle=info.leaf;X.beginPath();X.ellipse(x+r*.1,y-r*.85,r*.42,r*.18,.5,0,7);X.fill()}
function flipCard(x,y){if(!G||G.over||G.k!=='match'||G.peek>0||G.lock>0)return;const idx=cardAt(G,x,y);if(idx<0)return;
 const c=G.cards[idx];if(c.gone||c.open||G.flip.length>=2)return;c.open=true;G.flip.push(idx);
 if(G.flip.length<2)return;const [a,b]=G.flip;
 if(G.cards[a].id===G.cards[b].id){G.cards[a].gone=G.cards[b].gone=true;G.matched++;G.score+=50;G.flip=[];
  if(G.matched>=G.D.pairs){G.score+=Math.floor(G.left/6);endHub()}}
 else G.lock=G.D.flip}
function stepMatch(g){X.fillStyle='#fff3e0';X.fillRect(0,0,W,H);X.fillStyle='#ffe0b2';for(let i=0;i<6;i++)X.fillRect(0,i*H/6,W,8);
 if(!g.over){if(g.peek>0)g.peek--;else if(g.peek===0){g.cards.forEach(c=>{if(!c.gone)c.open=false});g.peek=-1}
  if(g.lock>0){g.lock--;if(g.lock===0&&g.flip.length===2){const [a,b]=g.flip;g.cards[a].open=g.cards[b].open=false;g.flip=[];g.mismatch++;if(g.mismatch>=g.D.lives)endHub()}}
  if(g.peek<0&&!g.over){g.left--;if(g.left<=0)endHub()}}
 const m=cardGeom(g);
 g.cards.forEach((c,idx)=>{const col=idx%m.cols,row=Math.floor(idx/m.cols),x=m.ox+col*(m.cw+m.gap),y=m.oy+row*(m.ch+m.gap);
  const show=c.gone||c.open||g.peek>0;X.fillStyle=c.gone?'#dcedc8':show?'#fffaf2':'#fb8c00';roundRect(x,y,m.cw,m.ch,12);
  X.strokeStyle=c.gone?'#aed581':'#ffe0b2';X.lineWidth=2;X.stroke();
  if(show){const info=CITRUS[c.id];citrusDraw(x+m.cw/2,y+m.ch*0.4,Math.min(m.cw,m.ch)*0.2,info);
   X.fillStyle='#6b4423';X.font=`bold ${Math.max(11,Math.floor(m.cw*0.16))}px "Apple SD Gothic Neo","Noto Sans KR",sans-serif`;X.textAlign='center';X.textBaseline='middle';X.fillText(info.n,x+m.cw/2,y+m.ch*0.78)}
  else{X.font=`${Math.floor(m.cw*0.34)}px serif`;X.textAlign='center';X.textBaseline='middle';X.fillText('🍊',x+m.cw/2,y+m.ch/2)}});
 const sec=Math.max(0,Math.ceil(g.left/60));
 caption(`${g.D.label} · 짝 ${g.matched}/${g.D.pairs} · 실수 ${g.mismatch}/${g.D.lives} · ${sec}초`,H*.14);
 if(g.t<110||g.peek>0)caption(g.peek>0?'카드를 잠깐 봐 두세요':HUB_GAMES.match.hint,H*.195,16)}
function initBalance(g){g.desired=0;g.windTarget=0;g.lean=0;g.tilt=0;g.gust=40;g.danger=0;g.left=g.D.seconds*60;g.hold=0}
function stepBalance(g){X.fillStyle='#b3e5fc';X.fillRect(0,0,W,H);X.fillStyle='#ffe082';X.beginPath();X.arc(W*.82,H*.16,28,0,7);X.fill();
 X.fillStyle='#c8e6c9';X.beginPath();X.ellipse(W/2,H*.78,W*.7,H*.22,0,0,7);X.fill();
 if(!g.over){g.gust--;if(g.gust<=0){g.windTarget=(Math.random()*2-1)*g.D.amp;g.gust=g.D.spawn}
  g.desired+=(g.windTarget-g.desired)*g.D.speed;
  g.lean+=(((g.hold||0)*g.D.amp)-g.lean)*g.D.lean;
  g.tilt=g.desired-g.lean;
  if(Math.abs(g.tilt)>g.D.safe){g.danger++;if(g.danger>=g.D.timing){g.danger=0;g.desired=0;g.lean=0;g.tilt=0;g.windTarget=0;g.gust=24;loseLife(g)}}
  else{g.danger=Math.max(0,g.danger-1);const centered=1-Math.abs(g.tilt)/g.D.safe;g.score+=0.2*Math.max(0,centered)}
  g.left--;if(!g.over&&g.left<=0)endHub()}
 const beamY=H*.58;
 X.save();X.translate(W/2,beamY);X.rotate(Math.max(-.75,Math.min(.75,g.tilt*.6)));
 X.fillStyle='#8d6e63';X.beginPath();X.ellipse(0,10,86,16,0,0,7);X.fill();X.fillStyle='#bcaaa4';X.beginPath();X.ellipse(0,4,86,11,0,0,7);X.fill();
 capy(0,-34,1.05);yuzu(10,-86,13);yuzu(6,-108,10);yuzu(8,-126,8);X.restore();
 const bw=Math.min(W-48,320),bx=(W-bw)/2,by=H*.2;
 X.fillStyle='#eadbc8';roundRect(bx,by,bw,16,8);
 const safeW=Math.max(12,bw*(g.D.safe/1.15));X.fillStyle='#c5e1a5';roundRect(W/2-safeW/2,by,safeW,16,8);
 const nx=Math.max(-1,Math.min(1,g.tilt/1.15));
 X.fillStyle=Math.abs(g.tilt)>g.D.safe?'#e53935':'#6b4423';X.beginPath();X.arc(W/2+nx*(bw/2-10),by+8,9,0,7);X.fill();
 const bh=68,bby=H-96,bbw=(W-40)/2;
 X.fillStyle=g.hold<0?'#ffb74d':'#fff3e0';roundRect(12,bby,bbw,bh,18);
 X.fillStyle=g.hold>0?'#ffb74d':'#fff3e0';roundRect(W/2+8,bby,bbw,bh,18);
 X.fillStyle='#6b4423';X.font='bold 18px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';X.textAlign='center';X.textBaseline='middle';
 X.fillText('◀ 왼쪽',12+bbw/2,bby+bh/2);X.fillText('오른쪽 ▶',W/2+8+bbw/2,bby+bh/2);
 const wind=g.windTarget<-0.08?'왼쪽':g.windTarget>0.08?'오른쪽':'잔잔';
 const sec=Math.max(0,Math.ceil(g.left/60));
 caption(`${g.D.label} · 목숨 ${Math.max(0,g.lives)} · ${sec}초`,H*.1);
 caption(g.t<140?HUB_GAMES.balance.hint:`바람 ${wind}`,H*.155,15);
 if(g.inv>0){X.fillStyle='rgba(229,57,53,.13)';X.fillRect(0,0,W,H)}}
function loopAction(){const g=G;X.clearRect(0,0,W,H);if(!g.over)g.t++;
 if(g.k==='feed')actFeed(g);else if(g.k==='walk')actWalk(g);else if(g.k==='exercise')actEx(g);else if(g.k==='play')actPlay(g);else if(g.k==='study')actStudy(g);else if(g.k==='trick')actTrick(g);else if(g.k==='sleep')actSleep(g);
 if(!g.over&&g.t>18*60){const q=Math.max(0,Math.min(1,(g.hits||0)/Math.max(1,g.need||1)));if(g.k==='sleep')finishAction(g.blanket||0);else finishAction(q)}
 $('mgScore').textContent=g.k==='sleep'?Math.round((g.blanket||0)*100)+'%':(Math.floor(g.score)+'점')}
function actFeed(g){X.fillStyle='#fff3e0';X.fillRect(0,0,W,H);X.fillStyle='#ffe0b2';X.fillRect(0,H*.7,W,H*.3);
 g.px+=(g.tx-g.px)*.2;const mouthY=H*.55;capy(g.px,mouthY,1.4,1,.8);
 const every=g.foodEvery||28,fsp=g.foodSp||2.5,mlim=g.missLimit||5;
 if(!g.over&&g.t%every===0)g.items.push({x:40+Math.random()*(W-80),y:70,v:fsp+Math.random()*1.2,kind:['🍉','🥕','🍊'][g.t%3]});
 g.items=g.items.filter(it=>{it.y+=it.v;food(it.x,it.y,it.kind);
  if(!g.over&&hit(it.x,it.y,g.px+28,mouthY-18,48)){g.hits++;g.score+=10;return false}
  if(it.y>H*.85){g.miss++;return false}return true});
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';
 X.fillText((DIFF[g.diff]?DIFF[g.diff].n+' · ':'')+`받은 먹이 ${g.hits}/${g.need} · 놓침 ${g.miss}/${mlim}`,W/2,H*.18);
 if(g.t<90)X.fillText('좌우로 움직여 입을 맞추세요!',W/2,H*.28);
 if(!g.over&&(g.hits>=g.need||g.t>16*60||g.miss>=mlim))finishAction(Math.max(0,g.hits/g.need)*(1-Math.min(.5,g.miss*.08)))}
function actWalk(g){X.fillStyle='#b3e5fc';X.fillRect(0,0,W,H);X.fillStyle='#81c784';X.fillRect(0,H*.65,W,H);
 const ground=H*.65, bodyY=()=>ground-28-g.jy;
 if(!g.over){
  const wsp=g.walkSp||5.2,oE=g.obsEvery||48,fE=g.flowerEvery||52;
  g.dist+=wsp*.8;g.score+=.12;g.px+=(g.tx-g.px)*.22;
  if(g.jy<=0){g.jy=0;g.jvy=0;g.holdingJump=false;g.coyote=Math.min(8,(g.coyote||0)+1)}
  else{g.coyote=0;if(g.holdingJump&&ptr.jumpBtn&&(g.jumpHold||0)<12&&g.jvy>0){g.jumpHold=(g.jumpHold||0)+1;g.jvy=Math.min(13.2,g.jvy+.55)}
   const grav=g.holdingJump&&ptr.jumpBtn&&g.jvy>0?.5:.8;g.jvy-=grav;g.jy+=g.jvy;if(g.jy>88){g.jy=88;if(g.jvy>0)g.jvy=0}if(g.jy<=0){g.jy=0;g.jvy=0;g.holdingJump=false;g.coyote=8}}
  if(g.jumpBuf>0){g.jumpBuf--;tryWalkJump()}
  if(g.t%oE===0)g.obs.push({x:W+30,y:ground-10,type:Math.random()<.55?'rock':'puddle',w:18+Math.random()*14,h:g.t});
  if(g.t%fE===0)g.items.push({x:W+16,y:ground-36-Math.random()*50,got:false});
  g.obs.forEach(o=>o.x-=wsp);g.items.forEach(it=>it.x-=wsp);
 }
 g.obs=g.obs.filter(o=>{
  if(o.type==='puddle')puddle(o.x,ground-4,o.w);else rock(o.x,ground-14,17);
  const half=o.type==='puddle'?o.w+4:20;
  const near=Math.abs(o.x-g.px)<half;
  const cleared=g.jy>(o.type==='puddle'?12:28);
  if(!g.over&&near&&!cleared&&!o.hit){o.hit=true;g.miss++;g.score=Math.max(0,g.score-3)}
  return o.x>-50});
 g.items=g.items.filter(it=>{flower(it.x,it.y);
  if(!g.over&&hit(it.x,it.y,g.px,bodyY(),40)){g.hits++;g.score+=12;return false}
  return it.x>-30});
 const bob=g.jy>0?0:Math.sin(g.t*.45)*2;
 capy(g.px,bodyY()+bob,1,g.tx<g.px-2?-1:1);
 const bx=W-78,by=H-110;X.fillStyle=(ptr.jumpBtn||g.jy>0)?'#ffb74d':'#ff9800';roundRect(bx,by,64,72,18);X.fillStyle='#fff';X.font='bold 12px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('길게↑',bx+32,by+48);X.font='bold 14px sans-serif';X.fillText('점프',bx+32,by+30);X.font='18px serif';X.fillText('⬆',bx+32,by+12);
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textBaseline='alphabetic';
 X.fillText((DIFF[g.diff]?DIFF[g.diff].n+' · ':'')+`꽃 ${g.hits}/${g.need} · 부딪힘 ${g.miss}`,W/2,H*.15);
 if(g.t<160){X.fillText('짧게=살짝 점프 · 점프 길게=높이! 돌은 높이 넘기',W/2,H*.25)}
 if(!g.over&&(g.hits>=g.need||g.dist>2400||g.t>18*60))finishAction(Math.max(.2,Math.min(1,(g.hits/g.need)*.85+(g.dist/2600)*.15)*(1-Math.min(.45,g.miss*.1))))}
function actEx(g){X.fillStyle='#ffe0b2';X.fillRect(0,0,W,H);X.fillStyle='#ffcc80';X.fillRect(0,H*.72,W,H);
 const ty=H*.62, cols=['#ef5350','#42a5f5','#66bb6a','#ffa726'], labels=['①','②','③','④'];
 for(let i=0;i<4;i++){const cx=W*((i+.5)/4);X.strokeStyle=cols[i];X.lineWidth=5;X.beginPath();X.arc(cx,ty,36,0,7);X.stroke();
  X.fillStyle=(g.flashLane===i&&g.flashT>0)?'#fff8e1':'#ffffffcc';X.beginPath();X.arc(cx,ty,28,0,7);X.fill();
  X.fillStyle=cols[i];X.font='bold 18px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(labels[i],cx,ty);
  X.strokeStyle='#0001';X.lineWidth=1;X.beginPath();X.moveTo(cx,80);X.lineTo(cx,ty-40);X.stroke()}
 if(g.flashT>0)g.flashT--;
 const sp=g.speed||4.2,win=g.win||20;
 g.cues.forEach(c=>{const cx=W*((c.lane+.5)/4);const dy=(c.t-g.t)*sp;const y=ty-dy;if(y<-50||y>H) ; else{
  X.fillStyle=c.hit?'#66bb6a':c.missed?'#ef535088':cols[c.lane];X.beginPath();X.arc(cx,y,22,0,7);X.fill();X.strokeStyle='#fff';X.lineWidth=2;X.stroke()}
  if(!g.over&&!c.hit&&!c.missed&&g.t>c.t+win){c.missed=true;g.miss++}});
 capy(W/2,H*.82,.95);X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 const dn=g.diff&&DIFF[g.diff]?DIFF[g.diff].n:'보통';
 X.fillStyle='#6b4423';X.font='bold 18px sans-serif';X.fillText(`원 4개 · ${dn}`,W/2,H*.14);X.font='bold 14px sans-serif';X.fillText(`속도 ${g.speed} · 판정 ±${g.win}`,W/2,H*.185);
 X.fillText(`성공 ${g.hits}/${g.cues.length} · 놓침 ${g.miss}`,W/2,H*.21);
 if(g.t<100)X.fillText('노트와 같은 색 원을 타이밍에 탭!',W/2,H*.27);
 const done=g.cues.every(c=>c.hit||c.missed);
 if(!g.over&&done)finishAction(g.hits/g.cues.length)}
function actPlay(g){X.fillStyle='#e1f5fe';X.fillRect(0,0,W,H);X.fillStyle='#c8e6c9';X.fillRect(0,H*.75,W,H);
 const b=g.ball,mlim=g.missLimit||3,grav=g.grav||.35;
 if(!g.over){b.vy+=grav;b.y+=b.vy;if(b.y>H*.72){b.y=H*.72;b.vy=0;g.miss++;if(g.miss>=mlim)finishAction(Math.min(1,g.bounces/g.need)*.7)}}
 X.fillStyle='#ec407a';X.beginPath();X.arc(b.x,b.y,22,0,7);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(b.x-6,b.y-6,6,0,7);X.fill();
 capy(W/2,H*.78,1);X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';
 X.fillText((DIFF[g.diff]?DIFF[g.diff].n+' · ':'')+`튕기기 ${g.bounces}/${g.need} · 바닥 ${g.miss}/${mlim}`,W/2,H*.16);if(g.t<90)X.fillText('공이 내려올 때 탭해서 튕기세요!',W/2,H*.26);
 if(!g.over&&g.bounces>=g.need)finishAction(Math.min(1,.5+g.bounces/g.need*.5)*(1-g.miss*.1))}
function actStudy(g){X.fillStyle='#e3f2fd';X.fillRect(0,0,W,H);const cols=4,gap=12,cw=(W-40-gap*3)/4,ch=cw,ox=20,oy=H*.28;
 g.cards.forEach((c,i)=>{const col=i%4,row=Math.floor(i/4),x=ox+col*(cw+gap),y=oy+row*(ch+gap);
  X.fillStyle=c.gone?'#c8e6c9':c.open?'#fff':'#64b5f6';roundRect(x,y,cw,ch,12);if(c.open||c.gone){X.font=`${cw*.45}px serif`;X.textAlign='center';X.textBaseline='middle';X.fillText(c.e,x+cw/2,y+ch/2)}});
 const left=Math.max(0,Math.ceil((g.limit-g.t)/60));X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 X.fillText((DIFF[g.diff]?DIFF[g.diff].n+' · ':'')+`짝 ${g.matched}/4 · ⏱ ${left}초`,W/2,H*.18);if(g.t<80)X.fillText('같은 그림을 찾아 짝을 맞추세요',W/2,H*.24);
 if(!g.over&&(g.matched>=4||g.t>=g.limit))finishAction(g.matched/4)}
function roundRect(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath();X.fill()}
function actTrick(g){X.fillStyle='#fff8e1';X.fillRect(0,0,W,H);const labels=['👆','👏','💫','🍊'],cols=['#ef9a9a','#90caf9','#a5d6a7','#ffe082'];
 const cx=[W*.25,W*.75,W*.25,W*.75],cy=[H*.42,H*.42,H*.62,H*.62];
 if(g.phase==='show'){g.showT++;const pace=g.showPace||20;if(g.showT>=pace){g.showT=0;g.showI++}if(g.showI>=g.seq.length){g.phase='input';g.player=[]} }
 if(g.phase==='fail'){g.failT--;if(g.failT<=0){if(g.miss>=3)finishAction(Math.min(1,g.hits/g.need)*.5);else{g.phase='show';g.showI=-1;g.showT=0;g.player=[]}}}
 for(let i=0;i<4;i++){const lit=(g.phase==='show'&&g.seq[g.showI]===i)||g.flash===i;X.fillStyle=lit?'#fff':cols[i];X.beginPath();X.arc(cx[i],cy[i],48,0,7);X.fill();X.fillStyle='#6b4423';X.font='32px serif';X.textAlign='center';X.textBaseline='middle';X.fillText(labels[i],cx[i],cy[i])}
 if(g.flashT>0){g.flashT--;if(g.flashT===0)g.flash=-1}
 X.fillStyle='#6b4423';X.font='bold 16px sans-serif';X.textAlign='center';X.textBaseline='alphabetic';
 X.fillText(g.phase==='show'?'패턴을 기억하세요…':g.phase==='fail'?'앗! 다시…':`따라 하세요 (${g.player.length}/${g.seq.length})`,W/2,H*.18);
 X.fillText((DIFF[g.diff]?DIFF[g.diff].n+' · ':'')+`성공 ${g.hits}/${g.need}`,W/2,H*.24);capy(W/2,H*.82,.9)}
function actSleep(g){X.fillStyle='#1a237e';X.fillRect(0,0,W,H);for(let i=0;i<20;i++){X.fillStyle='#fff8';X.beginPath();X.arc((i*97+g.t)%W,((i*53)%(H*.5)),2,0,7);X.fill()}
 const bedY=H*.62;X.fillStyle='#5d4037';X.fillRect(W*.1,bedY,W*.8,18);X.fillStyle='#f8bbd0';X.beginPath();X.ellipse(W*.3,bedY,40,18,0,0,7);X.fill();
 capy(W*.45,bedY-10,1.1);X.globalAlpha=.45+g.blanket*.55;X.fillStyle='#7e57c2';X.fillRect(W*.18,bedY-40,W*.6*Math.max(.25,g.blanket),56);X.fillStyle='#b39ddb';X.fillRect(W*.18,bedY-40,W*.6*Math.max(.25,g.blanket),10);X.globalAlpha=1;
 X.fillStyle='#fff';X.font='bold 16px sans-serif';X.textAlign='center';X.fillText('담요를 아래로 쓸어 덮어 주세요',W/2,H*.2);
 X.fillText(`${Math.round(g.blanket*100)}%`,W/2,H*.28);
 if(!g.over&&g.blanket>=1){g.blanket=1;finishAction(1)}
 if(!g.over&&g.t>20*60)finishAction(g.blanket)}
function home(){let forfeited=false;
 if(mode==='hub'&&G&&!G.over&&G.run&&!G.run.paid)forfeited=forfeitRun(G.run);
 cancelAnimationFrame(raf);G=null;$('mg').classList.remove('on');$('mgEnd').classList.remove('on');$('again').style.display='block';
 if(forfeited&&window.__capy)window.__capy.toast('중간에 나가서 보상은 없어요')}
$('mgBack').onclick=()=>{if(mode==='action'&&G&&!G.over){finishAction(Math.max(0,(G.hits||0)/Math.max(1,G.need||1)*.5));return}home()};
$('endHome').onclick=home;
$('again').onclick=()=>{if(mode==='hub'&&G)beginHub(G.k,G.diff)};
window.__mg={get G(){return G},get mode(){return mode}};
window.__care={DIFF};
window.__hub={
  HUB_GAMES,HUB_GAME_ORDER,HUB_DIFF,HUB_DIFF_ORDER,HUB_DEFAULT_DIFF,HUB_LABELS,HUB_ENERGY_MSG,
  gameParams,difficultyMenu,diffSummary,hubReward,bestScore,
  openHubDiff,beginHub,endHub,home,
  get G(){return G},get mode(){return mode},get picked(){return hubPicked}
};
