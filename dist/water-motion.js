// Match the ocean vertex shader, in world coordinates (plane Y maps to world -Z).
export function waterHeight(x,z,time){
 return -1.35+.10*Math.sin((x-.4*z)/Math.hypot(1,.4)*.21-time*.9)
  +.055*Math.sin((-.5*x-z)/Math.hypot(.5,1)*.33-time*1.15)
  +.025*Math.sin((.7*x+.8*z)/Math.hypot(.7,.8)*.65-time*1.6);
}
export function boatPose(d,time,reduced=false){
 if(reduced)return {y:-1.15,pitch:0,roll:0};
 const fx=-Math.sin(d.heading),fz=-Math.cos(d.heading),rx=Math.cos(d.heading),rz=-Math.sin(d.heading);
 const front=waterHeight(d.x+fx*1.6,d.z+fz*1.6,time),rear=waterHeight(d.x-fx*1.6,d.z-fz*1.6,time);
 const left=waterHeight(d.x-rx,d.z-rz,time),right=waterHeight(d.x+rx,d.z+rz,time);
 return {y:(front+rear)*.5+.2,pitch:Math.atan2(front-rear,3.2),roll:Math.atan2(right-left,2)};
}
