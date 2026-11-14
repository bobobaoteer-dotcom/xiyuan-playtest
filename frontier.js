export function cellKey(x, y) { return `${x},${y}`; }
export function initialClearing() {
  const cells = [];
  for (let y = 9; y <= 16; y++) for (let x = 9; x <= 16; x++) cells.push(cellKey(x, y));
  return cells;
}
export function terrainAt(x, y) {
  const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  const value = noise - Math.floor(noise);
  if (x < 3 || y < 3 || x > 20 || y > 20) return 'mountain';
  return value > .78 ? 'rock' : 'forest';
}
export const OBSTACLES = {
  forest: { name: '茂密森林', icon: 'wood', seconds: 18, food: 5, reward: { wood: 24 }, description: '砍倒树木，获得木材，并将这一格变成可建造土地。' },
  rock: { name: '天然石堆', icon: 'stone', seconds: 24, food: 6, reward: { stone: 20 }, description: '开凿并搬走石料，为营地清出新的空间。' },
  mountain: { name: '险峻山岭', icon: 'mountain', seconds: 60, food: 12, reward: { stone: 45 }, description: '山岭构成聚落的边界。向附近的森林与石堆拓展。' },
};
export function isCleared(base, x, y) { return base.cleared.includes(cellKey(x, y)); }
export function canClear(state, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 3 || y < 3 || x > 20 || y > 20) return '这是聚落边界的山岭';
  if (isCleared(state.base, x, y)) return '这块土地已经清理';
  if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => isCleared(state.base,x+dx,y+dy))) return '先清理与现有营地相邻的地区';
  return null;
}
export function startClearing(state, x, y, now = Date.now()) {
  const error = canClear(state, x, y);
  if (error) return { ok: false, message: error };
  if (state.base.clearing) return { ok: false, message: '一位农民正在拓荒，请等他完成' };
  const idle = state.base.workers - Object.values(state.base.jobs).reduce((sum,n) => sum+n,0);
  const source = idle > 0 ? null : ['wood','stone','food'].find(id => state.base.jobs[id] > 0);
  if (idle <= 0 && !source) return { ok: false, message: '请招募农民，或从采集中调回一位农民' };
  const obstacle = OBSTACLES[terrainAt(x,y)];
  if (state.resources.food < obstacle.food) return { ok: false, message: '拓荒需要食物补给' };
  state.resources.food -= obstacle.food;
  if (source) state.base.jobs[source]--;
  state.base.clearing = { x, y, source, start: now, end: now + obstacle.seconds * 1000 };
  return { ok: true, message: '农民已前往拓荒，完成后会恢复原来的工作' };
}
export function finishClearing(state) {
  const job = state.base.clearing;
  const key = cellKey(job.x,job.y);
  const fresh = !state.base.cleared.includes(key);
  if (fresh) state.base.cleared.push(key);
  if (job.source) state.base.jobs[job.source]++;
  state.base.clearing = null;
  return fresh ? OBSTACLES[terrainAt(job.x,job.y)].reward : {};
}
export function restoreFrontier(base, saved) {
  const validKey = key => typeof key === 'string' && /^\d{1,2},\d{1,2}$/.test(key) && key.split(',').every(v => Number(v)>=0 && Number(v)<24);
  base.cleared = Array.isArray(saved?.cleared) ? [...new Set(saved.cleared.filter(validKey))] : initialClearing();
  // Existing buildings retain the land they already occupy when an old save is upgraded.
  for (const [id,p] of Object.entries(base.positions)) {
    const n = ['hall','farm','library','market','barracks'].includes(id) ? 3 : 2;
    for(let y=p.y;y<p.y+n;y++)for(let x=p.x;x<p.x+n;x++)if(!base.cleared.includes(cellKey(x,y)))base.cleared.push(cellKey(x,y));
  }
  const j = saved?.clearing;
  base.clearing = null;
  if(j && Number.isInteger(j.x) && Number.isInteger(j.y) && j.x>=3 && j.y>=3 && j.x<=20 && j.y<=20 && !isCleared(base,j.x,j.y) && Number.isFinite(j.start) && Number.isFinite(j.end) && j.end>j.start && (j.source===null || ['wood','stone','food'].includes(j.source))) {
    base.clearing = {x:j.x,y:j.y,source:j.source,start:j.start,end:j.end};
    if(Object.values(base.jobs).reduce((a,b)=>a+b,0)>=base.workers){const donor=Object.keys(base.jobs).find(id=>base.jobs[id]>0);if(donor)base.jobs[donor]--;}
  }
}
