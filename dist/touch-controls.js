export function steeringAxis(offset,radius,deadZone=.1){
 const value=Math.max(-1,Math.min(1,offset/radius)),amount=Math.abs(value);
 return amount<=deadZone?0:Math.sign(value)*(amount-deadZone)/(1-deadZone);
}

export function createTouchControls(root,{paused=()=>false,onStart=()=>{}}={}){
 const stick=root.querySelector('#joystick'),knob=root.querySelector('.joystick-knob');
 const pedals=[...root.querySelectorAll('[data-pedal]')],held=new Map();
 const input={turn:0,throttle:0,handbrake:false};
 let pointer=null,centerX=0,centerY=0,radius=40;
 function paint(x=0,y=0){
  knob.style.transform=`translate(${x}px,${y}px)`;
  const value=Math.round(-input.turn*100);
  stick.setAttribute('aria-valuenow',value);
  const direction=input.throttle>0?'Frente':input.throttle<0?'Ré':'Neutro';
  stick.setAttribute('aria-valuetext',`${direction}; ${value===0?'direção central':`${Math.abs(value)}% para ${value<0?'esquerda':'direita'}`}`);
 }
 function move(e){
  const dx=e.clientX-centerX,dy=e.clientY-centerY;
  const distance=Math.hypot(dx,dy),scale=distance>radius?radius/distance:1;
  const x=dx*scale,y=dy*scale;
  input.turn=steeringAxis(-x,radius);input.throttle=steeringAxis(-y,radius);paint(x,y);
 }
 function releaseStick(){pointer=null;input.turn=input.throttle=0;stick.classList.remove('active');paint();}
 stick.addEventListener('pointerdown',e=>{
  if(paused()||pointer!==null||e.button!==0)return;
  e.preventDefault();const rect=stick.getBoundingClientRect();
  centerX=rect.left+rect.width/2;centerY=rect.top+rect.height/2;radius=rect.width*.3;
  pointer=e.pointerId;stick.setPointerCapture(pointer);stick.classList.add('active');onStart();move(e);
 });
 stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===pointer)releaseStick();});
 stick.addEventListener('keydown',e=>{
  if(paused()||pointer!==null||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  if(e.key==='Home')releaseStick();
  if(e.key==='ArrowLeft'||e.key==='ArrowRight')input.turn=e.key==='ArrowLeft'?1:-1;
  if(e.key==='ArrowUp'||e.key==='ArrowDown')input.throttle=e.key==='ArrowUp'?1:-1;
  stick.classList.add('active');paint(-input.turn*28,-input.throttle*28);onStart();
 });
 stick.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();e.stopPropagation();if(pointer===null){if(e.key==='ArrowLeft'||e.key==='ArrowRight')input.turn=0;if(e.key==='ArrowUp'||e.key==='ArrowDown')input.throttle=0;if(!input.turn&&!input.throttle)releaseStick();else paint(-input.turn*28,-input.throttle*28);}}});
 stick.addEventListener('blur',()=>{if(pointer===null)releaseStick();});
 function updatePedals(){
  for(const button of pedals){const active=[...held.values()].includes(button);button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);}
  const active=action=>[...held.values()].some(button=>button.dataset.pedal===action);
  input.handbrake=active('brake');
 }
 for(const button of pedals){
  button.addEventListener('pointerdown',e=>{if(paused()||e.button!==0)return;e.preventDefault();held.set(e.pointerId,button);button.setPointerCapture(e.pointerId);updatePedals();onStart();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(held.get(e.pointerId)===button){held.delete(e.pointerId);updatePedals();}});
  button.addEventListener('keydown',e=>{if(paused()||![' ','Enter'].includes(e.key))return;e.preventDefault();e.stopPropagation();held.set(button,button);updatePedals();onStart();});
  button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();held.delete(button);updatePedals();}});
  button.addEventListener('blur',()=>{held.delete(button);updatePedals();});
 }
 function reset(){
  if(pointer===null&&!held.size&&!input.turn&&!input.throttle&&!input.handbrake)return;
  const stickPointer=pointer;releaseStick();
  if(stickPointer!==null&&stick.hasPointerCapture(stickPointer))stick.releasePointerCapture(stickPointer);
  const captures=[...held];held.clear();updatePedals();
  for(const [id,button] of captures)if(typeof id==='number'&&button.hasPointerCapture(id))button.releasePointerCapture(id);
 }
 root.addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('blur',reset);addEventListener('resize',reset);
 document.addEventListener('visibilitychange',reset);
 return {input,reset};
}
