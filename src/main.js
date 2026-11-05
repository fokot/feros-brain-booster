import * as THREE from 'three';
import { adaptSpeed, scoreSelection, advanceBall } from './training.js';
import './style.css';

const $ = id => document.getElementById(id);
let history = [];
try { history = JSON.parse(localStorage.getItem('brain-booster-v1') || '[]'); if (!Array.isArray(history)) history = []; } catch {}
let phase = 'idle', round = 0, speed = 1, targets = [], selected = [], records = [], elapsed = 0, paused = false;
let settings = {};
const labels = {idle:'Pripravený na tréning', memorize:'Zapamätaj si zelené gule', tracking:'Sleduj svoje gule', select:'Označ sledované gule', feedback:'Výsledok kola', complete:'Tréning dokončený'};
$('app').innerHTML = `
<header><a class="brand" href="./"><span class="brand-icon">✳</span> fero’s<span>brain booster</span></a><span class="header-note"><i></i> Priestor pre tvoju pozornosť</span></header>
<main><section class="intro"><div><p class="eyebrow">TRÉNING VIZUÁLNEJ POZORNOSTI</p><h1>Spomaľ myšlienky.<br><em>Zrýchli pozornosť.</em></h1><p class="subtitle">Pár minút sústredenia. Osem gúľ. Jedna výzva.</p></div><div class="intro-mark">3D<span>MULTIPLE OBJECT<br>TRACKING</span></div></section>
<div class="workspace"><section class="training"><div class="stage-top"><span><i class="live-dot"></i><b id="phase-label">Pripravený na tréning</b></span><button class="icon-button" id="fullscreen" title="Celá obrazovka" aria-label="Celá obrazovka">⛶</button></div><div id="viewport"><div class="crosshair">+</div><div id="welcome"><span class="pill">TVOJ DENNÝ RESET</span><h2>Udrž ich v pozornosti.</h2><p>Zapamätaj si zvýraznené gule.<br>Sleduj ich pohyb a na konci ich nájdi.</p><button class="primary" id="start">Začať tréning <span>↗</span></button><small>Bez účtu. Výsledky zostávajú v tomto prehliadači.</small></div><div id="message" hidden></div><div id="paused" hidden>Tréning je pozastavený</div></div><div class="stage-bottom"><div><span>KOLO</span><strong id="round">— / 10</strong></div><div><span>RÝCHLOSŤ</span><strong id="speed">1.00×</strong></div><div><span id="timer-label">SLEDOVANIE</span><strong id="timer">8 s</strong></div><button id="pause" disabled>Pozastaviť</button><button id="stop" disabled>Ukončiť</button></div><div class="action-bar"><p id="hint" aria-live="polite">Pohľad nechaj v strede a vnímaj celý priestor.</p><button id="confirm" class="primary" hidden>Potvrdiť výber</button><button id="next" class="primary" hidden>Ďalšie kolo →</button></div></section>
<aside><section class="panel"><p class="eyebrow">NASTAVENIE TRÉNINGU</p><h2>Tvoje tempo.</h2><label for="target-count">Sledované gule <output id="target-value">4 z 8</output></label><input id="target-count" type="range" min="2" max="5" value="4"><div class="range-labels"><span>Ľahšie</span><span>Náročnejšie</span></div><label for="duration">Dĺžka pohybu</label><select id="duration"><option value="6">6 sekúnd</option><option value="8" selected>8 sekúnd</option><option value="12">12 sekúnd</option></select><label for="round-count">Počet kôl</label><select id="round-count"><option value="5">5 kôl · približne 2 min</option><option value="10" selected>10 kôl · približne 4 min</option><option value="20">20 kôl · približne 7 min</option></select><label for="initial-speed">Počiatočná rýchlosť</label><select id="initial-speed"><option value="0.6">Pokojná · 0.60×</option><option value="1" selected>Štandardná · 1.00×</option><option value="1.5">Rýchla · 1.50×</option></select><div class="adaptive"><span>↗</span><p><b>Rastie spolu s tebou</b>Po úspešnom kole sa pohyb zrýchli. Po chybe spomalí.</p></div></section><section class="tip"><span>✦</span><p><b>Malý tip, veľký rozdiel.</b>Nesleduj každú guľu očami. Pozeraj do stredu a rozlož pozornosť do priestoru.</p></section></aside></div>
<section class="progress"><div class="section-heading"><div><p class="eyebrow">KROK ZA KROKOM</p><h2>Tvoj pokrok</h2></div><button id="clear" class="text-button">Vymazať históriu</button></div><div class="stats"><div><span>DOKONČENÉ TRÉNINGY</span><strong id="sessions">0</strong></div><div><span>PRIEMERNÁ ÚSPEŠNOSŤ</span><strong id="accuracy">—</strong></div><div><span>NAJLEPŠIA RÝCHLOSŤ</span><strong id="best">—</strong></div></div><div id="history"></div></section><section class="how"><div><span>01</span><h3>Zapamätaj si</h3><p>Zelené gule sú tvoje ciele. Máš 2 sekundy na zapamätanie.</p></div><div><span>02</span><h3>Sleduj pohyb</h3><p>Všetky gule zmenia farbu. Udrž svoje ciele v pozornosti.</p></div><div><span>03</span><h3>Nájdi ich znova</h3><p>Po zastavení vyber svoje gule a potvrď výber.</p></div></section></main><footer><span>✳ fero’s brain booster</span><p>Vlastné cvičenie inšpirované princípom sledovania viacerých objektov.<br>Nezávislý projekt, bez prepojenia na NeuroTracker. Perspektívne 3D, bez stereoskopie.</p></footer>`;

const viewport = $('viewport');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
camera.position.set(0, 0, 12);
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); } catch {
  $('welcome').innerHTML = '<h2>3D zobrazenie nie je dostupné</h2><p>Zapni hardvérovú akceleráciu alebo použi prehliadač s podporou WebGL.</p>';
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
viewport.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','3D tréningová plocha. Po zastavení vyber gule kliknutím alebo klávesmi 1 až 8.');
// A lit room gives the moving objects stable spatial references.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
scene.fog = new THREE.Fog(0x101c17, 11, 24);
scene.add(new THREE.HemisphereLight(0xe4f1dd, 0x536d5c, 1.5));
scene.add(new THREE.AmbientLight(0xb5d5bd, .4));
const light = new THREE.DirectionalLight(0xfff5dd, 3.2);
light.position.set(-3, 6, 7);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 22 });
light.shadow.radius = 4;
light.shadow.normalBias = .025;
light.shadow.bias = -.00015;
light.shadow.camera.updateProjectionMatrix();
scene.add(light);
const rim = new THREE.PointLight(0xc4efba, 14);
rim.position.set(3, 1, 1);
scene.add(rim);
const roomSize = 6.2;
const roomGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
function addWall(color, position, rotation) {
  const wall = new THREE.Mesh(roomGeometry, new THREE.MeshStandardMaterial({ color, roughness: .95 }));
  wall.position.set(...position);
  wall.rotation.set(...rotation);
  wall.receiveShadow = true;
  scene.add(wall);
  return wall;
}
addWall(0x22372e, [0, 0, -3.1], [0, 0, 0]);
addWall(0x2b4035, [0, -3.1, 0], [-Math.PI / 2, 0, 0]);
addWall(0x1b3028, [-3.1, 0, 0], [0, Math.PI / 2, 0]);
addWall(0x1b3028, [3.1, 0, 0], [0, -Math.PI / 2, 0]);
// The open front and ceiling keep every target visible.
const floorGrid = new THREE.GridHelper(roomSize, 8, 0x8fa997, 0x6b8d79);
floorGrid.position.y = -3.095;
floorGrid.material.transparent = true;
floorGrid.material.opacity = .24;
scene.add(floorGrid);
const backGrid = new THREE.GridHelper(roomSize, 8, 0x7c9d89, 0x648272);
backGrid.rotation.x = Math.PI / 2;
backGrid.position.z = -3.095;
backGrid.material.transparent = true;
backGrid.material.opacity = .16;
scene.add(backGrid);
const cube = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(roomSize, roomSize, roomSize)),
  new THREE.LineBasicMaterial({color: 0xa5c4ae, transparent: true, opacity: .34})
);
scene.add(cube);
const balls = [];
const geometry = new THREE.SphereGeometry(.29,32,24);
function makeLabel(n) {const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.font='bold 68px sans-serif';ctx.fillStyle='#122019';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,64,68);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));sprite.scale.set(.36,.36,1);sprite.visible=false;return sprite;}
for(let i=0;i<8;i++){const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xdbe7d5,roughness:.3,metalness:.16}));const label=makeLabel(i+1);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh,label);balls.push({mesh,label,position:mesh.position,velocity:new THREE.Vector3()});}
function resetBalls(){balls.forEach((b,i)=>{b.position.set((i%2?1:-1)*(1.2+Math.random()*.8),(Math.floor(i/2)%2?1:-1)*(1+Math.random()*.8),(i<4?-1:1)*(1+Math.random()*.7));b.velocity.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();});}
function paint(){balls.forEach((b,i)=>{let color=0xdbe7d5;if(phase==='memorize'&&targets.includes(i))color=0xc6f68a;if(phase==='select'&&selected.includes(i))color=0xc6f68a;if(phase==='feedback')color=targets.includes(i)?0xc6f68a:selected.includes(i)?0xf28b82:0x68776d;b.mesh.material.color.setHex(color);b.mesh.material.emissive.setHex(color===0xc6f68a?0x659e23:0);b.label.visible=phase==='select';});}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(1.15,.85,camera.aspect<1?13/camera.aspect:13);camera.lookAt(0,0,0);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewport);
resetBalls();paint();resize();
const configInputs=['target-count','duration','round-count','initial-speed'];
function ui(){
  $('phase-label').textContent=labels[phase];$('round').textContent=`${round||'—'} / ${settings.rounds||$('round-count').value}`;$('speed').textContent=speed.toFixed(2)+'×';
  const active=['memorize','tracking','select','feedback'].includes(phase);
  $('pause').disabled=!active;$('stop').disabled=!active;$('pause').textContent=paused?'Pokračovať':'Pozastaviť';$('paused').hidden=!paused;
  $('confirm').hidden=phase!=='select';$('confirm').disabled=selected.length!==settings.targets;$('next').hidden=phase!=='feedback';$('next').textContent=round===settings.rounds?'Zobraziť výsledok →':'Ďalšie kolo →';
  configInputs.forEach(id=>$(id).disabled=active);
  $('welcome').hidden=phase!=='idle';$('message').hidden=phase!=='complete';
}
function startRound(){round++;elapsed=0;selected=[];resetBalls();targets=[...Array(8).keys()].sort(()=>Math.random()-.5).slice(0,settings.targets);phase='memorize';$('hint').textContent=`Zapamätaj si ${settings.targets} zelené gule.`;paint();ui();}
function start(){settings={targets:+$('target-count').value,duration:+$('duration').value,rounds:+$('round-count').value};speed=+$('initial-speed').value;round=0;records=[];paused=false;startRound();}
$('start').onclick=start;
$('target-count').oninput=()=>{$('target-value').textContent=$('target-count').value+' z 8';};
$('duration').onchange=()=>{$('timer').textContent=$('duration').value+' s';};
$('round-count').onchange=ui;
$('initial-speed').onchange=()=>{speed=+$('initial-speed').value;ui();};
$('pause').onclick=()=>{paused=!paused;ui();};
$('stop').onclick=()=>{phase='idle';paused=false;elapsed=0;paint();ui();$('hint').textContent='Tréning bol ukončený. Nedokončené tréningy sa neukladajú.';};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.training').requestFullscreen();}catch{$('hint').textContent='Prehliadač nepovolil celú obrazovku.';}};
function toggle(i){if(phase!=='select'||paused)return;if(selected.includes(i))selected=selected.filter(n=>n!==i);else if(selected.length<settings.targets)selected.push(i);$('hint').textContent=`Vybrané ${selected.length} z ${settings.targets}. Klikni na gule alebo použi klávesy 1–8.`;paint();ui();}
const raycaster=new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown',e=>{const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=raycaster.intersectObjects(balls.map(b=>b.mesh))[0];if(hit)toggle(balls.findIndex(b=>b.mesh===hit.object));});
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName))return;if(e.key>='1'&&e.key<='8')toggle(+e.key-1);if(e.key==='Enter'){if(phase==='select'&&!$('confirm').disabled)$('confirm').click();else if(phase==='feedback')$('next').click();}if(e.code==='Space'&&!$('pause').disabled){e.preventDefault();$('pause').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['memorize','tracking','select','feedback'].includes(phase)){paused=true;ui();}});
$('confirm').onclick=()=>{if(paused||selected.length!==settings.targets||phase!=='select')return;const hits=scoreSelection(targets,selected);records.push({speed,hits,targets:settings.targets});phase='feedback';$('hint').textContent=`${hits===settings.targets?'Výborne!':'Skús to znova.'} Správne ${hits} z ${settings.targets}. Zelené gule ukazujú správne ciele.`;paint();ui();};
$('next').onclick=()=>{if(paused)return;if(round<settings.rounds){speed=adaptSpeed(speed,records.at(-1).hits===settings.targets);startRound();}else finish();};
function finish(){phase='complete';const accuracy=Math.round(records.reduce((n,r)=>n+r.hits,0)/(settings.rounds*settings.targets)*100);const best=Math.max(...records.filter(r=>r.hits===r.targets).map(r=>r.speed),0);const entry={date:new Date().toISOString(),accuracy,best,rounds:settings.rounds,targets:settings.targets};history.unshift(entry);let saved=true;try{localStorage.setItem('brain-booster-v1',JSON.stringify(history));}catch{saved=false;}$('message').innerHTML=`<span class="pill">DOBRÁ PRÁCA</span><h2>${accuracy}% úspešnosť</h2><p>${settings.rounds} kôl sústredenia je za tebou.<br>${best?'Najvyššia zvládnutá rýchlosť: '+best.toFixed(2)+'×':'Každý tréning je nový začiatok.'}</p><button class="primary" id="restart">Ďalší tréning ↗</button>`;$('restart').onclick=start;$('hint').textContent=saved?'Výsledok je uložený v tomto prehliadači.':'Výsledok sa nepodarilo uložiť. Úložisko prehliadača nie je dostupné.';renderHistory();paint();ui();}
function renderHistory(){const valid=history.filter(h=>Number.isFinite(h.accuracy)&&Number.isFinite(h.best)&&!isNaN(Date.parse(h.date)));$('sessions').textContent=valid.length;$('accuracy').textContent=valid.length?Math.round(valid.reduce((n,h)=>n+h.accuracy,0)/valid.length)+'%':'—';$('best').textContent=valid.length?Math.max(...valid.map(h=>h.best)).toFixed(2)+'×':'—';$('clear').disabled=!valid.length;$('history').replaceChildren();if(!valid.length){$('history').textContent='Tvoj prvý tréning sa začína tu. Po dokončení tu nájdeš svoje výsledky.';return;}valid.slice(0,10).forEach(h=>{const row=document.createElement('div');row.className='history-row';for(const value of [new Date(h.date).toLocaleString('sk-SK',{dateStyle:'medium',timeStyle:'short'}),`${h.rounds} kôl · ${h.targets} ciele`,`${h.accuracy} %`,`${h.best.toFixed(2)}×`]){const s=document.createElement('span');s.textContent=value;row.append(s);}$('history').append(row);});}
$('clear').onclick=()=>{if(confirm('Vymazať všetky uložené výsledky tréningov?')){try{localStorage.removeItem('brain-booster-v1');history=[];renderHistory();}catch{$('hint').textContent='Históriu sa nepodarilo vymazať.';}}};
let previous=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.05);previous=now;if(!paused){if(phase==='memorize'||phase==='tracking'){elapsed+=dt;const duration=phase==='memorize'?2:settings.duration;$('timer-label').textContent=phase==='memorize'?'ZAPAMÄTANIE':'ZOSTÁVA';$('timer').textContent=Math.max(0,Math.ceil(duration-elapsed))+' s';if(elapsed>=duration){elapsed=0;phase=phase==='memorize'?'tracking':'select';$('hint').textContent=phase==='tracking'?'Pozeraj do stredu a sleduj svoje ciele.':`Vyber ${settings.targets} gule. Klikni na ne alebo použi klávesy 1–8.`;paint();ui();}}if(phase==='tracking'||phase==='idle'){balls.forEach(b=>advanceBall(b,dt*(phase==='idle'?.12:speed)));}}
  balls.forEach(b=>b.label.position.copy(b.position).add(new THREE.Vector3(0,0,.32)));renderer.render(scene,camera);
}
renderHistory();ui();requestAnimationFrame(animate);
