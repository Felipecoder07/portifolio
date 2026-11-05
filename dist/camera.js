import * as T from './three.js';

export const cameraTuning=Object.freeze({introDuration:4.5,minZoom:13,maxZoom:36,zoom:22,follow:5,lookAhead:.22});
export function createCameraRig(camera,canvas,car,occluders,reduced){
 const cfg=cameraTuning,focus=car.position.clone(),target=new T.Vector3(),desired=new T.Vector3(),ray=new T.Raycaster();
 const hidden=new Set(),hits=[],candidates=[],intersection=new T.Vector3();
 const bounds=occluders.map(object=>({object,box:new T.Box3().setFromObject(object).expandByScalar(.25)}));
 let angle=.6,zoom=cfg.zoom,drag=null,introTime=0,intro=!reduced.matches,occlusionClock=1;
 const skipButton=document.querySelector('#skip-intro');skipButton.hidden=!intro;
 function skip(){intro=false;skipButton.hidden=true;occlusionClock=1;}
 function recenter(){skip();angle=car.rotation.y+.6;zoom=cfg.zoom;}
 function restore(){for(const mesh of hidden){mesh.visible=true;}hidden.clear();}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;skip();drag={id:e.pointerId,x:e.clientX,a:angle};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)angle=drag.a-(e.clientX-drag.x)*.005;});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null;});
 addEventListener('blur',()=>{drag=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();skip();zoom=T.MathUtils.clamp(zoom+e.deltaY*.015,cfg.minZoom,cfg.maxZoom);},{passive:false});
 skipButton.onclick=skip;
 document.querySelector('#recenter').onclick=recenter;
 reduced.addEventListener('change',()=>{if(reduced.matches)skip();});
 function update(dt,speed,paused){
  occlusionClock+=dt;
  if(intro){
   if(!paused)introTime+=dt;
   const p=Math.min(introTime/cfg.introDuration,1),ease=p*p*(3-2*p),a=.1+ease*.5;
   focus.copy(car.position);const distance=T.MathUtils.lerp(68,zoom,ease);
   camera.position.set(focus.x+Math.sin(a)*distance,T.MathUtils.lerp(66,zoom*1.05,ease),focus.z+Math.cos(a)*distance);
   camera.lookAt(focus.x,car.position.y+.7,focus.z);if(p===1)skip();return;
  }
  const ahead=reduced.matches?0:speed*cfg.lookAhead;
  target.set(car.position.x-Math.sin(car.rotation.y)*ahead,car.position.y+.7,car.position.z-Math.cos(car.rotation.y)*ahead);
  focus.lerp(target,1-Math.exp(-cfg.follow*dt));
  const extra=reduced.matches?0:Math.min(Math.abs(speed)/24,1)*3;
  desired.set(focus.x+Math.sin(angle)*(zoom+extra),focus.y+zoom*1.05+extra,focus.z+Math.cos(angle)*(zoom+extra));
  camera.position.lerp(desired,1-Math.exp(-cfg.follow*dt));camera.lookAt(focus);
  // Hide only meshes intersecting the sightline to the car, without editing shared materials.
  // Three rays protect the centre and both sides of the small vehicle.
  // Broad phase rejects distant districts before the expensive triangle tests.
  // Check at 20 Hz; camera movement and steering still update every frame.
  if(occlusionClock<.05)return;
  occlusionClock=0;restore();camera.updateMatrixWorld();car.updateWorldMatrix(true,false);
  for(const offset of [-.9,0,.9]){
   target.set(car.position.x+offset,car.position.y+1,car.position.z);
   desired.subVectors(target,camera.position);ray.far=desired.length()-.6;ray.set(camera.position,desired.normalize());
   candidates.length=0;hits.length=0;
   for(const entry of bounds)if(entry.box.containsPoint(camera.position)||(ray.ray.intersectBox(entry.box,intersection)&&intersection.distanceTo(camera.position)<=ray.far))candidates.push(entry.object);
   ray.intersectObjects(candidates,true,hits);
   for(const hit of hits){if(hit.object.isMesh){hidden.add(hit.object);hit.object.visible=false;}}
  }
 }
 return {update,skip,recenter,restore};
}
