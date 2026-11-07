import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createLunarExploration,homeBearing} from '../dist/lunar-exploration.js';
import {createRocket} from '../dist/selene-rocket.js';
import {createFlightRenderer} from '../dist/flight-renderer.js';
test('hidden observers emerge from shelter and retreat before the car can reach them',()=>{
 const scene=new T.Scene(),e=createLunarExploration(scene,[]),d={x:0,z:0};
 for(let i=0;i<500;i++)e.update(.02,d);
 assert.ok(e.aliens.every(a=>a.root.visible));
 for(const a of e.aliens){for(let distance=45;distance>=0;distance-=.3){d.x=a.x+distance;d.z=a.z;e.update(.02,d);if(distance>10)assert.ok(a.root.visible);if(distance<4)assert.equal(a.root.visible,false);}}
 const count=scene.children.length;e.update(100,d,{paused:true});assert.equal(scene.children.length,count);
});
test('a visible scout watches the landing area and stays above ground at viewing distance',()=>{
 const e=createLunarExploration(new T.Scene(),[]),scout=e.aliens[0],d={x:0,z:9};
 assert.ok(Math.hypot(scout.x-d.x,scout.z-d.z)<18);assert.ok(scout.root.visible);
 for(let i=0;i<180;i++)e.update(1/60,d);
 assert.equal(scout.hide,0);assert.ok(scout.root.scale.x>1);assert.ok(scout.root.visible);
 for(const aspect of [16/9,390/844]){const camera=new T.PerspectiveCamera(42,aspect,1,1400);camera.position.set(Math.sin(.6)*22,24,9+Math.cos(.6)*22);camera.lookAt(0,.9,9);camera.updateMatrixWorld();const p=new T.Vector3(scout.x,2.5,scout.z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,'scout should be visible from the landing camera');}
});
test('home compass points to the ship relative to vehicle heading',()=>{
 assert.equal(homeBearing({x:0,z:80,heading:0}).angle,0);
 assert.equal(homeBearing({x:0,z:80,heading:0}).distance,80);
 assert.ok(Math.abs(homeBearing({x:80,z:0,heading:Math.PI/2}).angle)<1e-8);
 assert.ok(Math.abs(Math.abs(homeBearing({x:0,z:80,heading:Math.PI}).angle)-Math.PI)<1e-8);
});
test('cargo hatch opens a straight front entrance and ramp retracts during flight',()=>{
 const rocket=createRocket(),ray=new T.Raycaster(new T.Vector3(0,2,8),new T.Vector3(0,0,-1));
 rocket.setDoor(1);rocket.root.updateMatrixWorld(true);let hits=ray.intersectObject(rocket.root,true);assert.ok(hits.length);assert.ok(hits[0].point.z<0,'open bay must not contain a front wall');
 rocket.setDoor(0);rocket.root.updateMatrixWorld(true);hits=ray.intersectObject(rocket.root,true);assert.ok(hits[0].point.z>2);
 rocket.setDoor(1);rocket.setFlight(1);assert.equal(rocket.ramp.visible,false);rocket.setFlight(0);assert.equal(rocket.ramp.visible,true);
});
test('transition renderer draws both views and restores the default framebuffer',()=>{
 const calls=[],renderer={getDrawingBufferSize:v=>v.set(1920,1080),setRenderTarget:t=>calls.push(t),render:(s,c)=>calls.push([s,c])};const compositor=createFlightRenderer(renderer),scene=new T.Scene(),camera=new T.PerspectiveCamera();
 compositor.render({scene,camera,blend:{scene,camera,mix:.5}});assert.equal(calls.length,6);assert.equal(calls[4],null);assert.equal(calls[0].width,1600);compositor.release();
});
