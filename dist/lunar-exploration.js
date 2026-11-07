import * as T from './three.js';
import {lunarSurfaceHeight} from './lunar-terrain.js';
const sites=[{x:42,z:-38,name:'Arco do Silêncio'},{x:-54,z:32,name:'Sinal Perdido'},{x:30,z:78,name:'Vale dos Cristais'}];
export function homeBearing(d){return {distance:Math.hypot(d.x,d.z),angle:Math.atan2(Math.sin(d.heading-Math.atan2(d.x,d.z)),Math.cos(d.heading-Math.atan2(d.x,d.z)))};}
export function createLunarExploration(scene,obstacles){
 const root=new T.Group();root.name='Lunar discoveries';scene.add(root);
 const stone=new T.MeshStandardMaterial({color:'#777982',roughness:1}),silver=new T.MeshStandardMaterial({color:'#b6b7b2',metalness:.65,roughness:.4}),green=new T.MeshStandardMaterial({color:'#b2d88e',emissive:'#567d35',emissiveIntensity:.22,roughness:.7}),eyes=new T.MeshStandardMaterial({color:'#071114',roughness:.12}),crystal=new T.MeshStandardMaterial({color:'#729bba',emissive:'#376789',emissiveIntensity:.35,roughness:.25,metalness:.2});
 const add=(g,m,x,y,z,parent=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const aliens=[];
 for(let i=0;i<sites.length;i++){
  const site=sites[i],y=lunarSurfaceHeight(site.x,site.z);
  for(const dx of [-5,5]){const rock=add(new T.IcosahedronGeometry(1,1),stone,site.x+dx,y+2.4,site.z);rock.scale.set(2,4,2.6);obstacles.push({x:site.x+dx,z:site.z,radius:2.5});}
  if(i===0){const arch=add(new T.TorusGeometry(5,1.4,8,24,Math.PI),stone,site.x,y+5,site.z);arch.rotation.z=0;}
  if(i===1){const probe=add(new T.CylinderGeometry(1.3,2,2.5,10),silver,site.x,y+.8,site.z+2);probe.rotation.z=.7;const panel=add(new T.BoxGeometry(6,.1,2),crystal,site.x+2,y+.7,site.z+2);panel.rotation.z=.2;obstacles.push({x:site.x,z:site.z+2,radius:3});}
  if(i===2)for(let j=0;j<9;j++){const a=j*2.4,r=2+j*.35,x=site.x+Math.cos(a)*r,z=site.z+Math.sin(a)*r;const shard=add(new T.ConeGeometry(.5,2+j%3,5),crystal,x,lunarSurfaceHeight(x,z)+1,z);shard.rotation.z=Math.sin(j)*.25;}
  const alien=new T.Group();root.add(alien);alien.name='Shy observer '+i;
  const body=add(new T.SphereGeometry(.42,16,12),green,0,1.1,0,alien);body.scale.set(.8,1.3,.65);
  const head=add(new T.SphereGeometry(.65,24,16),green,0,2,0,alien);head.scale.set(1,1.15,.85);
  for(const x of [-.28,.28]){const eye=add(new T.SphereGeometry(.22,16,12),eyes,x,2.1,.43,alien);eye.scale.set(.8,1.4,.35);eye.rotation.z=-Math.sign(x)*.3;const leg=add(new T.CylinderGeometry(.09,.06,.8,8),green,x*.65,.4,0,alien);const arm=add(new T.CylinderGeometry(.075,.04,.8,8),green,x*1.5,1.1,0,alien);arm.rotation.z=Math.sign(x)*.3;}
  alien.scale.setScalar(1.25);
  // One scout watches the landing area; the others stand in front of their shelters.
  const direction=new T.Vector2(site.x,site.z).normalize();
  const x=i===0?4:site.x-direction.x*10,z=i===0?17:site.z-direction.y*10;
  alien.position.set(x,lunarSurfaceHeight(x,z),z);
  aliens.push({root:alien,x,z,hide:0,cooldown:0,site:i});
 }
 // A warm beacon remains recognizable from the far side of the exploration area.
 const pole=add(new T.CylinderGeometry(.07,.1,8,10),silver,-6,4,4);
 const beacon=add(new T.SphereGeometry(.3,16,12),new T.MeshBasicMaterial({color:'#ffd49b'}),-6,8,4);
 const halo=add(new T.SphereGeometry(.65,16,12),new T.MeshBasicMaterial({color:'#ffd49b',transparent:true,opacity:.12,depthWrite:false}),-6,8,4);
 let time=0;
 function update(dt,d,{paused=false,reduced=false}={}){
  if(paused)return;time+=dt;
  for(const a of aliens){const dist=Math.hypot(d.x-a.x,d.z-a.z);a.cooldown=Math.max(0,a.cooldown-dt);
   const retreat=dist<8||a.cooldown>0;
   a.hide=reduced?(retreat?1:0):T.MathUtils.damp(a.hide,retreat?1:0,retreat?9:1.5,dt);
   if(dist<4)a.hide=1; // Also safe when the car is recovered or teleported.
   a.root.visible=a.hide<.98;
   a.root.position.set(a.x,lunarSurfaceHeight(a.x,a.z)-a.hide*4, a.z);
   a.root.rotation.y=Math.atan2(d.x-a.x,d.z-a.z);
   if(!reduced)a.root.rotation.z=Math.sin(time*1.3+a.site)*.04;
   if(dist<8)a.cooldown=1.5;
  }
  halo.scale.setScalar(reduced?1:1+Math.sin(time*2)*.15);
 }
 return {root,aliens,sites,update};
}
