import * as THREE from './three.js';
const Q=new URLSearchParams(location.search);
const KEY='capy_save_v1';
const STAGES=[{k:'baby',n:'아기',min:0,s:.6},{k:'child',n:'어린이',min:150,s:.8},{k:'adult',n:'어른',min:450,s:1}];
const ITEMS=[{id:'rug',n:'🟫 러그',p:30},{id:'plant',n:'🪴 화분',p:40},{id:'bath',n:'🍊 유자 온천',p:80},{id:'lamp',n:'💡 스탠드',p:50},{id:'bed',n:'🛏️ 쿠션 침대',p:60},{id:'books',n:'📚 책장',p:70}];
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{name:'',exp:0,coin:50,hunger:70,happy:70,energy:80,fit:30,smart:30,clean:80,own:[],t:Date.now()};
if(Q.get('stage')){S.exp=STAGES.find(x=>x.k==Q.get('stage')).min+1;S.name=S.name||'바라'}
if(Q.get('reset'))S={...S,name:'',own:[]};
const save=()=>{S.t=Date.now();localStorage.setItem(KEY,JSON.stringify(S))};
// offline decay
const hrs=Math.min((Date.now()-S.t)/36e5,24);S.hunger=Math.max(0,S.hunger-hrs*4);S.energy=Math.min(100,S.energy+hrs*5);S.happy=Math.max(0,S.happy-hrs*2);
const stage=()=>[...STAGES].reverse().find(x=>S.exp>=x.min);
// scene
const R=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,preserveDrawingBuffer:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf3d9b1);const cam=new THREE.PerspectiveCamera(40,1,.1,100);
scene.add(new THREE.HemisphereLight(0xfff6e5,0x9c7a5b,1.1));
const sun=new THREE.DirectionalLight(0xffffff,1.4);sun.position.set(3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
const floor=new THREE.Mesh(new THREE.CircleGeometry(14,48),M(0xf3d9b1));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const wall=new THREE.Mesh(new THREE.PlaneGeometry(30,12),M(0xfde7c7));wall.position.set(0,3,-3);scene.add(wall);
const park=new THREE.Group();scene.add(park);park.visible=false;
for(let i=0;i<7;i++){const t=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,1),M(0x8d6e63));tr.position.y=.5;const lf=new THREE.Mesh(new THREE.SphereGeometry(.6,16,12),M(0x81c784));lf.position.y=1.3;t.add(tr,lf);t.position.set(-3+i,0,-2.2-(i%2)*.6);park.add(t)}
// capybara
function sph(r,c,sx=1,sy=1,sz=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),M(c));m.scale.set(sx,sy,sz);m.castShadow=true;return m}
const FUR=0xc98f5e,DARK=0x7a4f2e,NOSE=0x5a3a22;
const capy=new THREE.Group(),body=new THREE.Group();capy.add(body);scene.add(capy);
const torso=sph(.6,FUR,1.35,.95,1);torso.position.y=.65;body.add(torso);
const head=new THREE.Group();head.position.set(.78,1.0,0);body.add(head);
const skull=sph(.42,FUR,1.15,1,1);head.add(skull);
const snout=sph(.3,FUR,1,.85,1.05);snout.position.set(.36,-.08,0);head.add(snout);
const nose=sph(.13,NOSE,.6,.5,1.6);nose.position.set(.62,-.02,0);head.add(nose);
const eyes=[];for(const z of[-.24,.24]){const e=sph(.085,0x1b1b1b);e.position.set(.33,.14,z*1.15);head.add(e);eyes.push(e);const hl=sph(.025,0xffffff);hl.position.set(.4,.18,z*1.2);head.add(hl);
 const ear=sph(.1,DARK,.6,1,1);ear.position.set(-.18,.38,z*1.1);head.add(ear);const ch=sph(.07,0xff9e9e,1,.6,.4);ch.position.set(.42,-.08,z*1.2);ch.material.transparent=true;ch.material.opacity=.6;head.add(ch)}
const legs=[];for(const[x,z]of[[.45,-.3],[.45,.3],[-.45,-.3],[-.45,.3]]){const l=sph(.17,DARK,1,1.4,1);l.position.set(x,.2,z);body.add(l);legs.push(l)}
const hat=new THREE.Group();const yz=sph(.18,0xffb300);const lf=sph(.07,0x66bb6a,1.6,.4,1);lf.position.y=.17;hat.add(yz,lf);hat.position.set(-.05,.48,0);head.add(hat);
// props
const props={};const P=(id,g,x,z)=>{g.position.set(x,0,z);g.visible=false;scene.add(g);props[id]=g};
{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.03,40),M(0xc0896a));m.position.y=.02;m.receiveShadow=true;g.add(m);P('rug',g,0,0)}
{const g=new THREE.Group();const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.2,.4),M(0xe57373));pot.position.y=.2;const pl=sph(.4,0x4caf50);pl.position.y=.7;g.add(pot,pl);P('plant',g,-2.2,-1.6)}
{const g=new THREE.Group();const w=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.12,32),M(0x81d4fa));w.position.y=.06;g.add(w);for(let i=0;i<5;i++){const y=sph(.12,0xffb300);y.position.set(Math.cos(i)*.5,.15,Math.sin(i*2)*.5);g.add(y)}P('bath',g,2.1,1.2)}
{const g=new THREE.Group();const st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.6),M(0x555555));st.position.y=.8;const sh=new THREE.Mesh(new THREE.ConeGeometry(.3,.35,24,1,true),new THREE.MeshStandardMaterial({color:0xfff59d,emissive:0xffe082,emissiveIntensity:.6,side:2}));sh.position.y=1.65;g.add(st,sh);P('lamp',g,2.3,-1.7)}
{const g=new THREE.Group();const b=sph(.9,0xf8bbd0,1,.25,.7);b.position.y=.15;g.add(b);P('bed',g,-2,.9)}
{const g=new THREE.Group();const sh=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.4,.4),M(0xa1887f));sh.position.y=.7;g.add(sh);[0xe57373,0x64b5f6,0xffd54f,0x81c784].forEach((c,i)=>{const bk=new THREE.Mesh(new THREE.BoxGeometry(.18,.4,.3),M(c));bk.position.set(-.4+i*.25,1.05,.1);g.add(bk)});P('books',g,-.6,-2.6)}
const fx=new THREE.Group();scene.add(fx);
function spawn(c,n=6,y=1.6){for(let i=0;i<n;i++){const m=sph(.08,c);m.position.set(capy.position.x+(Math.random()-1.0),y,(Math.random()-1.0));m.userData.v=new THREE.Vector3((Math.random()-1.0)*.02,.03,0);m.userData.life=60;fx.add(m)}}
// UI
const $=id=>document.getElementById(id);
const toast=t=>{$('toast').textContent=t;$('toast').style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>$('toast').style.opacity=0,1600)};
const STATS=[['hunger','🍉 배부름'],['happy','💖 행복'],['energy','⚡ 체력'],['fit','💪 근력'],['smart','🧠 지능'],['clean','🛁 청결']];
function ui(){const st=stage();$('name').textContent=S.name||'카피바라';$('stage').textContent=st.n;$('coin').textContent='🪙 '+S.coin;
 $('bars').innerHTML=STATS.map(([k,n])=>`<div>${n} ${Math.round(S[k])}<div class="bar"><i style="width:${S[k]}%;background:${S[k]<25?'#ef5350':'#8bc34a'}"></i></div></div>`).join('');
 const nx=STAGES[STAGES.indexOf(st)+1];$('exp').textContent=nx?`성장 경험치 ${S.exp}/${nx.min} → ${nx.n}까지`:`경험치 ${S.exp} · 다 자란 어른 카피바라!`;
 capy.scale.setScalar(st.s);hat.visible=st.k!=='baby';
 ITEMS.forEach(i=>props[i.id].visible=S.own.includes(i.id));save()}
const cl=v=>Math.max(0,Math.min(100,v));
let anim=null,at=0;
const ACT={
 feed:{need:0,d:{hunger:30,happy:5,clean:-5},x:5,c:2,m:'냠냠! 수박이 맛있어요 🍉',fx:0xe53935},
 walk:{need:15,d:{energy:-15,happy:15,fit:5,hunger:-10,clean:-10},x:15,c:8,m:'산책 최고! 풀냄새가 좋아요 🌳',fx:0x66bb6a},
 exercise:{need:20,d:{energy:-20,fit:15,hunger:-12},x:15,c:6,m:'영차영차! 근력이 늘었어요 💪',fx:0xffa726},
 play:{need:10,d:{energy:-10,happy:20,hunger:-6},x:10,c:5,m:'털실 놀이 재밌어요 🧶',fx:0xec407a},
 study:{need:10,d:{energy:-10,smart:15,happy:-3},x:15,c:6,m:'열공 중! 지능이 올랐어요 📚',fx:0x42a5f5},
 trick:{need:5,d:{energy:-5,happy:10},x:8,c:10,m:'',fx:0xffd54f},
 sleep:{need:0,d:{energy:50,hunger:-10,clean:5},x:3,c:0,m:'쿨쿨… 체력 회복 💤',fx:0x9575cd}};
const TRICKS=['빙글빙글 돌기','점프 재롱','고개 갸웃','유자 올리기'];
function act(a){if(a==='decor'){openShop();return}
 // 돌보기 미니게임은 난이도 창 먼저, 시작! 에서 체력/배고픔 검사
 if(window.__startAction){window.__startAction(a);return}
 const A=ACT[a];if(S.energy<A.need){toast('너무 피곤해요… 잠을 재워 주세요 💤');return}
 if(a!=='feed'&&a!=='sleep'&&S.hunger<10){toast('배고파요! 먹이를 주세요 🍉');return}
 finishAction(a,1)}
function finishAction(a,quality,rewardMul=1){quality=Math.max(0,Math.min(1,quality));rewardMul=rewardMul||1;const A=ACT[a],mul=.4+.6*quality;
 for(const k in A.d){let v=A.d[k];if(v>0)v=Math.round(v*mul);S[k]=cl(S[k]+v)}
 const before=stage();const xp=Math.max(1,Math.round(A.x*mul*rewardMul)),coin=Math.round(A.c*mul*rewardMul);S.exp+=xp;S.coin+=coin;
 let msg=A.m;if(a==='trick'){const lv=Math.min(TRICKS.length,1+Math.floor(S.smart/25));msg=`재롱: ${TRICKS[Math.floor(Math.random()*lv)]}! 🎵`}
 anim=a;at=0;park.visible=a==='walk';wall.visible=a!=='walk';spawn(A.fx);toast(msg+(quality<.5?' (아쉬워요)':quality>.85?' (완벽!)':''));
 if(stage()!==before)setTimeout(()=>{toast(`🎉 ${S.name}(이)가 ${stage().n} 카피바라로 성장했어요!`);spawn(0xffeb3b,20)},1800);
 ui();return{msg,xp,coin,quality}}
document.querySelectorAll('#acts button').forEach(b=>b.onclick=()=>act(b.dataset.a));
function openShop(){$('shop').innerHTML=ITEMS.map(i=>`<button data-i="${i.id}" class="${S.own.includes(i.id)?'own':''}">${i.n}<br>${S.own.includes(i.id)?'배치됨 ✓':'🪙 '+i.p}</button>`).join('');
 $('shop').querySelectorAll('button').forEach(b=>b.onclick=()=>{const it=ITEMS.find(x=>x.id==b.dataset.i);if(S.own.includes(it.id)){S.own=S.own.filter(x=>x!=it.id)}else if(S.coin>=it.p){S.coin-=it.p;S.own.push(it.id);S.happy=cl(S.happy+10);toast(it.n+' 배치 완료!')}else toast('코인이 부족해요 🪙');ui();openShop()});
 $('decorM').classList.add('on')}
$('decorX').onclick=()=>$('decorM').classList.remove('on');
if(!S.name)$('nameM').classList.add('on');
$('nameB').onclick=()=>{const n=$('nameI').value.trim();if(!n){toast('이름을 입력해 주세요');return}S.name=n;$('nameM').classList.remove('on');toast(`반가워, ${n}! 🦫`);ui()};
setInterval(()=>{S.hunger=cl(S.hunger-1);S.happy=cl(S.happy-1.0);S.clean=cl(S.clean-.3);ui()},30000);
// loop
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.position.set(0,2.2,w<h?11.5:5);cam.lookAt(0,.7,0);cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
let t=0;capy.rotation.y=-1.0;
R.setAnimationLoop(()=>{t+=.016;at+=.016;const b=Math.sin(t*2)*.02;body.position.y=b;head.rotation.z=Math.sin(t*1.3)*.05;
 eyes.forEach(e=>e.scale.y=(t%4<.12)?.1:1);
 if(anim&&at<2.4){const p=at*8;
  if(anim==='feed')head.rotation.z=-.3+Math.sin(p)*.15;
  if(anim==='walk'){capy.position.x=Math.sin(at*1.3)*1.2;legs.forEach((l,i)=>l.position.y=.2+Math.max(0,Math.sin(p+i*Math.PI))*.08)}
  if(anim==='exercise')body.position.y=Math.abs(Math.sin(p*.7))*.5;
  if(anim==='play')capy.rotation.y=-1.0+Math.sin(p*.5)*.8;
  if(anim==='study')head.rotation.z=-.2+Math.sin(p*.3)*.1;
  if(anim==='trick'){capy.rotation.y=-1.0+at*Math.PI*2/2.4;body.position.y=Math.abs(Math.sin(p*.6))*.3}
  if(anim==='sleep'){eyes.forEach(e=>e.scale.y=.1);body.rotation.z=-.08}
 }else if(anim){anim=null;capy.position.x=0;capy.rotation.y=-1.0;body.rotation.z=0;park.visible=false;wall.visible=true}
 fx.children.slice().forEach(m=>{m.position.add(m.userData.v);if(--m.userData.life<0)fx.remove(m)});
 R.render(scene,cam)});
ui();
window.__capy={S,act,ui,toast,finishAction,ACT};
