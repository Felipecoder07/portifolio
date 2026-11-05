// Node 22+: local Chromium with --remote-debugging-port=9224 and npm start.
import {writeFile,mkdir} from 'node:fs/promises';
const label=process.argv[2]||'latest';
if(!/^[a-z0-9-]+$/i.test(label))throw Error('Use an alphanumeric report name.');
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
 let ready=false;for(let i=0;i<60;i++){await pause(500);ready=await evaluate("!!document.querySelector('canvas.world') && !document.querySelector('#loading')");if(ready)break;}
 if(!ready)throw Error('WebGL scene did not become ready');
 await evaluate("document.querySelector('#start').click()");
 const results=[];
 for(const [name,x,z,night] of [['arrival',0,12,false],['lookout',-31,36,false],['bridge',33,4,false],['night',0,12,true]]){
  await evaluate(`import('./world.js').then(w=>{w.quality('high');w.lighting(${night});w.teleport({target:{x:${x},z:${z-2}}});})`);await pause(2000);
  results.push({name,...await evaluate(`(async()=>{
   const w=await import('./world.js'),frames=[];let last=performance.now(),start=last;
   await new Promise(resolve=>{function sample(now){frames.push(now-last);last=now;if(now-start<3500)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});
   frames.shift();frames.sort((a,b)=>a-b);
   const c=document.querySelector('canvas.world'),gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
   return {frameCount:frames.length,medianMs:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',...w.diagnostics()};
  })()`)});
 }
 await mkdir('test-artifacts',{recursive:true});await writeFile(`test-artifacts/performance-${label}.json`,JSON.stringify({label,viewport:'1440x1000 DPR 1, high quality, stationary, headless',results,errors},null,2));
 console.log(JSON.stringify({label,results,errors},null,2));
 if(errors.length)process.exitCode=1;
}finally{ws.close();}
