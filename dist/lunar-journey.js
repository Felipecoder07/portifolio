import * as T from './three.js';
import {createStation,createMoon,createRocket,planet,addStars} from './lunar-models.js';
import {createFlightClouds} from './flight-clouds.js';
import {homeBearing} from './lunar-exploration.js';
import {station,flightDuration,flightStage,craters,moonRadius} from './lunar-terrain.js';
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function approachProgress(age){return ease((age-18)/18);}
export function forwardBoarding(d,base){return d.mode==='car'&&Math.abs(d.x-base)<.9&&d.z>-.5&&d.z<6.5;}
export function createLunarJourney(earthScene,car,{onDepart,onArrive,onRecover=()=>{}}){
 const launchSite=createStation(earthScene);let moon=null,flight=null,location='earth',age=0,origin='earth',boarding=null,lastDriver=null;
 const hud=document.createElement('section');hud.id='lunar-flight';hud.hidden=true;hud.setAttribute('aria-label','Viagem espacial');
 hud.innerHTML='<div class="flight-heading"><span>SELENE / TRANSPORTE LUNAR</span><strong id="flight-destination"></strong></div><div class="flight-instruments"><span id="flight-phase" role="status"></span><div class="flight-progress"><i></i></div><small id="flight-detail"></small></div><div class="flight-actions"><button id="flight-cancel" type="button">Sair da cápsula</button><button id="flight-skip" type="button" hidden>Pular viagem</button></div>';
 document.body.append(hud);
 const badge=document.createElement('div');badge.id='lunar-location';badge.hidden=true;badge.innerHTML='<span>SUPERFÍCIE LUNAR</span><strong>Base Selene</strong><div class="lunar-bearing"><b aria-hidden="true">↑</b><span></span></div><small>A seta indica o caminho em relação ao carro.</small><button type="button">Voltar ao foguete · R</button>';document.body.append(badge);
 const skip=hud.querySelector('#flight-skip'),cancelButton=hud.querySelector('#flight-cancel');
 const destination=hud.querySelector('#flight-destination'),phase=hud.querySelector('#flight-phase'),detail=hud.querySelector('#flight-detail'),progress=hud.querySelector('i');
 badge.querySelector('button').onclick=()=>{if(location==='moon'&&!boarding)onRecover();};
 function prepare(){
  if(flight)return;
  const scene=new T.Scene();scene.background=new T.Color('#02040b');scene.add(new T.HemisphereLight('#d7e9ff','#384453',1.35));const sun=new T.DirectionalLight('#fff4dd',3.5);sun.position.set(-30,50,40);scene.add(sun);
  const rocket=createRocket();scene.add(rocket.root);rocket.setDoor(0);rocket.setFlight(1);
  const earth=planet('earth',95),luna=planet('moon',65);scene.add(earth,luna);const stars=addStars(scene),clouds=createFlightClouds(scene);
  const camera=new T.PerspectiveCamera(48,1,.1,20000),surfaceCamera=camera.clone();
  flight={scene,rocket,earth,luna,stars,clouds,camera,surfaceCamera,direction:new T.Vector3(),right:new T.Vector3(),sky:new T.Color(),black:new T.Color('#02040b'),blue:new T.Color('#9fbfdd')};
 }
 function canEnter(d){return !boarding&&forwardBoarding(d,location==='moon'?0:station.x);}
 function nearRamp(d){const x=location==='moon'?0:station.x;return !boarding&&Math.abs(d.x-x)<6&&d.z>-1&&d.z<12;}
 function enter(d){
  if(!canEnter(d))return false;prepare();moon??=createMoon();origin=location;age=0;lastDriver=d;boarding={x:d.x,z:d.z,heading:d.heading};hud.hidden=false;badge.hidden=true;document.body.classList.add('spaceflight');
  destination.textContent=origin==='earth'?'TERRA → LUA':'LUA → TERRA';cancelButton.hidden=false;skip.hidden=false;onDepart();return true;
 }
 function arrive(d,target=origin==='earth'?'moon':'earth'){
  location=target;boarding=null;age=0;hud.hidden=true;document.body.classList.remove('spaceflight');car.visible=true;
  (location==='moon'?moon.scene:earthScene).add(car);
  // The car reverses out, retaining its forward-facing orientation in the bay.
  Object.assign(d,{x:location==='moon'?0:station.x,z:9,heading:0,vx:0,vz:0,speed:0,steer:0,mode:'car',deck:false,acceleration:0});car.position.set(d.x,.2,d.z);car.rotation.set(0,0,0);
  for(const rocket of [launchSite.rocket,moon?.rocket].filter(Boolean)){rocket.root.visible=true;rocket.root.position.y=.12;rocket.flame.visible=false;rocket.setFlight(0);rocket.setDoor(1);}
  badge.hidden=location!=='moon';onArrive(location);
 }
 skip.onclick=()=>{if(boarding)arrive(lastDriver);};cancelButton.onclick=()=>cancel(lastDriver);
 function cancel(d){if(boarding)arrive(d,origin);}
 function earth(d){if(boarding)cancel(d);if(location==='moon')arrive(d,'earth');}
 function update(dt,d,{paused=false,reduced=false,aspect=1}={}){
  if(!boarding)return null;lastDriver=d;if(!paused)age+=dt;
  if((reduced&&age>4)||age>=flightDuration){arrive(d);return null;}
  const f=flight,c=f.camera,sc=f.surfaceCamera;c.aspect=sc.aspect=aspect;
  phase.textContent=flightStage(age);progress.style.transform=`scaleX(${clamp(age/flightDuration)})`;
  detail.textContent=age<4?'Veículo reconhecido · preparando a partida':age<12?'Compartimento fechado · motores em ignição':age<24?'Subindo acima das nuvens · rumo ao destino':age<37?'Destino à vista · aproximação e frenagem':'Trem de pouso aberto · descida controlada';
  const base=origin==='earth'?station.x:0,sourceRocket=origin==='earth'?launchSite.rocket:moon.rocket,sourceScene=origin==='earth'?earthScene:moon.scene,outbound=origin==='earth';
  if(age<4){
   const p=ease(age/2.5),distance=Math.max(0,boarding.z-.6)*p;d.z=boarding.z-distance;d.x=boarding.x;d.heading=boarding.heading;car.position.set(d.x,.2,d.z);car.rotation.set(0,boarding.heading,0);
   sourceRocket.setDoor(1-ease(age-3));
   c.fov=48;c.position.set(base+13,8,21);c.lookAt(base,3,1);c.updateProjectionMatrix();return {scene:sourceScene,camera:c};
  }
  cancelButton.hidden=true;car.visible=false;sourceRocket.setDoor(0);
  // Launch and orbital cameras share the same framing while the scenery dissolves.
  const lift=Math.max(0,age-7),rise=lift*lift*2.1;
  sourceRocket.root.visible=age<12;sourceRocket.root.position.y=.12+rise;sourceRocket.flame.visible=age>6;sourceRocket.flame.scale.y=.35+ease((age-6)/4);sourceRocket.setFlight(ease((age-8)/4));
  const framing=ease((age-4)/3),cx=T.MathUtils.lerp(13,18,framing),cy=T.MathUtils.lerp(8,11,framing),cz=T.MathUtils.lerp(21,31,framing);
  sc.fov=48;sc.position.set(base+cx,cy+rise,cz);sc.lookAt(base,rise+3+3*framing,0);sc.updateProjectionMatrix();
  if(age<10)return {scene:sourceScene,camera:sc};
  const orbit=ease((age-14)/7),approach=approachProgress(age),landing=ease((age-34)/7);
  f.rocket.root.position.set(0,0,0);f.rocket.root.rotation.z=-Math.sin(ease((age-18)/16)*Math.PI)*.15;f.rocket.setFlight(1-landing);f.rocket.flame.visible=age<40;f.rocket.flame.scale.y=age<24?.85+Math.sin(age*18)*.035:.35+.2*(1-landing);
  c.fov=48+Math.sin(ease((age-10)/24)*Math.PI)*6;c.position.set(18,11,31);c.lookAt(0,6,0);c.updateProjectionMatrix();
  const source=outbound?f.earth:f.luna,target=outbound?f.luna:f.earth;
  source.visible=target.visible=true;source.position.set(-140,-230-(age-10)*27,-150);source.scale.setScalar(1);
  // Continuous angular growth: destination exists from the first orbital frame.
  const radius=(outbound?65:95)*(1+ease((approach-.6)/.4)*7),angularRadius=.012+approach*1.15,distance=radius/Math.sin(angularRadius);
  c.getWorldDirection(f.direction);f.right.set(1,0,0).applyQuaternion(c.quaternion);
  f.direction.addScaledVector(f.right,-.28*(1-approach));f.direction.y+=.2*(1-approach)-.8*approach;f.direction.normalize();
  target.position.copy(c.position).addScaledVector(f.direction,distance);target.scale.setScalar(radius/(outbound?65:95));target.userData.angularRadius=angularRadius;
  const atmosphere=outbound?1-orbit:ease((age-30)/6);
  f.sky.copy(f.black).lerp(f.blue,atmosphere);f.scene.background.copy(f.sky);f.stars.material.opacity=(1-atmosphere)*.7;
  f.clouds.update(age-10,atmosphere,outbound?false:true);
  if(age<12)return {scene:sourceScene,camera:sc,blend:{scene:f.scene,camera:c,mix:ease((age-10)/2)}};
  // Match the large planet's horizon to the real terrain before touching down.
  if(age>=34){
   const targetScene=outbound?moon.scene:earthScene,targetRocket=outbound?moon.rocket:launchSite.rocket,baseX=outbound?0:station.x,p=ease((age-34)/7),height=55*(1-p);
   targetRocket.root.visible=true;targetRocket.root.position.y=.12+height;targetRocket.setFlight(1-p);targetRocket.flame.visible=age<41;targetRocket.flame.scale.y=.15+.5*(1-p);targetRocket.setDoor(ease((age-41)/2));
   sc.fov=48;sc.position.set(baseX+18,11+height,31);sc.lookAt(baseX,6+height,0);sc.updateProjectionMatrix();
   if(age>=43){targetScene.add(car);car.visible=true;car.position.set(baseX,.2,ease((age-43)/3)*9);car.rotation.set(0,0,0);}
   if(age<37)return {scene:f.scene,camera:c,blend:{scene:targetScene,camera:sc,mix:ease((age-34)/3)}};
   return {scene:targetScene,camera:sc};
  }
  return {scene:f.scene,camera:c};
 }
 function explore(dt,d,options){if(location!=='moon'||boarding)return;moon.exploration.update(dt,d,options);const bearing=homeBearing(d);badge.querySelector('.lunar-bearing b').style.transform=`rotate(${bearing.angle}rad)`;badge.querySelector('.lunar-bearing span').textContent=`Foguete · ${Math.round(bearing.distance)} m`;}
 function drawMap(ctx,d){ctx.fillStyle='#292c31';ctx.fillRect(0,0,220,180);const scale=76/moonRadius;ctx.strokeStyle='#5c6067';for(const crater of craters){if(Math.hypot(crater.x,crater.z)>moonRadius+10)continue;ctx.beginPath();ctx.arc(110+crater.x*scale,90+crater.z*scale,crater.r*scale,0,Math.PI*2);ctx.stroke();}ctx.strokeStyle='#eac891';ctx.beginPath();ctx.moveTo(110+d.x*scale,90+d.z*scale);ctx.lineTo(110,90);ctx.stroke();ctx.fillStyle='#f7dcaa';ctx.fillRect(106,86,8,8);ctx.font='10px sans-serif';ctx.fillText('FOGUETE',119,86);ctx.fillStyle='#d5e8fa';for(const site of moon.exploration.sites){ctx.beginPath();ctx.arc(110+site.x*scale,90+site.z*scale,2,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#f3c77c';ctx.beginPath();ctx.arc(110+d.x*scale,90+d.z*scale,3,0,Math.PI*2);ctx.fill();}
 return {enter,update,cancel,earth,canEnter,nearRamp,explore,drawMap,stationObstacles:launchSite.obstacles,get active(){return boarding!==null;},get location(){return location;},get scene(){return location==='moon'?moon.scene:earthScene;},get moon(){return moon;},get phase(){return boarding?flightStage(age):location;}};
}
