import * as T from './three.js';
import {terrainHeight} from './island-layout.js';

const waves=`
vec3 oceanWave(vec2 p,float t){
 vec2 d1=normalize(vec2(1.,.4)),d2=normalize(vec2(-.5,1.)),d3=normalize(vec2(.7,-.8));
 float p1=dot(d1,p)*.21-t*.9,p2=dot(d2,p)*.33-t*1.15,p3=dot(d3,p)*.65-t*1.6;
 float h=.10*sin(p1)+.055*sin(p2)+.025*sin(p3);
 vec2 g=.021*cos(p1)*d1+.01815*cos(p2)*d2+.01625*cos(p3)*d3;
 return vec3(h,g);
}`;
const noise=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
`;
const hullWave=`
uniform vec4 uBoat;
float hullWave(vec2 p){
 vec2 rel=vec2(p.x,-p.y)-uBoat.xy;
 float side=dot(rel,vec2(cos(uBoat.z),-sin(uBoat.z)));
 float along=dot(rel,vec2(-sin(uBoat.z),-cos(uBoat.z)));
 float bow=exp(-pow((abs(side)-1.25)/.55,2.)-pow((along-1.1)/1.6,2.));
 float outward=exp(-pow((abs(side)-1.7+along*.35)/.6,2.))*smoothstep(-7.,-2.,along)*(1.-smoothstep(-1.,1.,along));
 return uBoat.w*(bow*.12+outward*.065);
}`;

export function createOcean(root){
 const uniforms={uTime:{value:0},uBoat:{value:new T.Vector4(0,0,0,0)}};
 const material=new T.MeshStandardMaterial({color:'#ffffff',roughness:.24,metalness:.12});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uTime=uniforms.uTime;
  shader.uniforms.uBoat=uniforms.uBoat;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
uniform float uTime;varying vec2 vOcean;${waves}${hullWave}`)
   .replace('#include <beginnormal_vertex>',`vec3 wf=oceanWave(position.xy,uTime);
vec3 objectNormal=normalize(vec3(-wf.y,-wf.z,1.));
#ifdef USE_TANGENT
vec3 objectTangent=vec3(tangent.xyz);
#endif`)
   .replace('#include <begin_vertex>','vOcean=position.xy;vec3 transformed=vec3(position);transformed.z+=wf.x;transformed.z+=hullWave(position.xy);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform float uTime;varying vec2 vOcean;${noise}${hullWave}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
float depthBlend=smoothstep(80.,118.,length(vOcean));
vec3 shallow=vec3(.105,.36,.32),deep=vec3(.018,.095,.14);
float caustic=pow(.5+.5*sin(vOcean.x*2.3+sin(vOcean.y*1.7+uTime*.5))*sin(vOcean.y*2.1-uTime*.7),5.);
diffuseColor.rgb=mix(shallow,deep,depthBlend)+vec3(.04,.07,.045)*caustic*(1.-depthBlend);`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
vec2 ripple=vec2(cos(vOcean.x*2.2+vOcean.y*.8-uTime*1.4),sin(vOcean.y*2.6-vOcean.x*.7+uTime*1.1));
float pressure=hullWave(vOcean);
vec2 hullGradient=vec2(hullWave(vOcean+vec2(.08,0.))-pressure,hullWave(vOcean+vec2(0.,.08))-pressure)/.08;
normal=normalize(normal+mat3(viewMatrix)*vec3(ripple.x*.045-hullGradient.x,0.,ripple.y*.045+hullGradient.y));`)
   .replace('#include <opaque_fragment>',`float fresnel=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),4.);
outgoingLight=mix(outgoingLight,vec3(.48,.63,.65),fresnel*.38);
#include <opaque_fragment>`);
 };
 const water=new T.Mesh(new T.PlaneGeometry(500,500,160,160),material);water.rotation.x=-Math.PI/2;water.position.y=-1.35;water.name='water';water.frustumCulled=false;root.add(water);
 const vertices=[],indices=[],rings=40,sectors=256;
 for(let r=0;r<=rings;r++)for(let a=0;a<=sectors;a++){
  const radius=76+12*r/rings,angle=a/sectors*Math.PI*2,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  vertices.push(x,terrainHeight(x,z),z);
  if(r<rings&&a<sectors){const i=r*(sectors+1)+a;indices.push(i,i+sectors+1,i+1,i+1,i+sectors+1,i+sectors+2);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
 const wash=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
  vertexShader:`uniform float uTime;varying vec2 vXZ;${waves}
void main(){vXZ=position.xz;vec3 p=position;float sea=-1.35+oceanWave(vec2(p.x,-p.z),uTime).x;p.y=max(p.y,sea)+.035;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uTime;varying vec2 vXZ;${noise}
void main(){
 float r=length(vXZ);
 // Local variations break up the circular shoreline without a seam at +/- pi.
 float coast=noise(vXZ*.14)*.6+noise(vXZ*.45)*.18;
 float cycle=uTime*.72+noise(vXZ*.025)*1.6;
 float surge=pow(.5+.5*sin(cycle),1.5);
 float front=80.25-1.65*surge+coast;
 float behind=r-front;
 float film=smoothstep(-.08,.22,behind)*(1.-smoothstep(1.2,3.5,behind));
 float cells=noise(vXZ*5.+vec2(uTime*.15,-uTime*.25));
 float lace=smoothstep(.25,.72,cells);
 float leading=exp(-pow((behind-.12)/.18,2.))*(.35+.65*lace);
 float residual=exp(-max(behind,0.)*1.6)*film*lace*.3;
 // Offshore crests travel toward the sand and dissolve before the next wave.
 float crest=pow(.5+.5*sin((r+coast*.5)*2.6+uTime*1.7),24.);
 crest*=smoothstep(80.,81.4,r)*(1.-smoothstep(83.,86.,r))*(.35+.65*lace)*.25;
 float wet=(1.-smoothstep(78.,80.6,r))*smoothstep(77.5,78.5,r)*.17;
 float foam=leading*.72+residual+crest;
 float alpha=(film*.15+foam+wet)*smoothstep(76.8,78.,r)*(1.-smoothstep(85.,87.,r));
 if(alpha<.005)discard;
 vec3 color=mix(vec3(.20,.32,.27),vec3(.86,.94,.88),clamp(foam/max(alpha,.001),0.,1.));
 gl_FragColor=vec4(color,clamp(alpha,0.,.78));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
 const shore=new T.Mesh(geometry,wash);shore.name='shore-wash';shore.frustumCulled=false;shore.renderOrder=2;root.add(shore);
 return {water,shore,update(time,reduced=false,position=null,driver=null){
  if(!reduced)uniforms.uTime.value=time;
  const afloat=!reduced&&driver?.mode==='boat'&&position&&position.y<-.5;
  uniforms.uBoat.value.set(driver?.x||0,driver?.z||0,driver?.heading||0,afloat?Math.min(Math.abs(driver.speed)/12,1):0);
 }};
}
