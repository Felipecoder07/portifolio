import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createKraken,landingSpot,throwPose,krakenRange} from '../dist/kraken.js';
import {createDriver} from '../dist/driving.js';
import {terrainHeight,infrastructureColliders,buildingColliders} from '../dist/island-layout.js';
import {projects} from '../dist/projects.js';
import {createKrakenModel} from '../dist/kraken-model.js';

test('random landings vary across the island and avoid the last landing',()=>{
 let seed=123;const random=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
 let previous=null;const quadrants=new Set();
 for(let i=0;i<40;i++){
  const p=landingSpot(110,0,[],[],random,previous);
  if(previous)assert.ok(Math.hypot(p.x-previous.x,p.z-previous.z)>=18);
  assert.ok(terrainHeight(p.x,p.z)>-.1);quadrants.add(`${Math.sign(p.x)},${Math.sign(p.z)}`);previous=p;
 }
 assert.equal(quadrants.size,4);
});

test('body and every arm move independently, with a stable reduced-motion model',()=>{
 const model=createKrakenModel(new T.Scene()),grip={y:8,z:-6};
 const arm=model.root.getObjectByName('kraken-tentacles'),body=model.root.getObjectByName('kraken-body');
 model.update(0,grip);const before=arm.geometry.attributes.position.array.slice(),bodyBefore=body.position.clone();
 model.update(1,grip);const after=arm.geometry.attributes.position.array,part=after.length/8;
 assert.ok(body.position.distanceTo(bodyBefore)>.05);
 for(let a=0;a<8;a++){let movement=0;for(let i=a*part;i<(a+1)*part;i++){assert.ok(Number.isFinite(after[i]));movement+=Math.abs(after[i]-before[i]);}assert.ok(movement>1);}
 model.update(0,grip,true);const still=arm.geometry.attributes.position.array.slice();model.update(2,grip,true);assert.deepEqual(arm.geometry.attributes.position.array,still);
});

test('kraken ignores land and near-shore boats',()=>{
 const encounter=createKraken(new T.Scene());
 for(const d of [createDriver(),createDriver(90,0)])assert.equal(encounter.update(.1,d),null);
 assert.equal(encounter.active,false);
});
test('full encounter lifts and throws continuously, lands on dry land, and releases control at every frame rate',()=>{
 for(const fps of [30,60,144]){
  const events=[],encounter=createKraken(new T.Scene(),{onEvent:e=>events.push(e)}),d=createDriver(-krakenRange-1,0);
  let maximum=0,previous=null,frames=0;
  do{
   const pose=encounter.update(1/fps,d);assert.ok(pose);maximum=Math.max(maximum,pose.y);
   assert.ok([pose.x,pose.y,pose.z,pose.pitch,pose.roll].every(Number.isFinite));
   if(previous)assert.ok(Math.hypot(pose.x-previous.x,pose.y-previous.y,pose.z-previous.z)<130/fps,'trajectory jumped');
   previous=pose;frames++;
  }while(encounter.active&&frames<fps*12);
  assert.equal(encounter.active,false);assert.ok(maximum>36);assert.equal(d.mode,'car');assert.ok(Math.hypot(d.x,d.z)<75);assert.ok(terrainHeight(d.x,d.z)>-.1);
  assert.deepEqual(events,['rise','grab','throw','land','done']);assert.equal(encounter.root.visible,false);assert.equal(encounter.update(.1,d),null);
 }
});

test('kraken repeats immediately on every return to deep water without a cooldown',()=>{
 const events=[],encounter=createKraken(new T.Scene(),{onEvent:e=>events.push(e)}),d=createDriver(-110,0);
 for(let attempt=0;attempt<3;attempt++){
  Object.assign(d,createDriver(-110,0));assert.ok(encounter.update(1/60,d));assert.equal(encounter.phase,'rise');
  let elapsed=0;while(encounter.active&&elapsed<10){encounter.update(1/60,d);elapsed+=1/60;}
  assert.equal(d.mode,'car');assert.equal(encounter.active,false);
 }
 assert.equal(events.filter(e=>e==='throw').length,3);
});
test('pausing freezes sequence, cancel hides monster, and reduced motion removes vehicle rotation',()=>{
 const encounter=createKraken(new T.Scene()),d=createDriver(-110,0);
 const first=encounter.update(.1,d);const position={x:d.x,z:d.z};
 for(let i=0;i<50;i++)assert.deepEqual(encounter.update(.1,d,{paused:true}),first);
 assert.equal(d.x,position.x);assert.equal(d.z,position.z);
 for(let i=0;i<45;i++){const pose=encounter.update(.1,d,{reduced:true});if(pose){assert.equal(pose.pitch,0);assert.equal(pose.roll,0);}}
 encounter.cancel();assert.equal(encounter.active,false);assert.equal(encounter.root.visible,false);assert.equal(encounter.update(.1,d),null);
});
test('landing selection clears obstacles from all directions and throw arc meets both endpoints',()=>{
 const obstacles=[...infrastructureColliders(),...buildingColliders(projects)];
 for(let angle=0;angle<Math.PI*2;angle+=.1){const p=landingSpot(Math.cos(angle)*110,Math.sin(angle)*110,obstacles);assert.ok(terrainHeight(p.x,p.z)>-.1);assert.ok(obstacles.every(o=>o.radius?Math.hypot(p.x-o.x,p.z-o.z)>=o.radius+4:Math.hypot(Math.max(Math.abs(p.x-o.x)-o.hx,0),Math.max(Math.abs(p.z-o.z)-o.hz,0))>=4));}
 const a={x:110,y:7,z:0},b={x:61,y:.08,z:0};assert.equal(throwPose(a,b,0).x,a.x);assert.equal(throwPose(a,b,1).y,b.y);assert.ok(throwPose(a,b,.5).y>23);
});
