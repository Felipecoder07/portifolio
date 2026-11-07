import * as T from './three.js';
import {box,cylinder,sphere} from './models.js';
import {terrainHeight} from './island-layout.js';
import {secrets} from './secrets.js';
import {batchRigidMeshes} from './render-optimization.js';
function rod(g,a,b,r,color){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=cylinder(g,r,r,d.length(),color);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function ring(g,r,y,color){const m=new T.Mesh(new T.TorusGeometry(r,.035,4,48),new T.MeshStandardMaterial({color,roughness:.7}));m.rotation.x=-Math.PI/2;m.position.y=y;g.add(m);return m;}
export function createSecretModels(scene){
 const indicators=new Map();
 for(const s of secrets){
  const g=new T.Group();g.name=`secret-${s.id}`;g.position.set(s.x,terrainHeight(s.x,s.z)+.1,s.z);scene.add(g);
  const glow=new T.MeshStandardMaterial({color:'#91b7a8',emissive:'#80dfc4',emissiveIntensity:.08,roughness:.5});indicators.set(s.id,glow);
  cylinder(g,6,6.5,.08,'#b6a17c',0,0,0,32);
  if(s.id==='witcher'){
   sphere(g,1.5,'#727e77',0,.55,0,1,.65,.8);
   const shape=new T.Shape();shape.moveTo(0,.55);shape.lineTo(-.27,1.25);shape.lineTo(-.27,4.25);shape.lineTo(.27,4.25);shape.lineTo(.27,1.25);shape.closePath();
   const blade=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:1,steps:1}),new T.MeshStandardMaterial({color:'#d9e3e4',metalness:.75,roughness:.3}));blade.castShadow=true;g.add(blade);
   box(g,.045,2.8,.03,'#889da0',0,2.65,.18);
   rod(g,[-1.05,4.65,.07],[0,4.22,.07],.095,'#9daeb0');rod(g,[0,4.22,.07],[1.05,4.65,.07],.095,'#9daeb0');
   cylinder(g,.14,.14,1,'#3f3936',0,4.9,.07,10);
   for(let i=0;i<7;i++)cylinder(g,.155,.155,.035,'#82766b',0,4.48+i*.13,.07,10);
   sphere(g,.25,'#b8c4c2',0,5.55,.07,1,.65,.7);
   // Angular wolf medallion on the stone, with ears and muzzle.
   sphere(g,.43,'#a1b1b0',.75,1.2,.7,1,1,.4);
   for(const x of [.48,1.02])cylinder(g,0,.18,.38,'#a1b1b0',x,1.6,.7,3);
   sphere(g,.23,'#657779',.75,1.06,.9,.8,1,.7);
   for(const x of [.59,.91])sphere(g,.065,'#91b7a8',x,1.3,.89).material=glow;
   for(const x of [-3.3,3.3]){box(g,1.5,.55,1.1,'#7d7566',x,.28,-1);box(g,.7,.18,.6,'#584b41',x,.65,-1);}
  }else if(s.id==='automail'){
   cylinder(g,3.4,3.6,.25,'#65716d',0,.12,0,32);ring(g,3.05,.28,'#b6d1ca').material=glow;ring(g,2.65,.28,'#b6d1ca');
   for(let i=0;i<6;i++){const a=i*Math.PI/3,b=a+Math.PI*2/3;rod(g,[Math.cos(a)*2.6,.28,Math.sin(a)*2.6],[Math.cos(b)*2.6,.28,Math.sin(b)*2.6],.025,'#b6d1ca');}
   box(g,1.6,.6,1.4,'#384c48',0,.55,0);rod(g,[0,.8,-.35],[0,4.4,-.35],.11,'#384c48');
   const arm=new T.Group();g.add(arm);arm.position.set(-.65,0,0);arm.rotation.z=-.22;
   sphere(arm,.7,'#b9c5c8',0,4.8,0,1,.9,.8);
   cylinder(arm,.45,.36,1.2,'#99a9ae',0,3.95,0,12);
   for(const x of [-.29,.29])rod(arm,[x,4.3,.24],[x,3.4,.24],.065,'#d6e0e1');
   const elbow=cylinder(arm,.36,.36,.85,'#43565b',0,3.2,0,12);elbow.rotation.z=Math.PI/2;
   for(const x of [-.44,.44])sphere(arm,.18,'#d2dcdd',x,3.2,0,.35,1,1);
   cylinder(arm,.39,.27,1.1,'#c4cfd1',0,2.55,0,8);
   for(const x of [-.26,.26])box(arm,.045,.85,.045,'#566c73',x,2.55,.3);
   cylinder(arm,.24,.24,.18,'#43565b',0,1.93,0,10);
   box(arm,.62,.56,.25,'#b9c5c8',0,1.59,.03);
   for(let i=0;i<4;i++){const x=-.24+i*.16;for(let j=0;j<3;j++){box(arm,.12,.2,.17,'#c4cfd1',x,1.24-j*.23,.05+j*.045);sphere(arm,.07,'#52676d',x,1.12-j*.23,.08+j*.045);}}
   rod(arm,[.36,1.72,.02],[.57,1.39,.12],.11,'#b9c5c8');rod(arm,[.57,1.39,.12],[.49,1.17,.25],.09,'#c4cfd1');
   for(const y of [2.22,2.9,4.3])for(const x of [-.2,.2])sphere(arm,.055,'#43565b',x,y,.34);
   box(g,1.4,.12,.9,'#a04f43',-2,.4,-1.5);
  }else{
   // Suspended mask framed by an actual geometric web, not a texture.
   const center=[0,3.5,-.5];
   for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(g,center,[Math.cos(a)*3.1,3.5+Math.sin(a)*2.9,-.5],.025,'#c5d7d2');}
   for(const r of [1,1.8,2.6])for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;rod(g,[Math.cos(a)*r,3.5+Math.sin(a)*r,-.5],[Math.cos(b)*r,3.5+Math.sin(b)*r,-.5],.022,'#c5d7d2');}
   rod(g,[-3.4,0,-.5],[-3.4,6.8,-.5],.13,'#596e69');rod(g,[3.4,0,-.5],[3.4,6.8,-.5],.13,'#596e69');rod(g,[-3.4,6.6,-.5],[3.4,6.6,-.5],.1,'#596e69');
   const mask=new T.Mesh(new T.SphereGeometry(1.15,20,14),new T.MeshStandardMaterial({color:'#b94d43',roughness:.65}));mask.position.set(0,3.5,.25);mask.scale.set(1,1.3,.8);mask.castShadow=true;g.add(mask);
   function eye(side,scale,z,color){const shape=new T.Shape();shape.moveTo(.12,0);shape.quadraticCurveTo(.6,.1,.94,.55);shape.quadraticCurveTo(.85,-.48,.3,-.45);shape.closePath();const m=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color,side:T.DoubleSide}));m.position.set(0,3.6,z);m.scale.set(side*scale,scale,1);g.add(m);}
   for(const side of [-1,1]){eye(side,1,1.15,'#233d3d');eye(side,.8,1.17,'#edf4e9');}
   // Dark meridians trace the mask's surface.
   for(const angle of [-.8,-.4,0,.4,.8]){let prev;for(let i=1;i<14;i++){const t=i/14*Math.PI,p=[Math.sin(t)*Math.sin(angle)*1.16,3.5+Math.cos(t)*1.51,.25+Math.sin(t)*Math.cos(angle)*.94];if(prev)rod(g,prev,p,.018,'#553f3b');prev=p;}}
   for(const yy of [-.9,-.55,.75,1.05]){const r=Math.sqrt(1-(yy/1.51)**2);let prev;for(let i=0;i<=12;i++){const a=-1.3+i*2.6/12,p=[Math.sin(a)*r*1.16,3.5+yy,.25+Math.cos(a)*r*.94];if(prev)rod(g,prev,p,.018,'#553f3b');prev=p;}}
   sphere(g,.16,'#91b7a8',0,6.6,-.5).material=glow;
  }
  for(let i=0;i<7;i++){
   const a=Math.PI*.95+i*Math.PI*1.1/6,x=Math.cos(a)*7.5,z=Math.sin(a)*7.5,y=terrainHeight(s.x+x,s.z+z)-terrainHeight(s.x,s.z);
   cylinder(g,.18,.3,2.8,'#897350',x,y+1.4,z,6);cylinder(g,0,1.8,3.5,'#748f67',x,y+4,z,7);cylinder(g,0,1.35,2.6,'#91a77c',x,y+5.4,z,7);
  }
  batchRigidMeshes(g);g.updateMatrixWorld(true);g.traverse(o=>{o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;});
 }
 return {sync(progress){for(const [id,mat] of indicators){const found=progress.has(id);mat.color.set(found?'#acead4':'#91b7a8');mat.emissiveIntensity=found?.8:.08;}}};
}
