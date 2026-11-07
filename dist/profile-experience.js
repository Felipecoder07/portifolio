const paths={arrow:'M7 17 17 7M7 7h10v10',back:'m12 5-7 7 7 7M5 12h14',down:'M12 4v16m-6-6 6 6 6-6',home:'m3 10 9-7 9 7v10H3ZM9 20v-7h6v7',grid:'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',file:'M14 2H5v20h14V7Zm0 0v5h5M8 12h8M8 16h6',code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',terminal:'m4 6 6 6-6 6m9 0h7',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',moon:'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',close:'m6 6 12 12M6 18 18 6',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',map:'m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3Zm6-3v17m6-14v17',github:'M9 19c-5 1-5-3-7-3m14 6v-4c0-1-.3-2-1-2.5 4-.5 7-2 7-6a5 5 0 0 0-1.5-3.5c.4-1 .4-2.5-.2-3.5-2 0-3.5 1-4 1.5a13 13 0 0 0-7 0C8 3.5 6.5 2.5 4.5 2.5c-.6 1-.6 2.5-.2 3.5A5 5 0 0 0 3 9.5c0 4 3 5.5 7 6-.7.5-1 1.5-1 2.5v4'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',paths[name]||paths.arrow);svg.append(p);return svg;}
const symbols={'↗':'arrow','↘':'down','↓':'down','←':'back','⌂':'home','▦':'grid','☺':'user','≡':'file','⌘':'github','☼':'sun','☾':'moon','×':'close','✦':'spark','⌁':'map','◈':'grid','◎':'user','⚙':'sun'};
function replaceSymbols(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style,svg,.terminal-body')&&Object.keys(symbols).some(s=>n.textContent.includes(s)))nodes.push(n);}for(const n of nodes){const fragment=document.createDocumentFragment();for(const part of n.textContent.split(/([↗↘↓←⌂▦☺≡⌘☼☾×✦⌁◈◎⚙])/)){fragment.append(symbols[part]?icon(symbols[part]):document.createTextNode(part));}n.replaceWith(fragment);}}
replaceSymbols(document.body);
document.querySelectorAll('.project-footer a').forEach(a=>a.replaceChildren(icon('code'),document.createTextNode(' Código')));
const wm=document.querySelector('.wordmark');if(wm){wm.setAttribute('aria-label','felipe');const cur=wm.querySelector('span')||Object.assign(document.createElement('span'),{textContent:'_'});const txt=document.createTextNode('');wm.replaceChildren(txt,cur);const word='felipe';let i=0;const type=()=>{if(i<word.length){txt.nodeValue+=word[i++];setTimeout(type,120);}};setTimeout(type,250);}

// Siamese oneko cat mascot (walks around following the cursor, with toggle control)
(()=>{
 const nekoEl=document.createElement('div');
 nekoEl.id='oneko';
 nekoEl.setAttribute('aria-hidden','true');

 const spriteSets={
  idle:[[-3,-3]],
  alert:[[-7,-3]],
  pet:[[-5,0],[-7,0]],
  scratchSelf:[[-5,0],[-6,0],[-7,0]],
  tired:[[-3,-2]],
  sleeping:[[-2,0],[-2,-1]],
  N:[[-1,-2],[-1,-3]],
  NE:[[0,-2],[0,-3]],
  E:[[-3,0],[-3,-1]],
  SE:[[-5,-1],[-5,-2]],
  S:[[-6,-3],[-7,-2]],
  SW:[[-5,-3],[-6,-1]],
  W:[[-4,-2],[-4,-3]],
  NW:[[-1,0],[-1,-1]],
  scratchWallN:[[0,0],[0,-1]],
  scratchWallS:[[-7,-1],[-6,-2]],
  scratchWallE:[[-2,-2],[-2,-3]],
  scratchWallW:[[-4,0],[-4,-1]]
 };

 const topbar=document.querySelector('.topbar .topright')||document.querySelector('.topbar');
 const toggleBtn=document.createElement('button');
 toggleBtn.type='button';
 toggleBtn.className='cat-link-btn';
 if(topbar)topbar.prepend(toggleBtn);

 let enabled=true;
 try{if(localStorage.getItem('felipe-cat')==='off')enabled=false;}catch{}
 function applyEnabled(){
  nekoEl.classList.toggle('disabled',!enabled);
  toggleBtn.textContent=enabled?'desativar gato':'ativar gato';
 }
 toggleBtn.onclick=()=>{
  enabled=!enabled;
  try{localStorage.setItem('felipe-cat',enabled?'on':'off');}catch{}
  applyEnabled();
 };

 let nekoPosX=120,nekoPosY=120;
 let mousePosX=180,mousePosY=150;
 let frameCount=0,idleTime=0,idleAnimation=null,idleAnimationFrame=0,alertTicks=0;
 let petTimer=0,lastHeartTime=0,rubDist=0,lastRubX=0,lastRubY=0;
 const speed=110; // pixels per second

 function setSprite(name,frame){
  const list=spriteSets[name]||spriteSets.idle;
  const sprite=list[frame%list.length];
  nekoEl.style.backgroundPosition=`${sprite[0]*64}px ${sprite[1]*64}px`;
 }

 function updatePosition(purrOffset=0){
  nekoEl.style.transform=`translate3d(${Math.round(nekoPosX-32+purrOffset)}px,${Math.round(nekoPosY-32)}px,0)`;
 }

 function spawnHeart(){
  const now=performance.now();
  if(now-lastHeartTime<180)return;
  lastHeartTime=now;
  const h=document.createElementNS('http://www.w3.org/2000/svg','svg');
  h.setAttribute('viewBox','0 0 9 8');
  h.setAttribute('class','neko-heart');
  h.style.left=`${nekoPosX+(Math.random()*26-13)}px`;
  h.style.top=`${nekoPosY-24}px`;
  h.innerHTML='<path d="M1 1h2v1h1V1h1v1h1V1h2v1h1v2H8v1H7v1H6v1H5v1H4V7H3V6H2V5H1V4H0V2h1V1z" fill="#ff5a79"/><path d="M2 2h1v1H2V2z" fill="#ffc2cd"/>';
  document.body.appendChild(h);
  setTimeout(()=>h.remove(),850);
 }

 function petCat(){
  petTimer=0.95;
  alertTicks=0;
  idleTime=2;
  spawnHeart();
 }

 setSprite('idle',0);
 updatePosition();
 document.body.appendChild(nekoEl);
 applyEnabled();

 document.addEventListener('pointermove',e=>{
  mousePosX=e.clientX;
  mousePosY=e.clientY;
 },{passive:true});

 nekoEl.addEventListener('pointerdown',e=>{
  e.preventDefault();
  petCat();
 });

 nekoEl.addEventListener('pointermove',e=>{
  const d=Math.hypot(e.clientX-lastRubX,e.clientY-lastRubY);
  lastRubX=e.clientX;
  lastRubY=e.clientY;
  rubDist+=d;
  if(rubDist>18){
   rubDist=0;
   petCat();
  }
 });

 function resetIdleAnimation(){
  idleAnimation=null;
  idleAnimationFrame=0;
 }

 function stepIdleTick(){
  idleTime+=1;
  if(idleTime>10&&Math.floor(Math.random()*60)===0&&idleAnimation==null){
   const available=['sleeping','scratchSelf'];
   if(nekoPosX<48)available.push('scratchWallW');
   if(nekoPosY<48)available.push('scratchWallN');
   if(nekoPosX>innerWidth-48)available.push('scratchWallE');
   if(nekoPosY>innerHeight-48)available.push('scratchWallS');
   idleAnimation=available[Math.floor(Math.random()*available.length)];
  }

  switch(idleAnimation){
   case 'sleeping':
    if(idleAnimationFrame<8){
     setSprite('tired',0);
     break;
    }
    setSprite('sleeping',Math.floor(idleAnimationFrame/4));
    if(idleAnimationFrame>192)resetIdleAnimation();
    break;
   case 'scratchWallN':
   case 'scratchWallS':
   case 'scratchWallE':
   case 'scratchWallW':
   case 'scratchSelf':
    setSprite(idleAnimation,idleAnimationFrame);
    if(idleAnimationFrame>9)resetIdleAnimation();
    break;
   default:
    setSprite('idle',0);
    return;
  }
  idleAnimationFrame+=1;
 }

 const dirs=['E','SE','S','SW','W','NW','N','NE'];
 let currentDir='S';

 let prevTime=performance.now(),spriteTimer=0;
 function onAnimationFrame(now){
  requestAnimationFrame(onAnimationFrame);
  if(!enabled)return;
  const dt=Math.min((now-prevTime)/1000,0.05);
  prevTime=now;
  spriteTimer+=dt;

  // Petting state: closes eyes, purrs gently, and stays under the hand
  if(petTimer>0){
   petTimer=Math.max(0,petTimer-dt);
   updatePosition(Math.sin(now*0.045)*1.2);
   if(spriteTimer>=0.18){
    spriteTimer=0;
    frameCount+=1;
    setSprite('pet',frameCount);
   }
   if(petTimer===0)updatePosition(0);
   return;
  }

  const diffX=mousePosX-nekoPosX;
  const diffY=mousePosY-nekoPosY;
  const distance=Math.hypot(diffX,diffY);

  if(distance<52){
   if(spriteTimer>=0.12){
    spriteTimer=0;
    stepIdleTick();
   }
   return;
  }

  // Wake up / alert pause before starting to walk
  if(idleTime>1){
   alertTicks=4;
   idleTime=0;
   resetIdleAnimation();
   setSprite('alert',0);
  }
  if(alertTicks>0){
   if(spriteTimer>=0.1){
    spriteTimer=0;
    alertTicks-=1;
   }
   return;
  }

  // Smooth 60fps position update
  const step=Math.min(distance-48,speed*dt);
  if(step>0){
   nekoPosX+=(diffX/distance)*step;
   nekoPosY+=(diffY/distance)*step;
   nekoPosX=Math.min(Math.max(32,nekoPosX),innerWidth-32);
   nekoPosY=Math.min(Math.max(32,nekoPosY),innerHeight-32);
   updatePosition();
  }

  // 8-way direction from angle
  const angle=Math.atan2(diffY,diffX);
  const idx=Math.round(((angle+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8;
  currentDir=dirs[idx];

  if(spriteTimer>=0.12){
   spriteTimer=0;
   frameCount+=1;
   setSprite(currentDir,frameCount);
  }
 }
 requestAnimationFrame(onAnimationFrame);
})();
