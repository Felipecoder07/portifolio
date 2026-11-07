import * as T from './three.js';
import {seededRandom} from './lunar-terrain.js';
export function createFlightClouds(scene){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),random=seededRandom(912);
 // Overlapping soft gradients form billowing silhouettes without polygon edges.
 for(let i=0;i<32;i++){const x=65+random()*126,y=83+random()*88,r=24+random()*40,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.38)');g.addColorStop(.45,'rgba(244,249,255,.22)');g.addColorStop(1,'rgba(232,242,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const root=new T.Group();root.name='Soft atmospheric cloud layers';scene.add(root);const clouds=[];
 for(let i=0;i<46;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,color:'#f4f8ff',transparent:true,opacity:.8,depthWrite:false,fog:false}));const size=24+random()*38;sprite.scale.set(size*1.8,size,1);root.add(sprite);clouds.push({sprite,x:(random()-.5)*200,z:-25-random()*180,y:random()*270,size});}
 return {root,update(time,opacity,reverse=false){root.visible=opacity>.001;if(!root.visible)return;for(const c of clouds){c.sprite.position.set(c.x,((c.y+(reverse?1:-1)*time*38)%270+270)%270-145,c.z);c.sprite.material.opacity=opacity*.8;}}};
}
