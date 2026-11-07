import {projects} from './projects.js';
import {setupInterfaceFocus} from './interface-focus.js';
import {secrets,discoveries} from './secrets.js';
function showSecrets(){
 state.paused=true;
 $('#content').innerHTML=`<h2>Segredos da ilha</h2><p>${discoveries.count} / ${secrets.length} descobertos. Aproxime o carro dos objetos para registrar sua descoberta.</p><div class="secret-list">${secrets.map((s,i)=>`<article class="secret-card"><small>${discoveries.has(s.id)?'✓ DESCOBERTO':`? PISTA ${i+1}`}</small><h3>${discoveries.has(s.id)?s.name:'Um segredo espera por você'}</h3><p>${discoveries.has(s.id)?s.story:s.hint}</p>${discoveries.has(s.id)?`<blockquote>${s.quote}</blockquote><small>FRASE ORIGINAL ? FELIPE WORLD</small>`:''}</article>`).join('')}</div><p>${discoveries.persistent?'Progresso salvo neste navegador.':'O navegador não permitiu salvar. O progresso permanece nesta sessão.'}</p><button id="secrets-reset" ${discoveries.count?'':'disabled'}>Apagar descobertas</button>`;
 $('#secrets-reset').onclick=()=>{const button=$('#secrets-reset');button.textContent='Confirmar: apagar descobertas';button.onclick=()=>{discoveries.reset();world?.refreshSecrets();showSecrets();};};
 mobileBack();if(!$('#modal').open)$('#modal').showModal();
}
import {readQuality,saveQuality,qualityModes,qualityLabels} from './graphics.js';
const mobileScreen=matchMedia('(max-width:650px), (any-pointer:coarse)');
function mobileBack(){if(!mobileScreen.matches)return;const back=document.createElement('button');back.type='button';back.className='mobile-back';back.textContent='← Menu';back.onclick=showMobileMenu;document.querySelector('#content').prepend(back);}
function showMobileMenu(){
 state.paused=true;
 const mapVisible=document.body.classList.contains('mobile-map-visible');
 $('#content').innerHTML=`<h2>Felipe World</h2><p class="menu-progress">${$('#count').textContent}</p><div class="mobile-menu-actions">
 <button id="menu-resume" class="menu-primary">Continuar dirigindo <span aria-hidden="true">→</span></button>
 <button id="menu-projects">Explorar projetos <span aria-hidden="true">↗</span></button>
 <button id="menu-map" aria-pressed="${mapVisible}">${mapVisible?'Ocultar':'Mostrar'} mapa <span aria-hidden="true">⌖</span></button>
 <button id="menu-settings">Configurações <span aria-hidden="true">⚙</span></button>
 <button id="menu-spaceport">Ir à estação lunar <span aria-hidden="true">↗</span></button>
 <button id="menu-recover">Recuperar carro <span aria-hidden="true">↺</span></button>
 <button id="menu-camera">Centralizar câmera <span aria-hidden="true">◎</span></button>
 <a href="classico.html">Sobre mim &amp; currículo <span aria-hidden="true">↗</span></a></div><p class="menu-help">Arraste o joystick: cima para avançar, baixo para frear e dar ré. Use as diagonais para fazer curvas.</p>`;
 $('#menu-resume').onclick=()=>{$('#modal').close();dismissIntro();};
 const secretsButton=document.createElement('button');secretsButton.textContent=`Segredos da ilha · ${discoveries.count}/${secrets.length}`;secretsButton.onclick=showSecrets;$('#menu-projects').after(secretsButton);
 $('#menu-projects').onclick=()=>{$('#projects').click();mobileBack();};
 $('#menu-settings').onclick=()=>{$('#settings').click();mobileBack();};
 $('#menu-spaceport').onclick=()=>{$('#modal').close();world?.visitSpaceport();};
 $('#menu-map').onclick=()=>{document.body.classList.toggle('mobile-map-visible');$('#modal').close();};
 $('#menu-recover').onclick=()=>{$('#modal').close();world?.reset();};
 $('#menu-camera').onclick=()=>{$('#recenter').click();$('#modal').close();};
 if(!$('#modal').open)$('#modal').showModal();
}
const $=s=>document.querySelector(s);export let world=null;export const state={paused:false,night:false,quality:readQuality()};let toastTimer;export function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}export function dismissIntro(){world?.skipIntro();$('#welcome').classList.add('dismissed');$('#start').disabled=true}
export function showProject(p){state.paused=true;$('#content').innerHTML=`<div style="font:9px monospace;letter-spacing:2px;color:#9b895e;margin-bottom:15px">${p.label}</div><h2>${p.name}</h2><p>${p.desc}</p><div class="chips">${p.stack.map(s=>`<span>${s}</span>`).join('')}</div><p style="font-size:11px;margin-top:25px">Explore o repositório para conhecer o código e a documentação do projeto.</p><a class="repo" target="_blank" rel="noopener" href="https://github.com/Felipecoder07/${p.repo}">Ver projeto no GitHub ↗</a>`;if(!$('#modal').open)$('#modal').showModal()}
setupInterfaceFocus(document,$('#modal'),()=>{state.paused=false;});$('#close').onclick=()=>$('#modal').close();$('#projects').onclick=()=>{state.paused=true;$('#content').innerHTML='<h2>Escolha seu destino.</h2><p>Seis projetos. Seis lugares para descobrir.</p><div class="project-list"></div>';projects.forEach(p=>{const b=document.createElement('button');b.className='destination';b.innerHTML=`<b>${p.name}</b><small>Visitar projeto ↗</small>`;b.onclick=()=>{world?.teleport(p);showProject(p);dismissIntro()};$('.project-list').append(b)});$('#modal').showModal()};$('#reset').onclick=()=>{world?.reset();toast('De volta ao início. Boa viagem!')};$('#start').onclick=()=>{dismissIntro();world?.start()};$('#settings').onclick=()=>{state.paused=true;$('#content').innerHTML=`<h2>Do seu jeito.</h2><div class="setting">Iluminação<button id="day">${state.night?'Noite':'Fim de tarde'}</button></div><div class="setting">Qualidade gráfica<button id="quality" aria-label="Alternar qualidade gráfica">${qualityLabels[state.quality]}</button></div><p>A qualidade automática ajusta a resolução para favorecer a fluidez, mantendo os modelos e detalhes. Clique na qualidade para escolher outro modo.</p><p class="keyboard-help">WASD / setas: dirigir<br>Espaço: freio de mão · R: recuperar<br>C: recentralizar câmera<br>Arraste o cenário: girar câmera · Roda do mouse: zoom</p><a class="repo" href="classico.html">Sobre mim &amp; currículo ↗</a>`;$('#day').onclick=e=>{state.night=!state.night;world?.lighting(state.night);e.target.textContent=state.night?'Noite':'Fim de tarde'};$('#quality').onclick=e=>{state.quality=qualityModes[(qualityModes.indexOf(state.quality)+1)%qualityModes.length];world?.quality(state.quality);saveQuality(state.quality);e.target.textContent=qualityLabels[state.quality]};$('#modal').showModal()};
$('#mobile-menu').onclick=showMobileMenu;
const spaceportButton=document.createElement('button');spaceportButton.type='button';spaceportButton.textContent='Estação lunar';spaceportButton.onclick=()=>world?.visitSpaceport();$('#settings').before(spaceportButton);
const secretsButton=document.createElement('button');secretsButton.type='button';secretsButton.textContent='Segredos';secretsButton.setAttribute('aria-haspopup','dialog');secretsButton.onclick=showSecrets;$('#projects').after(secretsButton);
import('./world.js').then(async m=>{await m.ready;world=m;$('#loading').style.opacity=0;setTimeout(()=>$('#loading').remove(),650)}).catch(e=>{console.error(e);$('#loading h2').textContent='O passeio 3D não pôde iniciar.';$('#load-status').textContent='Este modo precisa de WebGL. Use um navegador com aceleração gráfica. Você também pode acessar meu perfil, currículo e projetos na página Sobre mim.';$('.loader-line').style.display='none';});
