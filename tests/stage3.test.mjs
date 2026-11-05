import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {projects} from '../dist/projects.js';
import {createScenery} from '../dist/scenery.js';
import {routes,routeSamples,bridgeHeight,terrainHeight,surfaceHeight,groundPose,inWater,nearRoad,infrastructureColliders,buildingColliders} from '../dist/island-layout.js';
import {createDriver,stepDriver} from '../dist/driving.js';
import {createLighting} from '../dist/lighting.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const scene=new T.Scene();scene.background=new T.Color();scene.fog=new T.Fog('#fff',90,210);
const world=createScenery(scene,projects.map(p=>({...p})));
function collides(x,z,objects=world.obstacles,radius=1.15){return objects.some(o=>o.radius?Math.hypot(x-o.x,z-o.z)<radius+o.radius:Math.hypot(Math.max(Math.abs(x-o.x)-o.hx,0),Math.max(Math.abs(z-o.z)-o.hz,0))<radius);}

test('bridge deck is above lagoon with continuous shallow ramps and safe road',()=>{
 assert.ok(terrainHeight(33,-3)<-2);assert.ok(surfaceHeight(33,-3)>1.6);assert.equal(bridgeHeight(-18),0);assert.equal(bridgeHeight(12),0);
 assert.equal(inWater(33,-3),false);assert.equal(inWater(38,-3),false);assert.equal(inWater(30,-3),false);
 assert.equal(inWater(33+4.1,-3),true);
 let previous=surfaceHeight(33,-18);
 for(let z=-17.9;z<=12;z+=.1){const h=surfaceHeight(33,z);assert.ok(Math.abs(h-previous)<.04);assert.equal(collides(33,z),false);previous=h;}
 assert.ok(groundPose(33,10,0).pitch>0);assert.ok(groundPose(33,-16,0).pitch<0);
});
test('garage and tunnel have open lanes, with solid sides',()=>{
 for(let z=-9;z<=9;z+=.25)assert.equal(collides(-43,z),false,`tunnel ${z}`);
 for(let z=-1;z<=12;z+=.25)assert.equal(collides(0,z),false,`garage ${z}`);
 assert.ok(collides(-48,0));assert.ok(collides(6,0));
});
test('every marked road centre avoids buildings, furniture and water',()=>{
 const bad=[];for(const route of routes)for(const p of routeSamples(route,1)){if(collides(p.x,p.z)||inWater(p.x,p.z))bad.push(`${route.id}@${p.x.toFixed(1)},${p.z.toFixed(1)}`);}
 assert.deepEqual(bad,[]);
});
test('all destinations and lookout are reachable from spawn on a clearance grid',()=>{
 const key=(x,z)=>`${x},${z}`,queue=[[0,12]],seen=new Set([key(0,12)]);
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!seen.has(k)&&Math.hypot(nx,nz)<55&&!inWater(nx,nz)&&!collides(nx,nz)){seen.add(k);queue.push([nx,nz]);}}}
 for(const p of projects)assert.ok(seen.has(key(p.x,p.z+11)),p.id);
 assert.ok(seen.has(key(-31,36)));
});
test('coastal trees stay clear of road corridors; terrain and roads have upward normals',()=>{
 assert.ok(world.plants.length>10);for(const p of world.plants)assert.equal(nearRoad(p.x,p.z,2),false);
 const terrain=world.root.getObjectByName('terrain'),normals=terrain.geometry.attributes.normal;
 let upward=0;for(let i=0;i<normals.count;i++)if(normals.getY(i)>.5)upward++;
 assert.ok(upward/normals.count>.9);
 const instances=[];world.root.traverse(o=>{if(o.isInstancedMesh)instances.push(o);});assert.ok(instances.length>=5);
});
test('car traverses bridge and tunnel at speed without hitting invisible walls',()=>{
 for(const [x,startZ,endZ] of [[33,12,-18],[-43,12,-12]]){const c=createDriver(x,startZ);for(let i=0;i<500&&c.z>endZ;i++){stepDriver(c,{throttle:1,turn:0},world.obstacles);assert.equal(inWater(c.x,c.z),false);}assert.ok(c.z<=endZ,`blocked at ${c.x},${c.z}`);}
});
test('night lighting uses limited local lights and shared emissive fixtures',()=>{
 const renderer={toneMappingExposure:1},lighting=createLighting(scene,renderer,world.fixtures);lighting.setNight(true);
 assert.ok(world.fixtures.every(m=>m.emissiveIntensity>1));let pointLights=0;scene.traverse(o=>{if(o.isPointLight)pointLights++;});assert.equal(pointLights,3);
 lighting.setNight(false);assert.ok(world.fixtures.every(m=>m.emissiveIntensity<.1));
 const flag=world.root.children.find(o=>o.name==='district-arenix');world.update(1,true);assert.ok(flag);
});
