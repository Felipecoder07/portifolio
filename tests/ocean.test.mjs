import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createOcean} from '../dist/ocean.js';
import {terrainHeight} from '../dist/island-layout.js';

test('shore mesh follows the terrain, closes at its seam and has valid indices',()=>{
 const root=new T.Group(),o=createOcean(root),g=o.shore.geometry,p=g.attributes.position;
 assert.equal(root.children.length,2);assert.equal(o.shore.material.depthWrite,false);
 for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getY(i)));assert.ok(Math.abs(p.getY(i)-terrainHeight(p.getX(i),p.getZ(i)))<.00002);}
 for(let i=0;i<g.index.count;i++)assert.ok(g.index.getX(i)<p.count);
 for(let r=0;r<=40;r++){const a=new T.Vector3().fromBufferAttribute(p,r*257),b=new T.Vector3().fromBufferAttribute(p,r*257+256);assert.ok(a.distanceTo(b)<1e-8);}
});
test('water and wash share animation time and reduced motion freezes both',()=>{
 const o=createOcean(new T.Group());
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};o.water.material.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('transformed.z+=wf.x'));
 assert.ok(shader.fragmentShader.includes('float fresnel='));
 assert.equal(shader.uniforms.uTime,o.shore.material.uniforms.uTime);
 o.update(12);assert.equal(shader.uniforms.uTime.value,12);o.update(15,true);assert.equal(shader.uniforms.uTime.value,12);
 o.update(16);assert.equal(shader.uniforms.uTime.value,16);
});
