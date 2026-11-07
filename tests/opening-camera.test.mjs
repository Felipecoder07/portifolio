import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createWorldCamera,createCameraRig} from '../dist/camera.js';

test('opening camera separates ground and curb depths throughout the tour on desktop and mobile',()=>{
 const controls=new Map();
 globalThis.document={querySelector:id=>{if(!controls.has(id))controls.set(id,{});return controls.get(id);}};
 globalThis.addEventListener=()=>{};
 for(const aspect of [1440/1000,390/844]){
  const camera=createWorldCamera(aspect),car=new T.Group(),reduced=new EventTarget();
  car.position.set(0,.08,12);reduced.matches=false;
  const rig=createCameraRig(camera,new EventTarget(),car,[],reduced);
  for(let frame=0;frame<270;frame++){
   rig.update(1/60,0,false);camera.updateMatrixWorld();
   for(const [x,z] of [[0,12],[4,-47],[33,-18],[-43,-20]]){
    const ground=new T.Vector3(x,0,z).project(camera),curb=new T.Vector3(x,.04,z).project(camera);
    if(Math.abs(ground.x)>1||Math.abs(ground.y)>1)continue;
    const depthSteps=Math.abs(ground.z-curb.z)*.5*(2**24-1);
    assert.ok(depthSteps>4,`depth surfaces collide at ${x},${z}: ${depthSteps} steps`);
    assert.ok(ground.z>-1&&ground.z<1);
   }
  }
 }
});
