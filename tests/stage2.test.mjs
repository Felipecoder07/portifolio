import test from 'node:test';
import assert from 'node:assert/strict';
import {spring,advanceSpring,wheelSteering} from '../dist/suspension.js';
import {createDriver,stepDriver} from '../dist/driving.js';
import * as T from '../dist/three.js';
import {vehicle} from '../dist/vehicle.js';
import {createCameraRig} from '../dist/camera.js';

test('suspension converges consistently at 30, 60 and 144 FPS',()=>{
 const results=[30,60,144].map(fps=>{const s=spring();for(let i=0;i<fps*2;i++)advanceSpring(s,.07,1/fps);assert.ok(Math.abs(s.value-.07)<1e-6);return s.value;});
 assert.ok(Math.max(...results)-Math.min(...results)<1e-10);
});
test('suspension settles after braking and remains bounded after a long frame',()=>{
 const s=spring();for(let i=0;i<120;i++)advanceSpring(s,-.108,1/120);
 assert.ok(s.value<-.1);advanceSpring(s,0,.1);for(let i=0;i<240;i++)advanceSpring(s,0,1/120);
 assert.ok(Math.abs(s.value)<1e-6);assert.ok(Number.isFinite(s.velocity));
});
test('inside front wheel turns more than outside wheel; steering is symmetric',()=>{
 assert.ok(wheelSteering(.4,-1.03)>wheelSteering(.4,1.03));
 assert.equal(wheelSteering(.4,-1.03),-wheelSteering(-.4,1.03));assert.equal(wheelSteering(0,1.03),0);
});
test('driving remains finite through acceleration, steering, braking and reverse',()=>{
 const c=createDriver();for(let i=0;i<360;i++)stepDriver(c,{throttle:1,turn:0},[]);
 assert.equal(c.speed,24);
 for(let i=0;i<180;i++)stepDriver(c,{throttle:0,turn:1,handbrake:true},[]);
 assert.ok(Math.abs(c.speed)<24);assert.ok(c.heading>0);
 for(let i=0;i<600;i++)stepDriver(c,{throttle:-1,turn:0},[]);
 assert.ok(c.speed<-9);assert.ok([c.x,c.z,c.heading,c.vx,c.vz].every(Number.isFinite));
});

test('procedural car builds with four wheels, transparent cabin and responsive lights',()=>{
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const scene=new T.Scene(),rig=vehicle(scene),driver=createDriver();
 assert.equal(rig.wheels.length,4);assert.equal(rig.wheels.filter(w=>w.front).length,2);
 const meshes=[];rig.car.traverse(o=>{if(o.isMesh)meshes.push(o);});
 assert.ok(meshes.some(m=>m.material.transparent));
 driver.speed=12;driver.steer=.4;rig.update(1/60,driver,{night:true,braking:true});
 assert.ok(rig.body.rotation.x>0);assert.ok(rig.body.rotation.z<0);
 assert.ok(meshes.some(m=>m.material.emissiveIntensity===3));
 assert.equal(rig.body.children.filter(o=>o.isSpotLight&&o.intensity>0).length,2);
 const bounds=new T.Box3().setFromObject(rig.car,true);assert.ok(bounds.max.y<3.2);assert.ok(bounds.min.y>-.001);
 rig.reset();assert.equal(rig.body.rotation.x,0);assert.equal(rig.body.rotation.z,0);
 rig.update(.1,driver,{reduced:true});assert.equal(rig.body.rotation.x,0);
});

test('camera intro finishes, obstruction restores, reduced motion skips intro',()=>{
 const controls=new Map();globalThis.document={querySelector:id=>{if(!controls.has(id))controls.set(id,{});return controls.get(id);}};
 globalThis.addEventListener=()=>{};
 const reduced=new EventTarget();reduced.matches=false;
 const canvas=new EventTarget(),camera=new T.PerspectiveCamera(42,1,.1,250),car=new T.Group();car.position.set(0,.04,12);
 const obstruction=new T.Mesh(new T.BoxGeometry(20,20,20),new T.MeshBasicMaterial());
 obstruction.position.set(5,13,20);obstruction.updateMatrixWorld();
 const rig=createCameraRig(camera,canvas,car,[obstruction],reduced);
 assert.equal(controls.get('#skip-intro').hidden,false);
 for(let i=0;i<300;i++)rig.update(1/60,0,false);
 assert.equal(controls.get('#skip-intro').hidden,true);
 assert.equal(obstruction.visible,false);rig.restore();assert.equal(obstruction.visible,true);
 rig.recenter();for(let i=0;i<60;i++)rig.update(1/60,24,false);
 assert.ok(camera.position.toArray().every(Number.isFinite));
 reduced.matches=true;const other=createCameraRig(camera,canvas,car,[],reduced);
 assert.equal(controls.get('#skip-intro').hidden,true);other.update(.1,0,false);
});
