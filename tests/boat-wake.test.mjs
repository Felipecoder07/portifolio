import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createBoatWake} from '../dist/boat-wake.js';
import {waterHeight,boatPose} from '../dist/water-motion.js';
import {createDriver,stepDriver} from '../dist/driving.js';
import {createOcean} from '../dist/ocean.js';

test('bow waves spread to both sides, remain behind on turns, pause and expire',()=>{
 const wake=createBoatWake(new T.Scene()),d=createDriver(-95,0);d.speed=8;d.vz=-8;
 wake.update(.1,d);d.z=-1;wake.update(.1,d,{time:.1});
 let visible=wake.root.children.filter(m=>m.visible);assert.ok(visible.length>=3);
 assert.ok(visible.some(m=>m.position.x<d.x)&&visible.some(m=>m.position.x>d.x));
 const trail=visible[0],position=trail.position.clone();
 d.heading=1;d.x+=1;wake.update(.1,d,{time:.2});assert.ok(trail.position.distanceTo(position)<.5,'old foam does not rotate with the hull');
 const paused=trail.position.clone();wake.update(1,d,{paused:true});assert.ok(trail.position.equals(paused));
 d.speed=d.vx=d.vz=0;for(let i=0;i<250;i++)wake.update(.016,d,{time:i*.016});
 assert.equal(wake.root.children.filter(m=>m.visible).length,0);
 assert.equal(wake.root.children.length,96,'fixed pool does not allocate more meshes');
});
test('wake handles reverse, resets, reduced motion and airborne boat',()=>{
 const wake=createBoatWake(new T.Scene()),d=createDriver(-95,0);d.speed=-5;d.vz=5;
 wake.update(.1,d);d.z=1;wake.update(.1,d);assert.ok(wake.root.children.some(m=>m.visible));
 wake.update(.1,d,{reduced:true});assert.ok(wake.root.children.every(m=>!m.visible));
 d.z=2;wake.update(.1,d,{airborne:true});assert.ok(wake.root.children.every(m=>!m.visible));
 d.z=3;wake.update(.1,d);wake.reset();assert.ok(wake.root.children.every(m=>!m.visible));
});
test('buoyancy follows water slope and boat preserves momentum with gradual steering',()=>{
 const d=createDriver(-95,0);d.vz=-10;d.speed=10;
 for(let i=0;i<120;i++)stepDriver(d,{throttle:0,turn:0},[]);
 assert.ok(d.speed>5&&d.speed<10,'coasting slows gradually in water');
 stepDriver(d,{throttle:1,turn:1},[]);const first=d.boatYawRate;
 for(let i=0;i<60;i++)stepDriver(d,{throttle:1,turn:1},[]);
 assert.ok(d.boatYawRate>first);assert.ok(d.heading>0);
 const a=boatPose(d,0),b=boatPose(d,2);assert.notDeepEqual(a,b);
 for(const time of [0,1,10,100]){const pose=boatPose(d,time);assert.ok(Object.values(pose).every(Number.isFinite));assert.ok(Math.abs(pose.y-waterHeight(d.x,d.z,time)-.2)<.03);}
 assert.deepEqual(boatPose(d,1,true),{y:-1.15,pitch:0,roll:0});
});
test('hull displaces water only when afloat and fades with speed',()=>{
 const ocean=createOcean(new T.Group()),shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 ocean.water.material.onBeforeCompile(shader);const d=createDriver(-95,0);d.speed=12;
 ocean.update(1,false,{y:-1.15},d);assert.equal(shader.uniforms.uBoat.value.w,1);
 ocean.update(1,false,{y:8},d);assert.equal(shader.uniforms.uBoat.value.w,0);
 ocean.update(1,true,{y:-1.15},d);assert.equal(shader.uniforms.uBoat.value.w,0);
});
