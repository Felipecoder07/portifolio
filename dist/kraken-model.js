import * as T from './three.js';

// Smooth tapered arms share one dynamic mesh; suction cups are instanced.
export function createKrakenModel(scene){
 const root=new T.Group();root.name='kraken';root.visible=false;scene.add(root);
 const body=new T.Group();body.name='kraken-body';root.add(body);
 const skin=new T.MeshStandardMaterial({color:'#694451',roughness:.36,metalness:.04});
 function ellipsoid(radius,color,x,y,z,sx=1,sy=1,sz=1){const mesh=new T.Mesh(new T.SphereGeometry(radius,32,24),new T.MeshStandardMaterial({color,roughness:.32}));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);body.add(mesh);return mesh;}
 const mantle=ellipsoid(3.1,'#704957',0,3.5,1.1,1.05,1.6,.95);
 const position=mantle.geometry.attributes.position,colors=[];
 const dark=new T.Color('#463547'),light=new T.Color('#936270'),color=new T.Color();
 for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);const ripple=Math.sin(x*6+y*3)*Math.sin(z*5-y*2);position.setX(i,x*(1+ripple*.018));color.copy(dark).lerp(light,.45+.16*ripple+.12*y/3.1);colors.push(color.r,color.g,color.b);}
 mantle.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mantle.geometry.computeVertexNormals();mantle.material.color.set('#ffffff');mantle.material.vertexColors=true;
 ellipsoid(2.5,'#694451',0,1.4,-.45,1.12,.85,1.08);
 for(const side of [-1,1]){
  ellipsoid(.92,'#44313d',side*1.8,2.35,-2.1,1.1,.8,.7);
  const eye=ellipsoid(.65,'#cba557',side*1.8,2.35,-2.6,1,.72,.5);eye.material.roughness=.12;
  ellipsoid(.4,'#101d20',side*1.8,2.35,-2.88,.22,1,.2);
  ellipsoid(.09,'#f4ecce',side*1.8-.14,2.52,-2.97,1,1,.4);
  const brow=ellipsoid(.95,'#694451',side*1.8,2.91,-2.35,1,.24,.5);brow.rotation.z=-side*.16;
 }
 const beak=new T.Mesh(new T.ConeGeometry(.55,1.2,12),new T.MeshStandardMaterial({color:'#282432',roughness:.25}));beak.position.set(0,.45,-2);beak.rotation.x=-.6;body.add(beak);
 const arms=8,segments=36,sides=10,stride=sides+1,count=arms*(segments+1)*stride;
 const coords=new Float32Array(count*3),normals=new Float32Array(count*3),indices=[];
 for(let a=0;a<arms;a++)for(let j=0;j<segments;j++)for(let k=0;k<sides;k++){const n=a*(segments+1)*stride+j*stride+k;indices.push(n,n+1,n+stride,n+1,n+stride+1,n+stride);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(coords,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));geometry.setIndex(indices);
 const tubes=new T.Mesh(geometry,skin);tubes.name='kraken-tentacles';tubes.frustumCulled=false;root.add(tubes);
 const cupCount=arms*15*2;
 const cups=new T.InstancedMesh(new T.TorusGeometry(1,.3,6,10),new T.MeshStandardMaterial({color:'#bb8b91',roughness:.5}),cupCount);cups.name='kraken-suckers';cups.instanceMatrix.setUsage(T.DynamicDrawUsage);cups.frustumCulled=false;root.add(cups);
 const curve=new T.CatmullRomCurve3(Array.from({length:6},()=>new T.Vector3())),point=new T.Vector3(),tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),axis=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1),dummy=new T.Object3D(),out=new T.Vector3();
 function frame(t){curve.getPoint(t,point);curve.getTangent(t,tangent);normal.crossVectors(tangent,axis);if(normal.lengthSq()<.001)normal.crossVectors(tangent,forward);normal.normalize();binormal.crossVectors(tangent,normal).normalize();}
 function update(time,grip,reduced=false){
  const motion=reduced?0:1;
  body.position.set(Math.sin(time*.83)*.35*motion,Math.sin(time*1.1)*.3*motion,Math.cos(time*.71)*.22*motion);
  body.rotation.set(Math.sin(time*.69)*.045*motion,Math.sin(time*.57)*.1*motion,Math.sin(time*.91)*.06*motion);
  const breath=Math.sin(time*1.65)*.025*motion;mantle.scale.set(1.05*(1-breath*.5),1.6*(1+breath),.95*(1-breath*.5));
  for(let a=0;a<arms;a++){
   if(a===0){curve.points[0].set(1.6,.5,-.4);curve.points[1].set(4,3,-2);curve.points[2].set(3,Math.max(4,grip.y+1),grip.z-1.5);curve.points[3].set(1.3,grip.y-.3,grip.z-1);curve.points[4].set(-1.2,grip.y,grip.z);curve.points[5].set(-.8,grip.y+.9,grip.z+.9);}
   else{
    const angle=a/arms*Math.PI*2,phase=time*(.85+a*.11)+a*1.73;
    curve.points.forEach((p,i)=>{
     const travel=phase-i*.85,weight=i/5;
     const r=[2,4.1,6.7,8.2,8.8,8][i]+Math.sin(travel)*1.2*weight*motion;
     const height=[.5,.9,2.4,4.6,5.7,5.9][i]+Math.cos(travel*.92)*1.5*weight*motion;
     const twist=angle+(i>2?(i-2)*.16:0)+Math.sin(travel*.7)*.2*weight*motion;
     p.set(Math.sin(twist)*r,height,Math.cos(twist)*r);
    });
   }
   // The gripping arm also undulates, while its end stays wrapped around the boat.
   if(a===0)for(let i=0;i<3;i++){curve.points[i].x+=Math.sin(time*1.8-i)*.45*motion;curve.points[i].y+=Math.cos(time*1.3-i)*.3*motion;}
   curve.points[0].add(body.position);
   for(let j=0;j<=segments;j++){
    const t=j/segments,r=.95*(1-t)**1.15+.07;frame(t);
    for(let k=0;k<=sides;k++){
     const angle=k/sides*Math.PI*2;out.copy(normal).multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle));
     const n=(a*(segments+1)*stride+j*stride+k)*3;coords[n]=point.x+out.x*r;coords[n+1]=point.y+out.y*r;coords[n+2]=point.z+out.z*r;normals[n]=out.x;normals[n+1]=out.y;normals[n+2]=out.z;
    }
   }
   for(let j=0;j<15;j++)for(let row=0;row<2;row++){
    const t=.12+j*.052,r=.95*(1-t)**1.15+.07;frame(t);
    out.copy(binormal).multiplyScalar(.9).addScaledVector(normal,row?.4:-.4).normalize();
    dummy.position.copy(point).addScaledVector(out,r);dummy.quaternion.setFromUnitVectors(forward,out);dummy.scale.setScalar(r*.3);dummy.updateMatrix();cups.setMatrixAt((a*15+j)*2+row,dummy.matrix);
   }
  }
  geometry.attributes.position.needsUpdate=geometry.attributes.normal.needsUpdate=true;cups.instanceMatrix.needsUpdate=true;
 }
 return {root,update};
}
