import * as T from './three.js';

// Merge rigid, opaque siblings only. Wheels and suspension keep their own
// moving parents; transparent glass and individually animated parts stay separate.
export function batchRigidMeshes(parent,{exclude=new Set()}={}){
 const groups=new Map();
 for(const mesh of parent.children){
  if(!mesh.isMesh||mesh.isInstancedMesh||exclude.has(mesh)||!mesh.visible||Array.isArray(mesh.material)||mesh.material.transparent||mesh.children.length)continue;
  if(mesh.geometry.morphAttributes.position||mesh.geometry.attributes.position.count>6000)continue;
  mesh.updateMatrix();if(mesh.matrix.determinant()<=0)continue;
  const attributes=Object.keys(mesh.geometry.attributes).sort();
  const key=[mesh.material.id,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask,...attributes.map(k=>`${k}:${mesh.geometry.attributes[k].itemSize}`)].join('/');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 }
 let removed=0;
 for(const meshes of groups.values()){
  if(meshes.length<2)continue;
  const first=meshes[0],geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrix));
  const geometry=new T.BufferGeometry(),count=geometries.reduce((n,g)=>n+g.attributes.position.count,0);
  for(const name of Object.keys(first.geometry.attributes)){
   const size=first.geometry.attributes[name].itemSize,data=new Float32Array(count*size);let offset=0;
   for(const g of geometries){const attribute=g.attributes[name];for(let i=0;i<attribute.count;i++)for(let c=0;c<size;c++)data[offset++]=attribute.getComponent(i,c);}
   geometry.setAttribute(name,new T.BufferAttribute(data,size));
  }
  const indices=[];let base=0;
  for(const g of geometries){if(g.index){for(let i=0;i<g.index.count;i++)indices.push(base+g.index.getX(i));}else for(let i=0;i<g.attributes.position.count;i++)indices.push(base+i);base+=g.attributes.position.count;g.dispose();}
  geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const batch=new T.Mesh(geometry,first.material);batch.name='rigid-batch';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;batch.matrixAutoUpdate=false;
  for(const mesh of meshes)parent.remove(mesh);parent.add(batch);removed+=meshes.length-1;
 }
 return removed;
}
