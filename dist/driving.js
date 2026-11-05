// Metres, seconds and radians. Simulation runs at a fixed 120 Hz.
export const tuning = Object.freeze({acceleration:23, forward:24, reverse:10, brake:36, steering:.75, response:12, wheelbase:2.12, grip:12, driftGrip:2.4, radius:1.15, step:1/120});
export function createDriver(x=0,z=12){return {x,z,vx:0,vz:0,heading:0,steer:0,speed:0,acceleration:0};}
export function stepDriver(c,input,obstacles,dt=tuning.step){
 const t=tuning, fx=-Math.sin(c.heading),fz=-Math.cos(c.heading),rx=Math.cos(c.heading),rz=-Math.sin(c.heading);
 let forward=c.vx*fx+c.vz*fz,lateral=c.vx*rx+c.vz*rz;const before=forward;
 const opposing=input.throttle*forward<-.2;
 forward+=input.throttle*(opposing?t.brake:t.acceleration)*dt;
 if(opposing&&before*forward<0)forward=0;
 forward*=Math.exp(-(input.throttle?.22:1.1)*dt);
 if(input.handbrake)forward*=Math.exp(-2.4*dt);
 forward=Math.max(-t.reverse,Math.min(t.forward,forward));
 c.steer+=(input.turn*t.steering/(1+Math.abs(forward)*.065)-c.steer)*(1-Math.exp(-t.response*dt));
 c.heading+=Math.tan(c.steer)*forward/t.wheelbase*dt*(input.handbrake?1.15:1);
 lateral*=Math.exp(-(input.handbrake?t.driftGrip:t.grip)*dt);
 // Retain world-space inertia while the body turns; grip aligns velocity gradually.
 const grip=1-Math.exp(-(input.handbrake?t.driftGrip:t.grip)*dt);
 const targetX=(fx*forward+rx*lateral)*(1-grip)+(-Math.sin(c.heading)*forward+Math.cos(c.heading)*lateral)*grip;
 const targetZ=(fz*forward+rz*lateral)*(1-grip)+(-Math.cos(c.heading)*forward-Math.sin(c.heading)*lateral)*grip;
 const blend=1;
 c.vx+=(targetX-c.vx)*blend;c.vz+=(targetZ-c.vz)*blend;
 c.x+=c.vx*dt;c.z+=c.vz*dt;
 for(const o of obstacles){
  let nx,nz,depth;
  if(o.radius){const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz);depth=t.radius+o.radius-d;nx=d?dx/d:1;nz=d?dz/d:0;}
  else {const qx=Math.max(o.x-o.hx,Math.min(o.x+o.hx,c.x)),qz=Math.max(o.z-o.hz,Math.min(o.z+o.hz,c.z));const dx=c.x-qx,dz=c.z-qz,d=Math.hypot(dx,dz);depth=t.radius-d;if(d){nx=dx/d;nz=dz/d;}else{const ax=o.hx-Math.abs(c.x-o.x),az=o.hz-Math.abs(c.z-o.z);nx=ax<az?(Math.sign(c.x-o.x)||1):0;nz=ax<az?0:(Math.sign(c.z-o.z)||1);depth=t.radius+Math.min(ax,az);}}
  if(depth>0){c.x+=nx*depth;c.z+=nz*depth;const inward=c.vx*nx+c.vz*nz;if(inward<0){c.vx-=inward*nx;c.vz-=inward*nz;}}
 }
 c.speed=-Math.sin(c.heading)*c.vx-Math.cos(c.heading)*c.vz;c.acceleration=(c.speed-before)/dt;
 return Math.hypot(c.x,c.z)<57;
}
