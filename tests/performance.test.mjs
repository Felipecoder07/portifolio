import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {batchRigidMeshes} from '../dist/render-optimization.js';
import {createGraphics,pixelRatioFor,readQuality,saveQuality} from '../dist/graphics.js';

test('rigid batching keeps transformed bounds, triangle count, material and moving parents',()=>{
 const parent=new T.Group(),material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry(1,2,3);
 parent.position.set(4,5,6);parent.rotation.y=.3;
 for(let i=0;i<4;i++){const mesh=new T.Mesh(geometry,material);mesh.position.set(i*2,i,0);mesh.rotation.z=i*.2;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);}
 const glass=new T.Mesh(geometry,new T.MeshStandardMaterial({transparent:true,opacity:.4}));parent.add(glass);
 const before=new T.Box3().setFromObject(parent,true);
 assert.equal(batchRigidMeshes(parent),3);assert.equal(parent.children.length,2);assert.ok(parent.children.includes(glass));
 const batch=parent.children.find(m=>m!==glass);
 assert.equal(batch.geometry.index.count,geometry.index.count*4);assert.equal(batch.material,material);assert.ok(batch.castShadow&&batch.receiveShadow);
 const after=new T.Box3().setFromObject(parent,true);
 assert.ok(before.min.distanceTo(after.min)<1e-6);assert.ok(before.max.distanceTo(after.max)<1e-6);
 parent.position.x+=10;const moved=new T.Box3().setFromObject(parent,true);assert.ok(Math.abs(moved.min.x-after.min.x-10)<1e-6);
 assert.equal(geometry.attributes.position.count,24,'shared source geometry was not changed');
});

test('explicitly animated meshes are never merged into rigid decoration',()=>{
 const parent=new T.Group(),geometry=new T.BoxGeometry(),mat=new T.MeshBasicMaterial();
 const flag=new T.Mesh(geometry,mat);parent.add(flag,new T.Mesh(geometry,mat),new T.Mesh(geometry,mat));
 assert.equal(batchRigidMeshes(parent,{exclude:new Set([flag])}),1);assert.equal(flag.parent,parent);
});

function rig(mode='auto'){
 let ratio=1,disposed=0;
 const renderer={getPixelRatio:()=>ratio,setPixelRatio:value=>{ratio=value;}};
 const sun={shadow:{mapSize:new T.Vector2(2048,2048),map:{dispose(){disposed++;}},needsUpdate:false}};
 const graphics=createGraphics(renderer,sun,{mode,viewport:()=>({width:1440,height:1000,dpr:2})});
 return {graphics,sun,ratio:()=>ratio,disposed:()=>disposed};
}
test('graphics quality caps high-density buffers and releases replaced shadow maps',()=>{
 assert.ok(pixelRatioFor('high',3840,2160,3)**2*3840*2160<=6_000_001);
 const r=rig('high');assert.equal(r.ratio(),2);r.graphics.setMode('balanced');assert.equal(r.sun.shadow.mapSize.x,1024);assert.equal(r.disposed(),1);
 r.graphics.setMode('low');assert.equal(r.sun.shadow.mapSize.x,512);assert.ok(r.ratio()<=1);
 r.graphics.setMode('high');assert.equal(r.sun.shadow.mapSize.x,2048);assert.equal(r.ratio(),2);
});
test('automatic resolution reacts to sustained load, ignores paused frames and recovers slowly',()=>{
 const r=rig();for(let i=0;i<600;i++)r.graphics.sample(.05,false);assert.equal(r.graphics.status().scale,1);
 for(let i=0;i<280;i++)r.graphics.sample(.05,true);assert.ok(r.graphics.status().scale<1);
 const low=r.graphics.status().scale;
 for(let i=0;i<1100;i++)r.graphics.sample(1/60,true);assert.ok(r.graphics.status().scale>low);
 r.graphics.setMode('high');for(let i=0;i<1000;i++)r.graphics.sample(.1,true);assert.equal(r.graphics.status().scale,1);
});
test('quality preferences tolerate denied storage and invalid saved values',()=>{
 globalThis.localStorage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 assert.equal(readQuality(),'auto');assert.doesNotThrow(()=>saveQuality('high'));
 let stored='invalid';globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
 assert.equal(readQuality(),'auto');saveQuality('balanced');assert.equal(readQuality(),'balanced');delete globalThis.localStorage;
});
