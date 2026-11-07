import test from 'node:test';
import assert from 'node:assert/strict';
import {secrets,createDiscoveries,storageKey} from '../dist/secrets.js';
import {inWater,routes,routeSamples,surfaceHeight} from '../dist/island-layout.js';
import {createScenery} from '../dist/scenery.js';
import {projects} from '../dist/projects.js';
import * as T from '../dist/three.js';
import {createDriver,stepDriver} from '../dist/driving.js';
test('discoveries require proximity, notify once, persist and reset',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const progress=createDiscoveries(storage);
 assert.deepEqual(progress.discover(0,12),[]);
 for(const s of secrets){assert.equal(progress.discover(s.x,s.z).length,1);assert.equal(progress.discover(s.x,s.z).length,0);}
 assert.equal(progress.count,3);const restored=createDiscoveries(storage);assert.equal(restored.count,3);
 restored.reset();assert.equal(createDiscoveries(storage).count,0);
 data.set(storageKey,'["witcher","witcher","unknown"]');assert.equal(createDiscoveries(storage).count,1);
});
test('corrupt and blocked storage do not interrupt exploration',()=>{
 for(const storage of [{getItem:()=>'{',setItem(){throw Error();}},{getItem(){throw Error();},setItem(){throw Error();}}]){
  const p=createDiscoveries(storage);assert.equal(p.count,0);assert.equal(p.discover(0,-70).length,1);assert.equal(p.persistent,false);p.reset();assert.equal(p.count,0);
 }
});
test('secret approaches are on land with room for the car and no trees',()=>{
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const world=createScenery(new T.Scene(),projects.map(p=>({...p})));
 for(const s of secrets){
  const x=s.x,z=s.z-2.8;assert.equal(inWater(x,z),false,s.id);
  for(const o of world.obstacles){const distance=o.radius!==undefined?Math.hypot(x-o.x,z-o.z)-o.radius:Math.hypot(Math.max(0,Math.abs(x-o.x)-o.hx),Math.max(0,Math.abs(z-o.z)-o.hz));assert.ok(distance>1.1,`${s.id} obstructed`);}
  assert.ok(world.plants.every(p=>Math.hypot(p.x-s.x,p.z-s.z)>=4.8));
 }
});
test('outer trails stay on dry, smooth ground across their full driving width',()=>{
 for(const route of routes.filter(r=>r.id.startsWith('trail-'))){
  const samples=routeSamples(route,.4);
  for(const p of samples){assert.equal(stepDriver(createDriver(p.x,p.z),{throttle:1,turn:0},[]),true);for(const [dx,dz] of [[0,0],[-1.9,0],[1.9,0],[0,-1.9],[0,1.9]])assert.equal(inWater(p.x+dx,p.z+dz),false,route.id);}
  for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];assert.ok(Math.abs(surfaceHeight(a.x,a.z)-surfaceHeight(b.x,b.z))<.2);}
 }
 assert.equal(inWater(0,83),true);
 assert.ok(secrets.every(s=>Math.hypot(s.x,s.z)>60),'secrets should be outside the original island');
});
