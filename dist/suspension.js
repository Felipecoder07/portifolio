// Damped visual springs, independent of the rendering frame rate.
export function spring(value=0){return {value,velocity:0};}
export function advanceSpring(s,target,dt,frequency=9){
 const offset=s.value-target, j=s.velocity+frequency*offset, decay=Math.exp(-frequency*dt);
 s.value=target+(offset+j*dt)*decay;
 s.velocity=(s.velocity-frequency*j*dt)*decay;
 return s.value;
}
export function wheelSteering(steer,x,wheelbase=2.12){
 if(Math.abs(steer)<.0001)return 0;
 const radius=wheelbase/Math.tan(Math.abs(steer));
 return Math.sign(steer)*Math.atan(wheelbase/(radius+Math.sign(steer)*x));
}
