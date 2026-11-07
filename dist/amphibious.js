import * as T from './three.js';
import {box,cylinder,material} from './models.js';
import {createBoatWake} from './boat-wake.js';
import {batchRigidMeshes} from './render-optimization.js';
import {terrainHeight,onBridge} from './island-layout.js';

export const seaLevel=-1.35;
export const sailingRadius=130;
// Two shoreline thresholds prevent repeated transformations in the surf.
export function travelMode(driver){
 if(driver.deck&&onBridge(driver.x,driver.z))return 'car';
 const ground=terrainHeight(driver.x,driver.z);
 return driver.mode==='boat'?(ground>seaLevel+.4?'car':'boat'):(ground<seaLevel+.1?'boat':'car');
}

export function createAmphibious(scene,car){
 const carParts=[...car.children],boat=new T.Group();boat.name='boat';boat.visible=false;car.add(boat);
 const outline=new T.Shape();outline.moveTo(0,2.5);outline.quadraticCurveTo(1.4,1.5,1.3,-1.7);outline.lineTo(-1.3,-1.7);outline.quadraticCurveTo(-1.4,1.5,0,2.5);
 const hullPaint=material('#d78256').clone();
 const hull=new T.Mesh(new T.ExtrudeGeometry(outline,{depth:.65,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:2,steps:1,curveSegments:8}),hullPaint);hull.rotation.x=-Math.PI/2;hull.position.y=-.22;hull.castShadow=true;boat.add(hull);
 box(boat,2.25,.12,2.6,'#f0e5cb',0,.5,.15);
 for(const x of [-.48,.48]){box(boat,.65,.2,.7,'#29483f',x,.72,.5);box(boat,.65,.55,.15,'#29483f',x,.96,.85);}
 box(boat,1.7,.42,.35,'#f0e5cb',0,.9,-.65);
 const glass=box(boat,1.9,.62,.07,'#8fc6cf',0,1.36,-.75);glass.material=new T.MeshStandardMaterial({color:'#8fc6cf',transparent:true,opacity:.55,roughness:.2});glass.rotation.x=-.18;
 for(const x of [-1.05,1.05])box(boat,.12,.22,2.8,'#f0e5cb',x,.65,.08);
 const ring=new T.Mesh(new T.TorusGeometry(.38,.12,8,20),material('#f0e5cb'));ring.position.set(1.37,.38,.65);ring.rotation.y=Math.PI/2;boat.add(ring);
 box(boat,.55,.8,.55,'#29483f',0,.45,1.95);box(boat,.17,.6,.15,'#29483f',0,-.05,2.05);
 const propeller=box(boat,.8,.1,.12,'#a6b3a8',0,-.3,2.16);
 cylinder(boat,.07,.07,1.2,'#a6b3a8',-.85,1.2,1.35,8);
 box(boat,.5,.28,.035,'#a9d7ad',-.6,1.65,1.35);
 batchRigidMeshes(boat,{exclude:new Set([propeller])});
 const smoke=Array.from({length:14},(_,i)=>{
  const mesh=new T.Mesh(new T.IcosahedronGeometry(.55,1),new T.MeshBasicMaterial({color:i%2?'#fff4df':'#d7e3d9',transparent:true,opacity:0,depthWrite:false}));mesh.visible=false;scene.add(mesh);return {mesh,angle:i/14*Math.PI*2,life:0};
 });
 const wake=createBoatWake(scene);
 let mode='car';
 function show(next){mode=next;boat.visible=mode==='boat';for(const part of carParts)part.visible=mode==='car';}
 function reset(){show('car');wake.reset();boat.rotation.set(0,0,0);for(const p of smoke){p.life=0;p.mesh.visible=false;}}
 function update(dt,driver,{time=0,reduced=false,paused=false,airborne=false}={}){
  if(driver.mode!==mode){show(driver.mode);if(!reduced)for(const p of smoke){p.life=1;p.mesh.visible=true;p.mesh.position.copy(car.position);p.mesh.position.x+=Math.cos(p.angle)*.8;p.mesh.position.z+=Math.sin(p.angle)*.8;p.mesh.position.y+=.65;p.mesh.scale.setScalar(1.5);}}
  wake.update(dt,driver,{time,reduced,paused,airborne});
  if(reduced){for(const p of smoke){p.life=0;p.mesh.visible=false;}boat.rotation.set(0,0,0);return;}
  if(paused)return;
  propeller.rotation.z+=dt*driver.speed*3;
  boat.rotation.z=T.MathUtils.damp(boat.rotation.z,T.MathUtils.clamp((driver.boatYawRate||0)*driver.speed*.018,-.12,.12),4,dt);boat.rotation.x=T.MathUtils.damp(boat.rotation.x,T.MathUtils.clamp(driver.speed*.003+(driver.acceleration||0)*.002,-.035,.07),3,dt);
  for(const p of smoke)if(p.life>0){p.life=Math.max(0,p.life-dt*1.5);p.mesh.position.x+=Math.cos(p.angle)*dt*1.3;p.mesh.position.z+=Math.sin(p.angle)*dt*1.3;p.mesh.position.y+=dt*1.2;p.mesh.scale.addScalar(dt*1.1);p.mesh.material.opacity=p.life*.65;p.mesh.visible=p.life>0;}

 }
 return {boat,update,reset,paint:hullPaint};
}
