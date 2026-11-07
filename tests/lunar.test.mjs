import test from 'node:test';
import assert from 'node:assert/strict';
import {lunarHeight,lunarPose,moonRadius,stationSurface,flightStage,flightDuration} from '../dist/lunar-terrain.js';
import {terrainHeight,inWater} from '../dist/island-layout.js';
import {travelMode} from '../dist/amphibious.js';
import {createDriver,stepDriver,tuning} from '../dist/driving.js';
test('launch island and causeway remain dry and continuous for the car',()=>{
 for(let x=74;x<115;x+=.5){assert.ok(stationSurface(x,0));assert.equal(terrainHeight(x,0),0);assert.equal(inWater(x,0),false);assert.equal(travelMode({x,z:0,mode:'car'}),'car');}
 assert.equal(stationSurface(101,20),false);assert.equal(inWater(101,20),true);
});
test('lunar landing area is flat and crater wheel contact stays finite',()=>{
 assert.equal(lunarHeight(0,0),0);assert.equal(lunarHeight(0,9),0);
 for(let x=-210;x<=210;x+=7)for(let z=-210;z<=210;z+=7){const p=lunarPose(x,z,.7);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.pitch)<1&&Math.abs(p.roll)<1);}
});
test('lunar driving stays on land and respects its own exploration boundary',()=>{
 const d=createDriver(80,0);d.heading=-Math.PI/2;
 for(let i=0;i<2400;i++)assert.ok(stepDriver(d,{throttle:1,turn:0,handbrake:false},[],tuning.step,{mode:'car',radius:moonRadius,tuning:{...tuning,forward:18}}));
 assert.equal(d.mode,'car');assert.ok(Math.hypot(d.x,d.z)<=moonRadius+.001);assert.ok(d.x>100);
});
test('flight phases cover boarding through landing in both directions',()=>{
 assert.equal(flightStage(0),'Embarque');assert.equal(flightStage(8),'Ascensão');assert.equal(flightStage(26),'Transferência orbital');assert.equal(flightStage(40),'Pouso');assert.equal(flightStage(flightDuration-.01),'Desembarque');
});
