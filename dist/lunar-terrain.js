export const station={x:101,z:0,radius:15};
export const moonRadius=110;
export const lunarTerrainSize=640,lunarTerrainSegments=256;
export function stationSurface(x,z){return Math.hypot(x-station.x,z)<station.radius||(x>=73&&x<=101&&Math.abs(z)<3.8);}
export function seededRandom(seed=71){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const random=seededRandom();
export const craters=Array.from({length:48},()=>({x:(random()-.5)*560,z:(random()-.5)*560,r:7+random()*26,depth:1.1+random()*3.5})).filter(c=>Math.hypot(c.x,c.z)>c.r+22);
export function lunarHeight(x,z){
 const radius=Math.hypot(x,z),flat=Math.min(1,Math.max(0,(radius-17)/20));
 let h=Math.sin(x*.027)*Math.cos(z*.034)*2.8+Math.sin(x*.09+z*.046)*.35;
 h+=Math.exp(-(((radius-144)/22)**2))*(10+Math.sin(Math.atan2(z,x)*7)*3);
 for(const c of craters){const d=Math.hypot(x-c.x,z-c.z)/c.r;if(d<1.45)h+=-c.depth*Math.exp(-d*d*3.6)+c.depth*.42*Math.exp(-(((d-.94)/.17)**2));}
 return h*flat;
}
export function lunarPose(x,z,heading){
 const s=Math.sin(heading),c=Math.cos(heading),h=(a,b)=>lunarSurfaceHeight(x+c*a+s*b,z-s*a+c*b);
 const fl=h(-1.03,-1.06),fr=h(1.03,-1.06),rl=h(-1.03,1.06),rr=h(1.03,1.06);
 return {y:(fl+fr+rl+rr)/4+.08,pitch:Math.atan2((fl+fr-rl-rr)/2,2.12),roll:Math.atan2((fr+rr-fl-rl)/2,2.06)};
}
// Match the actual terrain triangles so wheels do not float above crater rims.
export function lunarSurfaceHeight(x,z){
 const cell=lunarTerrainSize/lunarTerrainSegments,ax=Math.floor((x+lunarTerrainSize/2)/cell)*cell-lunarTerrainSize/2,az=Math.floor((z+lunarTerrainSize/2)/cell)*cell-lunarTerrainSize/2,u=(x-ax)/cell,v=(z-az)/cell;
 const b=lunarHeight(ax,az+cell),d=lunarHeight(ax+cell,az);
 return u+v<=1?lunarHeight(ax,az)*(1-u-v)+b*v+d*u:b*(1-u)+d*(1-v)+lunarHeight(ax+cell,az+cell)*(u+v-1);
}
export const flightDuration=46;
export function flightStage(t){return t<4?'Embarque':t<7?'Ignição':t<19?'Ascensão':t<24?'Além da atmosfera':t<34?'Transferência orbital':t<39?'Descida':t<43?'Pouso':'Desembarque';}
