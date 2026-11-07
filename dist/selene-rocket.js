import * as T from './three.js';
import {batchRigidMeshes} from './render-optimization.js';
const mat=(color,metalness=.25,roughness=.36)=>new T.MeshStandardMaterial({color,metalness,roughness});
export function createRocket(){
 const root=new T.Group();root.name='Selene / orbital lander';
 const pearl=mat('#eeeae1'),navy=mat('#26374d',.6,.3),steel=mat('#8e9aa5',.8,.24),orange=mat('#d78a50',.35,.4),bay=mat('#29333e',.4,.65);
 const add=(g,m,x=0,y=0,z=0,parent=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const tube=(r1,r2,h,m,y)=>add(new T.CylinderGeometry(r1,r2,h,64),m,0,y,0);
 const profile=[[2.8,4.55],[2.8,8.8],[2.77,10],[2.62,11],[2.36,12],[1.98,13],[1.46,14],[.8,14.85],[.25,15.35],[0,15.5]].map(([r,y])=>new T.Vector2(r,y));
 add(new T.LatheGeometry(profile,80),pearl);
 const shell=pearl.clone();shell.side=T.DoubleSide;
 add(new T.CylinderGeometry(2.8,2.8,4.5,64,1,true,.8,Math.PI*2-1.6),shell,0,2.3);
 tube(2.73,2.73,.09,bay,.02);tube(2.8,2.8,.2,navy,4.6);
 for(const y of [5.15,8.65,10.1])tube(2.815,2.815,.055,steel,y);
 tube(2.82,2.82,.48,navy,8.95);tube(2.83,2.83,.075,orange,9.23);
 const door=add(new T.CylinderGeometry(2.82,2.82,4.42,40,1,true,-.8,1.6),pearl,0,2.3);
 // A visible floor, guide lights and rear bulkhead make the bay read as an interior.
 const light=new T.MeshBasicMaterial({color:'#a5e8ff'});
 for(const x of [-1.5,1.5])add(new T.BoxGeometry(.055,.025,4),light,x,.085,.2);
 add(new T.BoxGeometry(3,2,.1),navy,0,1.5,-2.25);
 for(const x of [-1.4,1.4])add(new T.BoxGeometry(.07,2,.05),light,x,1.5,-2.16);
 const ramp=new T.Group();root.add(ramp);add(new T.BoxGeometry(3.8,.09,4.7),steel,0,-.035,4.4,ramp);
 for(let i=0;i<8;i++)add(new T.BoxGeometry(3.5,.02,.045),navy,0,.02,2.5+i*.5,ramp);
 const glass=mat('#102d48',.7,.12);
 for(const angle of [-.43,0,.43]){const window=add(new T.SphereGeometry(.37,24,16),glass,Math.sin(angle)*2.64,10.8,Math.cos(angle)*2.64);window.scale.set(1,.7,.22);window.rotation.y=angle;const ring=add(new T.TorusGeometry(.39,.045,8,32),steel,Math.sin(angle)*2.67,10.8,Math.cos(angle)*2.67);ring.scale.y=.7;ring.rotation.y=angle;}
 // Four swept fins and articulated landing legs, kept clear of the front ramp.
 const legs=[];
 for(const angle of [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4]){
  const g=new T.Group();g.rotation.y=angle;root.add(g);
  const shape=new T.Shape();shape.moveTo(2.55,1.2);shape.lineTo(4.1,.45);shape.quadraticCurveTo(4.5,.4,4.3,1.15);shape.lineTo(2.7,5.6);shape.closePath();
  const fin=add(new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:true,bevelSegments:2,bevelThickness:.06,bevelSize:.08,steps:1}),pearl,0,0,-.09,g);
  const leg=new T.Group();leg.position.set(2.6,1.7,0);g.add(leg);legs.push(leg);
  const piston=add(new T.CylinderGeometry(.09,.09,2,12),steel,.55,-.65,0,leg);piston.rotation.z=.7;
  const upper=add(new T.CylinderGeometry(.16,.16,1,12),navy,.22,-.15,0,leg);upper.rotation.z=.7;
  add(new T.CylinderGeometry(.5,.65,.12,16),navy,1.1,-1.62,0,leg);
 }
 tube(1.4,1.65,.75,navy,-.45);tube(.85,1.3,.65,steel,-.85);
 const flame=new T.Group();root.add(flame);
 for(const [radius,length,color,opacity] of [[1.25,9,'#65aaff',.25],[.85,7,'#bfe8ff',.5],[.4,5,'#fff8dc',.95]]){const m=add(new T.ConeGeometry(radius,length,32,1,true),new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}),0,-length/2-1,0,flame);m.rotation.z=Math.PI;m.castShadow=false;}
 flame.visible=false;
 batchRigidMeshes(root,{exclude:new Set([door])});batchRigidMeshes(ramp);
 let opening=1;
 return {root,door,flame,ramp,legs,setDoor(value){opening=T.MathUtils.clamp(value,0,1);door.position.y=2.3+opening*4.5;ramp.visible=opening>.1;},setFlight(value){for(const leg of legs)leg.rotation.z=-value*.75;ramp.visible=value<.05&&opening>.1;}};
}
