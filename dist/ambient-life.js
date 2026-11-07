import * as T from './three.js';
import {box,sphere} from './models.js';
import {terrainHeight} from './island-layout.js';
import {batchRigidMeshes} from './render-optimization.js';

// Small, deterministic loops: no physics bodies or per-frame allocations.
export function createAmbientLife(scene,projects){
 const root=new T.Group();root.name='ambient-life';scene.add(root);
 const birds=[],crabs=[],smoke=[];
 for(let i=0;i<5;i++){
  const bird=new T.Group();bird.name='seagull';root.add(bird);
  sphere(bird,.24,'#f2e8ce',0,0,0,.7,.7,1.8);
  box(bird,.12,.1,.26,'#dcac62',0,.04,-.48);
  const wings=[-1,1].map(side=>{const pivot=new T.Group();bird.add(pivot);box(pivot,.95,.06,.3,'#f2e8ce',side*.55,0,0);box(pivot,.27,.065,.26,'#49685e',side*1.08,0,.04);return pivot;});
  birds.push({bird,wings,phase:i*1.7});
 }
 for(let i=0;i<5;i++){
  const crab=new T.Group();crab.name='beach-crab';root.add(crab);
  sphere(crab,.4,'#c36a47',0,.23,0,1,.5,.7);
  for(const side of [-1,1]){
   for(let j=0;j<3;j++){const leg=box(crab,.43,.06,.065,'#a75438',side*.43,.12,(j-1)*.22);leg.rotation.y=side*(j-1)*.4;}
   sphere(crab,.18,'#dc8053',side*.47,.31,-.39,1,.8,1.3);
   sphere(crab,.06,'#29483f',side*.15,.46,-.16);
  }
  crabs.push({crab,angle:.3+i*.18});
 }
 const food=projects.find(p=>p.id==='food');
 if(food)for(let i=0;i<7;i++){
  const puff=new T.Mesh(new T.IcosahedronGeometry(.4,1),new T.MeshBasicMaterial({color:'#f2e8ce',transparent:true,opacity:.2,depthWrite:false}));
  puff.name='chimney-smoke';root.add(puff);smoke.push(puff);
 }
 function update(time,reduced=false){
  if(reduced)return;
  birds.forEach(({bird,wings,phase},i)=>{
   const a=time*(.21+i*.008)+phase;
   bird.position.set(39+Math.cos(a)*(13+i),10+i*.65+Math.sin(time*.45+phase)*.5,-3+Math.sin(a)*19);
   bird.rotation.y=Math.atan2(Math.sin(a)*(13+i),-Math.cos(a)*19);
   wings.forEach((wing,j)=>wing.rotation.z=(j?1:-1)*(.12+Math.sin(time*5+phase)*.32));
  });
  crabs.forEach(({crab,angle},i)=>{
   const walk=Math.sin(time*.4+i),a=angle+walk*.025,x=Math.cos(a)*77,z=Math.sin(a)*77;
   crab.position.set(x,terrainHeight(x,z)+Math.abs(Math.sin(time*9+i))*.025,z);
   crab.rotation.y=-a;crab.rotation.z=Math.sin(time*9+i)*.035*Math.abs(Math.cos(time*.4+i));
  });
  smoke.forEach((puff,i)=>{
   const age=(time*.17+i/7)%1;
   puff.position.set(food.x+2.5+age*2.1,6.25+age*4,food.z-2.5+Math.sin(age*3+i)*age*.5);
   puff.scale.setScalar(.45+age*2);puff.material.opacity=Math.sin(age*Math.PI)*.22;
  });
 }
 update(0);
 for(const {crab} of crabs)batchRigidMeshes(crab);
 for(const {bird,wings} of birds){batchRigidMeshes(bird);for(const wing of wings)batchRigidMeshes(wing);}
 root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 return {root,update};
}
