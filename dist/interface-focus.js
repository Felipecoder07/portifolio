// Return keyboard control to the scene after menus and pointer actions.
export function setupInterfaceFocus(doc, modal, onResume){
 const focusScene=()=>doc.querySelector('canvas.world')?.focus({preventScroll:true});
 doc.addEventListener('pointerdown',()=>doc.body.classList.add('pointer-input'),true);
 doc.addEventListener('keydown',event=>{
  if(event.key==='Tab')doc.body.classList.remove('pointer-input');
 },true);
 modal.addEventListener('close',()=>{
  // A menu may have been reopened before the queued close event runs.
  if(modal.open)return;
  onResume();
  if(!doc.querySelector('dialog[open]'))focusScene();
 });
 doc.addEventListener('click',event=>{
  if(event.detail>0&&event.target.closest('button')&&!event.target.closest('#controls')&&!doc.querySelector('dialog[open]'))focusScene();
 });
}
