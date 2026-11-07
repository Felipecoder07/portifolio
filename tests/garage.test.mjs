import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createCustomization,originalFinish,paints,rimFinishes} from '../dist/garage-customization.js';
import {createGarage} from '../dist/garage.js';
import {vehicle} from '../dist/vehicle.js';
import {createAmphibious} from '../dist/amphibious.js';
import {createDriver} from '../dist/driving.js';

function storage(value=null){return {value,getItem(){return this.value;},setItem(key,value){this.value=value;}};}
test('preview and restore remain drafts until apply; saved finishes survive reload',()=>{
 const disk=storage(),c=createCustomization(disk);c.begin();c.preview({paint:'ocean',rims:'bronze'});
 assert.deepEqual(c.saved,originalFinish);assert.equal(disk.value,null);
 assert.deepEqual(c.cancel(),originalFinish);c.begin();c.preview({paint:'forest',rims:'dark'});c.apply();
 assert.deepEqual(createCustomization(disk).saved,{paint:'forest',rims:'dark'});
 c.begin();c.restore();c.cancel();assert.equal(c.saved.paint,'forest');
 c.begin();c.restore();c.apply();assert.deepEqual(createCustomization(disk).saved,originalFinish);
 const copy=c.saved;copy.paint='invalid';assert.equal(c.saved.paint,'copper');
});
test('corrupt and unavailable storage safely fall back and allow session customization',()=>{
 assert.deepEqual(createCustomization(storage('{bad')).saved,originalFinish);
 assert.deepEqual(createCustomization(storage('{"paint":"ocean","rims":"unknown"}')).saved,{paint:'ocean',rims:'silver'});
 const c=createCustomization({getItem(){throw Error();},setItem(){throw Error();}});
 c.begin();c.preview({paint:'berry'});assert.equal(c.apply().paint,'berry');assert.equal(c.persistent,false);
});

// Minimal DOM adapter: exercise the actual workshop controller and Three.js models
// without pretending to validate browser layout, focus trapping or rendered pixels.
class Element{
 constructor(){this.style={};this.dataset={};this.nodes=new Map();this.events={};this.classList={add(){},remove(){}};this.visible=true;}
 setAttribute(k,v){this[k]=String(v);}
 addEventListener(k,fn){this.events[k]=fn;}
 append(){} focus(){} setPointerCapture(){}
 showModal(){this.open=true;} close(){this.open=false;}
 querySelector(s){if(!this.nodes.has(s))this.nodes.set(s,new Element());return this.nodes.get(s);}
 querySelectorAll(s){return (s==='[data-paint]'?paints:s==='[data-rims]'?rimFinishes:[]).map(item=>{const node=this.querySelector(s+item.id);node.dataset=s==='[data-paint]'?{paint:item.id}:{rims:item.id};return node;});}
 getContext(){return {fillRect(){},fillText(){}};}
}
test('garage enters, previews boat and car paint, cancels, saves, and exits with controls released',()=>{
 const previousDocument=globalThis.document,previousStorage=globalThis.localStorage;
 globalThis.document={createElement:()=>new Element(),body:new Element()};globalThis.localStorage=storage();
 try{
  const scene=new T.Scene(),carRig=vehicle(scene),amphibious=createAmphibious(scene,carRig.car),shell=new T.Group();
  const g=createGarage(scene,{carRig,amphibious,garageShell:shell}),d=createDriver(0,9);
  assert.equal(g.open({...d,mode:'boat'}),false);
  g.update(.016,d,{paused:true});assert.equal(g.open(d),false);
  g.update(.016,d);assert.equal(g.open(d),true);assert.equal(shell.visible,false);
  for(let i=0;i<100;i++)g.update(1/60,d);
  assert.equal(g.phase,'open');assert.equal(d.x,0);assert.equal(d.z,0);assert.equal(d.speed,0);
  const facade=scene.getObjectByName('garage-facade');assert.equal(facade.visible,false);
  const first=scene.getObjectByName('robot-link-0'),second=scene.getObjectByName('robot-link-1');
  function checkArm(){
   scene.updateMatrixWorld(true);
   const elbowA=first.localToWorld(new T.Vector3(0,1.85/2,0));
   const elbowB=second.localToWorld(new T.Vector3(0,-1.75/2,0));
   assert.ok(elbowA.distanceTo(elbowB)<1e-6,'rigid links stay connected at the elbow');
   assert.equal(first.scale.y,1);assert.equal(second.scale.y,1);
  }
  g.dialog.querySelector('[data-paint]ocean').onclick();
  g.dialog.querySelector('[data-rims]bronze').onclick();
  for(let i=0;i<120;i++){g.update(1/60,d);checkArm();}
  assert.equal(carRig.paint.color.getHex(),amphibious.paint.color.getHex());
  assert.equal(carRig.paint.color.getHexString(),'397da4');
  assert.equal(carRig.rimMaterial.color.getHexString(),'b58b58');
  assert.equal(g.dialog.querySelector('#garage-apply').disabled,false);
  g.dialog.querySelector('#garage-apply').onclick();
  let moved=false;
  for(let i=0;i<180;i++){const beforeZ=d.z,pose=g.update(1/60,d);if(pose){carRig.update(1/60,d,{motionSpeed:pose.motionSpeed});if(d.z>beforeZ){moved=true;assert.ok(Math.abs(d.heading-Math.PI)<1e-6);assert.ok(pose.motionSpeed>0);}}}
  assert.ok(moved);assert.notEqual(carRig.wheels[0].wheel.rotation.x,0);
  assert.equal(facade.visible,true,'facade returns after leaving');
  assert.equal(g.active,false);assert.equal(shell.visible,true);assert.equal(d.z,9);assert.equal(g.dialog.open,false);
  assert.ok(globalThis.localStorage.value);
  g.open(d);g.update(.016,d,{reduced:true});assert.equal(g.phase,'open');
  g.dialog.querySelector('#garage-restore').onclick();g.update(.016,d,{reduced:true});
  assert.equal(carRig.paint.color.getHexString(),'d78256');
  g.dialog.events.cancel({preventDefault(){}});g.update(.016,d,{reduced:true});assert.equal(g.active,false);
  assert.equal(carRig.paint.color.getHexString(),'397da4');assert.equal(amphibious.paint.color.getHexString(),'397da4');
  d.x=0;d.z=2;d.speed=5;
  g.update(.016,d,{paused:true});assert.equal(g.active,false);
  g.update(.016,d);assert.equal(g.active,true,'driving inside opens customization without E');
  for(let i=0;i<100;i++)g.update(1/60,d);
  assert.equal(g.dialog.querySelector('#garage-options').disabled,false);
  g.dialog.querySelector('[data-paint]forest').onclick();g.update(.016,d,{reduced:true});
  assert.equal(carRig.paint.color.getHexString(),'427963');
  g.abort();assert.equal(g.active,false);assert.equal(shell.visible,true);
  scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
 }finally{globalThis.document=previousDocument;globalThis.localStorage=previousStorage;}
});
