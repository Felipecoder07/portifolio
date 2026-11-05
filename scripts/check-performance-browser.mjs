import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const pages=await(await fetch('http://127.0.0.1:9224/json/list')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map(),errors=[],checks=[];
ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const stats=()=>evaluate("import('./world.js').then(w=>w.diagnostics())");
async function ready(){for(let i=0;i<60;i++){await pause(500);if(await evaluate("!!document.querySelector('canvas.world') && !document.querySelector('#loading')"))return;}throw Error('WebGL unavailable');}
async function screenshot(name){const result=await send('Page.captureScreenshot',{format:'png'});await writeFile(`test-artifacts/optimized-${name}.png`,Buffer.from(result.data,'base64'));}
try{
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:3000'});await ready();
 await evaluate("document.querySelector('#start').click();document.querySelector('#settings').click()");
 const modes=[];
 for(let i=0;i<4;i++){
  await evaluate("document.querySelector('#quality').click()");await pause(350);
  const current=await stats();modes.push(current.graphics.mode);
  assert.equal(await evaluate("localStorage.getItem('felipe-world-quality')"),current.graphics.mode);
 }
 assert.deepEqual(modes.slice().sort(),['auto','balanced','high','low']);checks.push('All four quality modes render and save their preference');
 await screenshot('settings');
 await evaluate("while(document.querySelector('#quality').textContent!=='Equilibrada')document.querySelector('#quality').click()");
 await send('Page.reload');await ready();assert.equal((await stats()).graphics.mode,'balanced');checks.push('Saved quality survives page reload');
 await evaluate("document.querySelector('#start').click();import('./world.js').then(w=>{w.quality('high');w.reset()})");await pause(1700);await screenshot('arrival');
 for(const [name,x,z] of [['lookout',-31,36],['coast',4,-47],['bridge',33,4]]){
  await evaluate(`import('./world.js').then(w=>w.teleport({target:{x:${x},z:${z-2}}}))`);await pause(1700);await screenshot(name);
 }
 await evaluate("document.querySelector('#settings').click();document.querySelector('#day').click();document.querySelector('#close').click()");await pause(1000);await screenshot('night');
 await evaluate("import('./world.js').then(w=>w.teleport({target:{x:33,z:10}}));document.querySelector('canvas.world').focus()");
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});await pause(900);
 const moving=await stats();assert.ok(moving.car.speed>1);
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
 await evaluate("document.querySelector('#settings').click()");await pause(250);assert.equal((await stats()).car.speed,0);
 await evaluate("document.querySelector('#close').click()");checks.push('Keyboard acceleration works and opening a menu clears motion');
 await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:3,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await evaluate("import('./world.js').then(w=>{w.quality('low');w.reset()})");await pause(500);
 const touch=await evaluate(`['#joystick','[data-pedal="brake"]'].map((selector,id)=>{const r=document.querySelector(selector).getBoundingClientRect();return {id,x:r.x+r.width/2,y:r.y+r.height/2};})`);
 assert.ok(touch.every(p=>p.x>0&&p.x<844&&p.y>0&&p.y<390));
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch[0]]});
 const diagonal={...touch[0],x:touch[0].x-28,y:touch[0].y-28};
 await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[diagonal]});await pause(700);
 const mobile=await stats();assert.ok(mobile.car.speed>1);assert.ok(Math.abs(mobile.car.heading)>.01);assert.ok(mobile.pixelRatio<=1);
 assert.ok(mobile.touch.throttle>.5&&mobile.touch.turn>.5);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[diagonal,touch[1]]});await pause(100);assert.equal((await stats()).touch.handbrake,true);
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);assert.deepEqual((await stats()).touch,{turn:0,throttle:0,handbrake:false});
 await pause(3300);await screenshot('mobile');checks.push('One joystick controls acceleration and diagonal steering; a second finger operates the handbrake');
 await evaluate("import('./world.js').then(w=>w.reset())");
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch[0]]});
 await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch[0],y:touch[0].y+45}]});await pause(700);assert.ok((await stats()).car.speed<0);
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});checks.push('Dragging down engages reverse; release returns the joystick to neutral');
 for(const [width,height] of [[390,844],[320,568]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await pause(500);
  const layout=await evaluate(`['#joystick','[data-pedal="brake"]'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})`);
  assert.ok(layout.every(r=>r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height));
  assert.equal(await evaluate("['header','body>nav','#hud','#journey','#minimap'].every(s=>getComputedStyle(document.querySelector(s)).display==='none')"),true);
  await pause(3300);await screenshot(`portrait-${width}`);
 }
 checks.push('Joystick and brake stay within portrait screens of 390 and 320 CSS pixels');
 await evaluate("document.querySelector('#mobile-menu').click()");await screenshot('mobile-menu');
 await evaluate("document.querySelector('#menu-projects').click()");assert.equal(await evaluate("document.querySelectorAll('.destination').length"),6);
 await evaluate("document.querySelector('.mobile-back').click();document.querySelector('#menu-settings').click()");assert.ok(await evaluate("!!document.querySelector('#quality')"));
 await evaluate("document.querySelector('.mobile-back').click();document.querySelector('#menu-map').click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('#minimap')).display"),'block');
 await evaluate("document.querySelector('#mobile-menu').click();document.querySelector('#menu-map').click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('#minimap')).display"),'none');
 await evaluate("document.querySelector('#mobile-menu').click();document.querySelector('#menu-recover').click()");await pause(100);assert.equal((await stats()).car.speed,0);
 checks.push('Compact mobile menu exposes projects, settings, optional map and recovery; HUD clutter stays hidden');
 await evaluate("document.querySelector('#settings').click();while(document.querySelector('#quality').textContent!=='Automática')document.querySelector('#quality').click();document.querySelector('#close').click()");
 assert.deepEqual(errors,[]);
 await writeFile('test-artifacts/performance-browser-checks.json',JSON.stringify({checks,errors,mobile},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 ws.close();
}
