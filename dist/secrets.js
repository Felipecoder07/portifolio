// Shared discovery state: no renderer or UI dependencies.
export const secrets=Object.freeze([
 {id:'witcher',name:'O contrato do Lobo Branco',x:0,z:-70,radius:5,hint:'Ao norte, uma trilha leva ao descanso de um caçador de monstros.',quote:'Monstros não desaparecem quando você fecha os olhos. Afie a lâmina, siga os rastros e termine o contrato.',story:'The Witcher · Espada de prata inspirada em Geralt de Rívia, com guarda inclinada, cabo escuro e um medalhão de lobo.'},
 {id:'automail',name:'A troca equivalente',x:-68,z:12,radius:5,hint:'Além do túnel oeste, metal e alquimia guardam uma oficina esquecida.',quote:'Não existe código sem troca equivalente: você entrega tempo, estudo e tentativas — e transforma falhas em conhecimento.',story:'Fullmetal Alchemist · Automail inspirado no braço de Edward Elric: placas de metal, articulações e dedos mecânicos sobre um círculo de transmutação.'},
 {id:'spider',name:'Seu dev da vizinhança',x:48,z:49,radius:5,hint:'Na trilha a sudeste, procure algo que ficou preso entre as árvores.',quote:'Cada linha de código alcança alguém do outro lado da rede. Construa como quem tem a responsabilidade de cuidar dessa pessoa.',story:'Homem-Aranha · Uma máscara vermelha, lentes brancas e uma teia escondida no bosque. Conectar pessoas também é um superpoder.'}
]);
export const storageKey='felipe-world-secrets-v3';
export function createDiscoveries(storage){
 const found=new Set();let persistent=true;
 try{const saved=JSON.parse(storage?.getItem(storageKey)||'[]');if(Array.isArray(saved))for(const id of saved)if(secrets.some(s=>s.id===id))found.add(id);}catch{persistent=false;}
 function save(){try{if(!storage)throw Error('Storage unavailable');storage.setItem(storageKey,JSON.stringify([...found]));persistent=true;}catch{persistent=false;}}
 return {has:id=>found.has(id),get count(){return found.size;},get persistent(){return persistent;},
  discover(x,z){const added=secrets.filter(s=>!found.has(s.id)&&Math.hypot(x-s.x,z-s.z)<=s.radius);for(const s of added)found.add(s.id);if(added.length)save();return added;},
  reset(){found.clear();save();}
 };
}
let storage;try{storage=globalThis.localStorage;}catch{}
export const discoveries=createDiscoveries(storage);
