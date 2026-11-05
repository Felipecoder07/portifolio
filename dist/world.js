import {createTouchControls} from './touch-controls.js';
import {createScenery} from './scenery.js';
import {createLighting} from './lighting.js';
import {createGraphics} from './graphics.js';
import {groundPose,inWater,surfaceHeight} from './island-layout.js';
import {vehicle} from './vehicle.js';
import {createCameraRig} from './camera.js';
import {createDriver,stepDriver,tuning} from './driving.js';
import * as T from './three.js';
import {projects} from './projects.js';
import {state,toast,dismissIntro,showProject} from './ui.js';
import {sphere} from './models.js';
const scene=new T.Scene();scene.background=new T.Color('#d6e8e1');scene.fog=new T.Fog('#d6e8e1',90,210);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.domElement.className='world';renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Ilha 3D. WASD para dirigir, C para câmera, R para recuperar.');document.body.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,250);
// Read-only counters for repeatable local profiling, without a per-frame overlay.
export function diagnostics(){return {render:{...renderer.info.render},memory:{...renderer.info.memory},pixelRatio:renderer.getPixelRatio(),width:renderer.domElement.width,height:renderer.domElement.height,graphics:graphics.status(),touch:{...touch.input},car:{x:driver.x,z:driver.z,heading:driver.heading,speed:driver.speed}};}
const scenery=createScenery(scene,projects);
const lightRig=createLighting(scene,renderer,scenery.fixtures);
const graphics=createGraphics(renderer,lightRig.sun,{mode:state.quality});
const rand=Math.random;
const vehicleRig=vehicle(scene);const {car}=vehicleRig;car.position.set(0,.17,12);let heading=0,speed=0,steer=0;const keys=new Set();let near=null,lastNear=null;const visited=new Set();
const driver=createDriver();let accumulator=0;const obstacles=scenery.obstacles;
const touch=createTouchControls(document.querySelector('#controls'),{paused:()=>state.paused,onStart:dismissIntro});
const clearInput=()=>{keys.clear();touch.reset();driver.vx=driver.vz=driver.speed=0;};
new MutationObserver(()=>{if(document.querySelector('#modal').open)clearInput()}).observe(document.querySelector('#modal'),{attributes:true,attributeFilter:['open']});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cameraRig=createCameraRig(camera,renderer.domElement,car,scenery.occluders,reduced);
const dust=[];for(let i=0;i<24;i++){const m=sphere(scene,.2,'#c7b996',0,-10,0);m.material=new T.MeshBasicMaterial({color:'#d8c9a6',transparent:true,opacity:0,depthWrite:false});m.castShadow=m.receiveShadow=false;m.visible=false;dust.push({m,life:0})}let dustClock=0;
let audioCtx,osc,gain;export function audio(on){if(on){audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(!osc){osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='triangle';osc.connect(gain).connect(audioCtx.destination);gain.gain.value=0;osc.start()}audioCtx.resume()}if(gain)gain.gain.setTargetAtTime(on?.018:0,audioCtx.currentTime,.2)}
export function skipIntro(){cameraRig.skip();}
export function start(){cameraRig.skip();renderer.domElement.focus();toast(matchMedia('(any-pointer: coarse)').matches?'Arraste o joystick: cima vai, baixo freia e dá ré':'WASD ou setas para dirigir · E para explorar · R para voltar')}
export function reset(){car.position.set(0,.17,12);heading=0;speed=0;Object.assign(driver,createDriver());vehicleRig.reset();accumulator=0;cameraRig.recenter();keys.clear();touch.reset();toast('De volta à praça de chegada')}
export function teleport(p){car.position.set(p.target.x,.17,p.target.z+2);heading=0;speed=0;Object.assign(driver,createDriver(p.target.x,p.target.z+2));vehicleRig.reset();accumulator=0;cameraRig.recenter();keys.clear();touch.reset()}
export function lighting(night){lightRig.setNight(night)}
export function quality(mode){return graphics.setMode(mode);}
function interact(){if(near){speed=0;keys.clear();showProject(near)}}document.querySelector('#hint').onclick=interact;
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button,a,[contenteditable=true]'))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(state.paused)return;keys.add(k);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))dismissIntro();if(k==='e'&&!e.repeat)interact();if(k==='r')reset();if(k==='c')cameraRig.recenter();if(k==='h'&&!e.repeat){audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const h=audioCtx.createOscillator(),g=audioCtx.createGain();h.type='sine';h.frequency.value=390;g.gain.setValueAtTime(.07,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.3);h.connect(g).connect(audioCtx.destination);h.start();h.stop(audioCtx.currentTime+.3)}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',clearInput);addEventListener('visibilitychange',clearInput);
const map=document.querySelector('#map'),ctx=map.getContext('2d');
const mapBase=document.createElement('canvas');mapBase.width=220;mapBase.height=180;
function buildMapBackground(){const ctx=mapBase.getContext('2d');ctx.fillStyle='#c5d5b7';ctx.beginPath();ctx.ellipse(110,90,96,78,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#819080';ctx.lineWidth=7;ctx.beginPath();for(const route of scenery.routeLines){ctx.beginPath();ctx.lineWidth=route.width*.8;route.samples.forEach((p,i)=>{const x=110+p.x*1.65,y=90+p.z*1.35;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
ctx.fillStyle='#29483f';ctx.fillRect(105,84,10,8);ctx.font='8px monospace';ctx.fillText('G',107,82);}
buildMapBackground();
function drawMap(){ctx.clearRect(0,0,220,180);ctx.drawImage(mapBase,0,0);
projects.forEach(p=>{ctx.fillStyle=visited.has(p.id)?'#c36a47':'#f8f0d9';ctx.beginPath();ctx.arc(110+p.x*1.65,90+p.z*1.35,4,0,6.29);ctx.fill()});ctx.save();ctx.translate(110+car.position.x*1.65,90+car.position.z*1.35);ctx.rotate(heading);ctx.fillStyle='#e47750';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
let secretFound=false;
camera.position.set(19,25,35);let previous=performance.now(),elapsed=0,hudClock=0;const hint=document.querySelector('#hint'),speedText=document.querySelector('#speed'),gearText=document.querySelector('#gear');
function tick(now){requestAnimationFrame(tick);const frameDt=(now-previous)/1000,dt=Math.min(frameDt,.1);previous=now;if(document.hidden){clearInput();graphics.reset();return;}graphics.sample(frameDt,!state.paused);elapsed+=dt;const throttle=state.paused?0:T.MathUtils.clamp((keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+touch.input.throttle,-1,1);const turn=state.paused?0:T.MathUtils.clamp((keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0)+touch.input.turn,-1,1);if(state.paused){clearInput();accumulator=0;}else{accumulator+=dt;while(accumulator>=tuning.step){if(!stepDriver(driver,{throttle,turn,handbrake:keys.has(' ')||touch.input.handbrake},obstacles)||inWater(driver.x,driver.z)){reset();break;}accumulator-=tuning.step;}}heading=driver.heading;speed=driver.speed;steer=driver.steer;car.position.x=driver.x;car.position.z=driver.z;
const ground=groundPose(driver.x,driver.z,heading);
car.rotation.order='YXZ';car.rotation.y=heading;car.position.y=ground.y;
car.rotation.x=T.MathUtils.damp(car.rotation.x,ground.pitch,14,dt);car.rotation.z=T.MathUtils.damp(car.rotation.z,ground.roll,14,dt);
vehicleRig.update(dt,driver,{night:state.night,braking:keys.has(' ')||touch.input.handbrake||throttle*speed<-.2,reduced:reduced.matches,paused:state.paused});
cameraRig.update(dt,speed,state.paused);
if(!secretFound&&Math.hypot(car.position.x-scenery.secret.x,car.position.z-scenery.secret.z)<3.5){secretFound=true;toast('Mirante descoberto · git checkout horizonte');}
near=projects.find(p=>Math.hypot(car.position.x-p.target.x,car.position.z-p.target.z)<6)||null;hint.hidden=!near;if(near&&near!==lastNear)hint.textContent=matchMedia('(max-width:650px), (any-pointer:coarse)').matches?`${near.name} ↗`:`${near.name} ↗ · E para explorar`;lastNear=near;if(near&&!visited.has(near.id)){visited.add(near.id);document.querySelector('#count').textContent=`${visited.size} / 6 lugares descobertos`;toast(`Você descobriu ${near.name}`)}
scenery.update(elapsed,reduced.matches);dustClock+=dt;if(!reduced.matches&&Math.abs(speed)>4&&dustClock>.065){dustClock=0;const d=dust.find(d=>d.life<=0);if(d){d.life=1;d.m.visible=true;d.m.position.copy(car.position);d.m.position.y=car.position.y+.3;d.m.position.x+=Math.cos(heading)*(rand()-.5)*1.8;d.m.scale.setScalar(.7)}}dust.forEach(d=>{if(d.life>0){d.life-=dt;d.m.position.y+=dt*.6;d.m.scale.addScalar(dt*.8);d.m.material.opacity=Math.max(0,d.life*.22)}else d.m.visible=false});if(osc){osc.frequency.setTargetAtTime(35+Math.abs(speed)*7,audioCtx.currentTime,.1);gain.gain.setTargetAtTime(state.sound?.012+Math.abs(speed)*.001:0,audioCtx.currentTime,.1)}hudClock+=dt;if(hudClock>=.1){hudClock=0;speedText.textContent=Math.round(Math.abs(speed)*3.6);gearText.textContent=speed<-.2?'R':Math.abs(speed)<.2?'N':'D';drawMap()}renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);graphics.resize()});requestAnimationFrame(tick);
