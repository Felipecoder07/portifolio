import * as T from './three.js';
import {createCustomization,paints,rimFinishes} from './garage-customization.js';
import {createGarageModel} from './garage-model.js';

const svg=(path)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
const icons={paint:svg('M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-3-5-4-9-4ZM7 8h.01M6 13h.01M11 6h.01M16 7h.01'),wheel:svg('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 3v6m0 6v6M3 12h6m6 0h6'),close:svg('m6 6 12 12M6 18 18 6'),arrow:svg('M4 12h16m-6-6 6 6-6 6'),reset:svg('M3 10a9 9 0 1 1 1 7M3 4v6h6'),check:svg('m5 12 4 4L19 6'),rotate:svg('M4 9a8 8 0 1 1 0 6M4 4v5h5')};
const ease=t=>t*t*(3-2*t);
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function createGarage(scene,{carRig,amphibious,garageShell,onEnter=()=>{},onExit=()=>{}}){
 let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('storage');},setItem(){throw Error('storage');}};}
 const customization=createCustomization(storage),model=createGarageModel(scene);
 const dialog=document.createElement('dialog');dialog.id='garage-studio';dialog.setAttribute('aria-labelledby','garage-title');
 dialog.innerHTML=`<div class="garage-top"><a class="garage-wordmark" aria-label="Oficina Felipe World">FW<span>CUSTOM LAB</span></a><button type="button" class="garage-icon-button" id="garage-close" aria-label="Cancelar e sair da oficina">${icons.close}</button></div>
 <div class="garage-stage" aria-label="Visualização do veículo. Arraste para girar."></div>
 <div class="garage-view-tools"><button type="button" id="garage-spin" aria-pressed="true">${icons.rotate}<span>Rotação automática</span></button><label for="garage-angle">Ângulo do veículo</label><input id="garage-angle" type="range" min="-180" max="180" value="0" step="1" aria-label="Girar veículo"></div>
 <section class="garage-panel"><div class="garage-eyebrow"><span></span> SUA PRÓXIMA VERSÃO</div><h1 id="garage-title">Feito do seu jeito.</h1><p class="garage-intro">Uma nova cor. Um novo caminho.</p>
 <fieldset id="garage-options"><legend class="garage-sr">Personalização do veículo</legend>
 <div class="garage-section-title">${icons.paint}<h2>Pintura</h2><span id="garage-color-name"></span></div>
 <div class="garage-paints" role="group" aria-label="Cor da carroceria">${paints.map(p=>`<button type="button" data-paint="${p.id}" style="--swatch:${p.color}" aria-label="${p.name}" aria-pressed="false"><span>${icons.check}</span><small>${p.name}</small></button>`).join('')}</div>
 <p id="garage-color-description"></p>
 <div class="garage-section-title">${icons.wheel}<h2>Rodas</h2></div><div class="garage-rims" role="group" aria-label="Acabamento das rodas">${rimFinishes.map(r=>`<button type="button" data-rims="${r.id}" aria-pressed="false" style="--rim:${r.color}">${icons.wheel}<span>${r.name}</span></button>`).join('')}</div>
 <button type="button" id="garage-restore">${icons.reset}Restaurar original</button></fieldset>
 <div class="garage-status"><span id="garage-status" role="status" aria-live="polite">Alinhando o veículo na plataforma…</span><button type="button" id="garage-skip" hidden>Pular animação</button><div class="garage-progress" aria-hidden="true"><i></i></div></div>
 <div class="garage-actions"><button type="button" id="garage-cancel">Cancelar</button><button type="button" id="garage-apply">Aplicar e sair ${icons.arrow}</button></div><p class="garage-save-note">A pintura acompanha o barco. Suas escolhas ficam neste navegador.</p></section>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector),options=$('#garage-options'),apply=$('#garage-apply'),status=$('#garage-status'),skip=$('#garage-skip'),progress=$('.garage-progress i'),slider=$('#garage-angle');
 let phase='idle',age=0,from=null,turn=0,auto=true,drag=null,job=null,elapsed=0,lastDriver=null,exitNote='',blocked=false;
 const fromPaint=new T.Color(),fromRims=new T.Color(),targetPaint=new T.Color(),targetRims=new T.Color();
 function finishMaterials(value){const paint=paints.find(p=>p.id===value.paint),rim=rimFinishes.find(r=>r.id===value.rims);carRig.paint.color.set(paint.color);amphibious.paint.color.copy(carRig.paint.color);carRig.rimMaterial.color.set(rim.color);carRig.rimMaterial.roughness=rim.roughness;carRig.rimMaterial.metalness=rim.metalness;}
 finishMaterials(customization.saved);
 function refresh(){const draft=customization.draft||customization.saved,p=paints.find(p=>p.id===draft.paint);$('#garage-color-name').textContent=p.name;$('#garage-color-description').textContent=p.description;dialog.querySelectorAll('[data-paint]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.paint===draft.paint));dialog.querySelectorAll('[data-rims]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.rims===draft.rims));}
 function busy(){options.disabled=phase!=='open';apply.disabled=phase!=='open'||!!job;skip.hidden=!job;dialog.setAttribute('aria-busy',String(phase!=='open'||!!job));}
 function completeJob(){if(!job)return;finishMaterials(job.value);job=null;progress.style.transform='scaleX(1)';status.textContent='Pronto. Que tal dar uma volta?';busy();}
 function preview(value){fromPaint.copy(carRig.paint.color);fromRims.copy(carRig.rimMaterial.color);targetPaint.set(paints.find(p=>p.id===value.paint).color);targetRims.set(rimFinishes.find(p=>p.id===value.rims).color);job={value,elapsed:0};refresh();status.textContent='Braço de pintura em ação…';progress.style.transform='scaleX(0)';busy();}
 function inside(d){return d.mode==='car'&&Math.abs(d.x)<2.8&&d.z>-1.5&&d.z<3.3;}
 function canEnter(d){return inside(d)||(d.mode==='car'&&Math.abs(d.x)<2.8&&d.z>=3.3&&d.z<12.8&&Math.abs(d.speed)<2.5);}
 function open(d){if(phase!=='idle'||blocked||!canEnter(d))return false;lastDriver=d;customization.begin();phase='enter';age=0;turn=angle(d.heading);from={x:d.x,z:d.z,heading:turn};auto=true;$('#garage-spin').setAttribute('aria-pressed','true');garageShell.visible=false;document.body.classList.add('garage-open');refresh();busy();status.textContent='Alinhando o veículo na plataforma…';progress.style.transform='scaleX(0)';onEnter();dialog.showModal();$('#garage-close').focus();return true;}
 function leave(save){if(phase==='idle'||phase==='exit')return;if(save&&(phase!=='open'||job))return;const value=save?customization.apply():customization.cancel();finishMaterials(value);job=null;phase='exit';age=0;from={x:lastDriver.x,z:lastDriver.z,heading:turn,y:carRig.car.position.y};exitNote=save?(customization.persistent?'Visual salvo. Boa exploração!':'Visual aplicado nesta sessão. O navegador não permitiu salvar.'):'De volta à ilha.';status.textContent=save?'Tudo pronto. Preparando sua saída…':'Restaurando o visual anterior…';busy();}
 function abort(){if(phase==='idle')return;finishMaterials(customization.cancel());job=null;phase='idle';dialog.close();document.body.classList.remove('garage-open');garageShell.visible=true;model.update(0);onExit('');}
 dialog.addEventListener('cancel',e=>{e.preventDefault();leave(false);});
 $('#garage-close').onclick=$('#garage-cancel').onclick=()=>leave(false);apply.onclick=()=>leave(true);skip.onclick=completeJob;
 dialog.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>preview(customization.preview({paint:b.dataset.paint})));
 dialog.querySelectorAll('[data-rims]').forEach(b=>b.onclick=()=>preview(customization.preview({rims:b.dataset.rims})));
 $('#garage-restore').onclick=()=>preview(customization.restore());
 $('#garage-spin').onclick=()=>{auto=!auto;$('#garage-spin').setAttribute('aria-pressed',String(auto));};
 slider.oninput=()=>{auto=false;$('#garage-spin').setAttribute('aria-pressed','false');turn=Number(slider.value)*Math.PI/180;};
 const stage=$('.garage-stage');stage.addEventListener('pointerdown',e=>{if(phase!=='open')return;auto=false;$('#garage-spin').setAttribute('aria-pressed','false');drag={x:e.clientX,turn};stage.setPointerCapture(e.pointerId);});stage.addEventListener('pointermove',e=>{if(drag)turn=drag.turn+(e.clientX-drag.x)*.009;});for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>{drag=null;});
 function update(dt,d,{paused=false,reduced=false,unavailable=false}={}){
  lastDriver=d;blocked=paused||unavailable;elapsed+=dt;
  const near=d.mode==='car'&&Math.abs(d.x)<7&&d.z>-5&&d.z<17;
  
  if(phase==='idle'&&!blocked&&inside(d))open(d);
  const draft=customization.draft||customization.saved;
  model.update(dt,{time:elapsed,near,active:phase!=='idle',turn,painting:job?Math.max(.001,job.elapsed/1.8):0,color:paints.find(p=>p.id===draft.paint).color,reduced});
  if(phase==='idle')return null;
  age+=dt;let pose;
  if(phase==='enter'){
   const p=reduced?1:Math.min(age/1.5,1),s=ease(p);turn=from.heading*(1-s);pose={x:from.x*(1-s),z:from.z*(1-s),y:T.MathUtils.lerp(.08,.3,s)};
   if(p===1){phase='open';status.textContent='Escolha sua combinação. A prévia aparece no veículo.';busy();$('#garage-options [aria-pressed="true"]').focus();}
  }else if(phase==='open'){
   if(auto&&!reduced&&!drag)turn+=dt*.22;pose={x:0,z:0,y:.3};
   if(job){job.elapsed+=dt;const p=reduced?1:Math.min(job.elapsed/1.8,1);carRig.paint.color.copy(fromPaint).lerp(targetPaint,ease(p));amphibious.paint.color.copy(carRig.paint.color);carRig.rimMaterial.color.copy(fromRims).lerp(targetRims,ease(p));progress.style.transform=`scaleX(${p})`;if(p===1)completeJob();}
  }else{
   const align=reduced?1:Math.min(age/.7,1),p=reduced?1:Math.max(0,Math.min((age-.7)/2,1)),s=ease(p);turn=from.heading+angle(Math.PI-from.heading)*ease(align);pose={x:from.x*(1-s),z:T.MathUtils.lerp(from.z,9,s),y:T.MathUtils.lerp(from.y,.08,s)};
   if(p===1){phase='idle';dialog.close();document.body.classList.remove('garage-open');garageShell.visible=true;onExit(exitNote);}
  }
  const motionSpeed=reduced||dt<=0?0:((pose.x-d.x)*-Math.sin(turn)+(pose.z-d.z)*-Math.cos(turn))/dt;
  slider.value=String(Math.round(angle(turn)*180/Math.PI));d.x=pose.x;d.z=pose.z;d.heading=turn;d.vx=d.vz=d.speed=d.steer=0;d.mode='car';d.deck=false;
  return {...pose,pitch:0,roll:0,motionSpeed};
 }
 return {update,open,abort,canEnter,get active(){return phase!=='idle';},get phase(){return phase;},get finish(){return customization.saved;},dialog};
}
