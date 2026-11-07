import * as T from './three.js';
import {box,cylinder,sphere,sign,material,location} from './models.js';
import {batchRigidMeshes} from './render-optimization.js';
import {secrets} from './secrets.js';
import {createAmbientLife} from './ambient-life.js';
import {createOcean} from './ocean.js';
import {trimTrailJunction} from './ground-junction.js';
import {palette as P,routes,bridge,tunnel,secret,terrainHeight,surfaceHeight,bridgeHeight,nearRoad,routeSamples,buildingColliders,infrastructureColliders} from './island-layout.js';

export function createScenery(scene,projects){
 const ambient=createAmbientLife(scene,projects);
 const root=new T.Group();root.name='Ilha do Desenvolvedor';scene.add(root);
 const obstacles=[...buildingColliders(projects),...infrastructureColliders()],occluders=[],animated=[],fixtures=[];
 let seed=71;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const glow=new T.MeshStandardMaterial({color:'#fff0c3',emissive:'#ffd396',emissiveIntensity:.08,roughness:.65});fixtures.push(glow);
 const wood=new T.MeshStandardMaterial({color:P.wood,roughness:.95,side:T.DoubleSide});
 function group(x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);root.add(g);return g;}
 function colliderBox(x,z,hx,hz){obstacles.push({x,z,hx,hz});}
 function bench(g,x,z,rotation=0){const b=new T.Group();g.add(b);b.position.set(x,0,z);b.rotation.y=rotation;for(const dx of [-.8,.8])box(b,.12,.65,.75,P.ink,dx,.33,0);for(const dz of [-.25,0,.25])box(b,2.2,.12,.2,P.wood,0,.7,dz);box(b,2.2,.4,.12,P.wood,0,1.07,-.35);return b;}
 function fixture(g,x,y,z){const m=box(g,.9,.12,.4,P.cream,x,y,z);m.material=glow;return m;}
 function roof(g,width,depth,y,color){const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(0,1.2);shape.lineTo(width/2,0);shape.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),material(color));mesh.position.set(0,y,-depth/2);mesh.castShadow=true;g.add(mesh);return mesh;}

 // A single vertex-coloured terrain mesh carries grass, beach and the lagoon basin.
 const positions=[],colors=[],indices=[],rings=184,sectors=320;
 const grass=new T.Color(P.grass),sand=new T.Color(P.sand),wet=new T.Color('#a4b5a0'),shade=new T.Color(P.grassDark);
 for(let r=0;r<=rings;r++)for(let a=0;a<=sectors;a++){
  const radius=82*r/rings,angle=a/sectors*Math.PI*2,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,y=terrainHeight(x,z);
  positions.push(x,y,z);const color=grass.clone().lerp(shade,(Math.sin(x*.17)*Math.cos(z*.13)+1)*.08);
  color.lerp(sand,T.MathUtils.smoothstep(radius,73,79));if(y<-.2)color.lerp(sand,T.MathUtils.smoothstep(-y,.2,1));if(y<-1.2)color.lerp(wet,.65);colors.push(color.r,color.g,color.b);
  if(r<rings&&a<sectors){const i=r*(sectors+1)+a;indices.push(i,i+1,i+sectors+1,i+1,i+sectors+2,i+sectors+1);}
 }
 // Refine only the banks around the underpass so its new curves match ground contact.
 const refined=[],midpoints=new Map();
 function midpoint(a,b){
  const key=a<b?`${a}:${b}`:`${b}:${a}`;if(midpoints.has(key))return midpoints.get(key);
  const x=(positions[a*3]+positions[b*3])/2,z=(positions[a*3+2]+positions[b*3+2])/2,id=positions.length/3;
  positions.push(x,terrainHeight(x,z),z);for(let k=0;k<3;k++)colors.push((colors[a*3+k]+colors[b*3+k])/2);
  midpoints.set(key,id);return id;
 }
 for(let i=0;i<indices.length;i+=3){
  const [a,b,c]=indices.slice(i,i+3),x=(positions[a*3]+positions[b*3]+positions[c*3])/3,z=(positions[a*3+2]+positions[b*3+2]+positions[c*3+2])/3;
  if((Math.abs(x-bridge.x)<9&&Math.abs(z-bridge.z)<14)||(x>72&&Math.abs(z)<12)){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);if(x>72){for(const [u,v,w] of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]){const uv=midpoint(u,v),vw=midpoint(v,w),wu=midpoint(w,u);refined.push(u,uv,wu,uv,v,vw,wu,vw,w,uv,vw,wu);}}else refined.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}else refined.push(a,b,c);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(refined);geometry.computeVertexNormals();
 const terrain=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));terrain.receiveShadow=true;terrain.name='terrain';root.add(terrain);
 cylinder(root,81.9,83.5,3.4,'#b7a17d',0,-3.8,0,96);
 const ocean=createOcean(root);const {water,shore}=ocean;

 // Roads follow the same height function used by the car; edges are wider stone ribbons.
 const routeLines=routes.map(route=>({...route,samples:routeSamples(route,.8)}));
 function ribbon(route,width,mat,offset){
  // Sample across the width too: two edge vertices bridge over hills and slice
  // through other ribbons at junctions. Small cells track the terrain instead.
  const pos=[],idx=[],samples=[],columns=Math.ceil(width/.5),stride=columns+1;
  // Miter joins belong at route corners, not at every short sample. Otherwise
  // the outside edge folds back over itself in a sharp bend.
  const corners=route.points.map(([x,z],i,points)=>{
   const prev=points[i===0?(route.loop?points.length-1:0):i-1],next=points[i===points.length-1?(route.loop?0:i):i+1];
   const incoming=new T.Vector2(x-prev[0],z-prev[1]),outgoing=new T.Vector2(next[0]-x,next[1]-z);
   if(incoming.lengthSq()===0)incoming.copy(outgoing);
   if(outgoing.lengthSq()===0)outgoing.copy(incoming);
   incoming.normalize();outgoing.normalize();
   const normal=new T.Vector2(-incoming.y-outgoing.y,incoming.x+outgoing.x).normalize();
   const scale=1/Math.max(.5,normal.dot(new T.Vector2(-outgoing.y,outgoing.x)));
   return {x,z,nx:normal.x*scale,nz:normal.y*scale};
  });
  const points=route.loop?[...corners,corners[0]]:corners;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.5);
   for(let j=0;j<count;j++){const t=j/count;samples.push({x:T.MathUtils.lerp(a.x,b.x,t),z:T.MathUtils.lerp(a.z,b.z,t),nx:T.MathUtils.lerp(a.nx,b.nx,t),nz:T.MathUtils.lerp(a.nz,b.nz,t)});}
  }
  samples.push(points.at(-1));
  for(let i=0;i<samples.length;i++){
   const p=samples[i],{nx,nz}=p;
   for(let column=0;column<=columns;column++){const side=column/columns*2-1,x=p.x+nx*width*.5*side,z=p.z+nz*width*.5*side;
    const h=route.id==='bridge'&&Math.abs(z-bridge.z)<=15&&Math.abs(x-bridge.x)<4.6?bridgeHeight(z):terrainHeight(x,z);
    pos.push(x,h+offset,z);
   }
   if(i<samples.length-1)for(let column=0;column<columns;column++){const k=i*stride+column;idx.push(k,k+1,k+stride,k+1,k+stride+1,k+stride);}
  }
  const trimmed=trimTrailJunction(route,pos,idx);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(trimmed.positions,3));geo.setIndex(trimmed.indices);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,mat);mesh.name=`${offset>.06?'road':'curb'}-${route.id}`;mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 const roadMaterial=new T.MeshStandardMaterial({color:P.road,roughness:.97,side:T.DoubleSide});
 const edgeMaterial=new T.MeshStandardMaterial({color:P.curb,roughness:.95,side:T.DoubleSide});
 // Draw all borders before pavement; each route gets a tiny depth bias to
 // resolve coincident junction surfaces without physically raising the roads.
 routeLines.forEach((route,i)=>{
  const edge=edgeMaterial.clone(),pavement=(route.id==='lookout'?wood:roadMaterial).clone();
  if(route.id.startsWith('trail-')){edge.color.set('#91a77c');pavement.color.set('#b6a17c');}
  for(const [layer,mat] of [edge,pavement].entries()){
   mat.polygonOffset=true;
   // A slope-aware offset remains stable in the distant, oblique intro view.
   // Pavement must also win over the wider curb at every road junction.
   mat.polygonOffsetFactor=-(layer+1);mat.polygonOffsetUnits=-(layer*routeLines.length+i+1);
  }
  ribbon(route,route.width+1.1,edge,.04).renderOrder=1;
  ribbon(route,route.width,pavement,.085).renderOrder=2;
 });
 edgeMaterial.dispose();roadMaterial.dispose();wood.dispose();
 const coastal=routeLines.find(r=>r.id==='coast'),dashes=coastal.samples.filter((_,i)=>i%5===0);
 const markings=new T.InstancedMesh(new T.BoxGeometry(.13,.015,1.1),material('#e7dbb4'),dashes.length),dummy=new T.Object3D();
 dashes.forEach((p,i)=>{const next=coastal.samples[(i*5+1)%coastal.samples.length];dummy.position.set(p.x,surfaceHeight(p.x,p.z)+.015,p.z);dummy.rotation.set(0,Math.atan2(next.x-p.x,next.z-p.z),0);dummy.scale.set(1,1,1);dummy.updateMatrix();markings.setMatrixAt(i,dummy.matrix);});root.add(markings);

 // Compact resting area beside the garage, clear of every driving lane.
 const plaza=group(-12,0,-6);plaza.name='side-plaza';
 cylinder(plaza,3.6,3.6,.1,P.curb,0,.025,0,48);cylinder(plaza,3.3,3.3,.045,'#d8cbb0',0,.085,0,48);
 const garage=group();garage.name='garage';occluders.push(garage);
 box(garage,13,.15,9.5,'#c5bc9f',0,.02,0);
 for(const x of [-6.1,6.1]){box(garage,.7,4.2,9,'#d8c5a2',x,2.1,0);box(garage,.8,.5,9.2,P.ink,x,.3,0);}
 box(garage,12.8,4.2,.5,'#d8c5a2',0,2.1,-4.3);
 for(const x of [-5,5])box(garage,2.2,4.2,.6,P.ink,x,2.1,4);
 box(garage,8,1,.6,P.ink,0,3.8,4);roof(garage,14,10,4.2,'#49685e');
 sign(garage,'FELIPE / GARAGEM',8.5,.82,0,4.25,4.35,P.ink,P.cream);
 sign(garage,'BUILD • DRIVE • EXPLORE',4.5,.5,0,2.8,-3.98,P.ink,P.cream);
 for(const x of [-2.4,2.4]){box(garage,.07,.015,6.6,'#efe4bc',x,.115,.6);fixture(garage,x,3.2,3.7);}
 box(garage,3.4,.8,1,'#a77d55',-3.6,.4,-3.3);colliderBox(-3.6,-3.3,1.7,.5);
 for(const x of [-4.6,-3.6,-2.6])box(garage,.55,.55,.5,'#57786b',x,1.08,-3.3);
 const board=box(garage,3.7,1.5,.1,P.ink,-3.6,2,-4);for(let i=0;i<5;i++)box(garage,.05,.65,.07,'#baa983',-4.9+i*.6,2,-3.9);
 sign(plaza,'ILHA DO DESENVOLVEDOR',5.6,.65,0,2.6,-1.7,P.ink,P.cream);
 for(const x of [-2.5,2.5]){cylinder(plaza,.08,.1,2.8,P.ink,x,1.4,-1.7,8);colliderBox(plaza.position.x+x,plaza.position.z-1.7,.1,.1);}
 for(const x of [-1.8,1.8]){bench(plaza,x,1.5);colliderBox(plaza.position.x+x,plaza.position.z+1.5,1.1,.45);}

 // Paved bridge over timber supports; keep the beams below the ramp surface.
 const bridgeGroup=group();bridgeGroup.name='bridge';occluders.push(bridgeGroup);
 for(let z=-17;z<12;z+=.8){const h=bridgeHeight(z),beam=box(bridgeGroup,7.7,.14,.68,'#b08b60',33,h-.14,z);beam.rotation.x=-Math.atan2(bridgeHeight(z+.34)-bridgeHeight(z-.34),.68);}
 for(const x of [29,37])for(let z=-17;z<=11;z+=2){const h=bridgeHeight(z);box(bridgeGroup,.25,1.15,.25,P.ink,x,h+.52,z);if(z<11){const next=bridgeHeight(z+2),rail=box(bridgeGroup,.13,.15,Math.hypot(2,next-h),P.ink,x,(h+next)/2+1,z+1);rail.rotation.x=-Math.atan2(next-h,2);}}
 for(const z of [-9,3])for(const x of [30,36]){const bottom=terrainHeight(x,z)-.3,top=bridgeHeight(z)-.2;box(bridgeGroup,.6,top-bottom,.6,P.ink,x,(top+bottom)/2,z);}
 for(const z of [-18,12]){sign(bridgeGroup,'PONTE DOS COMMITS',4.5,.55,33,3,z,z<0?P.ink:P.wood,P.cream);}

 // Extruded stone arch: the opening is geometry, not a painted tunnel entrance.
 const tunnelGroup=group(tunnel.x,0,0);tunnelGroup.name='tunnel';occluders.push(tunnelGroup);
 const arch=new T.Shape();arch.moveTo(-7,0);
 for(let i=0;i<=32;i++){const a=Math.PI-i/32*Math.PI;arch.lineTo(Math.cos(a)*7,Math.sin(a)*7);}
 arch.lineTo(4.7,0);for(let i=0;i<=32;i++){const a=i/32*Math.PI;arch.lineTo(Math.cos(a)*4.7,Math.sin(a)*4.7);}arch.closePath();
 const archMesh=new T.Mesh(new T.ExtrudeGeometry(arch,{depth:18,bevelEnabled:false}),material('#869489'));archMesh.position.z=-9;archMesh.castShadow=archMesh.receiveShadow=true;tunnelGroup.add(archMesh);
 for(const z of [-9.1,9.1]){const rim=new T.Mesh(new T.TorusGeometry(5.85,1.17,4,32,Math.PI),material('#bdc4ae'));rim.position.set(0,0,z);tunnelGroup.add(rim);sign(tunnelGroup,'TÚNEL / OFFLINE',5,.6,0,6.25,z+.1,P.ink,P.cream);}
 for(const z of [-6,0,6])fixture(tunnelGroup,0,4.35,z);
 for(const side of [-1,1])for(let i=0;i<5;i++){const rock=sphere(tunnelGroup,1.8,'#7d9180',side*(6.4+random()),.6,-7+i*3.5,1,.7,1.2);rock.rotation.y=random()*3;}

 // Project-specific architectural accents, landscaping and readable district signs.
 for(const p of projects){
  const g=location(root,p,animated);g.name='district-'+p.id;occluders.push(g);
  if(p.id==='mapa'){
   const r=roof(g,10.4,7.3,5.45,'#a87856');r.position.z=-4.65;
   for(const x of [-6,6]){box(g,.45,3.7,.45,P.cream,x,1.85,1);box(g,.45,3.7,.45,P.cream,x,1.85,-3);colliderBox(p.x+x,p.z+1,.23,.23);colliderBox(p.x+x,p.z-3,.23,.23);}
   for(const x of [-5.4,5.4])box(g,2, .2,5.5,P.wood,x,3.75,-1);
  }else if(p.id==='arenix'){
   for(const x of [-6.3,6.3]){box(g,.3,4.7,.3,P.ink,x,2.35,-4);colliderBox(p.x+x,p.z-4,.15,.15);}
   const canopy=box(g,14,.2,3.2,'#e5d5ad',0,4.7,-4.4);canopy.rotation.x=-.12;
   for(const x of [-5,5])sign(g,'07',1.1,1.1,x,2.8,-4.15,P.ink,P.cream);
  }else if(p.id==='orto'){
   for(const x of [-2.6,0,2.6]){const solar=box(g,2,.07,2.6,'#375b67',x,4.87,-1);solar.rotation.x=-.16;}
   box(g,1.7,.08,2,'#cdd9d1',0,.37,4.2);
  }else if(p.id==='food'){
   cylinder(g,.35,.4,1.7,'#6b8074',2.5,5.2,-2.5,12);cylinder(g,.5,.5,.12,P.cream,2.5,6.1,-2.5,12);
   sign(g,'CAFÉ + CÓDIGO',3.6,.45,0,2.6,4.22,P.cream,P.ink);
  }else if(p.id==='pet'){
   for(const x of [-5.5,5.5]){cylinder(g,.12,.17,3.8,P.ink,x,1.9,0,8);fixture(g,x,3.9,0);colliderBox(p.x+x,p.z,.17,.17);}
  }else{
   box(g,2,1.8,.5,'#738f7b',-4.5,1.2,-2);sign(g,'DEVOLUÇÕES',1.7,.35,-4.5,2.4,-1.72,P.ink,P.cream);colliderBox(p.x-4.5,p.z-2,1,.25);
  }
  fixture(g,0,3.1,p.id==='lost'?1.8:2.3);
  for(const side of [-1,1]){
   const x=p.x+side*8.5,z=p.z+5.5;
   box(root,1.7,.6,1.5,'#bdb496',x,.3,z);sphere(root,.8,p.color,x,.9,z,1,.65,1);colliderBox(x,z,.85,.75);
  }
 }

 // Small lookout hidden behind the southwest grove, reached by a narrow spur.
 const lookout=group(secret.x,terrainHeight(secret.x,secret.z),secret.z);lookout.name='secret-lookout';occluders.push(lookout);
 cylinder(lookout,3.6,3.8,.18,P.wood,0,.08,0,32);bench(lookout,0,2.5);colliderBox(secret.x,secret.z+2.5,1.1,.45);
 cylinder(lookout,.12,.15,2.7,P.ink,-2,1.35,-1,10);const telescope=cylinder(lookout,.27,.35,1.8,P.cream,-2,2.6,-1,16);telescope.rotation.x=.9;
 obstacles.push({x:secret.x-2,z:secret.z-1,radius:.45});sign(lookout,'git checkout horizonte',3.2,.5,0,1,-2.5,P.ink,P.cream);

 // Vegetation is decorative only: no colliders, so the car can cross the groves.
 // Keep clusters clear of road corridors for visibility.
 const plants=[];
 for(let i=0;i<1600;i++){
  const a=random()*Math.PI*2,r=13+random()*63,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(nearRoad(x,z,2.3)||Math.abs(x)<12&&z>-8&&z<22||projects.some(p=>Math.abs(p.x-x)<11&&Math.abs(p.z-z)<14)||Math.hypot(x-secret.x,z-secret.z)<5||Math.abs(x+43)<9&&Math.abs(z)<14||Math.abs(x-33)<10&&Math.abs(z+3)<19||terrainHeight(x,z)<-.2)continue;
  if(plants.some(p=>Math.hypot(x-p.x,z-p.z)<2.7))continue;
  if(secrets.some(s=>Math.hypot(x-s.x,z-s.z)<8.5)||Math.hypot(x-plaza.position.x,z-plaza.position.z)<4.8)continue;
  plants.push({x,z,s:.65+random()*.5});if(plants.length===170)break;
 }
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.13,.23,2.3,7),material('#897350'),plants.length);
 const crowns=new T.InstancedMesh(new T.IcosahedronGeometry(1.5,1),material(P.grassDark),plants.length);
 const tips=new T.InstancedMesh(new T.IcosahedronGeometry(1.1,1),material('#a9bb82'),plants.length);
 [trunks,crowns,tips].forEach(m=>{m.castShadow=true;m.receiveShadow=true;root.add(m);});
 plants.forEach((p,i)=>{
  const y=terrainHeight(p.x,p.z);p.y=y;dummy.rotation.set(0,i*.7,0);dummy.scale.setScalar(p.s);
  dummy.position.set(p.x,y+1.15*p.s,p.z);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.y=y+2.9*p.s;dummy.scale.set(p.s,p.s*.9,p.s);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
  dummy.position.set(p.x+.5*p.s,y+3.5*p.s,p.z+.1);dummy.scale.setScalar(p.s);dummy.updateMatrix();tips.setMatrixAt(i,dummy.matrix);
 });
 const treeMeshes=[trunks,crowns,tips];
 const treeBases=treeMeshes.map(mesh=>plants.map((_,i)=>{const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);return matrix;}));
 const falling=new Set(),pivot=new T.Matrix4(),rotation=new T.Matrix4(),inversePivot=new T.Matrix4(),fallenMatrix=new T.Matrix4();
 function placeFallenTree(i,angle){
  const p=plants[i];pivot.makeTranslation(p.x,p.y,p.z);
  rotation.makeRotationAxis(p.axis,angle);
  inversePivot.makeTranslation(-p.x,-p.y,-p.z);
  pivot.multiply(rotation).multiply(inversePivot);
  treeMeshes.forEach((mesh,j)=>{fallenMatrix.multiplyMatrices(pivot,treeBases[j][i]);mesh.setMatrixAt(i,fallenMatrix);mesh.instanceMatrix.needsUpdate=true;});
 }
 function hitTrees(x,z,vx,vz,reduced=false){
  const speed=Math.hypot(vx,vz);if(speed<3)return 0;
  let hits=0;
  for(let i=0;i<plants.length;i++){
   const p=plants[i];if(p.fallen||Math.hypot(x-p.x,z-p.z)>1.4+.2*p.s)continue;
   p.fallen=true;p.fallTime=0;p.axis=new T.Vector3(vz,0,-vx).normalize();
   if(reduced)placeFallenTree(i,1.45);else falling.add(i);
   hits++;
  }
  return hits;
 }
 // Instanced shoreline stones, never inside the road network.
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material('#aab5a3'),65);
 for(let i=0;i<65;i++){const a=i/65*Math.PI*2,r=79.1+random();dummy.position.set(Math.cos(a)*r,terrainHeight(Math.cos(a)*r,Math.sin(a)*r)+.1,Math.sin(a)*r);dummy.rotation.set(random(),random()*3,random());dummy.scale.set(.4+random()*.5,.25+random()*.3,.5+random()*.6);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;root.add(rocks);

 // Road lamps share one emissive material; three local lights illuminate key interiors.
 for(let i=0;i<coastal.samples.length;i+=28){const p=coastal.samples[i],n=coastal.samples[(i+1)%coastal.samples.length],a=Math.atan2(n.x-p.x,n.z-p.z),x=p.x+Math.cos(a)*5,z=p.z-Math.sin(a)*5;if(Math.hypot(x,z)>53||Math.abs(x+43)<8&&Math.abs(z)<13||nearRoad(x,z,.6))continue;
  const g=group(x,terrainHeight(x,z),z);cylinder(g,.07,.13,4.5,P.ink,0,2.25,0,8);box(g,1,.12,.12,P.ink,.4,4.4,0);fixture(g,.8,4.3,0);obstacles.push({x,z,radius:.13});
 }
 // Keep occluders individually addressable by the camera. Only rigid decoration
 // outside those groups is batched; scenery transforms are otherwise immutable.
 const moving=new Set([...animated.map(a=>a.mesh),water,shore]);
 const protectedGroups=new Set(occluders);
 function batchDecoration(group){if(protectedGroups.has(group))return;for(const child of [...group.children])if(child.isGroup)batchDecoration(child);batchRigidMeshes(group,{exclude:moving});}
 batchDecoration(root);
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(!moving.has(o)){o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;}});
 let previousTreeTime=0;
 function update(time,reduced=false,carPosition=null,driver=null){
  ambient.update(time,reduced);
  const dt=Math.max(0,Math.min(time-previousTreeTime,.1));previousTreeTime=time;
  for(const i of falling){
   const p=plants[i];p.fallTime=Math.min(.48,p.fallTime+dt);
   const progress=reduced?1:p.fallTime/.48;
   placeFallenTree(i,1.45*(1-(1-progress)**3));
   if(progress>=1)falling.delete(i);
  }
  ocean.update(time,reduced,carPosition,driver);
  if(reduced)return;
   for(const a of animated)a.mesh.rotation.y=Math.sin(time*1.8+a.phase)*.075;
 }
 return {root,obstacles,occluders,fixtures,routeLines,plants,hitTrees,update,secret};
}
