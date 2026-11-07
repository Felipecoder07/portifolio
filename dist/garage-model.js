import * as T from './three.js';
import {box,cylinder,sphere,sign} from './models.js';
import {batchRigidMeshes} from './render-optimization.js';

export function createGarageModel(scene){
 const root=new T.Group();root.name='technology-garage';scene.add(root);
 const fixed=new T.Group();root.add(fixed);
 const facade=new T.Group();facade.name="garage-facade";root.add(facade);
 const ink='#243d3c',steel='#566e6c',cream='#e5e9d9',copper='#de9166';
 const glow=new T.MeshStandardMaterial({color:'#a9e5bd',emissive:'#a9e5bd',emissiveIntensity:.7,roughness:.45});
 const lights=[];
 function strip(parent,w,h,d,x,y,z,mat=glow){const m=box(parent,w,h,d,cream,x,y,z);m.material=mat;m.castShadow=false;return m;}
 const platform=new T.Group();platform.name='garage-turntable';root.add(platform);
 cylinder(fixed,3.35,3.4,.15,ink,0,.14,0,64);
 cylinder(platform,3.17,3.17,.07,steel,0,.235,0,64);
 cylinder(platform,2.8,2.8,.02,ink,0,.28,0,64);
 const rim=new T.Mesh(new T.TorusGeometry(3.25,.045,6,80),glow);rim.rotation.x=Math.PI/2;rim.position.y=.24;fixed.add(rim);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,m=strip(platform,.08,.012,.3,Math.sin(a)*3,.285,Math.cos(a)*3);m.rotation.y=a;}
 for(const x of [-1.35,1.35])strip(platform,.06,.015,3.4,x,.29,0);
 for(const x of [-4,4]){
  box(facade,.2,3.4,.25,steel,x,1.7,4.16);
  strip(facade,.08,2.7,.06,x,1.7,4.32);
 }
 const door=new T.Group();door.position.set(0,3.25,4.18);facade.add(door);
 box(door,7.7,3.1,.12,ink,0,-1.55,0);
 for(let j=0;j<10;j++)box(door,7.5,.035,.035,steel,0,-.13-j*.31,.08);
 strip(door,6.6,.07,.06,0,-2.9,.1);
 sign(facade,'FW / CUSTOM LAB',6.5,.55,0,4.5,4.7,ink,cream);
 sign(facade,'Entre para personalizar veículo',7,.48,0,3.72,4.55,ink,cream);
 const approach=[];
 for(const x of [-2,2])for(let z=5.2;z<12;z+=1.3){const m=strip(fixed,.09,.02,.65,x,.12,z);m.material=glow.clone();approach.push(m);}
 // Visible through the open front and during the close-up workshop view.
 box(fixed,10.7,3.4,.16,ink,0,1.7,-4);
 for(const x of [-5.4,5.4])box(facade,.16,3.4,7.8,ink,x,1.7,0);
 for(const x of [-4.8,4.8]){strip(fixed,.12,3.2,.06,x,1.8,-3.85);strip(fixed,.1,.1,6,x,3.5,0);}
 box(fixed,3.3,1,.7,steel,3.3,.6,-3.4);
 for(let i=0;i<3;i++){box(fixed,.92,.72,.04,ink,2.25+i*1.05,.65,-3.02);strip(fixed,.35,.04,.04,2.25+i*1.05,.85,-2.98);}
 sign(fixed,'PRECISION / PERSONALITY',5,.55,0,2.9,-3.88,ink,cream);
 sign(fixed,'01  /  PAINT STUDIO',3,.42,2.8,2.1,-3.88,ink,'#a9e5bd');
 // A pair of compact work lamps; no extra shadow maps.
 for(const x of [-3,3]){const lamp=new T.PointLight('#d9eee5',0,14,2);lamp.position.set(x,4.2,1.5);root.add(lamp);lights.push(lamp);}
 const arm=new T.Group();root.add(arm);
 cylinder(arm,.65,.85,.3,ink,-4,.25,0,20);cylinder(arm,.36,.45,.9,copper,-4,.85,0,16);
 const chrome=new T.MeshStandardMaterial({color:'#bdc8c6',metalness:.85,roughness:.24});
 const joints=Array.from({length:3},(_,i)=>{const g=new T.Group();arm.add(g);const r=i===2?.22:.32;
  const motor=cylinder(g,r,r,.36,steel,0,0,0,24);motor.rotation.x=Math.PI/2;
  for(const side of [-1,1]){const cap=cylinder(g,r*.78,r*.78,.04,ink,0,0,side*.2,20);cap.rotation.x=Math.PI/2;
   for(let j=0;j<6;j++){const a=j*Math.PI/3,b=cylinder(g,.025,.025,.045,cream,Math.cos(a)*r*.6,Math.sin(a)*r*.6,side*.23,6);b.rotation.x=Math.PI/2;b.material=chrome;}}
  batchRigidMeshes(g);return g;
 });
 const lengths=[1.85,1.75];
 const links=lengths.map((length,i)=>{const g=new T.Group();g.name='robot-link-'+i;arm.add(g);
  box(g,.34,length-.3,.3,copper,0,0,0);box(g,.2,length-.65,.025,ink,0,0,.165);
  for(const side of [-1,1])box(g,.045,length-.5,.36,steel,side*.2,0,0);
  for(const y of [-1,1])cylinder(g,.22,.22,.18,steel,0,y*(length/2-.14),0,16);
  batchRigidMeshes(g);return g;
 });
 const nozzle=new T.Group();arm.add(nozzle);
 cylinder(nozzle,.16,.22,.25,steel,0,0,0,20);
 box(nozzle,.24,.36,.18,ink,0,.22,0);
 const tip=cylinder(nozzle,.055,.1,.2,cream,0,.48,0,16);tip.material=chrome;
 cylinder(nozzle,.1,.13,.25,cream,.18,.15,0,16);
 const jointLight=sphere(arm,.08,'#a9e5bd',0,0,0);jointLight.material=glow;
 const piston=cylinder(arm,.09,.09,1,ink,0,0,0,12),rod=cylinder(arm,.045,.045,1,cream,0,0,0,12);rod.material=chrome;
 const hose=Array.from({length:16},()=>cylinder(arm,.035,.035,1,ink,0,0,0,8));
 const base=new T.Vector3(-4,1.25,0),elbow=new T.Vector3(),hand=new T.Vector3(-3.8,2.8,-1.6),aim=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);
 const targetHand=new T.Vector3(),pole=new T.Vector3(),aPoint=new T.Vector3(),bPoint=new T.Vector3(),mid=new T.Vector3(),previous=new T.Vector3(),current=new T.Vector3();
 function segment(mesh,a,b){mesh.position.copy(a).lerp(b,.5);direction.subVectors(b,a);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
 const sprayPositions=new Float32Array(64*3),sprayGeo=new T.BufferGeometry();sprayGeo.setAttribute('position',new T.BufferAttribute(sprayPositions,3));
 const sprayMat=new T.PointsMaterial({color:copper,size:.1,transparent:true,opacity:.55,depthWrite:false});
 const spray=new T.Points(sprayGeo,sprayMat);spray.frustumCulled=false;spray.visible=false;root.add(spray);
 let doorAmount=0;
 batchRigidMeshes(fixed);batchRigidMeshes(platform);batchRigidMeshes(facade);
 function update(dt,{time=0,near=false,active=false,turn=0,painting=0,color=copper,reduced=false}={}){
  facade.visible=!active;
  doorAmount=reduced?(near||active?1:0):T.MathUtils.damp(doorAmount,near||active?1:0,5,dt);
  door.scale.y=Math.max(.025,1-doorAmount);
  platform.rotation.y=turn;
  glow.emissiveIntensity=active?1.15:near?.85:.3;
  approach.forEach((m,i)=>m.material.emissiveIntensity=near||active?(reduced?.8:.35+(Math.sin(time*3-i*.7)+1)*.45):.15);
  lights.forEach(l=>l.intensity=active?12:0);
  const work=painting>0&&!reduced,sweep=work?Math.sin(painting*Math.PI*2)*1.15:0;
  targetHand.set(work?-1.9:-3.8,work?2.2:2.8,work?sweep:-1.6);
  hand.lerp(targetHand,reduced?1:1-Math.exp(-7*dt));
  // Two rigid links solved with inverse kinematics: joints bend, metal never stretches.
  direction.subVectors(hand,base);const distance=direction.length();direction.normalize();
  const along=(lengths[0]**2-lengths[1]**2+distance**2)/(2*distance);
  const height=Math.sqrt(Math.max(0,lengths[0]**2-along**2));
  pole.copy(up).addScaledVector(direction,-up.dot(direction)).normalize();
  elbow.copy(base).addScaledVector(direction,along).addScaledVector(pole,height);
  [base,elbow,hand].forEach((v,i)=>joints[i].position.copy(v));
  links.forEach((mesh,i)=>{const a=i?elbow:base,b=i?hand:elbow;mesh.position.copy(a).lerp(b,.5);direction.subVectors(b,a).normalize();mesh.quaternion.setFromUnitVectors(up,direction);});
  aPoint.copy(base).lerp(elbow,.25);aPoint.z+=.27;bPoint.copy(elbow).lerp(hand,.35);bPoint.z+=.27;
  mid.copy(aPoint).lerp(bPoint,.62);segment(piston,aPoint,mid);segment(rod,mid,bPoint);
  previous.copy(base);previous.z+=.33;
  for(let i=0;i<hose.length;i++){const t=(i+1)/hose.length;
   if(t<.5)current.copy(base).lerp(elbow,t*2);else current.copy(elbow).lerp(hand,(t-.5)*2);
   current.z+=.33+Math.sin(t*Math.PI)*.16;segment(hose[i],previous,current);previous.copy(current);
  }
  aim.set(-.8,1.35,hand.z);direction.subVectors(aim,hand).normalize();nozzle.position.copy(hand);nozzle.quaternion.setFromUnitVectors(up,direction);jointLight.position.copy(elbow);jointLight.position.z+=.25;
  spray.visible=work;sprayMat.color.set(color);
  if(work){for(let i=0;i<64;i++){const t=(i/64+time*2)%1,spread=t*.3;const n=i*3;sprayPositions[n]=hand.x+(aim.x-hand.x)*t;sprayPositions[n+1]=hand.y+(aim.y-hand.y)*t+Math.sin(i*8.7)*spread;sprayPositions[n+2]=hand.z+Math.cos(i*5.3)*spread;}sprayGeo.attributes.position.needsUpdate=true;}
 }
 update(0);
 return {root,update,platform};
}
