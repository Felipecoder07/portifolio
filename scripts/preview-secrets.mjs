// Connect to a locally launched Chromium with --remote-debugging-port=9224.
import {writeFile,mkdir} from 'node:fs/promises';
const pages=await(await fetch('http://127.0.0.1:9224/json/list')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map(),errors=[];
ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
try{
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:3000'});
 let ready=false;for(let i=0;i<30;i++){await pause(500);ready=await evaluate("!!document.querySelector('canvas.world') && !document.querySelector('#loading')");if(ready)break;}
 if(!ready)throw Error('WebGL scene did not become ready');
 await evaluate("localStorage.removeItem('felipe-world-secrets-v3')");await send('Page.reload');await pause(1800);await evaluate("document.querySelector('#start').click()");
 await mkdir('test-artifacts',{recursive:true});
 for(const [name,x,z] of [['witcher',0,-65.5],['automail',-68,16.5],['spider',48,53.5]]){
  await evaluate(`import('./world.js').then(w=>w.teleport({target:{x:${x},z:${z-2}}}))`);await pause(4500);
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`test-artifacts/secret-${name}.png`,Buffer.from(shot.data,'base64'));
 }
 await evaluate("import('./secrets.js').then(m=>{if(m.discoveries.count!==3)throw Error('Expected three discoveries')})");
 await send('Page.reload');await pause(2000);
 await evaluate("import('./secrets.js').then(m=>{if(m.discoveries.count!==3)throw Error('Persistence failed')})");
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate("document.querySelector('#mobile-menu').click();[...document.querySelectorAll('.mobile-menu-actions button')].find(b=>b.textContent.startsWith('Segredos')).click()");
 const menu=await send('Page.captureScreenshot',{format:'png'});await writeFile('test-artifacts/secrets-mobile.png',Buffer.from(menu.data,'base64'));
 await evaluate("if(document.documentElement.scrollWidth>innerWidth)throw Error('Horizontal overflow');document.querySelector('#secrets-reset').click();document.querySelector('#secrets-reset').click()");
 await evaluate("import('./secrets.js').then(m=>{if(m.discoveries.count!==0)throw Error('Reset failed')})");
 await writeFile('test-artifacts/secrets-browser-errors.json',JSON.stringify(errors,null,2));
 if(errors.length)throw Error(JSON.stringify(errors));
 console.log('WebGL: all three secrets discovered; persistence, mobile collection and reset passed.');
}finally{ws.close();}
