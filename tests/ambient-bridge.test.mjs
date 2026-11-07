import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createDriver,stepDriver} from '../dist/driving.js';
import {bridgeHeight,groundPose,inWater,infrastructureColliders,buildingColliders,routes,distanceToRoute} from '../dist/island-layout.js';
import {createAmbientLife} from '../dist/ambient-life.js';
import {projects} from '../dist/projects.js';
import {vehicle} from '../dist/vehicle.js';
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};

test('car crosses below the bridge both ways without rail collision, water or jumping onto deck',()=>{
 const car=vehicle(new T.Scene()).car;
 const height=new T.Box3().setFromObject(car,true).max.y;
 for(const direction of [-1,1])for(const z of [-4,-3,-2]){
  const c=createDriver(direction===1?23:43,z);c.heading=-direction*Math.PI/2;
  for(let i=0;i<400&&direction*(c.x-33)<10;i++){
   stepDriver(c,{throttle:1,turn:0},[...infrastructureColliders(),...buildingColliders(projects)]);
   assert.equal(c.deck,false);assert.equal(inWater(c.x,c.z,c.deck),false);
   const pose=groundPose(c.x,c.z,c.heading,c.deck);assert.ok(Math.abs(pose.y-.08)<.001);
   if(Math.abs(c.x-33)<4)assert.ok(pose.y+height+.5<bridgeHeight(c.z)-.22);
  }
  assert.ok(direction*(c.x-33)>=10);
 }
});
test('both bridge ramps still select the elevated road continuously',()=>{
 for(const direction of [-1,1]){
  const c=createDriver(33,direction===1?-20:14);c.heading=direction===1?Math.PI:0;
  let previous=groundPose(c.x,c.z,c.heading,c.deck).y,highest=0;
  for(let i=0;i<500&&direction*(c.z+3)<18;i++){
   stepDriver(c,{throttle:1,turn:0},infrastructureColliders());
   const y=groundPose(c.x,c.z,c.heading,c.deck).y;
   assert.ok(Math.abs(y-previous)<.2);assert.equal(inWater(c.x,c.z,c.deck),false);highest=Math.max(highest,y);previous=y;
  }
  assert.ok(highest>4.5);assert.ok(direction*(c.z+3)>=18);
 }
});
test('ambient animals and smoke animate, respect reduced motion and keep finite transforms',()=>{
 const life=createAmbientLife(new T.Scene(),projects),bird=life.root.getObjectByName('seagull'),crab=life.root.getObjectByName('beach-crab');
 const before=bird.position.clone(),beach=crab.position.clone();life.update(2);
 assert.ok(before.distanceTo(bird.position)>0);assert.ok(beach.distanceTo(crab.position)>0);
 const frozen=bird.position.clone();life.update(4,true);assert.deepEqual(bird.position,frozen);
 for(let t=0;t<100;t+=.5){life.update(t);life.root.traverse(o=>assert.ok(o.position.toArray().every(Number.isFinite)));}
});
test('deck wheel contact stays above the floor beside either rail at every heading',()=>{
 for(const x of [30.3,33,35.7])for(const z of [-8,-3,2])for(let a=0;a<Math.PI*2;a+=.1){
  const pose=groundPose(x,z,a,true);assert.ok(pose.y>4.6);assert.ok(Math.abs(pose.roll)<.001);assert.ok(Math.abs(pose.pitch)<.001);
 }
});
test('low ramp undersides block ground traffic without promoting it to the deck',()=>{
 for(const x of [30,33,36])for(const direction of [-1,1]){
  const c=createDriver(x,-3);c.deck=false;c.heading=direction===1?Math.PI:0;
  for(let i=0;i<300;i++){stepDriver(c,{throttle:1,turn:0},infrastructureColliders());assert.equal(c.deck,false);}
  assert.ok(c.z>-9&&c.z<3,`escaped under a low ramp at ${c.x},${c.z}`);
 }
});
test('underpass and campus link terminate on other streets, never on a ramp edge',()=>{
 for(const id of ['underpass','bridge-campus']){
  const road=routes.find(r=>r.id===id);
  for(const [x,z] of [road.points[0],road.points.at(-1)])assert.ok(routes.some(r=>r!==road&&distanceToRoute(x,z,r)<.01),`${id}: disconnected at ${x},${z}`);
 }
});
