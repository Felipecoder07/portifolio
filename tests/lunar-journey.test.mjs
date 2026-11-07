import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/three.js';
import {createLunarJourney,forwardBoarding} from '../dist/lunar-journey.js';
import {createDriver} from '../dist/driving.js';
// Canvas painting is stubbed; geometry, scenes, camera and the journey run in Three.js.
function element(){const children=new Map();return {style:{},classList:{add(){},remove(){}},append(){},setAttribute(){},querySelector(key){if(!children.has(key))children.set(key,element());return children.get(key);},getContext(){return new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>({addColorStop(){}})},{get:(obj,key)=>obj[key]||(()=>{})});}};}
globalThis.document={body:element(),createElement:element};
function setup(){const scene=new T.Scene(),car=new T.Group(),arrivals=[];scene.add(car);const journey=createLunarJourney(scene,car,{onDepart(){},onArrive:where=>arrivals.push(where)});const driver=createDriver(101,5);return {scene,car,journey,driver,arrivals};}
function board(journey,driver){driver.z=5;driver.heading=0;assert.equal(journey.enter(driver),true);journey.update(3,driver);}
test('full trip boards, lands, releases car on the Moon and returns to the station',()=>{
 const {scene,car,journey,driver,arrivals}=setup();
 board(journey,driver);assert.equal(journey.enter(driver),false);
 const stages=new Set();for(let i=0;i<470;i++){const view=journey.update(.1,driver);stages.add(journey.phase);if(view){assert.ok(view.scene.isScene);assert.ok(view.camera.position.toArray().every(Number.isFinite));}}
 assert.equal(journey.location,'moon');assert.equal(journey.active,false);assert.equal(car.parent,journey.moon.scene);assert.equal(car.visible,true);assert.equal(driver.z,9);assert.equal(driver.mode,'car');
 assert.ok(stages.has('Ascensão')&&stages.has('Pouso')&&stages.has('Desembarque'));
 board(journey,driver);for(let i=0;i<470;i++)journey.update(.1,driver);
 assert.deepEqual(arrivals,['moon','earth']);assert.equal(car.parent,scene);assert.equal(driver.x,101);assert.equal(driver.z,9);assert.ok(car.visible);
});
test('pause holds flight, cancellation restores departure and reduced motion arrives safely',()=>{
 const {scene,journey,driver,car}=setup();journey.enter(driver);journey.update(12,driver,{paused:true});assert.equal(journey.phase,'Embarque');
 journey.update(39,driver);journey.cancel(driver);assert.equal(journey.location,'earth');assert.equal(car.parent,scene);assert.equal(journey.active,false);assert.ok(car.visible);
 board(journey,driver);journey.update(1.1,driver,{reduced:true});assert.equal(journey.location,'moon');assert.equal(journey.active,false);assert.equal(driver.mode,'car');
 board(journey,driver);journey.update(10,driver);journey.cancel(driver);assert.equal(journey.location,'moon');assert.equal(driver.x,0);
 journey.earth(driver);assert.equal(journey.location,'earth');assert.equal(car.parent,scene);
});
test('lunar geometry contains finite positions and remains bounded in draw objects',()=>{
 const {journey,driver}=setup();journey.enter(driver);let meshes=0;
 journey.moon.scene.traverse(object=>{if(!object.isMesh)return;meshes++;const p=object.geometry.attributes.position;for(const value of p.array)assert.ok(Number.isFinite(value));});
 assert.ok(meshes<190,`Moon has ${meshes} meshes`);assert.ok(journey.moon.obstacles.length>20);
});
test('entry accepts any heading in the existing area and starts travel automatically',()=>{
 const {journey,driver}=setup();
 for(const heading of [0,.5,Math.PI/2,Math.PI,-.8])assert.equal(forwardBoarding({...driver,heading,speed:12},101),true);
 assert.equal(forwardBoarding({...driver,x:102},101),false);assert.equal(forwardBoarding({...driver,z:7},101),false);
 driver.heading=.5;assert.equal(journey.enter(driver),true);journey.update(3,driver);assert.equal(driver.heading,.5);assert.equal(driver.x,101);
 journey.update(7,driver);assert.equal(journey.phase,'Ascensão');
});
test('destination stays present and grows continuously; scene switches use dissolves',()=>{
 const {journey,driver}=setup();board(journey,driver);let previous=0,blends=0;
 for(let i=0;i<340;i++){const view=journey.update(.1,driver);if(view?.blend){blends++;assert.ok(view.blend.mix>=0&&view.blend.mix<=1);}const scene=view?.scene.name==='unused'?null:view?.scene;const planet=scene?.getObjectByName('moon globe')||view?.blend?.scene.getObjectByName('moon globe');if(planet?.userData.angularRadius){assert.ok(planet.visible);assert.ok(planet.userData.angularRadius>=previous-1e-8);previous=planet.userData.angularRadius;}}
 assert.ok(previous>1);assert.ok(blends>40);
});
