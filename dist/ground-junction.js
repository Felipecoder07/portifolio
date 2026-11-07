import {routes} from './island-layout.js';

// Exact footprint of the coastal ribbon, including its mitered bends and curb.
// Trails end here instead of drawing another road at almost the same height.
const coast=routes.find(r=>r.id==='coast'),halfWidth=(coast.width+1.1)/2;
const corners=coast.points.map(([x,z],i,points)=>{
 const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
 const il=Math.hypot(x-prev[0],z-prev[1]),ol=Math.hypot(next[0]-x,next[1]-z);
 const ix=(x-prev[0])/il,iz=(z-prev[1])/il,ox=(next[0]-x)/ol,oz=(next[1]-z)/ol;
 const length=Math.hypot(-iz-oz,ix+ox),nx=(-iz-oz)/length,nz=(ix+ox)/length;
 const scale=halfWidth/Math.max(.5,-nx*oz+nz*ox);
 return {x,z,nx:nx*scale,nz:nz*scale};
});
export const coastalFootprints=corners.map((a,i)=>{
 const b=corners[(i+1)%corners.length];
 const polygon=[[a.x-a.nx,a.z-a.nz],[a.x+a.nx,a.z+a.nz],[b.x+b.nx,b.z+b.nz],[b.x-b.nx,b.z-b.nz]];
 const cx=polygon.reduce((s,p)=>s+p[0],0)/4,cz=polygon.reduce((s,p)=>s+p[1],0)/4;
 const planes=polygon.map((p,j)=>{
  const q=polygon[(j+1)%4],length=Math.hypot(q[0]-p[0],q[1]-p[1]);let nx=(q[1]-p[1])/length,nz=-(q[0]-p[0])/length;
  if(nx*(cx-p[0])+nz*(cz-p[1])>0){nx=-nx;nz=-nz;}
  return {nx,nz,d:nx*p[0]+nz*p[1]};
 });
 return {planes};
});
const distance=(p,plane)=>p[0]*plane.nx+p[2]*plane.nz-plane.d;
function clip(poly,plane,outside){
 const result=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a,plane),db=distance(b,plane);
  const keepA=outside?da>=0:da<=0,keepB=outside?db>=0:db<=0;
  if(keepA)result.push(a);
  if(keepA!==keepB){const t=da/(da-db);result.push(a.map((v,k)=>v+(b[k]-v)*t));}
 }
 return result;
}
export function trimTrailJunction(route,positions,indices){
 if(!route.id.startsWith('trail-'))return {positions,indices};
 const output=[],triangles=[];
 for(let i=0;i<indices.length;i+=3){
  let parts=[indices.slice(i,i+3).map(k=>positions.slice(k*3,k*3+3))];
  for(const {planes} of coastalFootprints){
   const remaining=[];
   for(let polygon of parts){
    if(planes.some(plane=>polygon.every(p=>distance(p,plane)>=-1e-9))){remaining.push(polygon);continue;}
    for(const plane of planes){
     if(polygon.length<3)break;
     const outside=clip(polygon,plane,true);if(outside.length>=3)remaining.push(outside);
     polygon=clip(polygon,plane,false);
    }
   }
   parts=remaining;
  }
  for(const poly of parts)for(let j=1;j<poly.length-1;j++){
   const a=poly[0],b=poly[j],c=poly[j+1];
   if(Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))<1e-9)continue;
   const base=output.length/3;output.push(...a,...b,...c);triangles.push(base,base+1,base+2);
  }
 }
 return {positions:output,indices:triangles};
}
