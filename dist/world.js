import {createFlightRenderer} from './flight-renderer.js';
import {createLunarJourney} from './lunar-journey.js';
import {lunarPose,moonRadius,station} from './lunar-terrain.js';
import {createTouchControls} from './touch-controls.js';
import {createScenery} from './scenery.js';
import {discoveries} from './secrets.js';
import {createSecretModels} from './secret-models.js';
import {createLighting} from './lighting.js';
import {createGraphics} from './graphics.js';
import {groundPose} from './island-layout.js';
import {vehicle} from './vehicle.js';
import {boatPose} from './water-motion.js';
import {createAmphibious} from './amphibious.js';
import {createCameraRig,createWorldCamera} from './camera.js';
import {createDriver,stepDriver,tuning} from './driving.js';
import * as T from './three.js';
import {projects} from './projects.js';
import {state,toast,dismissIntro,showProject} from './ui.js';
import {sphere} from './models.js';
import {createKraken} from './kraken.js';
import {createGarage} from './garage.js';
const scene=new T.Scene();scene.background=new T.Color('#d6e8e1');scene.fog=new T.Fog('#d6e8e1',90,210);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.domElement.className='world';renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Ilha 3D. WASD para dirigir, C para câmera, R para recuperar.');document.body.prepend(renderer.domElement);
const camera=createWorldCamera(innerWidth/innerHeight);
const flightRenderer=createFlightRenderer(renderer);
let resolveReady;
export const ready=new Promise(resolve=>{resolveReady=resolve;});
// Read-only counters for repeatable local profiling, without a per-frame overlay.
export function diagnostics(){return {render:{...renderer.info.render},memory:{...renderer.info.memory},pixelRatio:renderer.getPixelRatio(),width:renderer.domElement.width,height:renderer.domElement.height,graphics:graphics.status(),touch:{...touch.input},car:{x:driver.x,z:driver.z,heading:driver.heading,speed:driver.speed,mode:driver.mode,encounter:kraken.phase,location:journey.location,flight:journey.phase}};}
const scenery=createScenery(scene,projects);
const secretModels=createSecretModels(scene);
export function refreshSecrets(){secretModels.sync(discoveries);}
refreshSecrets();
const lightRig=createLighting(scene,renderer,scenery.fixtures);
const graphics=createGraphics(renderer,lightRig.sun,{mode:state.quality});
const rand=Math.random;
const vehicleRig=vehicle(scene);const {car}=vehicleRig;const amphibious=createAmphibious(scene,car);car.position.set(0,.17,12);let heading=0,speed=0,steer=0;const keys=new Set();let near=null,lastNear=null;const visited=new Set();
const driver=createDriver();let accumulator=0;const obstacles=scenery.obstacles;
const touch=createTouchControls(document.querySelector('#controls'),{paused:()=>state.paused,onStart:dismissIntro});
const clearInput=()=>{keys.clear();touch.reset();driver.vx=driver.vz=driver.speed=0;};
new MutationObserver(()=>{if(document.querySelector('#modal').open)clearInput()}).observe(document.querySelector('#modal'),{attributes:true,attributeFilter:['open']});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cameraRig=createCameraRig(camera,renderer.domElement,car,scenery.occluders,reduced);
const kraken=createKraken(scene,{obstacles,plants:scenery.plants,onEvent:event=>{if(event==='rise'){clearInput();cameraRig.skip();toast('Algo enorme esta subindo do fundo do mar...');}if(event==='throw')toast('O kraken te mandou de volta para a ilha!');if(event==='done'){clearInput();cameraRig.recenter();}}});
const garage=createGarage(scene,{carRig:vehicleRig,amphibious,garageShell:scenery.root.getObjectByName('garage'),onEnter:()=>{clearInput();vehicleRig.reset();dismissIntro();cameraRig.skip();},onExit:message=>{clearInput();cameraRig.recenter();if(message)toast(message);renderer.domElement.focus();}});
const lunarDriving={mode:'car',radius:moonRadius,tuning:{...tuning,acceleration:12,forward:18,reverse:7,grip:5,driftGrip:1.2,brake:20}};
const journey=createLunarJourney(scene,car,{onRecover:()=>reset(),onDepart:()=>{clearInput();dismissIntro();cameraRig.restore();amphibious.reset();},onArrive:location=>{clearInput();for(const d of dust){d.life=0;d.m.visible=false;d.m.material.color.set(location==='moon'?'#b5b5ba':'#d8c9a6');journey.scene.add(d.m);}amphibious.reset();vehicleRig.reset();cameraRig.recenter();camera.far=location==='moon'?1400:250;camera.updateProjectionMatrix();document.body.classList.toggle('on-moon',location==='moon');toast(location==='moon'?'Bem-vindo \u00e0 Lua. Explore e volte \u00e0 c\u00e1psula para retornar.':'Pouso conclu\u00eddo. Voc\u00ea est\u00e1 de volta \u00e0 ilha.');renderer.domElement.focus({preventScroll:true});}});
obstacles.push(...journey.stationObstacles);
obstacles.push({x:-5.4,z:0,hx:.12,hz:3.9},{x:5.4,z:0,hx:.12,hz:3.9},{x:0,z:-4,hx:5.4,hz:.12},{x:-4,z:0,radius:.8});
const dust=[];for(let i=0;i<24;i++){const m=sphere(scene,.2,'#c7b996',0,-10,0);m.material=new T.MeshBasicMaterial({color:'#d8c9a6',transparent:true,opacity:0,depthWrite:false});m.castShadow=m.receiveShadow=false;m.visible=false;dust.push({m,life:0})}let dustClock=0;
export function skipIntro(){cameraRig.skip();}
export function start(){cameraRig.skip();renderer.domElement.focus();toast(matchMedia('(any-pointer: coarse)').matches?'Arraste o joystick: cima vai, baixo freia e dá ré':'WASD ou setas para dirigir · E para explorar · R para voltar')}
export function reset(){if(journey.active){journey.cancel(driver);return;}if(journey.location==='moon'){Object.assign(driver,createDriver(0,9),{mode:'car',heading:0});clearInput();car.position.set(0,.2,9);vehicleRig.reset();cameraRig.recenter();toast('De volta \u00e0 base lunar');return;}garage.abort();kraken.cancel();car.position.set(0,.17,12);heading=0;speed=0;Object.assign(driver,createDriver());vehicleRig.reset();amphibious.reset();accumulator=0;cameraRig.recenter();keys.clear();touch.reset();toast('De volta à praça de chegada')}
export function teleport(p){journey.earth(driver);garage.abort();kraken.cancel();car.position.set(p.target.x,.17,p.target.z+2);heading=0;speed=0;Object.assign(driver,createDriver(p.target.x,p.target.z+2));vehicleRig.reset();amphibious.reset();accumulator=0;cameraRig.recenter();keys.clear();touch.reset()}
export function visitSpaceport(){if(journey.active)return;teleport({target:{x:station.x,z:7}});dismissIntro();renderer.domElement.focus({preventScroll:true});toast('Dirija de frente pela rampa para entrar na c\u00e1psula');}
export function lighting(night){lightRig.setNight(night)}
export function quality(mode){return graphics.setMode(mode);}
function interact(){if(state.paused||journey.active)return;if(journey.enter(driver))return;if(journey.location==='moon')return;if(garage.open(driver))return;if(near){speed=0;keys.clear();showProject(near)}}document.querySelector('#hint').onclick=interact;
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button,a,[contenteditable=true]'))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(state.paused||garage.active||journey.active)return;if(kraken.active&&k!=='r')return;keys.add(k);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))dismissIntro();if(k==='e'&&!e.repeat)interact();if(k==='r')reset();if(k==='c')cameraRig.recenter();});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',clearInput);addEventListener('visibilitychange',clearInput);
const map=document.querySelector('#map'),ctx=map.getContext('2d');
const mapBase=document.createElement('canvas');mapBase.width=220;mapBase.height=180;
function buildMapBackground(){const ctx=mapBase.getContext('2d');ctx.fillStyle='#579f9d';ctx.fillRect(0,0,220,180);ctx.fillStyle='#c5d5b7';ctx.beginPath();ctx.ellipse(110,90,62.32,50.84,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#819080';ctx.lineWidth=7;ctx.beginPath();for(const route of scenery.routeLines){ctx.beginPath();ctx.lineWidth=route.width*.8;route.samples.forEach((p,i)=>{const x=110+p.x*.76,y=90+p.z*.62;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
ctx.fillStyle='#29483f';ctx.fillRect(106,86,8,6);ctx.font='8px monospace';ctx.fillText('G',107,82);}
buildMapBackground();
function drawMap(){if(journey.location==='moon'){journey.drawMap(ctx,driver);return;}ctx.clearRect(0,0,220,180);ctx.drawImage(mapBase,0,0);ctx.fillStyle='#e8d2a1';ctx.fillRect(110+station.x*.76-4,86,8,8);ctx.font='8px sans-serif';ctx.fillText('LUA',180,81);
projects.forEach(p=>{ctx.fillStyle=visited.has(p.id)?'#c36a47':'#f8f0d9';ctx.beginPath();ctx.arc(110+p.x*.76,90+p.z*.62,4,0,6.29);ctx.fill()});ctx.save();ctx.translate(110+car.position.x*.76,90+car.position.z*.62);ctx.rotate(heading);ctx.fillStyle='#e47750';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
let discoveryCooldown=0;
camera.position.set(19,25,35);let previous=performance.now(),elapsed=0,hudClock=0;const hint=document.querySelector('#hint'),speedText=document.querySelector('#speed'),gearText=document.querySelector('#gear');
function tick(now){requestAnimationFrame(tick);const frameDt=(now-previous)/1000,dt=Math.min(frameDt,.1);previous=now;if(document.hidden){clearInput();graphics.reset();return;}graphics.sample(frameDt,!state.paused);elapsed+=dt;let lunar=journey.location==='moon';
if(!journey.active&&!state.paused&&!garage.active&&!kraken.active&&Math.abs(driver.x-(lunar?0:station.x))<2&&Math.abs(driver.z)<2)journey.enter(driver);
const flightView=journey.update(dt,driver,{paused:state.paused,reduced:reduced.matches,aspect:camera.aspect});
if(flightView){clearInput();flightRenderer.render(flightView);return;}
flightRenderer.release();lunar=journey.location==='moon';journey.explore(dt,driver,{paused:state.paused,reduced:reduced.matches});const workshop=lunar?null:garage.update(dt,driver,{paused:state.paused,reduced:reduced.matches,unavailable:kraken.active});const cinematic=workshop||(!lunar&&kraken.update(dt,driver,{paused:state.paused,reduced:reduced.matches}));const throttle=state.paused?0:T.MathUtils.clamp((keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+touch.input.throttle,-1,1);const turn=state.paused?0:T.MathUtils.clamp((keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0)+touch.input.turn,-1,1);if(state.paused||cinematic){clearInput();accumulator=0;}else{accumulator+=dt;while(accumulator>=tuning.step){if(!stepDriver(driver,{throttle,turn,handbrake:keys.has(' ')||touch.input.handbrake},lunar?journey.moon.obstacles:obstacles,tuning.step,lunar?lunarDriving:null)){reset();break;}if(!lunar&&driver.mode!=='boat')scenery.hitTrees(driver.x,driver.z,driver.vx,driver.vz,reduced.matches);accumulator-=tuning.step;}}heading=driver.heading;speed=driver.speed;steer=driver.steer;car.position.x=driver.x;car.position.z=driver.z;
const ground=cinematic||(lunar?lunarPose(driver.x,driver.z,heading):driver.mode==='boat'?boatPose(driver,elapsed,reduced.matches||state.paused):groundPose(driver.x,driver.z,heading,driver.deck));
if(!lunar&&!cinematic&&driver.mode==='car'){const r=Math.hypot(driver.x,driver.z);if(r<3.65)ground.y=Math.max(ground.y,.08+.22*T.MathUtils.smoothstep(3.65-r,0,.6));}
car.rotation.order='YXZ';car.rotation.y=heading;car.position.y=ground.y;
car.rotation.x=T.MathUtils.damp(car.rotation.x,ground.pitch,14,dt);car.rotation.z=T.MathUtils.damp(car.rotation.z,ground.roll,14,dt);
vehicleRig.update(dt,driver,{motionSpeed:workshop?.motionSpeed??driver.speed,night:state.night,braking:keys.has(' ')||touch.input.handbrake||throttle*speed<-.2,reduced:reduced.matches,paused:state.paused});
amphibious.update(dt,driver,{airborne:!!cinematic,time:elapsed,reduced:reduced.matches,paused:state.paused});
cameraRig.update(dt,speed,state.paused,!!cinematic,!!workshop);
discoveryCooldown=Math.max(0,discoveryCooldown-dt);
if(!lunar&&!state.paused&&!cinematic&&discoveryCooldown===0){const added=discoveries.discover(driver.x,driver.z);if(added.length){refreshSecrets();discoveryCooldown=4;toast('Segredo descoberto: '+added[0].name+' \u00b7 '+discoveries.count+'/3');}}
near=cinematic||lunar?null:projects.find(p=>Math.hypot(car.position.x-p.target.x,car.position.z-p.target.z)<6)||null;hint.hidden=!near;if(near&&near!==lastNear)hint.textContent=matchMedia('(max-width:650px), (any-pointer:coarse)').matches?`${near.name} ↗`:`${near.name} ↗ · E para explorar`;lastNear=near;if(near&&!visited.has(near.id)){visited.add(near.id);document.querySelector('#count').textContent=`${visited.size} / 6 lugares descobertos`;toast(`Você descobriu ${near.name}`)}
if(journey.nearRamp(driver)){hint.hidden=false;hint.textContent=journey.canEnter(driver)?'Entrar na c\u00e1psula \u00b7 E':'Entre pela rampa do foguete';}
if(lunar){journey.moon.sun.position.set(driver.x-65,42,driver.z+35);journey.moon.sun.target.position.set(driver.x,0,driver.z);}else scenery.update(elapsed,reduced.matches,car.position,driver);dustClock+=dt;if(driver.mode!=='boat'&&!reduced.matches&&Math.abs(speed)>4&&dustClock>.065){dustClock=0;const d=dust.find(d=>d.life<=0);if(d){d.life=1;d.m.visible=true;d.m.position.copy(car.position);d.m.position.y=car.position.y+.3;d.m.position.x+=Math.cos(heading)*(rand()-.5)*1.8;d.m.scale.setScalar(.7)}}dust.forEach(d=>{if(d.life>0){d.life-=dt;d.m.position.y+=dt*.6;d.m.scale.addScalar(dt*.8);d.m.material.opacity=Math.max(0,d.life*.22)}else d.m.visible=false});hudClock+=dt;if(hudClock>=.1){hudClock=0;speedText.textContent=Math.round(Math.abs(speed)*3.6);gearText.textContent=speed<-.2?'R':Math.abs(speed)<.2?'N':'D';drawMap()}renderer.render(journey.scene,camera);if(resolveReady){resolveReady();resolveReady=null;}}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);graphics.resize()});requestAnimationFrame(tick);
