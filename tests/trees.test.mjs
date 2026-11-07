import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createScenery} from '../dist/scenery.js';
import {projects} from '../dist/projects.js';
import {createDriver,stepDriver} from '../dist/driving.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
function forest(){return createScenery(new T.Scene(),projects.map(p=>({...p})));}
test('a moving car knocks down a tree, which stays passable and remains fallen',()=>{
 const world=forest(),p=world.plants[0],driver=createDriver(p.x,p.z+2.5);
 driver.vz=-8;driver.speed=8;
 const start=driver.z;
 for(let i=0;i<70;i++){
  stepDriver(driver,{throttle:1,turn:0},world.obstacles);
  world.hitTrees(driver.x,driver.z,driver.vx,driver.vz);
  world.update(i/120);
 }
 assert.equal(p.fallen,true);assert.ok(driver.z<start-2,'tree blocked the vehicle');
 const canopy=world.root.children.find(m=>m.isInstancedMesh&&m.geometry.type==='IcosahedronGeometry'&&m.geometry.parameters.radius===1.5);
 const matrix=new T.Matrix4();canopy.getMatrixAt(0,matrix);
 const originalHeight=p.y+2.9*p.s;
 assert.ok(matrix.elements[13]<originalHeight-1,'canopy did not fall');
 assert.equal(world.hitTrees(p.x,p.z,10,0),0,'same tree was knocked down twice');
});
test('slow contact leaves trees upright; reduced motion finishes the fall immediately',()=>{
 const world=forest(),p=world.plants[0];
 assert.equal(world.hitTrees(p.x,p.z,2,0),0);assert.equal(p.fallen,undefined);
 assert.equal(world.hitTrees(p.x,p.z,6,0,true),1);assert.equal(p.fallen,true);
 assert.equal(world.obstacles.some(o=>o.x===p.x&&o.z===p.z),false);
});
