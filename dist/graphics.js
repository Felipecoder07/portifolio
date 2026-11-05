export const qualityModes=['auto','high','balanced','low'];
export const qualityLabels={auto:'Automática',high:'Alta',balanced:'Equilibrada',low:'Leve'};
const profiles={auto:{dpr:1.5,pixels:3_000_000,shadow:2048},high:{dpr:2,pixels:6_000_000,shadow:2048},balanced:{dpr:1.5,pixels:2_500_000,shadow:1024},low:{dpr:1,pixels:1_200_000,shadow:512}};
export function readQuality(){try{const saved=localStorage.getItem('felipe-world-quality');return qualityModes.includes(saved)?saved:'auto';}catch{return 'auto';}}
export function saveQuality(mode){try{localStorage.setItem('felipe-world-quality',mode);}catch{/* Private storage must not block the game. */}}
export function pixelRatioFor(mode,width,height,dpr,scale=1){const p=profiles[mode]||profiles.auto;return Math.min(dpr,p.dpr,Math.sqrt(p.pixels/Math.max(1,width*height)))*scale;}

// Resolution adapts slowly with hysteresis. Geometry, colours and effects stay
// intact. Menus, background tabs and first shader compilation are not samples.
export function createGraphics(renderer,sun,{mode='auto',viewport=()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})}={}){
 let selected=mode,scale=1,elapsed=0,count=0,total=0,slow=0,fast=0,warmup=3;
 function apply(){
  const {width,height,dpr}=viewport(),p=profiles[selected];
  const ratio=pixelRatioFor(selected,width,height,dpr,scale);
  if(Math.abs(renderer.getPixelRatio()-ratio)>.01)renderer.setPixelRatio(ratio);
  const shadow=selected==='auto'&&scale<.85?1024:p.shadow;
  // A lower-resolution shadow texel covers more ground; scale the bias too,
  // otherwise the light profile introduces striped self-shadowing on roads.
  sun.shadow.normalBias=.055*(2048/shadow);
  sun.shadow.bias=-.00012*(2048/shadow);
  if(sun.shadow.mapSize.x!==shadow){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(shadow,shadow);sun.shadow.needsUpdate=true;}
 }
 function resetSamples(){elapsed=count=total=slow=fast=0;warmup=3;}
 function setMode(value){selected=qualityModes.includes(value)?value:value===false?'low':'high';scale=1;resetSamples();apply();return selected;}
 function sample(dt,active){
  if(selected!=='auto')return;
  if(!active){resetSamples();return;}
  if(warmup>0){warmup-=dt;return;}
  elapsed+=dt;total+=Math.min(dt,.25);count++;
  if(elapsed<4)return;
  const average=total/count;elapsed=count=total=0;
  slow=average>1/45?slow+1:0;fast=average<1/57?fast+1:0;
  let next=scale;
  if(slow>=2){next=Math.max(.65,scale-.1);slow=fast=0;}
  if(fast>=3){next=Math.min(1,scale+.05);slow=fast=0;}
  if(next!==scale){scale=next;apply();warmup=1;}
 }
 setMode(mode);
 return {setMode,sample,resize:apply,reset:resetSamples,status:()=>({mode:selected,scale,shadowSize:sun.shadow.mapSize.x})};
}
