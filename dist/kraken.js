import * as T from './three.js';
import {createKrakenModel} from './kraken-model.js';
import {terrainHeight,groundPose,onBridge} from './island-layout.js';
import {seaLevel} from './amphibious.js';

export const krakenRange=108;
const duration={rise:1.8,grab:1.1,windup:.7,fly:1.65,land:.65};
const smooth=t=>t*t*(3-2*t);
export function landingSpot(x,z,obstacles=[],plants=[],random=Math.random,previous=null){
 const angle=Math.atan2(z,x);
 const candidates=Array.from({length:120},()=>{const a=random()*Math.PI*2,r=Math.sqrt(22**2+random()*(68**2-22**2));return {x:Math.cos(a)*r,z:Math.sin(a)*r};});
 for(const radius of [61,65,57,69,53])for(const offset of [0,.2,-.2,.4,-.4,.7,-.7,1,-1,1.5,-1.5,Math.PI])candidates.push({x:Math.cos(angle+offset)*radius,z:Math.sin(angle+offset)*radius});
 for(const {x:px,z:pz} of candidates){
  if(previous&&Math.hypot(px-previous.x,pz-previous.z)<18)continue;
  if(onBridge(px,pz)||terrainHeight(px,pz)<-.1)continue;
  if(obstacles.some(o=>o.radius?Math.hypot(px-o.x,pz-o.z)<o.radius+4:Math.hypot(Math.max(Math.abs(px-o.x)-o.hx,0),Math.max(Math.abs(pz-o.z)-o.hz,0))<4))continue;
  if(plants.some(p=>Math.hypot(px-p.x,pz-p.z)<4))continue;
  return {x:px,z:pz};
 }
 return {x:0,z:12};
}
export function throwPose(start,end,t,reduced=false){
 const p=Math.max(0,Math.min(1,t));
 return {x:T.MathUtils.lerp(start.x,end.x,p),z:T.MathUtils.lerp(start.z,end.z,p),y:T.MathUtils.lerp(start.y,end.y,p)+(reduced?7:32)*4*p*(1-p),pitch:reduced?0:-Math.sin(p*Math.PI*2)*1.2,roll:reduced?0:Math.sin(p*Math.PI)*.7};
}

export function createKraken(scene,{obstacles=[],plants=[],onEvent=()=>{},random=Math.random}={}){
 const model=createKrakenModel(scene),root=model.root;
 const ring=new T.Mesh(new T.RingGeometry(4.5,4.8,48),new T.MeshBasicMaterial({color:'#d9f4e4',transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 let phase='idle',age=0,armed=true,pose=null,start=null,end=null,launch=null,heading=0,nx=0,nz=1,quiet=false;
 const clock={value:0};
 let previousLanding=null,flightDuration=duration.fly;
 function cancel(){phase='idle';age=0;armed=false;pose=null;root.visible=ring.visible=false;}
 function animateArms(lift){
  const grip=phase==='fly'?{y:1+12*lift,z:-3-6*lift}:{y:pose.y-root.position.y+.5,z:(pose.x-root.position.x)*nx+(pose.z-root.position.z)*nz};
  model.update(clock.value,grip,quiet);
 }
 function update(dt,driver,{paused=false,reduced=false}={}){
  if(paused)return pose;
  quiet=reduced;clock.value+=dt;
  if(phase==='idle'){
   if(Math.hypot(driver.x,driver.z)<krakenRange)armed=true;
   if(!armed||driver.mode!=='boat'||Math.hypot(driver.x,driver.z)<krakenRange)return null;
   const radius=Math.hypot(driver.x,driver.z);nx=driver.x/radius;nz=driver.z/radius;
   start={x:driver.x,z:driver.z,y:seaLevel+.2};const spot=landingSpot(driver.x,driver.z,obstacles,plants,random,previousLanding);previousLanding=spot;
   heading=Math.atan2(-(spot.x-start.x),-(spot.z-start.z));end={...spot,y:groundPose(spot.x,spot.z,heading,false).y};
   const aimDistance=Math.hypot(start.x-end.x,start.z-end.z);nx=(start.x-end.x)/aimDistance;nz=(start.z-end.z)/aimDistance;
   launch={x:start.x-nx*2,z:start.z-nz*2,y:start.y+12};phase='rise';age=0;
   flightDuration=Math.max(duration.fly,Math.hypot(end.x-launch.x,end.z-launch.z)/48);
   root.position.set(start.x+nx*7,seaLevel-10,start.z+nz*7);root.rotation.y=Math.atan2(nx,nz);root.visible=ring.visible=true;
   ring.position.set(root.position.x,seaLevel+.035,root.position.z);onEvent('rise');
  }
  age+=dt;const p=Math.min(age/(phase==='fly'?flightDuration:duration[phase]),1);
  if(phase==='rise'){
   root.position.y=seaLevel-10*(1-smooth(p));pose={...start,pitch:0,roll:0};animateArms(0);
   ring.scale.setScalar(1+p*.6);ring.material.opacity=.5;
   if(p===1){phase='grab';age=0;onEvent('grab');}
  }else if(phase==='grab'){
   const lift=smooth(p);pose={x:start.x+nx*3*lift,z:start.z+nz*3*lift,y:start.y+8*lift,pitch:reduced?0:-.35*lift,roll:0};animateArms(lift);
   if(p===1){phase='windup';age=0;}
  }else if(phase==='windup'){
   const back=p<.6,force=back?smooth(p/.6):((p-.6)/.4)**2;
   const offset=back?3+4*force:7-9*force,height=back?8+2*force:10+2*force;
   pose={x:start.x+nx*offset,z:start.z+nz*offset,y:start.y+height,pitch:reduced?0:-.35+force*.5,roll:0};animateArms(1);
   if(p===1){phase='fly';age=0;onEvent('throw');}
  }else if(phase==='fly'){

   pose=throwPose(launch,end,p,reduced);root.position.y=seaLevel-Math.max(0,(p-.3)/.7)*12;animateArms(1-p);
   ring.scale.setScalar(1.6+p);ring.material.opacity=(1-p)*.4;
   if(p===1){phase='land';age=0;driver.mode='car';driver.deck=false;root.visible=ring.visible=false;onEvent('land');}
  }else if(phase==='land'){
   pose={...end,y:end.y+(reduced?0:Math.sin(p*Math.PI)*.6*(1-p)),pitch:0,roll:0};
   if(p===1){phase='idle';armed=true;onEvent('done');}
  }
  driver.x=pose.x;driver.z=pose.z;driver.heading=heading;driver.vx=driver.vz=driver.speed=driver.steer=0;
  // Return the final landing frame so normal physics resumes on the next frame.
  const result=pose;if(phase==='idle')pose=null;return result;
 }
 return {update,cancel,get active(){return phase!=='idle';},get phase(){return phase;},root};
}
