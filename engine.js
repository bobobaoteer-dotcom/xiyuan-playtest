import {finishClearing} from './frontier.js?v=8';
import { newBase, restoreBase, fits } from './base.js?v=8';
import { newWorld, restoreWorld, automaticSurveyPlan, surveyPlan, beginSurvey, completeSurvey, explorationBonuses, WORLD } from './world.js?v=8';

export const SAVE_KEY = 'xiyuan.civilization.v1';
export const RESOURCE_IDS = ['wood', 'stone', 'food', 'coin', 'knowledge'];
export const OFFLINE_LIMIT = 24 * 60 * 60 * 1000;

export const ERAS = [
  { name: '石器时代', subtitle: '让第一缕炊烟，成为文明的起点', art: 'stone-living', hall: 1, tech: 0, threshold: 0, duration: '初火纪元', labels: ['木材', '石料', '食物', '贝币', '学识'] },
  { name: '青铜时代', subtitle: '在河流与田野之间，筑起第一座城', art: 'valley', hall: 3, tech: 2, threshold: 800, duration: '聚落纪元', labels: ['木材', '石料', '粮食', '铜币', '学识'] },
  { name: '古典时代', subtitle: '道路连接城邦，思想越过群山', art: 'valley', hall: 5, tech: 4, threshold: 4000, duration: '城邦纪元', labels: ['木材', '石料', '粮食', '金币', '学识'] },
  { name: '工业时代', subtitle: '让蒸汽与钢铁，唤醒整个世界', art: 'future', hall: 8, tech: 6, threshold: 20000, duration: '机械纪元', labels: ['燃料', '钢材', '补给', '资本', '科学'] },
  { name: '科技时代', subtitle: '从一束电光，走向无限可能', art: 'future', hall: 11, tech: 8, threshold: 100000, duration: '信息纪元', labels: ['复材', '矿物', '补给', '能源', '算力'] },
  { name: '太空时代', subtitle: '离开摇篮，把灯火带往群星', art: 'cosmos', hall: 14, tech: 10, threshold: 600000, duration: '启航纪元', labels: ['复材', '晶矿', '补给', '能源', '智识'] },
  { name: '星际时代', subtitle: '每一颗陌生的星，都是新的家园', art: 'cosmos', hall: 18, tech: 12, threshold: 4000000, duration: '群星纪元', labels: ['星质', '晶矿', '补给', '能量', '智识'] },
  { name: '宇宙时代', subtitle: '文明没有终点，星海仍在展开', art: 'cosmos', hall: 23, tech: 14, threshold: 50000000, duration: '无尽纪元', labels: ['星质', '晶矿', '补给', '能量', '智识'] },
];

export const BUILDINGS = [
  { id: 'hall', name: '初始营地', later: '文明中枢', icon: 'hall', sprite: 0, x: 47, y: 45, description: '文明的心脏。提升聚落等级，解锁新的建筑与时代。', cost: { wood: 70, stone: 55, food: 30 }, seconds: 20, unlock: 1 },
  { id: 'farm', name: '采集营地', later: '生态供给站', icon: 'wheat', sprite: 1, x: 59, y: 59, description: '从森林采集到规模耕作，稳定的食物让更多人留下。', cost: { wood: 35, stone: 15 }, seconds: 12, unlock: 1, resource: 'food', rate: 16 },
  { id: 'lumber', name: '伐木营地', later: '材料工坊', icon: 'wood', sprite: 2, x: 31, y: 35, description: '把自然的馈赠转化为建设材料，让每一份蓝图落地。', cost: { wood: 30, stone: 20 }, seconds: 14, unlock: 1, resource: 'wood', rate: 14 },
  { id: 'quarry', name: '采石场', later: '矿物提炼厂', icon: 'stone', sprite: 3, x: 61, y: 29, description: '凿开岩壁，积累坚实的基础材料。', cost: { wood: 40, stone: 15 }, seconds: 16, unlock: 1, resource: 'stone', rate: 11 },
  { id: 'homes', name: '居民营帐', later: '生态居住区', icon: 'people', sprite: 4, x: 35, y: 57, description: '为新居民留一盏灯。每级增加八个人口席位。', cost: { wood: 45, stone: 25, food: 20 }, seconds: 18, unlock: 1 },
  { id: 'library', name: '智者小屋', later: '科研中心', icon: 'science', sprite: 5, x: 47, y: 70, description: '收集经验，点亮发现。持续产出推动文明进步的学识。', cost: { wood: 60, stone: 45, coin: 20 }, seconds: 25, unlock: 2, resource: 'knowledge', rate: 7 },
  { id: 'warehouse', name: '公共仓库', later: '星际储运站', icon: 'box', sprite: 2, x: 23, y: 69, description: '把今天的富余留给明天。每级显著增加全资源容量。', cost: { wood: 50, stone: 35 }, seconds: 20, unlock: 1 },
  { id: 'market', name: '交换集市', later: '贸易枢纽', icon: 'coin', sprite: 4, x: 70, y: 48, description: '让货物沿着道路流动，持续积累发展所需的财富。', cost: { wood: 80, stone: 50, food: 30 }, seconds: 30, unlock: 2, resource: 'coin', rate: 9 },
  { id: 'tower', name: '远行者营地', later: '深空探索港', icon: 'compass', sprite: 0, x: 75, y: 66, description: '为探索者准备行装。每级缩短远征时间并提高发现收益。', cost: { wood: 55, stone: 35, food: 35 }, seconds: 22, unlock: 1 },
];

BUILDINGS.push({id:'barracks',name:'兵营',later:'军事训练中心',icon:'hammer',sprite:0,x:50,y:70,description:'训练长矛兵与弓箭手。士兵会在营地巡逻，提升文明的军事力量。',cost:{wood:70,stone:45,food:20},seconds:22,unlock:2});

export const TECHNOLOGIES = [
  { id: 'tools', name: '磨制石器', icon: 'stone', detail: '生产效率 +15%', cost: 20, seconds: 25, era: 0 },
  { id: 'agriculture', name: '驯化与耕种', icon: 'wheat', detail: '食物产出 +30%', cost: 35, seconds: 45, era: 0 },
  { id: 'masonry', name: '青铜与筑造', icon: 'hall', detail: '建设时间 −15%', cost: 80, seconds: 180, era: 1 },
  { id: 'trade', name: '交换与度量', icon: 'coin', detail: '财富产出 +30%', cost: 120, seconds: 300, era: 1 },
  { id: 'writing', name: '文字与典籍', icon: 'science', detail: '学识产出 +30%', cost: 250, seconds: 900, era: 2 },
  { id: 'roads', name: '道路与远航', icon: 'compass', detail: '远征时间 −20%', cost: 400, seconds: 1800, era: 2 },
  { id: 'steam', name: '蒸汽与机械', icon: 'gear', detail: '材料产出 +50%', cost: 1500, seconds: 7200, era: 3 },
  { id: 'electricity', name: '电力与通信', icon: 'bolt', detail: '全体产出 +40%', cost: 3000, seconds: 14400, era: 3 },
  { id: 'computing', name: '计算与智能', icon: 'science', detail: '科研效率 +60%', cost: 12000, seconds: 43200, era: 4 },
  { id: 'fusion', name: '可控聚变', icon: 'sun', detail: '能源产出 +80%', cost: 20000, seconds: 86400, era: 4 },
  { id: 'orbital', name: '轨道工程', icon: 'planet', detail: '全体产出 +60%', cost: 65000, seconds: 172800, era: 5 },
  { id: 'habitat', name: '星外栖居', icon: 'people', detail: '人口增长效率翻倍', cost: 100000, seconds: 345600, era: 5 },
  { id: 'warp', name: '曲率航行', icon: 'compass', detail: '探索收益翻倍', cost: 500000, seconds: 604800, era: 6 },
  { id: 'dyson', name: '恒星工程', icon: 'sun', detail: '全体产出翻倍', cost: 900000, seconds: 1209600, era: 6 },
];

export const POLICIES = {
  balanced: { name: '均衡发展', detail: '让生产与生活保持平衡', icon: 'balance' },
  growth: { name: '民生优先', detail: '食物 +45%，材料 −15%', icon: 'wheat' },
  industry: { name: '集中建设', detail: '材料 +35%，食物 −20%', icon: 'hammer' },
};

export function newGame(now = Date.now()) {
  const state = {
    version: 1, createdAt: now, lastTick: now, era: 0, cycle: 0, policy: 'balanced',
    resources: { wood: 185, stone: 145, food: 180, coin: 85, knowledge: 30 },
    buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, b.id === 'hall' ? 1 : 0])),
    population: 12, growthProgress: 0, technologies: [], repeatResearch: 0,
    construction: [], research: null, expedition: null, expeditionReward: null,
    world: newWorld(now),
    explored: 0, produced: 0, claimed: [], chronicle: [{ at: now, text: '第一簇篝火亮起。十二位同行者，在河谷安下了家。' }],
  };
  state.base = newBase(state.buildings);
  return state;
}

function finite(value, fallback, maximum = 1e200) {
  return Number.isFinite(value) && value >= 0 ? Math.min(value, maximum) : fallback;
}

export function restoreGame(raw, now = Date.now()) {
  try {
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!saved || saved.version !== 1) return newGame(now);
    const state = { ...newGame(now), ...saved };
    state.resources = Object.fromEntries(RESOURCE_IDS.map(id => [id, finite(saved.resources?.[id], 0)]));
    state.buildings = Object.fromEntries(BUILDINGS.map(b => [b.id, Math.floor(finite(saved.buildings?.[b.id], b.id === 'hall' ? 1 : 0, 500))]));
    state.buildings.hall = Math.max(1, state.buildings.hall);
    state.era = Math.floor(finite(state.era, 0, ERAS.length - 1));
    state.lastTick = Math.min(finite(state.lastTick, now), now);
    state.createdAt = Math.min(finite(state.createdAt, now), now);
    state.population = finite(state.population, 12, populationCap(state));
    state.produced = finite(state.produced, 0);
    state.growthProgress = finite(state.growthProgress, 0, 60);
    state.cycle = Math.floor(finite(state.cycle, 0, 500));
    state.repeatResearch = Math.floor(finite(state.repeatResearch, 0, 500));
    state.explored = Math.floor(finite(state.explored, 0));
    state.policy = POLICIES[state.policy] ? state.policy : 'balanced';
    state.technologies = [...new Set((Array.isArray(saved.technologies) ? saved.technologies : []).filter(id => TECHNOLOGIES.some(t => t.id === id)))];
    state.claimed = Array.isArray(saved.claimed) ? saved.claimed.filter(id => typeof id === 'string') : [];
    state.chronicle = Array.isArray(saved.chronicle) ? saved.chronicle.filter(e => typeof e.text === 'string' && Number.isFinite(e.at)).slice(0, 30) : [];
    const validJob = j => j && Number.isFinite(j.start) && Number.isFinite(j.end) && j.end >= j.start;
    state.construction = (Array.isArray(saved.construction) ? saved.construction : []).filter(j => validJob(j) && BUILDINGS.some(b => b.id === j.id) && Number.isInteger(j.level) && j.level > 0).slice(0, 3);
    state.research = validJob(saved.research) && (saved.research.id === 'legacy' || TECHNOLOGIES.some(t => t.id === saved.research.id)) ? saved.research : null;
    state.expedition = validJob(saved.expedition) && ['near', 'far', 'unknown'].includes(saved.expedition.route) ? saved.expedition : null;
    const reward = saved.expeditionReward;
    state.expeditionReward = reward && typeof reward.title === 'string' && reward.resources && RESOURCE_IDS.every(id => reward.resources[id] === undefined || Number.isFinite(reward.resources[id]) && reward.resources[id] >= 0) ? reward : null;
    state.world = restoreWorld(saved.world, now);
    state.base = restoreBase(saved.base, state, now);
    return state;
  } catch {
    return newGame(now);
  }
}

export function capacity(state) { return Math.floor(600 * 1.8 ** state.buildings.warehouse * 1.12 ** state.buildings.hall); }
export function populationCap(state) { return 16 + state.buildings.homes * 8; }
export function hasTech(state, id) { return state.technologies.includes(id); }
export function buildingName(state, building) {
  if (state.era >= 4) return building.later;
  if (state.era===0) return ({hall:'初始营地',farm:'采集营棚',lumber:'伐木营棚',quarry:'采石营地',homes:'兽皮营帐',library:'智者营帐',warehouse:'储物棚',market:'交换营地',tower:'瞭望营地',barracks:'战士营地'})[building.id];
  if (state.era >= 1 && building.id === 'farm') return '河畔农庄';
  if (state.era >= 1 && building.id === 'hall') return '城镇议事厅';
  if (state.era >= 1 && building.id === 'homes') return '河谷民居';
  return building.name;
}

export function rates(state) {
  const rates = { wood: state.base.jobs.wood * 7, stone: state.base.jobs.stone * 6, food: state.base.jobs.food * 9, coin: 3, knowledge: 3 };
  for (const building of BUILDINGS) {
    if (building.resource) rates[building.resource] += (['wood','stone','food'].includes(building.resource) ? state.base.jobs[building.resource] / 3 : 1) * building.rate * (1.48 ** state.buildings[building.id] - 1) / .48;
  }
  let global = (1 + state.population * .012) * 1.35 ** state.era * 1.2 ** state.repeatResearch;
  if (hasTech(state, 'tools')) global *= 1.15;
  if (hasTech(state, 'electricity')) global *= 1.4;
  if (hasTech(state, 'orbital')) global *= 1.6;
  if (hasTech(state, 'dyson')) global *= 2;
  const discovery = explorationBonuses(state);
  for (const id of RESOURCE_IDS) rates[id] *= global * discovery[id];
  if (hasTech(state, 'agriculture')) rates.food *= 1.3;
  if (hasTech(state, 'trade')) rates.coin *= 1.3;
  if (hasTech(state, 'writing')) rates.knowledge *= 1.3;
  if (hasTech(state, 'computing')) rates.knowledge *= 1.6;
  if (hasTech(state, 'fusion')) rates.coin *= 1.8;
  if (hasTech(state, 'steam')) { rates.wood *= 1.5; rates.stone *= 1.5; }
  if (state.policy === 'growth') { rates.food *= 1.45; rates.wood *= .85; rates.stone *= .85; }
  if (state.policy === 'industry') { rates.food *= .8; rates.wood *= 1.35; rates.stone *= 1.35; }
  return rates;
}

export function buildingPlan(state, id) {
  const building = BUILDINGS.find(b => b.id === id);
  if (!building) return null;
  const queued = state.construction.filter(j => j.id === id);
  const level = state.buildings[id] + queued.length + 1;
  const factor = 1.55 ** Math.max(0, level - 2);
  const cost = Object.fromEntries(Object.entries(building.cost).map(([k, v]) => [k, Math.ceil(v * factor)]));
  const seconds = Math.ceil(building.seconds * 1.72 ** Math.max(0, level - 2) * (hasTech(state, 'masonry') ? .85 : 1));
  return { id, level, cost, seconds, locked: state.buildings.hall < building.unlock, building };
}

export function canAfford(state, cost) { return Object.entries(cost).every(([id, amount]) => state.resources[id] >= amount); }
function spend(state, cost) { for (const [id, amount] of Object.entries(cost)) state.resources[id] -= amount; }
export function addResources(state, resourceMap) {
  const gained = {};
  for (const [id, amount] of Object.entries(resourceMap)) {
    if (!RESOURCE_IDS.includes(id)) continue;
    const old = state.resources[id];
    state.resources[id] = Math.max(old, Math.min(capacity(state), old + amount));
    gained[id] = state.resources[id] - old;
  }
  return gained;
}
function log(state, text, at) { state.chronicle.unshift({ text, at }); state.chronicle = state.chronicle.slice(0, 30); }

export function startBuilding(state, id, now = Date.now(), position = null) {
  const plan = buildingPlan(state, id);
  if (plan && state.base.jobs.builder < 1) return {ok:false,message:'请先安排至少一名农民施工'};
  if (plan && !state.base.positions[id] && !fits(state.base,id,position)) return {ok:false,message:'请在地图上选择一块可建造空地'};
  if (!plan || plan.locked) return { ok: false, message: '提升文明中枢后解锁' };
  if (state.construction.length >= 3) return { ok: false, message: '建设队列已满，请等待当前工程完成' };
  if (!canAfford(state, plan.cost)) return { ok: false, message: '资源还不够，居民正在努力生产' };
  spend(state, plan.cost);
  if (!state.base.positions[id]) state.base.positions[id] = {...position};
  const start = Math.max(now, state.construction.at(-1)?.end ?? now);
  state.construction.push({ id, level: plan.level, start, end: start + plan.seconds * 1000 });
  return { ok: true, message: `${buildingName(state, plan.building)}已加入建设队列` };
}

export function nextResearch(state) {
  return TECHNOLOGIES.find(t => !hasTech(state, t.id)) ?? { id: 'legacy', name: `宇宙认知 · ${state.repeatResearch + 1}`, detail: '全体产出 ×1.2，研究可持续进阶', icon: 'science', cost: Math.ceil(1500000 * 1.6 ** state.repeatResearch), seconds: 1814400 * 1.2 ** state.repeatResearch, era: 7 };
}
export function startResearch(state, now = Date.now()) {
  const tech = nextResearch(state);
  if (state.research) return { ok: false, message: '当前研究仍在进行' };
  if (tech.era > state.era) return { ok: false, message: `进入${ERAS[tech.era].name}后解锁` };
  if (state.resources.knowledge < tech.cost) return { ok: false, message: '需要积累更多学识' };
  state.resources.knowledge -= tech.cost;
  state.research = { id: tech.id, start: now, end: now + tech.seconds * 1000 };
  return { ok: true, message: `开始研究${tech.name}` };
}

export const ROUTES = [
  { id: 'near', name: '河谷寻踪', later: '近地勘探', description: '沿着河岸，寻找被遗忘的馈赠。', seconds: 45, food: 20, icon: 'leaf', factor: 1 },
  { id: 'far', name: '群山之间', later: '深空航路', description: '穿过山口，带回稀有的材料与见闻。', seconds: 240, food: 60, icon: 'mountain', factor: 3 },
  { id: 'unknown', name: '未知之境', later: '星域拓荒', description: '新的边界，等待属于你的名字。', seconds: 900, food: 150, icon: 'compass', factor: 8 },
];
export function expeditionPlan(state, route) {
  const r = ROUTES.find(r => r.id === route);
  const scale = 1.7 ** state.era;
  const seconds = Math.ceil(r.seconds * (hasTech(state, 'roads') ? .8 : 1) / (1 + state.buildings.tower * .08));
  return { ...r, seconds, food: Math.ceil(r.food * scale), scale };
}
export function startExpedition(state, route, now = Date.now()) {
  if (!ROUTES.some(r => r.id === route)) return { ok: false, message: '请选择一条航路' };
  if (state.expedition || state.expeditionReward) return { ok: false, message: '请先等候远征归来并领取发现' };
  const plan = expeditionPlan(state, route);
  if (state.resources.food < plan.food) return { ok: false, message: '远征需要更多补给' };
  state.resources.food -= plan.food;
  state.expedition = { route, start: now, end: now + plan.seconds * 1000 };
  return { ok: true, message: '探索队已出发，离线期间也会继续远行' };
}
export function collectExpedition(state, now = Date.now()) {
  if (!state.expeditionReward) return { ok: false, message: '探索队尚未归来' };
  const title = state.expeditionReward.title;
  addResources(state, state.expeditionReward.resources);
  state.expeditionReward = null;
  state.explored++;
  log(state, title, now);
  return { ok: true, message: title };
}

export function startSurvey(state, target, now = Date.now()) {
  if (!Number.isInteger(target) || target < 0 || target >= WORLD.columns * WORLD.rows) return { ok: false, message: '请选择地图上的地区' };
  if (state.world.survey) return { ok: false, message: '探索队正在途中，请等本次勘探结束' };
  const plan = surveyPlan(state, target);
  if (plan.blocked) return { ok: false, message: plan.blocked };
  if (state.resources.food < plan.food) return { ok: false, message: '补给不足，居民正在准备食物' };
  beginSurvey(state, plan, now);
  return { ok: true, message: '探索队出发了，前往世界地图可跟随他们的脚步' };
}

export const MILESTONES = [
  { id: 'first', name: '筑起文明的基石', detail: '完成任意一次建筑升级', test: s => Object.values(s.buildings).some(l => l >= 2), reward: { wood: 50, stone: 40, knowledge: 15 } },
  { id: 'wisdom', name: '点亮第一项发现', detail: '研究「磨制石器」', test: s => hasTech(s, 'tools'), reward: { coin: 40, knowledge: 20 } },
  { id: 'explorer', name: '河流之外的世界', detail: '完成一次远征并领取发现', test: s => s.explored >= 1, reward: { food: 60, wood: 50, coin: 30 } },
  { id: 'home', name: '让更多人安居', detail: '人口达到 20', test: s => s.population >= 20, reward: { wood: 80, stone: 60 } },
];
export function claimMilestone(state, id) {
  const goal = MILESTONES.find(g => g.id === id);
  if (!goal || state.claimed.includes(id) || !goal.test(state)) return { ok: false, message: '继续发展，即可领取这份馈赠' };
  addResources(state, goal.reward);
  state.claimed.push(id);
  return { ok: true, message: '里程碑奖励已收入仓库' };
}

export function eraRequirements(state) {
  const next = ERAS[state.era + 1];
  if (next) return { name: next.name, hall: next.hall, tech: next.tech, threshold: next.threshold, cost: { wood: Math.ceil(next.threshold * .14), stone: Math.ceil(next.threshold * .12), coin: Math.ceil(next.threshold * .08) } };
  const cycle = state.cycle + 1;
  return { name: `第 ${cycle + 1} 星域`, hall: 23 + cycle * 3, tech: TECHNOLOGIES.length, threshold: 50000000 * 3 ** cycle, cost: { wood: Math.ceil(2000000 * 2 ** cycle), stone: Math.ceil(1800000 * 2 ** cycle), coin: Math.ceil(1200000 * 2 ** cycle) } };
}
export function advanceEra(state, now = Date.now()) {
  const target = eraRequirements(state);
  if (state.buildings.hall < target.hall || state.technologies.length < target.tech || state.produced < target.threshold) return { ok: false, message: '完成时代条件后，文明即可迈向新的篇章' };
  if (!canAfford(state, target.cost)) return { ok: false, message: '请积累足够的时代跃迁资源' };
  spend(state, target.cost);
  if (state.era < ERAS.length - 1) state.era++;
  else state.cycle++;
  log(state, `文明迈入${target.name}。新的疆界，在远处展开。`, now);
  return { ok: true, message: `欢迎来到${target.name}` };
}

function produce(state, seconds) {
  if (seconds <= 0) return;
  const production = rates(state);
  const gained = addResources(state, Object.fromEntries(RESOURCE_IDS.map(id => [id, production[id] * seconds / 60])));
  state.produced += Object.values(gained).reduce((a, b) => a + b, 0);
  // Growth is discrete: the same result is produced whether time advances in ticks or offline.
  state.growthProgress += seconds * (hasTech(state, 'habitat') ? 2 : 1);
  const space = Math.max(0, populationCap(state) - state.population);
  const growth = Math.min(Math.floor((state.growthProgress + 1e-7) / 60), space, Math.floor(state.resources.food / 10));
  state.population += growth;
  state.resources.food -= growth * 10;
  state.growthProgress = Math.max(0, state.growthProgress - Math.floor((state.growthProgress + 1e-7) / 60) * 60);
}

export function advanceTime(state, now = Date.now(), offline = false) {
  if (!Number.isFinite(now) || now <= state.lastTick) return null;
  const start = state.lastTick;
  const before = { ...state.resources };
  const capEnd = offline ? Math.min(now, start + OFFLINE_LIMIT) : now;
  const messages = [];
  let discoveries = 0;
  let cursor = start;
  // Events split time, so completed buildings never produce retroactively.
  while (cursor < now) {
    let surveyWake = Infinity;
    if (cursor >= state.world.startedAt && cursor < capEnd && state.world.auto && !state.world.survey) {
      const plan = automaticSurveyPlan(state);
      if (plan && state.resources.food >= plan.food) beginSurvey(state, plan, cursor);
      else if (plan && rates(state).food > 0) surveyWake = cursor + Math.max(1, Math.ceil((plan.food - state.resources.food) / rates(state).food * 60000));
    }
    const growthBoundary = cursor < capEnd && state.population < populationCap(state) ? cursor + Math.max(1, (60 - state.growthProgress) * 1000 / (hasTech(state, 'habitat') ? 2 : 1)) : Infinity;
    const worldStart = cursor < state.world.startedAt ? state.world.startedAt : Infinity;
    const next = Math.min(now, state.construction[0]?.end ?? Infinity, state.research?.end ?? Infinity, state.expedition?.end ?? Infinity, state.world.survey?.end ?? Infinity, state.base.recruit[0]?.end ?? Infinity, state.base.training[0]?.end ?? Infinity, state.base.clearing?.end ?? Infinity, worldStart, surveyWake, growthBoundary, cursor < capEnd ? capEnd : Infinity);
    const end = Math.max(cursor, next);
    produce(state, Math.max(0, Math.min(end, capEnd) - Math.min(cursor, capEnd)) / 1000);
    cursor = end;
    let event = false;
    if(state.base.clearing?.end<=cursor){const reward=finishClearing(state);addResources(state,reward);messages.push('拓荒完成：获得资源并解锁一格建设用地');event=true;}
    if(state.base.recruit[0]?.end<=cursor){state.base.recruit.shift();state.base.workers++;messages.push('一位新农民已加入，可分配采集与施工');event=true;}
    if(state.base.training[0]?.end<=cursor){const job=state.base.training.shift();state.base.army[job.type]++;messages.push('士兵训练完成，已加入驻守部队');event=true;}

    if (state.world.survey?.end <= cursor) {
      const result = completeSurvey(state);
      addResources(state, result.reward);
      log(state, result.text, cursor);
      discoveries++;
      event = true;
    }
    if (state.construction[0]?.end <= cursor) {
      const job = state.construction.shift();
      state.buildings[job.id] = Math.max(state.buildings[job.id], job.level);
      const building = BUILDINGS.find(b => b.id === job.id);
      const text = `${buildingName(state, building)}达到 Lv.${job.level}`;
      messages.push(text); log(state, text, cursor); event = true;
    }
    if (state.research?.end <= cursor) {
      const id = state.research.id;
      if (id === 'legacy') state.repeatResearch++;
      else if (!hasTech(state, id)) state.technologies.push(id);
      const text = id === 'legacy' ? '对宇宙的认知，又深入了一层' : `新发现：${TECHNOLOGIES.find(t => t.id === id).name}`;
      messages.push(text); log(state, text, cursor); state.research = null; event = true;
    }
    if (state.expedition?.end <= cursor) {
      const route = expeditionPlan(state, state.expedition.route);
      const gain = Math.ceil(35 * route.factor * route.scale * (1 + state.buildings.tower * .1) * (hasTech(state, 'warp') ? 2 : 1));
      const names = state.era >= 5 ? ['发现一片富矿小行星带', '接收到远方文明的讯号', '找到一颗适居的星球'] : ['发现一片富饶的河滩', '带回古老的石刻与见闻', '与远方的旅人交换了礼物'];
      state.expeditionReward = { title: names[state.explored % names.length], resources: { wood: gain, stone: Math.ceil(gain * .65), coin: Math.ceil(gain * .4), knowledge: Math.ceil(gain * .2) } };
      state.expedition = null; messages.push('探索队已归来，等待你查看发现'); event = true;
    }
    if (cursor >= now) break;
    if (!event && end === next && next !== growthBoundary && next !== capEnd && next !== surveyWake && next !== worldStart) break;
  }
  state.lastTick = now;
  if (discoveries) messages.push(discoveries === 1 ? state.chronicle.find(entry => entry.at > start)?.text ?? '探索队完成了一次勘探' : `探索队完成 ${discoveries} 次勘探，世界地图已更新`);
  return { elapsed: now - start, capped: now - start > OFFLINE_LIMIT, gains: Object.fromEntries(RESOURCE_IDS.map(id => [id, Math.max(0, state.resources[id] - before[id])])), messages, discoveries };
}
