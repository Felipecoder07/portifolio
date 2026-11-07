import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createScenery} from '../dist/scenery.js';
import {projects} from '../dist/projects.js';
import {terrainHeight,routes} from '../dist/island-layout.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const world=createScenery(new T.Scene(),projects.map(p=>({...p})));

test('three sand trail entrances meet the coastal curb without overlapping or leaving holes',()=>{
 const coast=world.root.getObjectByName('curb-coast');
 const ray=new T.Raycaster();ray.ray.direction.set(0,-1,0);
 for(const route of routes.filter(r=>r.id.startsWith('trail-'))){
  const trail=world.root.getObjectByName('road-'+route.id),border=world.root.getObjectByName('curb-'+route.id);
  const [a,b]=route.points,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  for(let distance=.037;distance<length;distance+=.12)for(const side of [-1.2,0,1.2]){
   ray.ray.origin.set(a[0]+dx*distance/length-dz*side/length,15,a[1]+dz*distance/length+dx*side/length);
   const asphalt=ray.intersectObject(coast).length>0,sand=ray.intersectObject(trail).length>0,edge=ray.intersectObject(border).length>0;
   assert.ok(asphalt||sand,`${route.id} has a gap at ${distance},${side}`);
   assert.ok(!(asphalt&&(sand||edge)),`${route.id} overlaps asphalt at ${distance},${side}`);
  }
 }
});

test('all project markers sit above the pavement with separate depth-tested disc, ring and label',()=>{
 const roads=world.root.children.filter(o=>o.name.startsWith('road-'));
 for(const p of projects){
  const group=world.root.getObjectByName('destination-marker-'+p.id);
  assert.ok(group,p.id);const position=new T.Vector3();group.getWorldPosition(position);
  assert.equal(position.x,p.x);assert.equal(position.z,p.z+11);
  const meshes=['destination-disc','destination-ring','destination-label'].map(name=>group.getObjectByName(name));
  assert.ok(meshes[0].position.y+.035/2<meshes[1].position.y);
  assert.ok(meshes[1].position.y<meshes[2].position.y);
  for(const mesh of meshes){
   assert.equal(mesh.material.depthTest,true);assert.equal(mesh.castShadow,false);
   for(const road of roads){assert.ok(mesh.renderOrder>road.renderOrder);assert.ok(mesh.material.polygonOffsetFactor<road.material.polygonOffsetFactor);assert.ok(mesh.material.polygonOffsetUnits<road.material.polygonOffsetUnits);}
  }
 }
});

test('roads use slope-aware depth separation above all curb layers',()=>{
 const roads=world.root.children.filter(o=>o.name.startsWith('road-'));
 const curbs=world.root.children.filter(o=>o.name.startsWith('curb-'));
 assert.ok(roads.length>0&&curbs.length>0);
 for(const road of roads)for(const curb of curbs){
  assert.ok(road.material.polygonOffset&&curb.material.polygonOffset);
  assert.ok(road.material.polygonOffsetFactor<curb.material.polygonOffsetFactor);
  assert.ok(road.material.polygonOffsetUnits<curb.material.polygonOffsetUnits);
 }
});

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
