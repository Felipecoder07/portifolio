import * as T from './three.js';
import {terrainHeight} from './island-layout.js';
import {waterHeight} from './water-motion.js';

export function createBoatWake(scene){
 const root=new T.Group();root.name='boat-water-reaction';scene.add(root);
 const geometry=new T.PlaneGeometry(1,1);
 const shader=`varying vec2 vUv;uniform float uLife;uniform float uTime;
void main(){
 vec2 p=vUv*2.-1.;float edge=1.-smoothstep(.6,1.,abs(p.y));
 float wave=exp(-pow((p.x+.12*sin(p.y*4.+uTime*.6))/.20,2.));
 float lace=.55+.45*sin(p.y*28.+sin(p.x*19.)+uTime*1.7);
 float alpha=wave*edge*uLife*(.25+.22*lace);
 gl_FragColor=vec4(mix(vec3(.38,.64,.62),vec3(.88,.96,.92),wave),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
 const pool=Array.from({length:96},()=>{
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uLife:{value:0},uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:shader});
  const mesh=new T.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;mesh.renderOrder=3;root.add(mesh);
  return {mesh,age:0,life:0,vx:0,vz:0,width:0,length:0};
 });
 let distance=0,last=null,cursor=0;
 function reset(){last=null;distance=0;for(const p of pool){p.life=0;p.mesh.visible=false;}}
 function emit(x,z,heading,side,speed,stern=false){
  if(terrainHeight(x,z)>-1.27)return;
  const p=pool[cursor++%pool.length],spread=stern?.28:.45+speed*.055;
  p.age=0;p.life=stern?1.5:1.9;p.vx=Math.cos(heading)*side*spread;p.vz=-Math.sin(heading)*side*spread;
  p.strength=Math.min(1,speed/7);p.width=stern?.7:.45;p.length=stern?1.4:2.1;p.mesh.position.set(x,0,z);p.mesh.rotation.z=heading+side*(stern?.12:.35);
  p.mesh.visible=true;p.mesh.material.uniforms.uLife.value=Math.min(1,speed/7);
 }
 function update(dt,d,{time=0,paused=false,reduced=false,airborne=false}={}){
  if(reduced){reset();return;}if(paused)return;
  const moving=d.mode==='boat'&&!airborne;
  const travel=last?Math.hypot(d.x-last.x,d.z-last.z):0;
  if(travel>8)reset();
  if(moving&&travel<8){
   distance+=travel;const speed=Math.hypot(d.vx,d.vz),direction=d.speed<0?-1:1,h=d.heading+(direction<0?Math.PI:0),fx=-Math.sin(h),fz=-Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
   if(speed>.35&&distance>=.85){
    const count=Math.min(6,Math.floor(distance/.85));distance%=.85;
    for(let i=0;i<count;i++){const t=(i+1)/count,x=last?T.MathUtils.lerp(last.x,d.x,t):d.x,z=last?T.MathUtils.lerp(last.z,d.z,t):d.z;
     for(const side of [-1,1])emit(x+fx*1.4+rx*side*.85,z+fz*1.4+rz*side*.85,h,side,speed);
     emit(x-fx*1.8,z-fz*1.8,h,i%2?1:-1,speed,true);
    }
   }
  }else distance=0;
  last={x:d.x,z:d.z};
  for(const p of pool)if(p.life>0){
   p.age+=dt;if(p.age>=p.life){p.life=0;p.mesh.visible=false;continue;}
   p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;
   p.mesh.position.y=waterHeight(p.mesh.position.x,p.mesh.position.z,time)+.045;
   p.mesh.scale.set(p.width+p.age*.75,p.length+p.age*.65,1);
   const fade=(1-p.age/p.life)**2;
   p.mesh.material.uniforms.uLife.value=fade*p.strength;p.mesh.material.uniforms.uTime.value=time;
   if(terrainHeight(p.mesh.position.x,p.mesh.position.z)>-1.27){p.life=0;p.mesh.visible=false;}
  }
 }
 return {update,reset,root};
}
