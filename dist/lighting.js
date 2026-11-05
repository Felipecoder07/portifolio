import * as T from './three.js';

export function createLighting(scene,renderer,fixtures){
 const hemi=new T.HemisphereLight('#e4f2ee','#626c4e',2.1);
 const sun=new T.DirectionalLight('#ffe6b9',3);sun.position.set(-38,65,28);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-64,right:64,top:64,bottom:-64,near:1,far:150});
 sun.shadow.normalBias=.055;sun.shadow.bias=-.00012;sun.shadow.radius=3;
 const fill=new T.DirectionalLight('#c0e1e3',.45);fill.position.set(30,18,-35);scene.add(hemi,sun,fill);
 const localLights=[[-1,3.5,0],[-43,3,0],[-31,5,36]].map(([x,y,z])=>{const l=new T.PointLight('#ffd396',0,15,2);l.position.set(x,y,z);scene.add(l);return l;});
 function setNight(night){
  scene.background.set(night?'#203746':'#d8e8de');scene.fog.color.copy(scene.background);
  hemi.intensity=night?.85:2.1;hemi.color.set(night?'#a9c9e4':'#e4f2ee');sun.intensity=night?.65:3;
  sun.color.set(night?'#aecbff':'#ffe6b9');fill.intensity=night?.2:.45;renderer.toneMappingExposure=night?1.05:1.12;
  for(const mat of fixtures)mat.emissiveIntensity=night?1.65:.08;
  localLights.forEach(l=>l.intensity=night?18:0);
 }
 setNight(false);return {setNight,sun};
}
