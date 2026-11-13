import {
  SAVE_KEY, RESOURCE_IDS, ERAS, BUILDINGS, TECHNOLOGIES, POLICIES, ROUTES, MILESTONES,
  newGame, restoreGame, capacity, populationCap, rates, buildingName, buildingPlan,
  canAfford, startBuilding, nextResearch, startResearch, expeditionPlan, startExpedition,
  collectExpedition, claimMilestone, eraRequirements, advanceEra, advanceTime,
} from './engine.js';

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
    $('#resource-band').innerHTML = RESOURCE_IDS.map(id => `<div class="resource" data-resource="${id}"><span class="resource-icon">${icon(resourceIcons[id])}</span><div class="resource-text"><div class="resource-label"></div><div class="resource-amount"></div></div><span class="resource-rate"></span><div class="resource-cap"><span></span></div></div>`).join('');
  }
  const production = rates(state);
  RESOURCE_IDS.forEach((id, i) => {
    const element = $(`[data-resource="${id}"]`);
    const full = state.resources[id] >= capacity(state) - .01;
    element.querySelector('.resource-label').textContent = ERAS[state.era].labels[i];
    element.querySelector('.resource-amount').textContent = format(state.resources[id]);
    element.querySelector('.resource-rate').textContent = full ? '仓库已满' : `+${format(production[id])} / 分`;
    element.querySelector('.resource-cap span').style.width = `${Math.min(100, state.resources[id] / capacity(state) * 100)}%`;
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
  return state.era === 0 ? stone[building.id] : [building.x, building.y];
}

function renderMap() {
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
  $('#expedition-notice').hidden = !state.expeditionReward;
}

function chronicleHtml() {
  return `<div class="chronicle-preview"><h3>${icon('scroll')}文明纪事</h3>${state.chronicle.slice(0, 3).map(entry => `<div class="chronicle-entry"><div>${escapeHtml(entry.text)}<time>${new Date(entry.at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time></div></div>`).join('')}</div>`;
}

function buildingPanel(id) {
  const b = BUILDINGS.find(b => b.id === id);
  const plan = buildingPlan(state, id);
  const level = state.buildings[id];
  let effect = `<div class="effect-row">${icon('hall')}文明中枢等级<b>${level} → ${plan.level}</b></div>`;
  if (b.resource) {
    const label = ERAS[state.era].labels[RESOURCE_IDS.indexOf(b.resource)];
    const current = rates(state)[b.resource];
    const preview = structuredClone(state); preview.buildings[id]++;
    effect = `<div class="effect-row">${icon(resourceIcons[b.resource])}${label}产出<b>${format(current)} → ${format(rates(preview)[b.resource])} / 分</b></div>`;
  }
  if (id === 'homes') effect = `<div class="effect-row">${icon('people')}人口上限<b>${populationCap(state)} → ${populationCap(state) + 8}</b></div>`;
  if (id === 'warehouse') effect = `<div class="effect-row">${icon('box')}全资源容量<b>${format(capacity(state))} → ${format(capacity({ ...state, buildings: { ...state.buildings, warehouse: level + 1 } }))}</b></div>`;
  if (id === 'tower') effect = `<div class="effect-row">${icon('compass')}探索补给效率<b>+${(level + 1) * 10}%</b></div>`;
  const currentJob = state.construction.find(j => j.id === id);
  return `<div class="detail-kicker">${level ? 'SETTLEMENT BUILDING' : 'A NEW BEGINNING'}</div><h2>${buildingName(state, b)}</h2><p class="detail-subtitle">${b.description}</p><div class="building-art-wrap"><div class="building-art ${state.era === 0 ? 'is-stone' : ''}" style="background-position:${b.sprite % 3 * 50}% ${Math.floor(b.sprite / 3) * 100}%" role="img" aria-label="${buildingName(state, b)}建筑插画"></div></div><div class="level-line"><span class="level-medal"><span>${level || '+'}</span></span><small>${level ? `等级 ${level} · ${ERAS[state.era].duration}` : '尚未建成 · 等待开拓'}</small></div><div class="detail-divider">建筑效益</div>${effect}<div class="effect-row">${icon('people')}居民人口<b>${Math.floor(state.population)} / ${populationCap(state)}</b></div><div class="upgrade-preview"><span>${currentJob ? `队列已安排至 Lv.${plan.level - 1}` : level ? '下一级' : '建造所需'}</span><b>Lv.${plan.level} ${icon('arrow')}</b></div><div class="resource-cost">${costs(plan.cost)}</div><button class="primary-button" data-action="upgrade" data-id="${id}" data-afford="${id}" ${plan.locked || state.construction.length >= 3 || !canAfford(state, plan.cost) ? 'disabled' : ''}>${icon(plan.locked ? 'lock' : 'hammer')}<span>${plan.locked ? `中枢 Lv.${b.unlock} 解锁` : level ? '升级建筑' : '开始建设'}</span><small>${duration(plan.seconds)}</small></button><p class="detail-footnote">${state.construction.length ? `建设队列 ${state.construction.length} / 3 · 后续工程自动接续` : '居民会持续施工，离线期间也会推进'}</p>${chronicleHtml()}`;
}

function buildPanel() {
  return `<div class="detail-kicker">SHAPE YOUR CIVILIZATION</div><h2>建设蓝图</h2><p class="detail-subtitle">一砖一木，都是未来的模样。<br>同时可安排三项工程，居民会依次施工。</p><div class="panel-list">${BUILDINGS.map(b => {
    const locked = state.buildings.hall < b.unlock;
    return `<button class="building-card" data-action="select" data-id="${b.id}"><span class="card-icon">${icon(locked ? 'lock' : b.icon)}</span><span class="card-details"><strong>${buildingName(state, b)}</strong><small>${locked ? `中枢 Lv.${b.unlock} 解锁` : state.buildings[b.id] ? '查看效益与升级' : '等待建造'}</small></span><span class="card-level">${state.buildings[b.id] ? `Lv.${state.buildings[b.id]}` : '+'}</span></button>`;
  }).join('')}</div>${state.construction.length ? `<div class="detail-divider">施工队列</div>${state.construction.map((j, i) => `<div class="building-queue-entry">${i + 1}. ${buildingName(state, BUILDINGS.find(b => b.id === j.id))} · Lv.${j.level}<br><small>${i ? '排队中' : '施工中'} · <span data-countdown="${j.end}">${duration((j.end - Date.now()) / 1000)}</span></small></div>`).join('')}` : ''}`;
}

function researchPanel() {
  const tech = nextResearch(state);
  const running = state.research;
  const locked = tech.era > state.era;
  const items = TECHNOLOGIES.filter(t => t.era <= Math.min(7, state.era + 1));
  return `<div class="detail-kicker">THE LIGHT OF DISCOVERY</div><h2>文明的火种</h2><p class="detail-subtitle">每一次发现，都让世界多一种可能。<br>研究完成后，新的知识会永久生效。</p><div class="research-card"><div class="research-symbol">${icon(tech.icon)}</div><h3>${tech.name}</h3><p>${tech.detail}</p><div class="research-meta"><span>${icon('science')} ${format(tech.cost)} ${ERAS[state.era].labels[4]}</span><span>${icon('clock')} ${duration(tech.seconds)}</span></div>${running ? `<div class="progress-track"><span class="progress-fill" data-progress-start="${running.start}" data-progress-end="${running.end}"></span></div><p>研究中 · <span data-countdown="${running.end}"></span></p>` : `<button class="primary-button" data-action="research" data-research-button ${locked || state.resources.knowledge < tech.cost ? 'disabled' : ''}>${icon(locked ? 'lock' : 'science')}${locked ? `${ERAS[tech.era].name}解锁` : '点亮新发现'}</button>`}</div><div class="detail-divider">知识的足迹</div>${items.map(t => `<div class="research-done ${t.era > state.era ? 'locked-tech' : ''}">${icon(state.technologies.includes(t.id) ? 'check' : t.era > state.era ? 'lock' : t.icon)}<span>${t.name}</span><small>${state.technologies.includes(t.id) ? '已掌握' : t.id === tech.id ? running ? '研究中' : '待研究' : '后续解锁'}</small></div>`).join('')}${state.repeatResearch ? `<p class="list-label">宇宙认知已进阶 ${state.repeatResearch} 次。下一层知识仍在等待。</p>` : ''}`;
}

function explorePanel() {
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

function erasPanel() {
  const target = eraRequirements(state);
  const requirements = [
    ['文明中枢', state.buildings.hall, target.hall, '级'],
    ['掌握发现', state.technologies.length, target.tech, '项'],
    ['累计生产', state.produced, target.threshold, ''],
  ];
  const ready = requirements.every(([, value, threshold]) => value >= threshold) && canAfford(state, target.cost);
  return `<div class="detail-kicker">FROM FIRELIGHT TO STARLIGHT</div><h2>文明长卷</h2><p class="detail-subtitle">从脚下的泥土，到头顶的星河。<br>每一个时代，都有值得等待的未来。</p><div class="era-list">${ERAS.map((era, i) => `<div class="era-item ${i === state.era ? 'current' : i < state.era ? 'passed' : ''}"><h3>${era.name}${i === state.era ? '<span class="era-state">当下</span>' : ''}</h3><small>${era.subtitle}</small><button class="era-preview-button" data-action="preview-era" data-id="${i}">预览图景 ${icon('arrow')}</button></div>`).join('')}<div class="era-item"><h3>无尽星域</h3><small>宇宙时代后，每次开拓都增加新的发展目标。<br>当前星域 ${state.cycle + 1}</small></div></div><div class="detail-divider">迈向${target.name}</div>${requirements.map(([label, value, threshold, unit]) => `<div class="requirement ${value >= threshold ? 'met' : ''}"><span>${label}</span><b>${format(value)} / ${format(threshold)} ${unit}</b></div>`).join('')}<div class="resource-cost" style="margin-top:18px">${costs(target.cost)}</div><button class="primary-button" data-action="advance" data-era-button ${ready ? '' : 'disabled'}>${icon('sun')}开启新的时代</button><p class="detail-footnote">保留所有建设、人口与研究成果<br>更换时代场景，解锁新的知识与更高产出</p>`;
}

function renderPanel() {
  const html = { world: () => buildingPanel(selected), build: buildPanel, research: researchPanel, explore: explorePanel, eras: erasPanel }[tab]();
  $('#detail-panel').innerHTML = `<div class="detail-content">${html}</div>`;
  const portrait = $('#detail-panel .building-art');
  if (portrait && (state.era === 0 || state.era >= 3)) {
    const [x, y] = coordinates(BUILDINGS.find(b => b.id === selected));
    const width = portrait.clientWidth || 210;
    const height = portrait.clientHeight || 160;
    const imageWidth = width * 5;
    const imageHeight = imageWidth / 1.5;
    portrait.style.backgroundImage = `url('./assets/${ERAS[state.era].art}.webp')`;
    portrait.style.backgroundSize = '500% auto';
    portrait.style.backgroundPosition = `${(x / 100 * imageWidth - width / 2) / (imageWidth - width) * 100}% ${((y - 7) / 100 * imageHeight - height / 2) / (imageHeight - height) * 100}%`;
    portrait.style.maskImage = 'radial-gradient(ellipse at center, black 42%, transparent 72%)';
    portrait.style.filter = 'drop-shadow(0 4px 5px #57503722)';
  }
  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
}

function renderQueue() {
  const job = state.construction[0];
  if (!job) {
    $('#construction-strip').innerHTML = `<span class="queue-icon">${icon('hammer')}</span><div class="queue-body"><strong>每一份蓝图，都通向未来</strong><p>工匠已准备好，选择一座建筑开始建设</p></div><button class="queue-idle-action" data-action="build">去建设 ${icon('chevron')}</button>`;
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
  $('#explore-dot').hidden = !state.expeditionReward;
  $('#build-dot').hidden = state.construction.length >= 3;
  $('#world-year').textContent = `纪元 ${Math.floor((now - state.createdAt) / 60000) + 1} 年 · ${state.era >= 5 ? `第 ${state.cycle + 1} 星域` : `${Math.floor(state.population)} 位居民`}`;
  if (!isWriter) $('#save-status').textContent = '另一窗口正在发展';
}

function openPanel(nextTab = tab) {
  tab = nextTab;
  renderPanel(); updateLive();
  if (matchMedia('(max-width:720px)').matches) {
    $('#right-sidebar').classList.add('open'); $('#sheet-scrim').hidden = false;
    $('#panel-close').focus({ preventScroll: true });
  }
  $('#right-sidebar').scrollTop = 0;
}
function closePanel() {
  $('#right-sidebar').classList.remove('open'); $('#sheet-scrim').hidden = true;
  tab = 'world'; renderPanel();
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

function helpDialog() {
  showDialog(`<span class="eyebrow">WELCOME TO DAWNLANDS</span><h2>你的文明手册</h2><p>在这片土地上，时间与想象一同流淌。</p><div class="help-item"><h3>建设与发展</h3><p>点击地图上的建筑进行升级。可提前安排三项工程，居民会依次完成。建设仓库提高资源上限，建造营帐迎接新居民。</p></div><div class="help-item"><h3>从初火到群星</h3><p>在「科技」中依次研究发现，在「纪元」查看时代目标。跨时代保留发展成果。后期研究需要数小时到数周，宇宙阶段还可持续开拓星域。</p></div><div class="help-item"><h3>离线也在生长</h3><p>离开后最多结算 24 小时资源产出，并受仓储容量限制。已经安排的建设、研究与远征按真实时间完成。存档保存在当前浏览器，清理网站数据会删除进度。</p></div><div class="help-item"><h3>发展方针</h3><p>根据眼下的需要，在民生、材料生产和均衡发展之间调整。</p><button class="secondary-button" data-action="policy">调整方针 ${icon('balance')}</button></div><div class="help-item"><h3>保管你的文明</h3><p>导出的存档可以在其他设备上导入。导入会替换本机现有进度。</p><button class="secondary-button" data-action="export">导出存档</button><button class="secondary-button" data-action="import">导入存档</button><input type="file" id="save-import" accept="application/json,.json" hidden></div><button class="text-button danger-button" data-action="reset-prompt">重新建立文明</button>`);
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
    if (tabButton.dataset.tab === 'world') closePanel();
    else openPanel(tabButton.dataset.tab);
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const readActions = ['select', 'build', 'eras', 'policy', 'dismiss', 'export', 'import', 'reset-prompt', 'preview-era'];
  if (!isWriter && !readActions.includes(action)) return toast('这份文明已在另一个窗口打开，请先关闭那个窗口');
  if (isWriter) advanceTime(state);
  switch (action) {
    case 'select': selected = id; renderMap(); openPanel('world'); break;
    case 'build': openPanel('build'); break;
    case 'eras': openPanel('eras'); break;
    case 'upgrade': runAction(startBuilding(state, id)); break;
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
$('#sheet-scrim').addEventListener('click', closePanel);
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
$('#zoom-in').addEventListener('click', () => { zoom = Math.min(1.8, zoom + .2); updateCamera(); });
$('#zoom-out').addEventListener('click', () => { zoom = Math.max(.8, zoom - .2); updateCamera(); });
$('#map-home').addEventListener('click', () => { zoom = 1; camera = { x: 0, y: 0 }; updateCamera(); });
new ResizeObserver(sizeMap).observe($('#map-viewport'));
let drag;
$('#map-viewport').addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  drag = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
  $('#map-viewport').setPointerCapture(event.pointerId);
});
$('#map-viewport').addEventListener('pointermove', event => {
  if (!drag) return;
  camera = { x: drag.cameraX + event.clientX - drag.x, y: drag.cameraY + event.clientY - drag.y }; updateCamera();
});
$('#map-viewport').addEventListener('pointerup', () => { drag = null; });
$('#map-viewport').addEventListener('pointercancel', () => { drag = null; });

$('#sound-button').addEventListener('click', async () => {
  if (audioContext) {
    await audioContext.close(); audioContext = null; audioNodes = [];
    $('#sound-button').innerHTML = icon('sound-off'); $('#sound-button').setAttribute('aria-pressed', 'false'); $('#sound-button').setAttribute('aria-label', '开启环境音'); return;
  }
  try {
    audioContext = new AudioContext(); await audioContext.resume();
    [130.81, 196, 261.63].forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .008 / (i + 1);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); audioNodes.push(oscillator, gain);
    });
    $('#sound-button').innerHTML = icon('sound'); $('#sound-button').setAttribute('aria-pressed', 'true'); $('#sound-button').setAttribute('aria-label', '关闭环境音');
  } catch { audioContext = null; toast('当前设备暂时无法播放环境音'); }
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

fillIcons(); renderAll(); sizeMap(); acquireWriter();
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
