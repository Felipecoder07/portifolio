import test from 'node:test';
import assert from 'node:assert/strict';
import {setupInterfaceFocus} from '../dist/interface-focus.js';

function setup(){
 const doc=new EventTarget(),modal=new EventTarget(),classes=new Set();
 let focused=0,resumed=0,otherDialog=false;
 modal.open=false;
 doc.body={classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)}};
 doc.querySelector=selector=>selector==='canvas.world'?{focus:()=>focused++}:modal.open||otherDialog?{}:null;
 setupInterfaceFocus(doc,modal,()=>resumed++);
 return {doc,modal,classes,get focused(){return focused;},get resumed(){return resumed;},other:()=>otherDialog=true};
}
function click(doc,{detail=1,touch=false}={}){
 const event=new Event('click');
 Object.defineProperties(event,{detail:{value:detail},target:{value:{closest:selector=>selector==='button'||touch&&selector==='#controls'?{}:null}}});
 doc.dispatchEvent(event);
}
test('closing settings restores scene focus and resumes driving',()=>{
 const s=setup();s.modal.dispatchEvent(new Event('close'));
 assert.equal(s.resumed,1);assert.equal(s.focused,1);
});
test('reopened menus and other open dialogs keep their focus',()=>{
 const s=setup();s.modal.open=true;s.modal.dispatchEvent(new Event('close'));
 assert.equal(s.resumed,0);assert.equal(s.focused,0);
 s.modal.open=false;s.other();s.modal.dispatchEvent(new Event('close'));assert.equal(s.focused,0);
});
test('pointer HUD clicks return to driving; keyboard and touch controls retain focus',()=>{
 const s=setup();click(s.doc);assert.equal(s.focused,1);
 click(s.doc,{detail:0});click(s.doc,{touch:true});assert.equal(s.focused,1);
 s.modal.open=true;click(s.doc);assert.equal(s.focused,1);
});
test('pointer actions hide focus outlines until keyboard navigation',()=>{
 const s=setup();s.doc.dispatchEvent(new Event('pointerdown'));assert.ok(s.classes.has('pointer-input'));
 const event=new Event('keydown');event.key='Tab';s.doc.dispatchEvent(event);assert.ok(!s.classes.has('pointer-input'));
});
