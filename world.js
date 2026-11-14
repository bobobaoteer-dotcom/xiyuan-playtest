import { TERRAIN } from './world-terrain.js?v=6';

export const WORLD = { columns: 48, rows: 34, radius: 25, width: 2122, height: 1288, home: 877 };
export const BIOMES = {
  ocean: { name: '海域', icon: 'planet', color: '#407d87', resource: 'coin', time: 54 },
  plains: { name: '草原', icon: 'wheat', color: '#9ca36a', resource: 'food', time: 28 },
  forest: { name: '林地', icon: 'wood', color: '#547954', resource: 'wood', time: 35 },
  mountain: { name: '山地', icon: 'mountain', color: '#999487', resource: 'stone', time: 48 },
  desert: { name: '荒漠', icon: 'sun', color: '#bcaa77', resource: 'stone', time: 42 },
  snow: { name: '雪原', icon: 'mountain', color: '#cbd3ce', resource: 'knowledge', time: 52 },
};
export const SITES = {
  grove: { name: '古老林场', icon: 'wood', detail: '材料产出永久 +2%', resource: 'wood' },
  mine: { name: '露天矿脉', icon: 'stone', detail: '矿物产出永久 +2%', resource: 'stone' },
  village: { name: '远方聚落', icon: 'people', detail: '食物产出永久 +2%', resource: 'food' },
  ruin: { name: '失落遗迹', icon: 'hall', detail: '学识产出永久 +3%', resource: 'knowledge' },
  port: { name: '古老港湾', icon: 'compass', detail: '财富产出永久 +2%', resource: 'coin' },
};

export function neighbors(id) {
  const q = id % WORLD.columns, r = Math.floor(id / WORLD.columns);
  const diagonal = r % 2 ? 1 : -1;
  return [[q - 1, r], [q + 1, r], [q, r - 1], [q + diagonal, r - 1], [q, r + 1], [q + diagonal, r + 1]]
    .filter(([x, y]) => x >= 0 && y >= 0 && x < WORLD.columns && y < WORLD.rows)
    .map(([x, y]) => y * WORLD.columns + x);
}
export function tilePoint(id) {
  const row = Math.floor(id / WORLD.columns), col = id % WORLD.columns;
  return { x: 28 + (col + (row % 2) * .5) * Math.sqrt(3) * WORLD.radius, y: 27 + row * WORLD.radius * 1.5 };
}
function hash(id) { const value = Math.sin(id * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); }
export function tileInfo(id) {
  const biome = TERRAIN[id] ?? 'ocean';
  let site = null;
  if (hash(id) > .87 && biome !== 'ocean') {
    site = biome === 'forest' ? 'grove' : biome === 'mountain' ? 'mine' : biome === 'plains' ? 'village' : 'ruin';
  }
  if (id === WORLD.home + 2) site = 'grove';
  if (id === WORLD.home - WORLD.columns * 2 + 1) site = 'ruin';
  if (biome === 'ocean' && hash(id) > .965) site = 'port';
  return { id, biome, site, ...BIOMES[biome], label: id === WORLD.home ? '曦原 · 家园' : site ? SITES[site].name : BIOMES[biome].name };
}
export function newWorld(now = Date.now()) {
  const revealed = new Set([WORLD.home]);
  let edge = [WORLD.home];
  for (let depth = 0; depth < 3; depth++) {
    edge = [...new Set(edge.flatMap(neighbors).filter(id => !revealed.has(id)))];
    edge.forEach(id => revealed.add(id));
  }
  return { startedAt: now, revealed: [...revealed], visited: [WORLD.home], sites: [], position: WORLD.home, survey: null, auto: true, direction: 'balanced', trips: 0 };
}
export function restoreWorld(saved, now) {
  const result = newWorld(now);
  if (!saved || typeof saved !== 'object') return result;
  result.startedAt = Number.isFinite(saved.startedAt) && saved.startedAt >= 0 ? Math.min(now, saved.startedAt) : now;
  const validId = id => Number.isInteger(id) && id >= 0 && id < WORLD.columns * WORLD.rows;
  for (const key of ['revealed', 'visited', 'sites']) {
    if (Array.isArray(saved[key])) result[key] = [...new Set(saved[key].filter(validId))];
  }
  if (!result.revealed.includes(WORLD.home)) result.revealed.push(WORLD.home);
  if (!result.visited.includes(WORLD.home)) result.visited.push(WORLD.home);
  result.visited = result.visited.filter(id => result.revealed.includes(id));
  result.sites = result.sites.filter(id => result.visited.includes(id) && tileInfo(id).site);
  result.position = result.visited.includes(saved.position) ? saved.position : WORLD.home;
  result.auto = saved.auto !== false;
  result.direction = ['balanced', 'east', 'west', 'north', 'south'].includes(saved.direction) ? saved.direction : 'balanced';
  result.trips = Number.isInteger(saved.trips) && saved.trips >= 0 ? saved.trips : 0;
  const task = saved.survey;
  if (task && validId(task.target) && !result.visited.includes(task.target) && Number.isFinite(task.start) && task.start <= now && Number.isFinite(task.end) && task.end > task.start && Array.isArray(task.path) && task.path.length > 1 && task.path.length <= WORLD.columns * WORLD.rows && task.path.every(validId) && task.path[0] === result.position && task.path.at(-1) === task.target && task.path.every((id, i) => !i || neighbors(task.path[i - 1]).includes(id))) {
    result.survey = { target: task.target, start: task.start, end: task.end, path: [...task.path], food: Math.max(0, Number(task.food) || 0) };
  }
  return result;
}
export function travelBlock(state, id) {
  const biome = tileInfo(id).biome;
  if (biome === 'ocean' && !state.technologies.includes('roads') && state.era < 3) return '研究「道路与远航」后可跨海航行';
  if (biome === 'mountain' && !state.technologies.includes('masonry') && state.era < 2) return '研究「青铜与筑造」后可翻越山地';
  return null;
}
export function reachablePaths(state) {
  const revealed = new Set(state.world.revealed), paths = new Map([[state.world.position, [state.world.position]]]);
  const queue = [state.world.position];
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i];
    for (const id of neighbors(from)) {
      if (paths.has(id) || travelBlock(state, id)) continue;
      paths.set(id, [...paths.get(from), id]);
      if (revealed.has(id)) queue.push(id);
    }
  }
  return paths;
}
export function frontier(state) {
  const revealed = new Set(state.world.revealed);
  return [...new Set(state.world.revealed.flatMap(neighbors).filter(id => !revealed.has(id)))];
}
export function surveyPlan(state, target, paths = reachablePaths(state)) {
  if (state.world.visited.includes(target)) return { blocked: '这片地区已经完成勘探' };
  const blocked = travelBlock(state, target);
  if (blocked) return { blocked };
  const path = paths.get(target);
  if (!path) return { blocked: '请先探索与已知区域相邻的边界' };
  const tile = tileInfo(target);
  const speed = (state.technologies.includes('roads') ? .8 : 1) / (1 + state.buildings.tower * .08);
  return { target, path, food: 5 + Math.ceil((path.length - 1) / 3), seconds: Math.max(12, Math.ceil((tile.time + (path.length - 2) * 7) * speed)) };
}
export function automaticSurveyPlan(state) {
  const paths = reachablePaths(state), visited = new Set(state.world.visited), revealed = new Set(state.world.revealed);
  const candidates = [...paths.keys()].filter(id => !visited.has(id));
  const home = tilePoint(WORLD.home);
  const direction = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1], balanced: [0, 0] }[state.world.direction];
  candidates.sort((a, b) => {
    const score = id => {
      const point = tilePoint(id), site = tileInfo(id).site;
      return paths.get(id).length * 8 + (revealed.has(id) ? 35 : -12) - (site ? 16 : 0) - ((point.x - home.x) * direction[0] + (point.y - home.y) * direction[1]) * .08 + hash(id) * 3;
    };
    return score(a) - score(b);
  });
  return candidates.length ? surveyPlan(state, candidates[0], paths) : null;
}
export function beginSurvey(state, plan, now) {
  state.resources.food -= plan.food;
  state.world.survey = { target: plan.target, path: [...plan.path], food: plan.food, start: now, end: now + plan.seconds * 1000 };
}
export function completeSurvey(state) {
  const target = state.world.survey.target, tile = tileInfo(target);
  state.world.position = target;
  if (!state.world.revealed.includes(target)) state.world.revealed.push(target);
  state.world.visited.push(target);
  state.world.trips++;
  state.world.survey = null;
  const scale = 1.5 ** state.era;
  const reward = { [tile.resource]: Math.ceil(12 * scale), knowledge: Math.ceil(3 * scale) };
  if (tile.site && !state.world.sites.includes(target)) {
    state.world.sites.push(target);
    reward[SITES[tile.site].resource] = Math.ceil(65 * scale);
  }
  return { text: tile.site ? `发现${SITES[tile.site].name}，${SITES[tile.site].detail}` : `探索者勘明了新的${tile.name}，带回资源与见闻`, reward };
}
export function explorationBonuses(state) {
  const bonus = { wood: 1, stone: 1, food: 1, coin: 1, knowledge: 1 };
  for (const id of state.world?.sites ?? []) {
    const site = SITES[tileInfo(id).site];
    if (site) bonus[site.resource] += site.resource === 'knowledge' ? .03 : .02;
  }
  return bonus;
}
