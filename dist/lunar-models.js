import {createRocket} from './selene-rocket.js';
import {createLunarExploration} from './lunar-exploration.js';
export {createRocket} from './selene-rocket.js';
import * as T from './three.js';
import {lunarHeight,lunarTerrainSize,lunarTerrainSegments,seededRandom,station} from './lunar-terrain.js';
const material=(color,metalness=0,roughness=.85)=>new T.MeshStandardMaterial({color,metalness,roughness});
const white=material('#d7d9d5',.45,.35),metal=material('#414953',.75,.32),dark=material('#19212b',.5,.45),gold=material('#b6985b',.65,.4);
function mesh(root,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
const box=(root,w,h,d,mat,x,y,z)=>mesh(root,new T.BoxGeometry(w,h,d),mat,x,y,z);
function label(root,text,x,y,z,width=7){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#12202c';ctx.fillRect(0,0,768,128);ctx.fillStyle='#d9eaf2';ctx.font='600 46px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,81);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=mesh(root,new T.PlaneGeometry(width,width/6),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),x,y,z);return m;}
export function createStation(scene){
 const group=new T.Group();scene.add(group);group.name='Selene launch island';
 mesh(group,new T.CylinderGeometry(15,17,3,64),material('#b4b0a2'),station.x,-1.5,0);
 mesh(group,new T.CylinderGeometry(12.8,13.5,.2,64),material('#4a555c'),station.x,-.03,0);
 box(group,28,.3,7.6,material('#717c7c'),87,-.12,0);
 for(const z of [-3.65,3.65]){box(group,18,.25,.16,white,83,.45,z);for(let x=76;x<94;x+=3)box(group,.15,.8,.15,metal,x,.2,z);}
 const rim=mesh(group,new T.TorusGeometry(8,.08,8,80),material('#e6d4a5'),station.x,.1,0);rim.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(group,new T.CylinderGeometry(.16,.16,.25,8),new T.MeshBasicMaterial({color:'#9fe9ff'}),station.x+Math.cos(a)*11,.25,Math.sin(a)*11);}
 for(const x of [107,109])box(group,.35,17,.35,metal,x,8.5,-6);
 for(let y=2;y<17;y+=2){box(group,2.4,.16,.4,metal,108,y,-6);const b=box(group,.15,2.8,.15,metal,108,y+1,-6);b.rotation.z=.75;}
 box(group,7,.45,1,metal,105,12,-6);box(group,4,2.4,3,white,94,1.2,-8);label(group,'SELENE · LUA',94,2.2,-6.45,5);
 const rocket=createRocket();rocket.root.position.set(station.x,.12,0);group.add(rocket.root);rocket.setDoor(1);
 // Ramp is aligned with the open cargo bay and remains flush with the pad.
 box(group,4.6,.12,5,metal,station.x,.09,4.6);
 const obstacles=[{x:station.x-2.5,z:0,hx:.15,hz:2.4},{x:station.x+2.5,z:0,hx:.15,hz:2.4},{x:station.x,z:-2.4,hx:2.5,hz:.15},{x:94,z:-8,hx:2,hz:1.5},{x:108,z:-6,hx:1.3,hz:.4},...[-3.65,3.65].map(z=>({x:83,z,hx:9,hz:.1}))];
 return {group,rocket,obstacles};
}
function moonTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),rng=seededRandom(419);
 const image=ctx.createImageData(512,512);for(let i=0;i<image.data.length;i+=4){const v=115+rng()*46;image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v;image.data[i+3]=255;}ctx.putImageData(image,0,0);
 for(let i=0;i<180;i++){const x=rng()*512,y=rng()*512,r=2+rng()*22;const g=ctx.createRadialGradient(x-r*.2,y-r*.2,0,x,y,r);g.addColorStop(0,'#45474b80');g.addColorStop(.72,'#77797b20');g.addColorStop(.9,'#dfdfdd65');g.addColorStop(1,'#99999900');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function earthTexture(){
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#16436c';ctx.fillRect(0,0,1024,512);
 // Stylized continental silhouettes on an equirectangular globe.
 const lands=[[[.08,.16],[.2,.12],[.29,.23],[.25,.34],[.18,.4],[.13,.31]],[[.25,.4],[.34,.46],[.33,.65],[.28,.85],[.23,.62]],[[.44,.2],[.55,.15],[.63,.24],[.58,.34],[.48,.33]],[[.45,.35],[.56,.34],[.59,.5],[.53,.72],[.48,.62]],[[.57,.2],[.77,.12],[.91,.23],[.85,.4],[.74,.46],[.65,.37]],[[.79,.65],[.88,.61],[.93,.75],[.84,.8]]];
 for(const points of lands){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*1024,y*512):ctx.moveTo(x*1024,y*512));ctx.closePath();ctx.fillStyle='#647359';ctx.fill();}
 const rng=seededRandom(216);for(let i=0;i<170;i++){ctx.fillStyle=`rgba(240,247,250,${.08+rng()*.22})`;ctx.beginPath();ctx.ellipse(rng()*1024,rng()*512,10+rng()*60,2+rng()*9,-.3,0,Math.PI*2);ctx.fill();}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
export function planet(kind,radius){
 const root=new T.Group();root.name=kind+' globe';const moon=kind==='moon';
 const globe=mesh(root,new T.SphereGeometry(radius,64,40),new T.MeshStandardMaterial({map:moon?moonTexture():earthTexture(),roughness:1}));
 if(!moon){const air=mesh(root,new T.SphereGeometry(radius*1.025,64,40),new T.MeshBasicMaterial({color:'#63b8ff',transparent:true,opacity:.12,side:T.BackSide,depthWrite:false,blending:T.AdditiveBlending}));air.castShadow=false;}
 root.userData.globe=globe;return root;
}
export function addStars(scene){const rng=seededRandom(915),p=[];for(let i=0;i<1300;i++){const y=rng()*2-1,a=rng()*Math.PI*2,r=780;const s=Math.sqrt(1-y*y);p.push(Math.cos(a)*s*r,y*r,Math.sin(a)*s*r);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const stars=new T.Points(g,new T.PointsMaterial({color:'#d8e6f7',size:1.25,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false,fog:false}));scene.add(stars);return stars;}
export function createMoon(){
 const scene=new T.Scene();scene.background=new T.Color('#020307');scene.fog=new T.Fog('#080a0e',280,650);
 scene.add(new T.HemisphereLight('#a9b4c9','#333239',.45));
 const sun=new T.DirectionalLight('#fff5df',3.4);sun.position.set(-65,42,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:180});sun.shadow.normalBias=.08;scene.add(sun,sun.target);
 const geometry=new T.PlaneGeometry(lunarTerrainSize,lunarTerrainSize,lunarTerrainSegments,lunarTerrainSegments);geometry.rotateX(-Math.PI/2);const position=geometry.attributes.position,colors=[];const rng=seededRandom(55);
 for(let i=0;i<position.count;i++){const x=position.getX(i),z=position.getZ(i),h=lunarHeight(x,z);position.setY(i,h);const v=.38+rng()*.08+Math.min(.06,h*.008);colors.push(v,v*.99,v*.98);}geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const texture=moonTexture();texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(40,40);
 mesh(scene,geometry,new T.MeshStandardMaterial({color:'#d3d2cf',vertexColors:true,roughness:1,map:texture,bumpMap:texture,bumpScale:.16}));
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#777778'),420),dummy=new T.Object3D(),obstacles=[];
 for(let i=0;i<420;i++){const spread=i<240?210:570;let x=(rng()-.5)*spread,z=(rng()-.5)*spread;if(Math.hypot(x,z)<22)x+=32;const size=.25+rng()*1.5;dummy.position.set(x,lunarHeight(x,z)+size*.3,z);dummy.rotation.set(rng()*2,rng()*6,rng()*2);dummy.scale.set(size,size*.65,size*.9);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);if(size>1)obstacles.push({x,z,radius:size*.8});}rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
 const rocket=createRocket();rocket.setDoor(1);rocket.root.position.set(0,.12,0);scene.add(rocket.root);
 // Research outpost: foil-wrapped habitat, solar arrays and antenna.
 mesh(scene,new T.CylinderGeometry(2,2,7,24),gold,-14,2,-14).rotation.z=Math.PI/2;
 for(const x of [-18,-10])box(scene,.2,3,.2,metal,x,1,-14);
 for(const x of [-21,-28]){box(scene,.15,2,.15,metal,x,1,-22);const panel=box(scene,5,.1,3,material('#132b4b',.5,.3),x,2,-22);panel.rotation.z=.2;for(let j=0;j<5;j++)box(scene,.035,.05,3,white,x-2+j,2.12,-22);}
 box(scene,.12,5,.12,white,-12,2.5,-4);const flag=box(scene,2,1.2,.04,material('#e7e7e1'),-11,4.2,-4);label(scene,'FW',-11,4.2,-3.96,1.8);
 const dish=mesh(scene,new T.SphereGeometry(2,24,12,0,Math.PI*2,0,.9),white,-21,5,-12);dish.rotation.z=.65;box(scene,.2,4,.2,metal,-21,2,-12);
 obstacles.push({x:-14,z:-14,hx:5,hz:2.2},{x:-21,z:-12,radius:2},{x:-2.5,z:0,hx:.15,hz:2.4},{x:2.5,z:0,hx:.15,hz:2.4},{x:0,z:-2.4,hx:2.5,hz:.15},...[-21,-28].map(x=>({x,z:-22,hx:2.5,hz:1.5})));
 addStars(scene);const earth=planet('earth',30);earth.position.set(110,115,-270);earth.rotation.z=.35;scene.add(earth);
 const exploration=createLunarExploration(scene,obstacles);
 return {scene,rocket,sun,obstacles,exploration};
}
