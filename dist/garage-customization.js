export const paints=Object.freeze([
 {id:'copper',name:'Cobre solar',color:'#d78256',description:'O clássico da ilha. Quente, aventureiro e cheio de personalidade.'},
 {id:'forest',name:'Verde floresta',color:'#427963',description:'Um tom profundo que combina com as trilhas da ilha.'},
 {id:'ocean',name:'Azul oceano',color:'#397da4',description:'Da estrada ao mar, uma pintura feita para explorar.'},
 {id:'pearl',name:'Pérola',color:'#e5dfcd',description:'Claro, elegante e com acabamento acetinado.'},
 {id:'graphite',name:'Grafite',color:'#424b55',description:'Discreto, técnico e com presença.'},
 {id:'berry',name:'Amora',color:'#956279',description:'Uma cor expressiva para deixar sua marca na ilha.'}
]);
export const rimFinishes=Object.freeze([
 {id:'silver',name:'Prata escovada',color:'#a6b3a8',metalness:.65,roughness:.35},
 {id:'dark',name:'Titânio escuro',color:'#48515a',metalness:.8,roughness:.3},
 {id:'bronze',name:'Bronze',color:'#b58b58',metalness:.7,roughness:.32}
]);
export const originalFinish=Object.freeze({paint:'copper',rims:'silver'});
const key='felipe-world-garage-v1';
export function sanitizeFinish(value){return {paint:paints.some(p=>p.id===value?.paint)?value.paint:originalFinish.paint,rims:rimFinishes.some(p=>p.id===value?.rims)?value.rims:originalFinish.rims};}
export function createCustomization(storage){
 let saved={...originalFinish},draft=null,persistent=true;
 try{saved=sanitizeFinish(JSON.parse(storage.getItem(key)));}catch{persistent=false;}
 return {
  get saved(){return {...saved};},get draft(){return draft?{...draft}:null;},get persistent(){return persistent;},
  begin(){draft={...saved};return {...draft};},
  preview(change){if(!draft)throw Error('A oficina não está aberta');draft=sanitizeFinish({...draft,...change});return {...draft};},
  restore(){if(!draft)throw Error('A oficina não está aberta');draft={...originalFinish};return {...draft};},
  cancel(){draft=null;return {...saved};},
  apply(){if(!draft)throw Error('A oficina não está aberta');saved={...draft};draft=null;try{storage.setItem(key,JSON.stringify(saved));persistent=true;}catch{persistent=false;}return {...saved};}
 };
}
