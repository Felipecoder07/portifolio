import test from 'node:test';
import assert from 'node:assert/strict';
import {steeringAxis,createTouchControls} from '../dist/touch-controls.js';

class Element extends EventTarget{
 constructor(){super();this.style={};this.attrs={};this.captured=new Set();this.classList={add(){},remove(){},toggle(){}};}
 setAttribute(name,value){this.attrs[name]=value;}
 setPointerCapture(id){this.captured.add(id);}
 hasPointerCapture(id){return this.captured.has(id);}
 releasePointerCapture(id){this.captured.delete(id);}
 getBoundingClientRect(){return {left:0,top:0,width:132,height:132};}
}
function setup(){
 const stick=new Element(),knob=new Element(),brake=new Element(),root=new Element(),window=new EventTarget();brake.dataset={pedal:'brake'};
 root.querySelector=s=>s==='#joystick'?stick:knob;root.querySelectorAll=()=>[brake];
 globalThis.addEventListener=window.addEventListener.bind(window);globalThis.document=new EventTarget();
 let paused=false;const control=createTouchControls(root,{paused:()=>paused});
 return {stick,brake,window,...control,pause:()=>{paused=true;}};
}
function fire(target,type,properties={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:1,button:0,clientX:66,clientY:66},properties);target.dispatchEvent(e);}

test('joystick has a dead zone and bounded progressive response',()=>{
 assert.equal(steeringAxis(2,40),0);assert.ok(steeringAxis(20,40)>.4);assert.ok(steeringAxis(20,40)<.5);
 assert.equal(steeringAxis(-1000,40),-1);assert.equal(steeringAxis(1000,40),1);
});
test('one thumb controls forward, reverse and diagonal steering; release stops input',()=>{
 const c=setup();fire(c.stick,'pointerdown');assert.equal(c.input.throttle,0);
 fire(c.stick,'pointermove',{clientY:20});assert.equal(c.input.throttle,1);assert.equal(c.input.turn,0);
 fire(c.stick,'pointermove',{clientX:40,clientY:40});assert.ok(c.input.turn>.5&&c.input.throttle>.5);
 fire(c.stick,'pointermove',{clientY:110});assert.equal(c.input.throttle,-1);
 fire(c.stick,'pointerup');assert.deepEqual(c.input,{turn:0,throttle:0,handbrake:false});
});
test('brake can be held with another finger without taking over the joystick',()=>{
 const c=setup();fire(c.stick,'pointerdown',{clientY:20});
 fire(c.brake,'pointerdown',{pointerId:2});assert.equal(c.input.throttle,1);assert.equal(c.input.handbrake,true);
 fire(c.stick,'pointerdown',{pointerId:3,clientY:110});assert.equal(c.input.throttle,1);
 fire(c.brake,'pointerup',{pointerId:2});assert.equal(c.input.throttle,1);assert.equal(c.input.handbrake,false);
 fire(c.stick,'pointercancel');assert.equal(c.input.throttle,0);
});
test('focus loss, resize and menus clear captures without a stuck throttle',()=>{
 for(const event of ['blur','resize']){
  const c=setup();fire(c.stick,'pointerdown',{clientY:20});fire(c.brake,'pointerdown',{pointerId:2});c.window.dispatchEvent(new Event(event));
  assert.deepEqual(c.input,{turn:0,throttle:0,handbrake:false});assert.equal(c.stick.captured.size,0);assert.equal(c.brake.captured.size,0);
 }
 const c=setup();fire(c.stick,'pointerdown',{clientY:20});c.reset();c.pause();fire(c.stick,'pointerdown',{clientY:20});assert.equal(c.input.throttle,0);
});
test('focused joystick supports keyboard diagonals and independent key release',()=>{
 const c=setup();fire(c.stick,'keydown',{key:'ArrowUp'});fire(c.stick,'keydown',{key:'ArrowLeft'});
 assert.equal(c.input.throttle,1);assert.equal(c.input.turn,1);
 fire(c.stick,'keyup',{key:'ArrowLeft'});assert.equal(c.input.turn,0);assert.equal(c.input.throttle,1);
 fire(c.stick,'keyup',{key:'ArrowUp'});assert.equal(c.input.throttle,0);
});
