import { BaseScene } from './base-scene.js?v=6';
import {OBSTACLES,terrainAt,isCleared,canClear,startClearing} from './frontier.js?v=6';
import {JOBS,TROOPS,idleWorkers,armySize,assignJob,recruitFarmer,trainTroop,moveBuilding,fits} from './base.js?v=6';
import {
  SAVE_KEY, RESOURCE_IDS, ERAS, BUILDINGS, TECHNOLOGIES, POLICIES, ROUTES, MILESTONES,
  newGame, restoreGame, capacity, populationCap, rates, buildingName, buildingPlan,
  canAfford, startBuilding, nextResearch, startResearch, expeditionPlan, startExpedition,
  collectExpedition, claimMilestone, eraRequirements, advanceEra, advanceTime, startSurvey,
} from './engine.js?v=6';
import { WORLD, BIOMES, SITES, tileInfo, tilePoint, frontier, surveyPlan, automaticSurveyPlan } from './world.js?v=6';
import { LivingSettlement, WorldMap } from './scene.js?v=6';

const PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1m0-15.6-2.1 2.1M6.3 17.7l-2.1 2.1"/>',
  flame: '<path d="M12 2c1 6 6 5 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 4 3 5 3 5s3-3 0-10Z"/><path d="M12 14c-3 3-2 6 0 6s3-3 0-6Z"/>',
  wood: '<path d="m12 2 6 8h-3l5 7H4l5-7H6l6-8Zm0 15v5M7 22h10"/>',
  stone: '<path d="m8 4 8 1 6 10-5 6H5l-3-7 6-10Z"/><path d="m8 4 2 10 12 1M2 14h8l7 7m-7-7 6-9"/>',
  wheat: '<path d="M12 22V5m0 3c-4 0-6-2-6-5 4 0 6 2 6 5Zm0 5c-4 0-6-2-6-5 4 0 6 2 6 5Zm0 5c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-10c4 0 6-2 6-5-4 0-6 2-6 5Zm0 5c4 0 6-2 6-5-4 0-6 2-6 5Zm0 5c4 0 6-2 6-5-4 0-6 2-6 5Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 8 3 4-3 4-3-4 3-4Z"/>',
  science: '<path d="M5 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-3-2H4V4a1 1 0 0 1 1-1Zm9 3a3 3 0 0 1 3-3h3v16h-3a4 4 0 0 0-3 2"/><path d="M7 7h3m-3 4h3m7-4h1m-1 4h1"/>',
  hall: '<path d="m2 9 10-6 10 6H2Zm2 0v12h16V9M2 21h20M7 12v6m5-6v6m5-6v6M12 3V1"/>',
  people: '<circle cx="10" cy="7" r="3"/><path d="M4 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m3 11v-4a6 6 0 0 0-2-4"/>',
  box: '<path d="m12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10 10-5M2 7l10 5v10M7 4.5l10 5V15"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8ZM12 1v2m0 18v2M1 12h2m18 0h2"/>',
  gear: '<path d="m10 2-1 3-3 1-3-1-1 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3h-4Z" transform="translate(-1 -1) scale(.95)"/><circle cx="12" cy="12" r="3"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M3 12h17m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  moon: '<path d="M20.5 14A9 9 0 0 1 10 3a9 9 0 1 0 10.5 11Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  hammer: '<path d="m14 3 6 6-3 3-3-3-8 11-3-3 11-8-3-3 3-3Z"/><path d="m16 1 7 7"/>',
  scroll: '<path d="M6 3h13a2 2 0 0 1 2 2v3h-5V5a2 2 0 0 1 4-1M6 3a2 2 0 0 0-2 2v13H2v1a2 2 0 0 0 2 2h12V8M4 21a2 2 0 0 0 2-2v-1h10v1a2 2 0 0 1-2 2M8 8h5m-5 4h5"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  'sound-off': '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m-6 0 6-6"/>',
  balance: '<path d="M12 3v18m-6 0h12M3 7h18M6 7l-4 8h8L6 7Zm12 0-4 8h8l-4-8Z"/>',
  bolt: '<path d="m14 2-10 12h7l-1 8 10-12h-7l1-8Z"/>',
  planet: '<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="12" ry="3" transform="rotate(-25 12 12)"/>',
  leaf: '<path d="M20 3C7 1 0 11 6 17c6 6 16-1 14-14ZM4 21l12-12"/>',
  mountain: '<path d="m1 21 8-17 5 10 3-6 6 13H1Zm5-10 3 2 3-2m3 6 2 1 2-1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
};

const $ = selector => document.querySelector(selector);
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name] ?? PATHS.sun}</svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const resourceIcons = { wood: 'wood', stone: 'stone', food: 'wheat', coin: 'coin', knowledge: 'science' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const format = value => {
  if (value >= 1e12) return value.toExponential(1);
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`;
  return Math.floor(value).toLocaleString('zh-CN');
};
function duration(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  if (s >= 86400) return `${Math.floor(s / 86400)}天 ${Math.floor(s % 86400 / 3600)}时`;
  if (s >= 3600) return `${Math.floor(s / 3600)}时 ${Math.floor(s % 3600 / 60)}分`;
  return s >= 60 ? `${Math.floor(s / 60)}分 ${s % 60}秒` : `${s}秒`;
}
function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
}

let stored = null;
try { stored = localStorage.getItem(SAVE_KEY); } catch { /* Storage availability is reported on save. */ }
let state = restoreGame(stored);
let offlineReport = advanceTime(state, Date.now(), true);
let selected = 'hall';
let tab = 'world';
let zoom = 1;
let camera = { x: 0, y: 0 };
let toastTimer;
let audioContext;
let audioNodes = [];
let saveWarningShown = false;
let isWriter = !navigator.locks;
let releaseWriter;
let lastSaved = Date.now();
let lastArt = '';
let mapMode = 'home';
let selectedTile = WORLD.home;
let settlementScene;
let worldScene;
let baseScene;
let placement = null;
let scrimTapStarted=false;
let selectedTerrain = {x:17,y:12};

function terrainPanel(){
  const {x,y}=selectedTerrain,clear=isCleared(state.base,x,y),o=OBSTACLES[terrainAt(x,y)],job=state.base.clearing;
  const error=canClear(state,x,y),running=job?.x===x&&job?.y===y;
  return `<div class="context-heading"><span class="context-icon">${icon(clear?'leaf':o.icon)}</span><div><h2>${clear?'可以建设了':o.name}</h2><p>${clear?'选择一座建筑，安放在这里':o.description}</p></div></div>${clear?'<button class="primary-button" data-action="build">选择建筑</button>':running?`<div class="task-status"><span class="working-dot"></span>农民正在清理 <b data-countdown="${job.end}"></b></div><div class="progress-track"><span class="progress-fill" data-progress-start="${job.start}" data-progress-end="${job.end}"></span></div>`:`<div class="terrain-reward"><span>清理获得</span>${costs(o.reward,true)}<small>${o.seconds}秒</small></div><button class="primary-button" data-action="clear-land" ${error||job?'disabled':''}>${icon('hammer')}派农民清理 <span class="button-cost">${icon('wheat')}${o.food}</span></button>${error||job?`<p class="detail-footnote">${error??'等当前农民清理完成'}</p>`:''}`}`;
}

function buildingControls(id){
  if(!state.buildings[id])return '';
  const job={farm:'food',lumber:'wood',quarry:'stone'}[id];
  if(job)return `<div class="worker-job"><span>${icon(resourceIcons[{food:'food',wood:'wood',stone:'stone'}[job]])} ${JOBS[job]}农民</span><button data-action="job-remove" data-id="${job}" aria-label="减少${JOBS[job]}农民">−</button><b>${state.base.jobs[job]}</b><button data-action="job-add" data-id="${job}" aria-label="增加${JOBS[job]}农民">＋</button></div>`;
  if(id==='hall'||id==='homes')return `<div class="quick-options"><button data-action="recruit">${icon('people')}<span>招募农民</span><small>30食物 · 10贝币</small></button><button data-action="${id==='hall'?'research-panel':'settlers'}">${icon(id==='hall'?'science':'people')}<span>${id==='hall'?'研究科技':'分配工作'}</span><small>${id==='hall'?nextResearch(state).name:'空闲 '+idleWorkers(state)+' 人'}</small></button></div>`;
  if(id==='library')return '<button class="secondary-button" data-action="research-panel">研究科技</button>';
  if(id==='barracks')return `<div class="quick-options">${Object.entries(TROOPS).map(([type,u])=>`<button data-action="train" data-id="${type}" ${state.buildings.barracks<u.level?'disabled':''}>${icon('hammer')}<span>${u.name}</span><small>${u.seconds}秒${state.buildings.barracks<u.level?' · 需Lv.'+u.level:''}</small></button>`).join('')}</div>`;
  if(id==='tower')return '<button class="secondary-button" data-action="map-mode" data-id="world">派遣探索队</button>';
  if(id==='market')return '<button class="secondary-button" data-action="policy">发展方针</button>';
  return '';
}

function toast(message) {
  $('#toast-region').innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast-region').innerHTML = ''; }, 3400);
}

function save() {
  if (!isWriter) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    lastSaved = Date.now();
    $('#save-status').textContent = '文明已保存';
  } catch {
    $('#save-status').textContent = '存档不可用';
    if (!saveWarningShown) toast('当前浏览器无法保存，请在设置中导出存档，避免进度丢失');
    saveWarningShown = true;
  }
}

function costs(cost, reward = false) {
  return Object.entries(cost).map(([id, amount]) => `<span class="cost ${!reward && state.resources[id] < amount ? 'insufficient' : ''}" data-cost="${id}" data-amount="${amount}" title="${ERAS[state.era].labels[RESOURCE_IDS.indexOf(id)]}">${icon(resourceIcons[id])}${reward ? '+' : ''}${format(amount)}</span>`).join('');
}

function renderResources() {
  if (!$('#resource-band').children.length) {
    $('#resource-band').innerHTML = RESOURCE_IDS.map(id => `<button class="resource" data-action="inventory" data-resource="${id}"><span class="resource-icon">${icon(resourceIcons[id])}</span><div class="resource-text"><div class="resource-label"></div><div class="resource-amount"></div></div><span class="resource-rate"></span><div class="resource-cap"><span></span></div></button>`).join('')+`<button class="resource-more" data-action="inventory" aria-label="查看全部资源">${icon('box')}</button>`;
  }
  const production = rates(state);
  RESOURCE_IDS.forEach((id, i) => {
    const element = $(`[data-resource="${id}"]`);
    const full = state.resources[id] >= capacity(state) - .01;
    element.querySelector('.resource-label').textContent = ERAS[state.era].labels[i];
    element.querySelector('.resource-amount').textContent = format(state.resources[id]);
    element.querySelector('.resource-rate').textContent = full ? '仓库已满' : `+${format(production[id])} / 分`;
    element.querySelector('.resource-cap span').style.width = `${Math.min(100, state.resources[id] / capacity(state) * 100)}%`;
    element.setAttribute('aria-label',ERAS[state.era].labels[i]+' '+format(state.resources[id])+'，查看资源');
    element.title = `${ERAS[state.era].labels[i]} ${format(state.resources[id])} / ${format(capacity(state))}，每分钟 +${format(production[id])}`;
  });
}

function renderMilestones() {
  $('#milestones').innerHTML = MILESTONES.map(goal => {
    const claimed = state.claimed.includes(goal.id);
    const ready = goal.test(state) && !claimed;
    return `<button class="milestone ${claimed ? 'claimed' : ready ? 'claimable' : ''}" data-action="claim" data-id="${goal.id}" ${claimed ? 'disabled' : ''}><span class="milestone-check">${claimed || ready ? icon('check') : ''}</span><span><strong>${goal.name}</strong><small>${goal.detail}</small></span>${ready ? '<span class="claim-text">领取</span>' : ''}</button>`;
  }).join('');
  $('#goal-count').textContent = `${state.claimed.length} / 4`;
  const next = MILESTONES.find(goal => !state.claimed.includes(goal.id));
  $('#mobile-objective').innerHTML = `${icon('scroll')}<span>${next ? escapeHtml(next.test(state) ? `${next.name} · 奖励已就绪` : next.detail) : '开拓手记已完成，准备迈向下一个时代'}</span><button data-action="${next ? 'claim' : 'eras'}" data-id="${next?.id ?? ''}">${next?.test(state) ? '领取馈赠' : '查看'} ${icon('chevron')}</button>`;
}

function renderStats() {
  const population = `${Math.floor(state.population)} / ${populationCap(state)}`;
  $('#settlement-stats').innerHTML = [
    ['people', '居民人口', population], ['box', '仓储容量', format(capacity(state))],
    ['balance', '发展方针', POLICIES[state.policy].name], ['compass', '远行发现', `${state.explored} 次`],
  ].map(([i, name, value]) => `<div class="stat-row"><span>${icon(i)}${name}</span><b>${value}</b></div>`).join('');
}

function coordinates(building) {
  const stone = { hall: [36, 48], farm: [58, 65], lumber: [20, 34], quarry: [58, 30], homes: [20, 67], library: [44, 78], warehouse: [30, 81], market: [71, 48], tower: [76, 74] };
  return state.era === 0 ? (stone[building.id] ?? [building.x,building.y]) : [building.x, building.y];
}

function renderMap() {
  if(baseScene)baseScene.selected=selected;
  const era = ERAS[state.era];
  if (lastArt !== era.art) {
    $('#map-art').style.backgroundImage = `url('./assets/${era.art}.webp')`;
    lastArt = era.art;
  }
  $('#era-name').textContent = era.name;
  $('#era-kicker').textContent = `文明纪元 · ${ROMAN[state.era]}${state.cycle ? ` · 星域 ${state.cycle + 1}` : ''}`;
  $('#era-subtitle').textContent = era.subtitle;
  $('#world-name').textContent = ['初火之谷', '曦光河谷', '曦原城邦', '新生之城', '明日之城', '第一星港', '群星家园', `曦原星域 · ${state.cycle + 1}`][state.era];
  const onMap = BUILDINGS.filter(b => state.buildings[b.id] || b.id === 'library' || b.id === 'tower');
  $('#map-buildings').innerHTML = onMap.map(b => {
    const [x, y] = coordinates(b);
    const level = state.buildings[b.id];
    const busy = state.construction.some(j => j.id === b.id);
    return `<button class="map-pin ${selected === b.id ? 'selected' : ''} ${level ? '' : 'unbuilt'} ${busy ? 'busy' : ''}" style="left:${x}%;top:${y}%" data-action="select" data-id="${b.id}" aria-label="${buildingName(state, b)} ${level ? `等级${level}` : '待建设'}"><span class="pin-stem"></span><span class="pin-label">${!level ? icon('plus') : ''}<b>${buildingName(state, b)}</b><small>${level ? `Lv.${level}` : '新建'}</small></span></button>`;
  }).join('');
  // New buildings are rendered as individual map objects on the agricultural map.
  $('#new-structures').innerHTML = state.era > 0 && state.era < 3 ? BUILDINGS.filter(b => ['library', 'warehouse'].includes(b.id) && state.buildings[b.id]).map(b => {
    const [x, y] = coordinates(b);
    return `<div class="new-structure" style="left:${x}%;top:${y}%;background-position:${b.sprite % 3 * 50}% ${Math.floor(b.sprite / 3) * 100}%"></div>`;
  }).join('') : '';
  $('#expedition-notice').hidden = !state.expeditionReward || mapMode === 'world';
  worldScene?.update();
}

function chronicleHtml() {
  return `<div class="chronicle-preview"><h3>${icon('scroll')}文明纪事</h3>${state.chronicle.slice(0, 3).map(entry => `<div class="chronicle-entry"><div>${escapeHtml(entry.text)}<time>${new Date(entry.at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time></div></div>`).join('')}</div>`;
}

function spriteStyle(b){
  const index=state.era===0?({hall:0,farm:1,lumber:2,quarry:3,homes:4,library:5,warehouse:2,market:4,tower:0,barracks:4})[b.id]:b.sprite;
  return `background-image:url(./assets/${state.era===0?'village-atlas-v6.webp':'buildings.png'});background-size:300% ${state.era===0?300:200}%;background-position:${index%3*50}% ${Math.floor(index/3)*(state.era===0?50:100)}%`;
}
function buildingPanel(id){
  const b=BUILDINGS.find(b=>b.id===id),plan=buildingPlan(state,id),level=state.buildings[id],job=state.construction.find(j=>j.id===id);
  const descriptions={hall:'营地的中心，升级解锁更多建筑',farm:'采集食物，迎接更多居民',lumber:'生产木材，建起新的家园',quarry:'开采石料，用于建造和升级',homes:'增加居民人口上限',library:'积累学识，研究新的科技',warehouse:'增加所有资源的储存上限',market:'交换物资，积累财富',tower:'为远方探索提供补给',barracks:'训练士兵，守护营地'};
  const effect=b.resource?`${ERAS[state.era].labels[RESOURCE_IDS.indexOf(b.resource)]} +${format(rates(state)[b.resource])}/分`:id==='homes'?`人口 ${Math.floor(state.population)}/${populationCap(state)}`:id==='warehouse'?`容量 ${format(capacity(state))}`:`${level?'等级 '+level:'尚未建造'}`;
  return `<div class="context-heading"><div class="mini-building" style="${spriteStyle(b)}"></div><div><h2>${buildingName(state,b)}<span class="level-chip">${level?'Lv.'+level:'新建'}</span></h2><p>${descriptions[id]}</p><small class="context-effect">${effect}</small></div></div>${job?`<div class="task-status"><span class="working-dot"></span>正在升级至 Lv.${job.level}<b data-countdown="${job.end}"></b></div><div class="progress-track"><span class="progress-fill" data-progress-start="${job.start}" data-progress-end="${job.end}"></span></div>`:''}${buildingControls(id)}<div class="upgrade-row"><span>${level?'升级至 Lv.'+plan.level:'建造需要'}</span><div class="resource-cost">${costs(plan.cost)}</div></div><div class="context-actions">${state.base.positions[id]?`<button class="move-button" data-action="relocate" data-id="${id}" aria-label="移动建筑">${icon('target')}<span>移动</span></button>`:''}<button class="primary-button" data-action="${state.base.positions[id]?'upgrade':'place'}" data-id="${id}" data-afford="${id}">${icon(plan.locked?'lock':'hammer')}<span>${plan.locked?'营地 Lv.'+b.unlock+' 解锁':level?'升级':'选择位置'}</span><small>${duration(plan.seconds)}</small></button></div>`;
}

function buildPanel(){
  return `<h2>建造</h2><p class="panel-hint">选择建筑，再点击空地放置</p><div class="blueprint-grid">${BUILDINGS.map(b=>{const locked=state.buildings.hall<b.unlock;return `<button class="building-card ${locked?'blueprint-locked':''}" data-action="select" data-id="${b.id}"><span class="blueprint-image" style="${spriteStyle(b)}"></span><strong>${buildingName(state,b)}</strong><small>${locked?'营地 Lv.'+b.unlock+' 解锁':state.buildings[b.id]?'Lv.'+state.buildings[b.id]+' · 升级':Object.entries(buildingPlan(state,b.id).cost).slice(0,2).map(([k,v])=>icon(resourceIcons[k])+v).join(' ')}</small></button>`;}).join('')}</div>`;
}

function researchPanel(){
  const tech=nextResearch(state),running=state.research,locked=tech.era>state.era;
  return `<div class="context-heading"><span class="context-icon">${icon(tech.icon)}</span><div><h2>${tech.name}</h2><p>${tech.detail}</p></div></div><div class="terrain-reward"><span>${icon('science')} ${format(tech.cost)} 学识</span><small>${duration(tech.seconds)}</small></div>${running?`<div class="task-status"><span class="working-dot"></span>研究中 <b data-countdown="${running.end}"></b></div><div class="progress-track"><span class="progress-fill" data-progress-start="${running.start}" data-progress-end="${running.end}"></span></div>`:`<button class="primary-button" data-action="research" data-research-button>${icon(locked?'lock':'science')}${locked?ERAS[tech.era].name+'解锁':'开始研究'}</button>`}<details class="more-details"><summary>已掌握 ${state.technologies.length} 项科技</summary>${TECHNOLOGIES.filter(t=>state.technologies.includes(t.id)).map(t=>`<p>${icon('check')} ${t.name}</p>`).join('')||'<p>从磨制第一把石器开始</p>'}</details>`;
}

function setMapMode(mode) {
  mapMode = mode === 'world' ? 'world' : 'home';
  const world = mapMode === 'world';
  tab = world ? 'explore' : 'world';
  $('#map-viewport').classList.toggle('world-mode', world);
  document.body.classList.toggle('view-world',world);
  baseScene.focused=false;
  baseScene.terrainSelected=null;
  $('#map-scene').hidden = world;
  $('#world-map-view').hidden = !world;
  $('#world-tools').hidden = !world;
  $('#world-map-hud').hidden = !world;
  worldScene.active = world;
  settlementScene.active = false;
  baseScene.active = !world;
  $('#base-map-view').hidden = world;
  $('#right-sidebar').classList.remove('open');
  document.body.classList.remove('panel-open');
  $('#sheet-scrim').hidden = true;
  document.querySelectorAll('[data-action="map-mode"]').forEach(button => {
    const active = button.dataset.id === mapMode;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  });
  worldScene.resize();
  renderAll();
}

function updateWorldHud() {
  if (!state.world) return;
  const world = state.world, task = world.survey;
  const total = WORLD.columns * WORLD.rows;
  const ratio = (world.revealed.length / total * 100).toFixed(1);
  $('#world-map-hud').innerHTML = `<div class="world-hud-main">${icon('compass')}<span><strong>${task ? '探索队正在赶路' : world.auto ? '探索队准备下一段旅程' : '探索队已驻扎'}</strong><small>${task ? `${tileInfo(task.target).label} · ${duration((task.end - Date.now()) / 1000)}` : world.auto ? '补给充足时继续勘探；新地形需要相应技术' : '可选择地区勘探，或重新开启自动探索'}</small></span><button data-action="toggle-auto" aria-pressed="${world.auto}" ${isWriter ? '' : 'disabled'}>${world.auto ? '暂停探索' : '自动探索'}</button></div><div class="world-reveal-progress"><span style="width:${ratio}%"></span></div><div class="world-progress-caption"><span>已勘明 ${world.revealed.length} / ${total} 地区 · ${ratio}%</span><span>发现 ${world.sites.length} 处资源地</span></div>`;
  if (mapMode === 'world') {
    $('#world-name').textContent = '未竟之境';
    $('#world-year').textContent = `已勘明 ${ratio}% · ${world.trips} 次勘探`;
  }
}

function explorePanel(){
 const world=state.world,tile=tileInfo(selectedTile),known=world.revealed.includes(selectedTile),plan=surveyPlan(state,selectedTile),visited=world.visited.includes(selectedTile);
 return `<div class="context-heading"><span class="context-icon">${icon(known?tile.icon:'compass')}</span><div><h2>${selectedTile===WORLD.home?'文明的起点':known?tile.label:'未知地区'}</h2><p>${known?tile.name:'沿着迷雾边缘，看看外面的世界'}</p></div></div>${world.survey?`<div class="task-status"><span class="working-dot"></span>探索队正在前进 <b data-countdown="${world.survey.end}"></b></div>`:!plan.blocked?`<div class="terrain-reward"><span>${icon('wheat')} ${plan.food} 补给</span><small>${duration(plan.seconds)}</small></div>`:`<p class="panel-hint">${plan.blocked}</p>`}<button class="primary-button" data-action="survey" ${world.survey||plan.blocked?'disabled':''}>${icon('compass')}${world.survey?'探索进行中':visited?'已勘明':'探索这里'}</button><button class="secondary-button" data-action="toggle-auto">${world.auto?'暂停自动探索':'开启自动探索'}</button><details class="more-details"><summary>探索设置与发现</summary><button class="secondary-button" data-action="nearby-frontier">寻找附近边界</button><label for="world-direction">探索方向</label><select id="world-direction">${[['balanced','均衡'],['east','向东'],['west','向西'],['north','向北'],['south','向南']].map(([id,name])=>`<option value="${id}" ${world.direction===id?'selected':''}>${name}</option>`).join('')}</select><p>已发现 ${world.sites.length} 处资源地。青铜筑造可翻山，道路远航可渡海。</p><button class="secondary-button" data-action="legacy-expedition">资源远征</button></details>`;
}

function beginPlacement(id){
  if(!isWriter)return toast('请先关闭另一游戏窗口');
  placement=id;closePanel();setMapMode('home');baseScene.begin(id);
  $('#right-sidebar').classList.remove('open');$('#sheet-scrim').hidden=true;
  $('#placement-hud').hidden=false;updatePlacement(baseScene.ghost);
}
function updatePlacement(p){
  if(!placement)return;
  const valid=fits(state.base,placement,p);
  $('#placement-hud').innerHTML=`<strong>${valid?'可以建造':'需先拓荒，或位置已被占用'} · ${p.x}, ${p.y}</strong><small>在已开垦空地选址；取消后点击树林、石堆可拓荒</small><div><button id="confirm-placement" ${valid?'':'disabled'}>确认${state.base.positions[placement]?'迁移':'建造'}</button><button id="cancel-placement">取消</button></div>`;
  $('#confirm-placement').onclick=()=>{
    advanceTime(state);
    const result=state.base.positions[placement]?moveBuilding(state,placement,baseScene.ghost):startBuilding(state,placement,Date.now(),baseScene.ghost);
    if(result.ok){baseScene.placing=null;placement=null;$('#placement-hud').hidden=true;}
    runAction(result);
  };
  $('#cancel-placement').onclick=()=>{placement=null;baseScene.placing=null;$('#placement-hud').hidden=true;};
}
function updateWorkforceLive(){
  document.querySelectorAll('[data-time-left]').forEach(e=>{e.textContent=duration((Number(e.dataset.timeLeft)-Date.now())/1000);});
  const badge=$('#workforce-badge');if(badge)badge.textContent=`农民 ${state.base.workers} · 空闲 ${idleWorkers(state)} · 军队 ${armySize(state)}`;
}
function settlersPanel(){
  const base=state.base;
  return `<h2>营地居民</h2><p class="panel-hint" id="workforce-badge"></p><button class="primary-button" data-action="recruit">${icon('people')}招募农民 <span class="button-cost">${icon('wheat')}30 ${icon('coin')}10</span></button>${base.recruit.map((j,i)=>`<div class="task-status">招募中 <b data-time-left="${j.end}"></b></div>`).join('')}<div class="jobs-list">${Object.entries(JOBS).map(([id,name])=>`<div class="worker-job"><span>${icon({wood:'wood',stone:'stone',food:'wheat',builder:'hammer'}[id])}${name}</span><button data-action="job-remove" data-id="${id}" aria-label="减少${name}农民">−</button><b>${base.jobs[id]}</b><button data-action="job-add" data-id="${id}" aria-label="增加${name}农民">＋</button></div>`).join('')}</div><details class="more-details"><summary>军队 ${armySize(state)} 人</summary>${Object.entries(TROOPS).map(([id,u])=>`<div class="troop-row"><span>${u.name} · ${base.army[id]} 人<small>${costs({food:u.food,wood:u.wood,coin:u.coin})}</small></span><button class="secondary-button" data-action="train" data-id="${id}" ${(state.buildings.barracks??0)<u.level?'disabled':''}>${(state.buildings.barracks??0)<u.level?'需兵营 Lv.'+u.level:'训练'}</button></div>`).join('')}${base.training.map(j=>`<p>${TROOPS[j.type].name}训练中 <b data-time-left="${j.end}"></b></p>`).join('')}</details>`;
}

function legacyExplorePanel() {
  if (state.expeditionReward) {
    return `<div class="detail-kicker">A GIFT FROM THE UNKNOWN</div><h2>远行的馈赠</h2><p class="detail-subtitle">${escapeHtml(state.expeditionReward.title)}。探索者已安全回到家园。</p><div class="welcome-symbol" style="text-align:center;margin:30px 0">${icon('compass')}</div><div class="resource-cost">${costs(state.expeditionReward.resources, true)}</div><button class="primary-button" data-action="collect">${icon('box')}收下这份发现</button><p class="detail-footnote">超过仓储容量的资源将无法收入，请留好空间</p>${chronicleHtml()}`;
  }
  if (state.expedition) {
    const expedition = state.expedition;
    const route = expeditionPlan(state, expedition.route);
    return `<div class="detail-kicker">BEYOND THE HORIZON</div><h2>探索者在路上</h2><p class="detail-subtitle">${state.era >= 4 ? route.later : route.name}<br>沿途的见闻，将成为文明的新故事。</p><div class="welcome-symbol" style="text-align:center;margin:40px 0">${icon('compass')}</div><div class="progress-track"><span class="progress-fill" data-progress-start="${expedition.start}" data-progress-end="${expedition.end}"></span></div><p class="detail-footnote">预计 <span data-countdown="${expedition.end}"></span> 后归来<br>离线期间，探索仍会继续</p>${chronicleHtml()}`;
  }
  return `<div class="detail-kicker">BEYOND THE HORIZON</div><h2>世界的另一边</h2><p class="detail-subtitle">为探索者准备补给，等候远方的消息。<br>每次远征都会带回新的资源。</p><div style="margin-top:22px">${ROUTES.map(r => {
    const p = expeditionPlan(state, r.id);
    return `<div class="route-card"><div class="route-top">${icon(r.icon)}<h3>${state.era >= 4 ? r.later : r.name}</h3></div><p>${r.description}</p><div class="route-meta"><span>${icon('wheat')} ${format(p.food)} 补给</span><span>${icon('clock')} ${duration(p.seconds)}</span></div><button class="secondary-button" data-action="expedition" data-id="${r.id}" data-expedition-button="${r.id}" ${state.resources.food < p.food ? 'disabled' : ''}>派遣探索者 ${icon('arrow')}</button></div>`;
  }).join('')}</div><p class="detail-footnote">已发现 ${state.explored} 处远方的馈赠</p>`;
}

function erasPanel(){
  const target=eraRequirements(state),requirements=[['营地等级',state.buildings.hall,target.hall],['掌握科技',state.technologies.length,target.tech],['累计生产',state.produced,target.threshold]];
  return `<h2>${ERAS[state.era].name}</h2><p class="panel-hint">下一站 · ${target.name}</p><button class="research-shortcut" data-action="research-panel">${icon('science')}<span><strong>${nextResearch(state).name}</strong><small>${state.research?'正在研究':'研究下一项科技'}</small></span>${icon('chevron')}</button>${requirements.map(([label,value,total])=>`<div class="requirement ${value>=total?'met':''}"><span>${label}</span><b>${format(value)} / ${format(total)}</b></div>`).join('')}<div class="resource-cost">${costs(target.cost)}</div><button class="primary-button" data-action="advance" data-era-button>${icon('flame')}进入${target.name}</button><details class="more-details"><summary>查看所有时代</summary><div class="era-trail">${ERAS.map((era,i)=>`<span class="${i===state.era?'current':''}">${i<state.era?icon('check'):''}${era.name}</span>`).join('')}<span>无尽星域</span></div></details>`;
}
function inventoryPanel(){
 const production=rates(state);return `<h2>资源</h2><p class="panel-hint">自动采集 · 离线也在积累</p>${RESOURCE_IDS.map((id,i)=>`<div class="inventory-row"><span class="inventory-icon">${icon(resourceIcons[id])}</span><span><strong>${ERAS[state.era].labels[i]}</strong><small>每分钟 +${format(production[id])}</small></span><b>${format(state.resources[id])}<small>/ ${format(capacity(state))}</small></b></div>`).join('')}<details class="more-details"><summary>开拓奖励</summary>${MILESTONES.map(g=>`<button class="goal-row" data-action="claim" data-id="${g.id}" ${state.claimed.includes(g.id)?'disabled':''}><span>${g.name}<small>${g.detail}</small></span><b>${state.claimed.includes(g.id)?'已领':g.test(state)?'领取':'查看'}</b></button>`).join('')}</details>`;
}

function renderPanel() {
  const html = { inventory: inventoryPanel, terrain: terrainPanel, settlers: settlersPanel, world: () => buildingPanel(selected), build: buildPanel, research: researchPanel, explore: explorePanel, eras: erasPanel }[tab]();
  $('#right-sidebar').dataset.panel=tab;$('#right-sidebar').dataset.cell=tab==='terrain'?`${selectedTerrain.x},${selectedTerrain.y}`:'';
  $('#detail-panel').innerHTML = `<div class="detail-content">${html}</div>`;
  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
}

function renderQueue() {
  $('#construction-strip').hidden=!state.construction.length&&!state.base.clearing;
  $('#scene-hint').hidden=mapMode==='world'||state.base.cleared.length>64||!!state.base.clearing||!!state.construction.length;
  const job = state.construction[0];
  if(!job&&state.base.clearing){const c=state.base.clearing;$('#construction-strip').innerHTML=`<span class="queue-icon">${icon('wood')}</span><div class="queue-body"><div class="queue-top"><strong>农民正在拓荒 · ${c.x}, ${c.y}</strong><small data-countdown="${c.end}"></small></div><div class="progress-track"><span class="progress-fill" data-progress-start="${c.start}" data-progress-end="${c.end}"></span></div></div><button class="queue-idle-action" data-action="inspect-clearing">查看</button>`;return;}
  if (!job) {
    $('#construction-strip').innerHTML='';
    return;
  }
  const building = BUILDINGS.find(b => b.id === job.id);
  $('#construction-strip').innerHTML = `<span class="queue-icon">${icon('hammer')}</span><div class="queue-body"><div class="queue-top"><strong>${buildingName(state, building)} · Lv.${job.level}</strong><small data-countdown="${job.end}"></small></div><div class="progress-track"><span class="progress-fill" data-progress-start="${job.start}" data-progress-end="${job.end}"></span></div></div><button class="queue-count" data-action="build">队列 ${state.construction.length} / 3 ${icon('chevron')}</button>`;
}

function renderAll() {
  renderResources(); renderMilestones(); renderStats(); renderMap(); renderQueue(); renderPanel(); updateLive();
}

function updateLive() {
  const now = Date.now();
  document.querySelectorAll('[data-countdown]').forEach(element => { element.textContent = duration((Number(element.dataset.countdown) - now) / 1000); });
  document.querySelectorAll('[data-progress-start]').forEach(element => {
    const start = Number(element.dataset.progressStart), end = Number(element.dataset.progressEnd);
    element.style.width = `${Math.max(0, Math.min(100, (now - start) / (end - start) * 100))}%`;
  });
  document.querySelectorAll('[data-cost]').forEach(element => { element.classList.toggle('insufficient', state.resources[element.dataset.cost] < Number(element.dataset.amount)); });
  document.querySelectorAll('[data-afford]').forEach(button => {
    const plan = buildingPlan(state, button.dataset.afford);
    button.disabled = !isWriter || plan.locked || state.construction.length >= 3 || !canAfford(state, plan.cost);
  });
  document.querySelectorAll('[data-research-button]').forEach(button => {
    const t = nextResearch(state);
    button.disabled = !isWriter || !!state.research || t.era > state.era || state.resources.knowledge < t.cost;
  });
  document.querySelectorAll('[data-expedition-button]').forEach(button => {
    button.disabled = !isWriter || !!state.expedition || !!state.expeditionReward || state.resources.food < expeditionPlan(state, button.dataset.expeditionButton).food;
  });
  document.querySelectorAll('[data-era-button]').forEach(button => {
    const t = eraRequirements(state);
    button.disabled = !isWriter || state.buildings.hall < t.hall || state.technologies.length < t.tech || state.produced < t.threshold || !canAfford(state, t.cost);
  });
  document.querySelectorAll('[data-action="survey"]').forEach(button => {
    const plan = surveyPlan(state, selectedTile);
    button.disabled = !isWriter || !!state.world.survey || !!plan.blocked || state.resources.food < plan.food;
  });
  $('#explore-dot').hidden = !state.expeditionReward && !state.world.sites.length;
  $('#build-dot').hidden = state.construction.length >= 3;
  $('#world-year').textContent = `纪元 ${Math.floor((now - state.createdAt) / 60000) + 1} 年 · ${state.era >= 5 ? `第 ${state.cycle + 1} 星域` : `${Math.floor(state.population)} 位居民`}`;
  if (!isWriter) $('#save-status').textContent = '另一窗口正在发展';
  updateWorkforceLive();
  updateWorldHud();
  worldScene?.update();
}

function openPanel(nextTab = tab) {
  scrimTapStarted=false;
  tab = nextTab;
  renderPanel(); updateLive();
  if (true) {
    document.body.classList.add('panel-open');
    baseScene.focused=nextTab==='world';
    $('#right-sidebar').classList.add('open'); $('#sheet-scrim').hidden = false;
    $('#panel-close').focus({ preventScroll: true });
  }
  $('#right-sidebar').scrollTop = 0;
}
function closePanel() {
  document.body.classList.remove('panel-open');
  baseScene.focused=false;baseScene.terrainSelected=null;
  $('#right-sidebar').classList.remove('open'); $('#sheet-scrim').hidden = true;
  tab = mapMode === 'world' ? 'explore' : 'world'; renderPanel();
}

let dialogReturnFocus;
function showDialog(html) {
  const dialog = $('#game-dialog');
  if (dialog.open) dialog.close();
  dialogReturnFocus = document.activeElement;
  $('#dialog-content').innerHTML = `<div class="dialog-inner">${html}</div>`;
  dialog.showModal();
}
function closeDialog() { $('#game-dialog').close(); dialogReturnFocus?.focus?.({ preventScroll: true }); }

function helpDialog(){
  showDialog(`<h2>设置</h2><div class="settings-grid"><button data-action="toggle-sound" aria-pressed="${!!audioContext}">${icon(audioContext?'sound':'sound-off')}${audioContext?'关闭声音':'开启声音'}</button><button data-action="toggle-motion">${icon('leaf')}${baseScene.paused?'开启动画':'暂停动画'}</button><button data-action="export">${icon('box')}导出存档</button><button data-action="import">${icon('scroll')}导入存档</button></div><input type="file" id="save-import" accept="application/json,.json" hidden><button class="secondary-button" data-action="policy">发展方针</button><details class="more-details"><summary>怎么玩</summary><p>点击树木或石堆，派农民开出新土地。在「建造」里选建筑，再点空地放置。</p><p>点击建筑可升级、移动或分配农民。双指缩放，单指拖动地图。</p><p>营地和左上角时代入口都能研究科技。去「世界」探索更远的地方。</p><p>自动保存到当前浏览器，离线最多积累24小时资源。换设备前先导出存档。</p></details><button class="text-button danger-button" data-action="reset-prompt">重新建立文明</button>`);
}

function policyDialog() {
  showDialog(`<span class="eyebrow">A DIRECTION FOR YOUR PEOPLE</span><h2>发展方针</h2><p>方针立即生效，也会影响离线期间的产出。</p>${Object.entries(POLICIES).map(([id, p]) => `<button class="policy-choice ${state.policy === id ? 'active' : ''}" data-action="set-policy" data-id="${id}">${icon(p.icon)}<span><strong>${p.name}</strong><small>${p.detail}</small></span>${state.policy === id ? `<span class="choice-check">${icon('check')}</span>` : ''}</button>`).join('')}`);
}

function showOffline(report) {
  if (!report || report.elapsed < 30000) return;
  const gains = Object.entries(report.gains).filter(([, value]) => value >= 1);
  showDialog(`<div class="welcome-symbol">${icon('moon')}</div><span class="eyebrow">WHILE YOU WERE AWAY</span><h2>欢迎回家，开拓者</h2><p>你离开了 ${duration(report.elapsed / 1000)}。<br>篝火没有熄灭，居民仍在为家园忙碌。</p><div class="offline-gains">${gains.length ? gains.map(([id, value]) => `<div class="offline-gain">${icon(resourceIcons[id])}<span>+${format(value)}<small>${ERAS[state.era].labels[RESOURCE_IDS.indexOf(id)]}</small></span></div>`).join('') : '<p class="list-label">仓储已满，扩大仓库可容纳更多产出。</p>'}</div>${report.messages.map(text => `<p class="list-label">${escapeHtml(text)}</p>`).join('')}<p class="detail-footnote">${report.capped ? '离线资源按最多 24 小时结算，工程按真实时间完成。' : '资源已自动收入仓库。'}</p><button class="primary-button" data-action="dismiss">${icon('sun')}看看我的文明</button>`);
}

function runAction(result) {
  if (result?.message) toast(result.message);
  if (result?.ok) { save(); renderAll(); }
}

document.addEventListener('click', event => {
  const tabButton = event.target.closest('[data-tab]');
  if (tabButton) {
    if (tabButton.dataset.tab === 'world') setMapMode('home');
    else if (tabButton.dataset.tab === 'explore') setMapMode('world');
    else openPanel(tabButton.dataset.tab);
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const readActions = ['select', 'build', 'eras', 'policy', 'dismiss', 'export', 'import', 'reset-prompt', 'preview-era', 'map-mode', 'follow-scout', 'fit-world', 'nearby-frontier', 'legacy-expedition','place','relocate','settlers','inventory','home','research-panel','hint-frontier','toggle-sound','toggle-motion'];
  if (!isWriter && !readActions.includes(action)) return toast('这份文明已在另一个窗口打开，请先关闭那个窗口');
  if (isWriter) advanceTime(state);
  switch (action) {
    case 'select': selected = id; setMapMode('home'); renderMap(); openPanel('world'); break;
    case 'map-mode': setMapMode(id); break;
    case 'follow-scout': worldScene.follow(); break;
    case 'fit-world': worldScene.fit(); break;
    case 'nearby-frontier': { const plan = automaticSurveyPlan(state); if (plan) { selectedTile = plan.target; worldScene.select(selectedTile); const p = tilePoint(selectedTile); worldScene.camera.x = p.x; worldScene.camera.y = p.y; openPanel('explore'); } else toast('附近地区已勘明，发展航海与山地技术可继续前进'); break; }
    case 'survey': runAction(startSurvey(state, selectedTile)); break;
    case 'toggle-auto': state.world.auto = !state.world.auto; save(); renderAll(); toast(state.world.auto ? '探索队将持续勘探新地区' : '本次勘探结束后，探索队会原地驻扎'); break;
    case 'legacy-expedition': showDialog(legacyExplorePanel()); break;
    case 'hint-frontier': selectedTerrain={x:17,y:12};baseScene.terrainSelected=selectedTerrain;openPanel('terrain');break;
    case 'toggle-sound': $('#sound-button').click();break;
    case 'toggle-motion': $('#motion-toggle').click();helpDialog();break;
    case 'inventory': openPanel('inventory');break;
    case 'home': setMapMode('home');closePanel();break;
    case 'build': openPanel('build'); break;
    case 'eras': openPanel('eras'); break;
    case 'upgrade': if(!state.base.positions[id]) beginPlacement(id);else runAction(startBuilding(state,id)); break;
    case 'place': case 'relocate': beginPlacement(id); break;
    case 'settlers': openPanel('settlers'); break;
    case 'job-add': runAction(assignJob(state,id,1));break;
    case 'job-remove': runAction(assignJob(state,id,-1));break;
    case 'clear-land': {const result=startClearing(state,selectedTerrain.x,selectedTerrain.y);runAction(result);if(result.ok){closePanel();baseScene.focused=false;}break;}
    case 'inspect-clearing': if(state.base.clearing){selectedTerrain={x:state.base.clearing.x,y:state.base.clearing.y};baseScene.terrainSelected=selectedTerrain;openPanel('terrain');}break;
    case 'research-panel': openPanel('research');break;
    case 'recruit': runAction(recruitFarmer(state));break;
    case 'train': runAction(trainTroop(state,id));break;
    case 'research': runAction(startResearch(state)); break;
    case 'expedition': runAction(startExpedition(state, id)); break;
    case 'collect': runAction(collectExpedition(state)); break;
    case 'claim': {
      const goal = MILESTONES.find(g => g.id === id);
      if (goal && !goal.test(state)) {
        if (id === 'first') { selected = 'hall'; openPanel('world'); }
        else openPanel(id === 'wisdom' ? 'research' : id === 'explorer' ? 'explore' : 'build');
      } else runAction(claimMilestone(state, id));
      break;
    }
    case 'advance': { const result = advanceEra(state); runAction(result); if (result.ok) renderAll(); break; }
    case 'preview-era': { const era = ERAS[Number(id)]; if (era) showDialog(`<span class="eyebrow">A GLIMPSE OF THE FUTURE</span><h2>${era.name}</h2><p>${era.subtitle}</p><img class="era-scene-preview" src="./assets/${era.art}.webp" alt="${era.name}场景预览"><p class="detail-footnote">文明会在你亲手开启这个时代时，迎来这幅图景。</p><button class="secondary-button" data-action="dismiss">继续发展我的文明</button>`); break; }
    case 'policy': policyDialog(); break;
    case 'set-policy': if (POLICIES[id]) { state.policy = id; save(); renderAll(); policyDialog(); toast(`已采用${POLICIES[id].name}`); } break;
    case 'dismiss': closeDialog(); break;
    case 'export': {
      save();
      const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `曦原-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); toast('存档已导出，请妥善保管'); break;
    }
    case 'import': $('#save-import').click(); break;
    case 'reset-prompt': showDialog(`<span class="eyebrow">A NEW BEGINNING</span><h2>重新点燃篝火？</h2><p>当前设备的文明进度将被清除。建议先在手册中导出存档。</p><button class="primary-button" data-action="reset-confirm">确认重新开始</button><button class="secondary-button" data-action="dismiss">保留这份文明</button>`); break;
    case 'reset-confirm': state = newGame(); selected = 'hall'; closeDialog(); save(); renderAll(); toast('新的故事，开始于第一簇篝火'); break;
  }
});

document.addEventListener('change', async event => {
  if (event.target.id === 'world-direction') { if (isWriter && ['balanced','east','west','north','south'].includes(event.target.value)) { state.world.direction = event.target.value; save(); toast('探索方向已调整'); } return; }
  if (event.target.id !== 'save-import' || !event.target.files[0]) return;
  if (!isWriter) return toast('请先关闭另一个游戏窗口，再导入存档');
  try {
    const file = event.target.files[0];
    if (file.size > 1000000) throw new Error('file size');
    const parsed = JSON.parse(await file.text());
    if (parsed.version !== 1 || !parsed.buildings || !parsed.resources || !Number.isFinite(parsed.lastTick)) throw new Error('format');
    state = restoreGame(parsed); const report = advanceTime(state, Date.now(), true);
    selected = 'hall'; closeDialog(); save(); renderAll(); showOffline(report); toast('文明存档已恢复');
  } catch { toast('无法读取这份存档，请选择从曦原导出的 JSON 文件'); }
});

$('#era-button').addEventListener('click', () => openPanel('eras'));
$('#help-button').addEventListener('click', helpDialog);
$('#policy-button').addEventListener('click', policyDialog);
$('#dialog-close').addEventListener('click', closeDialog);
$('#panel-close').addEventListener('click', closePanel);
$('#sheet-scrim').addEventListener('pointerdown',()=>{scrimTapStarted=true;});
$('#sheet-scrim').addEventListener('pointercancel',()=>{scrimTapStarted=false;});
$('#sheet-scrim').addEventListener('click',()=>{if(scrimTapStarted){scrimTapStarted=false;closePanel();}});
$('#expedition-notice').addEventListener('click', () => openPanel('explore'));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#game-dialog').open) closePanel(); });

function sizeMap() {
  const viewport = $('#map-viewport');
  const width = Math.max(viewport.clientWidth, viewport.clientHeight * 1.5);
  const scene = $('#map-scene'); scene.style.width = `${width}px`; scene.style.height = `${width / 1.5}px`;
  updateCamera();
}
function updateCamera() {
  const viewport = $('#map-viewport'), scene = $('#map-scene');
  const maxX = Math.max(0, (parseFloat(scene.style.width) * zoom - viewport.clientWidth) / 2);
  const maxY = Math.max(0, (parseFloat(scene.style.height) * zoom - viewport.clientHeight) / 2);
  camera.x = Math.min(maxX, Math.max(-maxX, camera.x)); camera.y = Math.min(maxY, Math.max(-maxY, camera.y));
  scene.style.transform = `translate(calc(-50% + ${camera.x}px), calc(-50% + ${camera.y}px)) scale(${zoom})`;
}
$('#zoom-in').addEventListener('click', () => { if (mapMode === 'world') return worldScene.zoomBy(1.2); return baseScene.zoomBy(1.2); });
$('#zoom-out').addEventListener('click', () => { if (mapMode === 'world') return worldScene.zoomBy(.8); return baseScene.zoomBy(.8); });
$('#map-home').addEventListener('click', () => { if (mapMode === 'world') return worldScene.home(); return baseScene.home(); });
new ResizeObserver(sizeMap).observe($('#map-viewport'));
let drag;
$('#map-viewport').addEventListener('pointerdown', event => {
  if (event.target.closest('canvas') || mapMode === 'world' || event.target.closest('button')) return;
  drag = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
  $('#map-viewport').setPointerCapture(event.pointerId);
});
$('#map-viewport').addEventListener('pointermove', event => {
  if (!drag || mapMode === 'world') return;
  camera = { x: drag.cameraX + event.clientX - drag.x, y: drag.cameraY + event.clientY - drag.y }; updateCamera();
});
$('#map-viewport').addEventListener('pointerup', () => { drag = null; });
$('#map-viewport').addEventListener('pointercancel', () => { drag = null; });

function refreshSoundSetting(){
 const toggle=$('[data-action="toggle-sound"]');if(toggle){toggle.setAttribute('aria-pressed',String(!!audioContext));toggle.innerHTML=icon(audioContext?'sound':'sound-off')+(audioContext?'关闭声音':'开启声音');}
}

$('#sound-button').addEventListener('click', async () => {
  if (audioContext) {
    await audioContext.close(); audioContext = null; audioNodes = [];
    $('#sound-button').innerHTML = icon('sound-off'); $('#sound-button').setAttribute('aria-pressed', 'false'); $('#sound-button').setAttribute('aria-label', '开启环境音'); refreshSoundSetting();return;
  }
  try {
    audioContext = new AudioContext(); await audioContext.resume();
    [130.81, 196, 261.63].forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .008 / (i + 1);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); audioNodes.push(oscillator, gain);
    });
    $('#sound-button').innerHTML = icon('sound'); $('#sound-button').setAttribute('aria-pressed', 'true'); $('#sound-button').setAttribute('aria-label', '关闭环境音');refreshSoundSetting();
  } catch { audioContext = null;refreshSoundSetting(); toast('当前设备暂时无法播放环境音'); }
});

let hiddenAt = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (isWriter) { advanceTime(state); save(); } hiddenAt = Date.now(); audioContext?.suspend(); }
  else {
    if (isWriter) { const report = advanceTime(state, Date.now(), true); save(); renderAll(); if (hiddenAt) showOffline(report); }
    hiddenAt = null; audioContext?.resume();
  }
});
window.addEventListener('pagehide', () => { if (isWriter) { advanceTime(state); save(); } releaseWriter?.(); });
window.addEventListener('pageshow', event => { if (event.persisted) acquireWriter(); });
window.addEventListener('storage', event => {
  if (event.key === SAVE_KEY && event.newValue && !isWriter) { state = restoreGame(event.newValue); renderAll(); }
});

function acquireWriter() {
  if (!navigator.locks) return;
  navigator.locks.request(SAVE_KEY, { ifAvailable: true }, async lock => {
    if (!lock) { setTimeout(acquireWriter, 3000); return; }
    isWriter = true;
    try { state = restoreGame(localStorage.getItem(SAVE_KEY)); } catch { /* Keep the current state if storage is unavailable. */ }
    const report = advanceTime(state, Date.now(), true);
    renderAll(); save();
    showOffline(offlineReport?.elapsed > report.elapsed ? offlineReport : report); offlineReport = null;
    await new Promise(resolve => { releaseWriter = resolve; });
    isWriter = false;
  }).catch(() => { isWriter = true; save(); });
}

settlementScene = new LivingSettlement($('#living-settlement'), () => state, id => coordinates(BUILDINGS.find(b => b.id === id)));
worldScene = new WorldMap($('#world-canvas'), () => state, id => { selectedTile = id; openPanel('explore'); });
$('#motion-toggle').setAttribute('aria-pressed', String(settlementScene.paused));
$('#motion-toggle').textContent = settlementScene.paused ? '▷' : 'Ⅱ';
$('#motion-toggle').setAttribute('aria-label', settlementScene.paused ? '恢复场景动画' : '暂停场景动画');
$('#motion-toggle').addEventListener('click', () => { const paused = !settlementScene.paused; settlementScene.paused = paused; worldScene.paused = paused; baseScene.paused = paused; $('#motion-toggle').textContent = paused ? '▷' : 'Ⅱ'; $('#motion-toggle').setAttribute('aria-pressed', String(paused)); $('#motion-toggle').setAttribute('aria-label', paused ? '恢复场景动画' : '暂停场景动画'); });
baseScene = new BaseScene($('#base-canvas'),()=>state,id=>{selected=id;openPanel('world');},p=>updatePlacement(p),p=>{if(isCleared(state.base,p.x,p.y)){closePanel();return;}selectedTerrain=p;baseScene.terrainSelected=p;openPanel('terrain');});
settlementScene.active=false;baseScene.paused=settlementScene.paused;worldScene.paused=settlementScene.paused;
fillIcons(); renderAll(); sizeMap(); baseScene.resize(); baseScene.home(); acquireWriter();
if (!navigator.locks) { save(); showOffline(offlineReport); }
setInterval(() => {
  if (!isWriter || document.hidden) return;
  const previousPopulation = state.population;
  const result = advanceTime(state);
  renderResources(); updateLive();
  if (previousPopulation !== state.population) { renderStats(); renderMilestones(); }
  if (result?.messages.length) { renderAll(); toast(result.messages.join(' · ')); save(); }
  if (Date.now() - lastSaved > 5000) save();
}, 1000);
