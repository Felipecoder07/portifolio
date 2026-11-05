import * as T from './three.js';
import {box,cylinder,sign,material} from './models.js';
import {spring,advanceSpring,wheelSteering} from './suspension.js';
import {batchRigidMeshes} from './render-optimization.js';

// Original procedural trail car; no downloaded models or textures.
export function vehicle(scene){
 const car=new T.Group(),body=new T.Group();car.add(body);scene.add(car);
 const paint=new T.MeshStandardMaterial({color:'#d78256',roughness:.38,metalness:.18});
 const glass=new T.MeshStandardMaterial({color:'#8fc6cf',roughness:.16,metalness:.15,transparent:true,opacity:.38,depthWrite:false});
 const metal=new T.MeshStandardMaterial({color:'#a6b3a8',roughness:.35,metalness:.65});
 const headlight=new T.MeshStandardMaterial({color:'#fff0bf',emissive:'#ffe1a0',emissiveIntensity:.35});
 const taillight=new T.MeshStandardMaterial({color:'#b43b32',emissive:'#ff3020',emissiveIntensity:.15});
 const dark='#293e39',cream='#f0e5cb';
 function rounded(w,h,d,mat,x,y,z,r=.1){
  const shape=new T.Shape(),a=w/2-r,b=d/2-r;
  shape.moveTo(-a,-d/2);shape.lineTo(a,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-b);shape.lineTo(w/2,b);shape.quadraticCurveTo(w/2,d/2,a,d/2);shape.lineTo(-a,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,b);shape.lineTo(-w/2,-b);shape.quadraticCurveTo(-w/2,-d/2,-a,-d/2);
  const geometry=new T.ExtrudeGeometry(shape,{depth:h-.08,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,steps:1,curveSegments:4});geometry.rotateX(-Math.PI/2);geometry.translate(0,-h/2+.04,0);
  const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;body.add(mesh);return mesh;
 }
 rounded(1.85,.3,3.45,material(dark),0,.63,0);
 rounded(1.93,.48,3.3,paint,0,.94,0);
 const hood=rounded(1.8,.27,1.1,paint,0,1.27,-1.08);hood.rotation.x=-.06;
 rounded(1.85,.16,1.95,material(cream),0,2.12,.18);
 // Open cabin with seats, dashboard, steering wheel and framed transparent glass.
 for(const x of [-.46,.46]){rounded(.59,.18,.58,material(dark),x,1.24,.2,.08);const seat=rounded(.59,.57,.16,material('#a47d55'),x,1.53,.48,.05);seat.rotation.x=-.12;}
 box(body,1.53,.23,.3,dark,0,1.43,-.53);
 const steering=new T.Mesh(new T.TorusGeometry(.18,.025,6,16),material(dark));steering.position.set(-.43,1.61,-.32);steering.rotation.x=-.5;body.add(steering);
 for(const x of [-.83,.83])for(const z of [-.69,1.02]){const pillar=box(body,.11,.88,.11,cream,x,1.69,z);pillar.rotation.x=z<0?-.12:.06;}
 for(const z of [-.7,1.03]){const pane=box(body,1.54,.66,.025,cream,0,1.72,z);pane.material=glass;}
 for(const x of [-.85,.85]){
  const pane=box(body,.025,.65,1.5,cream,x,1.72,.17);pane.material=glass;
  box(body,.07,.75,.07,cream,x,1.7,.2);box(body,.08,.08,.28,dark,x*1.08,1.24,.55);
  rounded(.22,.17,.37,material(dark),x*1.27,1.61,-.56,.05);
  const mirror=box(body,.025,.12,.25,cream,x*1.41,1.61,-.56);mirror.material=metal;
  box(body,.2,.12,1.5,dark,x*1.23,.56,.1);
 }
 for(const z of [-1.06,1.06])for(const x of [-1,1]){
  const arch=new T.Mesh(new T.TorusGeometry(.59,.115,6,20,Math.PI),paint);arch.rotation.y=Math.PI/2;arch.position.set(x,.57,z);body.add(arch);arch.castShadow=true;
 }
 rounded(2.12,.23,.27,material(dark),0,.67,-1.79,.07);rounded(2.12,.23,.27,material(dark),0,.67,1.78,.07);
 box(body,1.2,.3,.06,dark,0,1.03,-1.68);for(let i=-3;i<=3;i++){const slat=box(body,.055,.24,.08,cream,i*.15,1.03,-1.73);slat.material=metal;}
 for(const x of [-.73,.73]){
  const bezel=cylinder(body,.24,.24,.12,dark,x,1.12,-1.72,20);bezel.rotation.x=Math.PI/2;
  const light=cylinder(body,.18,.18,.025,cream,x,1.12,-1.8,20);light.rotation.x=Math.PI/2;light.material=headlight;
  box(body,.26,.19,.07,cream,x,1.04,1.68).material=taillight;
  const beam=new T.SpotLight('#ffe5ad',0,18,.5,.6,1.5);beam.position.set(x,1.12,-1.8);beam.target.position.set(x,.1,-12);body.add(beam,beam.target);beam.userData.headlight=true;
 }
 const plate=sign(body,'FW • 07',.7,.18,0,.84,1.96);plate.material.roughness=.7;
 for(const x of [-.68,.68])box(body,.07,.19,1.55,dark,x,2.28,.18);
 for(const z of [-.55,-.1,.35,.85])box(body,1.46,.07,.07,dark,0,2.38,z);
 rounded(.9,.3,.8,material('#839473'),0,2.56,.3,.1);for(const x of [-.3,.3])box(body,.06,.32,.82,cream,x,2.56,.3);
 const spare=cylinder(body,.48,.48,.26,dark,0,1.43,1.84,24);spare.rotation.x=Math.PI/2;
 const hub=cylinder(body,.25,.25,.28,cream,0,1.43,1.86,12);hub.rotation.x=Math.PI/2;hub.material=metal;
 const wheels=[];
 for(const x of [-1.03,1.03])for(const z of [-1.06,1.06]){
  const pivot=new T.Group(),wheel=new T.Group();pivot.position.set(x,.57,z);pivot.add(wheel);car.add(pivot);
  const tire=cylinder(wheel,.51,.51,.42,dark,0,0,0,24);tire.rotation.z=Math.PI/2;
  for(const side of [-1,1]){const rim=cylinder(wheel,.29,.29,.03,cream,side*.22,0,0,12);rim.rotation.z=Math.PI/2;rim.material=metal;for(let j=0;j<5;j++)box(wheel,.04,.06,.06,dark,side*.245,Math.sin(j*1.257)*.17,Math.cos(j*1.257)*.17);}
  for(let j=0;j<16;j++){const tread=box(wheel,.44,.065,.14,'#3a4a40',0,Math.sin(j*Math.PI/8)*.49,Math.cos(j*Math.PI/8)*.49);tread.rotation.x=-j*Math.PI/8;}
  const shock=cylinder(car,.065,.065,.45,'#c6ac72',x*.76,.62,z,8);
  wheels.push({pivot,wheel,front:z<0,shock,x,z});
 }
 batchRigidMeshes(body);for(const w of wheels)batchRigidMeshes(w.wheel);
 const headlights=body.children.filter(o=>o.userData.headlight);
 const pitch=spring(),roll=spring(),heave=spring();let lastSpeed=0,spin=0;
 function reset(){for(const s of [pitch,roll,heave])s.value=s.velocity=0;lastSpeed=0;body.position.y=0;body.rotation.set(0,0,0);}
 function update(dt,driver,{night=false,braking=false,reduced=false,paused=false}={}){
  const acceleration=paused?0:T.MathUtils.clamp((driver.speed-lastSpeed)/Math.max(dt,.001),-36,23);lastSpeed=driver.speed;
  const lateral=T.MathUtils.clamp(driver.speed*driver.speed*Math.tan(driver.steer)/2.12,-14,14);
  const amount=reduced?0:1;
  body.rotation.x=advanceSpring(pitch,acceleration*.003*amount,dt);
  body.rotation.z=advanceSpring(roll,-lateral*.006*amount,dt);
  body.position.y=advanceSpring(heave,-Math.min(Math.abs(acceleration)*.0015,.05)*amount,dt,13);
  spin=(spin-driver.speed*dt/.51)%(Math.PI*2);
  for(const w of wheels){w.wheel.rotation.x=spin;w.pivot.rotation.y=w.front?wheelSteering(driver.steer,w.x):0;const compression=body.position.y+body.rotation.z*w.x-body.rotation.x*w.z;w.shock.scale.y=T.MathUtils.clamp(1+compression/.45,.55,1.45);w.shock.position.y=.62+compression*.5;}
  headlight.emissiveIntensity=night?2:.35;taillight.emissiveIntensity=braking?3:night?.65:.15;
  for(const light of headlights)light.intensity=night?12:0;
 }
 return {car,body,wheels,update,reset};
}
