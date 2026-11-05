import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createScenery} from '../dist/scenery.js';
import {projects} from '../dist/projects.js';
import {terrainHeight} from '../dist/island-layout.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const world=createScenery(new T.Scene(),projects.map(p=>({...p})));

test('ground ribbons follow hills across their full width without cutting into grass',()=>{
 for(const mesh of world.root.children.filter(o=>/^(road|curb)-/.test(o.name)&&!o.name.endsWith('-bridge'))){
  const {position,normal}=mesh.geometry.attributes,index=mesh.geometry.index;
  for(let i=0;i<index.count;i+=3){
   let x=0,y=0,z=0;
   for(let j=0;j<3;j++){const k=index.getX(i+j);x+=position.getX(k)/3;y+=position.getY(k)/3;z+=position.getZ(k)/3;assert.ok(normal.getY(k)>0,mesh.name+' normal');}
   assert.ok(y-terrainHeight(x,z)>.025,mesh.name+' cuts into ground at '+x+','+z);
  }
 }
});

test('terrain triangles approximate the height used by pavement within two centimetres',()=>{
 const geometry=world.root.getObjectByName('terrain').geometry,{position}=geometry.attributes;
 for(let i=0;i<geometry.index.count;i+=3){
  let x=0,y=0,z=0;
  for(let j=0;j<3;j++){const k=geometry.index.getX(i+j);x+=position.getX(k)/3;y+=position.getY(k)/3;z+=position.getZ(k)/3;}
  assert.ok(Math.abs(y-terrainHeight(x,z))<.02,`terrain interpolation at ${x},${z}`);
 }
});
