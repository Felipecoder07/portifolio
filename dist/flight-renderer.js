import * as T from './three.js';
// Dissolve between the launch site, orbital shot and landing site, with both
// cameras following the same rocket framing during each transition.
export function createFlightRenderer(renderer){
 let targets=null;const size=new T.Vector2(),scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,2);camera.position.z=1;
 const geometry=new T.PlaneGeometry(2,2),a=new T.MeshBasicMaterial({depthTest:false,depthWrite:false}),b=new T.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false});
 const first=new T.Mesh(geometry,a),second=new T.Mesh(geometry,b);first.renderOrder=0;second.renderOrder=1;scene.add(first,second);
 function render(view){
  if(!view.blend){renderer.render(view.scene,view.camera);return;}
  renderer.getDrawingBufferSize(size);const scale=Math.min(1,1600/size.x),width=Math.max(1,Math.round(size.x*scale)),height=Math.max(1,Math.round(size.y*scale));
  const type=renderer.extensions?.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
  targets??=[new T.WebGLRenderTarget(width,height,{type}),new T.WebGLRenderTarget(width,height,{type})];
  for(const t of targets)if(t.width!==width||t.height!==height)t.setSize(width,height);
  renderer.setRenderTarget(targets[0]);renderer.render(view.scene,view.camera);
  renderer.setRenderTarget(targets[1]);renderer.render(view.blend.scene,view.blend.camera);
  renderer.setRenderTarget(null);a.map=targets[0].texture;b.map=targets[1].texture;b.opacity=view.blend.mix;renderer.render(scene,camera);
 }
 function release(){if(targets){for(const t of targets)t.dispose();targets=null;}}
 return {render,release};
}
