import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createDriver,stepDriver} from '../dist/driving.js';
import {travelMode,createAmphibious,sailingRadius} from '../dist/amphibious.js';

test('car enters the sea, sails beyond the old island limit and returns to land',()=>{
 const d=createDriver(72,0);d.heading=-Math.PI/2;
 for(let i=0;i<450;i++)assert.ok(stepDriver(d,{throttle:1,turn:0},[]));
 assert.equal(d.mode,'boat');assert.ok(d.x>90);
 d.heading=Math.PI/2;d.vx=d.vz=0;
 for(let i=0;i<600&&d.x>70;i++)stepDriver(d,{throttle:1,turn:0},[]);
 assert.ok(d.x<73);assert.equal(d.mode,'car');
});
test('bridge remains car mode and sea boundary keeps navigation finite',()=>{
 assert.equal(travelMode(createDriver(33,-3)),'car');
 const d=createDriver(125,0);d.heading=-Math.PI/2;
 for(let i=0;i<1000;i++)assert.ok(stepDriver(d,{throttle:1,turn:.1},[]));
 assert.ok(Math.hypot(d.x,d.z)<=sailingRadius+.0001);assert.equal(d.mode,'boat');
});
test('transformation swaps models, smoke expires and reset restores the car',()=>{
 const scene=new T.Scene(),car=new T.Group(),body=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());scene.add(car);car.add(body);
 // The new station causeway occupies z=0; use open sea south of it.
 const rig=createAmphibious(scene,car),d=createDriver(90,25);
 rig.update(1/60,d);assert.equal(body.visible,false);assert.equal(rig.boat.visible,true);
 assert.ok(scene.children.some(o=>o.isMesh&&o.visible));
 for(let i=0;i<120;i++)rig.update(1/60,d);
 assert.ok(scene.children.filter(o=>o.isMesh).every(o=>!o.visible));
 d.mode='car';rig.update(1/60,d,{reduced:true});assert.equal(body.visible,true);assert.equal(rig.boat.visible,false);
 d.mode='boat';rig.update(1/60,d);rig.reset();assert.equal(body.visible,true);assert.equal(rig.boat.visible,false);
 assert.ok(scene.children.filter(o=>o.isMesh).every(o=>!o.visible));
});
