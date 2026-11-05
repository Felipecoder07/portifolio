// Shared by rendering, navigation and ground contact. Coordinates are in metres.
export const palette=Object.freeze({grass:'#91a77c',grassDark:'#748f67',sand:'#daca9e',stone:'#9fa99c',road:'#596e69',curb:'#d9d6bd',water:'#579f9d',wood:'#a77d55',ink:'#29483f',cream:'#f2e8ce'});
export const bridge=Object.freeze({x:33,z:-3,halfWidth:3.9,halfLength:15,height:1.65});
export const tunnel=Object.freeze({x:-43,z:0,halfWidth:4.7,halfLength:9});
export const secret=Object.freeze({x:-31,z:36});
export const routes=[
 {id:'coast',width:7,loop:true,points:[[-43,-20],[-35,-35],[-20,-45],[4,-47],[29,-39],[43,-25],[47,-8],[45,15],[38,32],[15,47],[-15,46],[-37,33],[-43,20],[-43,12],[-43,0],[-43,-12]]},
 {id:'arrival',width:6,points:[[0,4],[0,12],[0,20]]},
 {id:'arenix',width:5,points:[[0,12],[-12,8],[-23,-5],[-36,-7],[-43,-7]]},
 {id:'mapa',width:5,points:[[0,12],[12,6],[21,-8],[25,-10]]},
 {id:'food',width:5,points:[[0,12],[10,4],[9,-13],[-9,-25],[-23,-27],[-35,-35]]},
 {id:'pet',width:5,points:[[0,20],[-14,27],[-25,27],[-37,33]]},
 {id:'orto',width:5,points:[[0,20],[13,25],[24,25],[38,32]]},
 {id:'lost',width:5,points:[[13,25],[17,36],[17,44],[4,44],[0,46]]},
 {id:'bridge',width:7,points:[[43,-25],[33,-18],[33,12],[38,20],[38,32]]},
 {id:'bridge-campus',width:4,points:[[25,-10],[27,-18],[33,-18]]},
 {id:'lookout',width:3,points:[[-37,33],[-31,36]]}
];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function mound(x,z,cx,cz,rx,rz,height){const d=Math.hypot((x-cx)/rx,(z-cz)/rz);return d>=1?0:height*(1-smooth(d));}
export function terrainHeight(x,z){
 const radius=Math.hypot(x,z);
 return mound(x,z,-31,36,10,10,2.1)+mound(x,z,4,-47,11,8,.85)
  -mound(x,z,bridge.x,bridge.z,7.5,12,2.7)-smooth((radius-52)/6)*2.1;
}
export function bridgeHeight(z){return bridge.height*(1-smooth((Math.abs(z-bridge.z)-7)/8));}
export function onBridge(x,z){return Math.abs(x-bridge.x)<=bridge.halfWidth&&Math.abs(z-bridge.z)<=bridge.halfLength;}
export function surfaceHeight(x,z){return onBridge(x,z)?bridgeHeight(z)+.08:terrainHeight(x,z)+.08;}
export function inWater(x,z){return Math.hypot(x,z)>57||surfaceHeight(x,z)<-1.15;}
export function groundPose(x,z,heading){
 const c=Math.cos(heading),s=Math.sin(heading);
 const height=(dx,dz)=>surfaceHeight(x+c*dx+s*dz,z-s*dx+c*dz);
 const fl=height(-1.03,-1.06),fr=height(1.03,-1.06),rl=height(-1.03,1.06),rr=height(1.03,1.06);
 return {y:(fl+fr+rl+rr)/4,pitch:Math.atan2((fl+fr-rl-rr)/2,2.12),roll:Math.atan2((fr+rr-fl-rl)/2,2.06)};
}
export function routeSamples(route,spacing=1){
 const out=[],points=route.loop?[...route.points,route.points[0]]:route.points;
 for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],n=Math.ceil(Math.hypot(bx-ax,bz-az)/spacing);for(let j=0;j<n;j++)out.push({x:ax+(bx-ax)*j/n,z:az+(bz-az)*j/n});}
 const [x,z]=points.at(-1);out.push({x,z});return out;
}
export function distanceToRoute(x,z,route){
 let best=Infinity;const points=route.loop?[...route.points,route.points[0]]:route.points;
 for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;
}
export function nearRoad(x,z,margin=2){return routes.some(r=>distanceToRoute(x,z,r)<r.width/2+margin);}
export function buildingColliders(projects){return projects.filter(p=>p.id!=='arenix').map(p=>p.id==='pet'?{x:p.x,z:p.z,radius:2.3}:{x:p.x,z:p.z-1,hx:p.id==='lost'?3:p.id==='mapa'?4.5:4,hz:p.id==='lost'?2.5:3});}
export function infrastructureColliders(){return [
 // Garage sides and rear; the 8 m opening and centre bay are driveable.
 {x:-6.1,z:0,hx:.35,hz:4.5},{x:6.1,z:0,hx:.35,hz:4.5},{x:0,z:-4.3,hx:6.4,hz:.25},
 {x:-5,z:4,hx:1.1,hz:.3},{x:5,z:4,hx:1.1,hz:.3},
 // Bridge rails start/end flush with ramps, not across the road.
 {x:bridge.x-4,z:bridge.z,hx:.15,hz:14},{x:bridge.x+4,z:bridge.z,hx:.15,hz:14},
 {x:tunnel.x-5.85,z:0,hx:1.15,hz:9},{x:tunnel.x+5.85,z:0,hx:1.15,hz:9},
 ];}
