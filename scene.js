import { WORLD, BIOMES, SITES, tilePoint, tileInfo, neighbors, frontier } from './world.js?v=6';

const TAU = Math.PI * 2;
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}

// Shared articulated sprite: the gait, tool and cargo are drawn independently.
export function drawPerson(ctx,x,y,time,options={}){
 const {scale=1,direction=1,walking=true,working=false,carrying=false,role='farm',era=0}=options;
 const stride=walking?Math.sin(time*9)*3:0,swing=working?Math.sin(time*6)*6:stride*.6;
 ctx.save();ctx.translate(x,y);ctx.scale(scale*direction,scale);
 ellipse(ctx,1,1,8,3,'#25433240');ctx.translate(0,walking?-Math.abs(Math.sin(time*9))*.9:0);
 const limb=(ax,ay,bx,by,color,width)=>line(ctx,[[ax,ay],[bx,by]],color,width);
 limb(-2,-8,-3+stride,0,'#63452d',4.2);limb(3,-8,3-stride,0,'#80603d',4.4);
 ellipse(ctx,-3+stride,0,3,1.8,'#493a2a');ellipse(ctx,4-stride,0,3,1.8,'#59422b');
 limb(-5,-18,-8,-10+swing,'#b28657',3.7);
 const palette=era>=4?['#dce8dd','#7fa4a2']:role==='quarry'?['#a9b77d','#637e4b']:role==='builder'?['#dfb96f','#a7783e']:role==='lumber'?['#c59a62','#88613b']:['#d8b681','#95713f'];
 const body=ctx.createLinearGradient(-6,-14,7,-14);body.addColorStop(0,palette[0]);body.addColorStop(1,palette[1]);ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-4,-19);ctx.quadraticCurveTo(0,-22,5,-18);ctx.lineTo(7,-7);ctx.quadraticCurveTo(0,-4,-6,-7);ctx.closePath();ctx.fill();
 limb(-5,-9,6,-9,'#74502f',1.5);ellipse(ctx,2,-9,1.3,1.4,'#dab87b');
 limb(5,-17,8,-10-swing,'#dfb780',4);ellipse(ctx,8,-10-swing,2,2.2,'#edc999');
 ctx.fillStyle='#87603c';ctx.beginPath();ctx.roundRect(-2,-23,5,5,2);ctx.fill();
 const skin=ctx.createRadialGradient(-1,-28,1,2,-25,8);skin.addColorStop(0,'#ffdfab');skin.addColorStop(1,'#c18b54');ellipse(ctx,1,-26,5.8,6.1,skin);ellipse(ctx,6.2,-26,1.4,2,'#dfb07d');
 ctx.fillStyle=era>=4?'#dce8dd':'#5c422c';ctx.beginPath();ctx.ellipse(.4,-29,6.2,4.3,-.15,Math.PI,TAU+.2);ctx.fill();ellipse(ctx,5,-27,1.1,2.7,era>=4?'#8baba0':'#62452c');ellipse(ctx,3.9,-25.9,.6,.8,'#47372a');
 if(era>=4)limb(-3,-26,5,-26,'#77bcc6',1.4);
 if(carrying){if(role==='lumber'){limb(-10,-19,-10,-9,'#815330',7);ellipse(ctx,-10,-19,3.5,1.8,'#d9af70');}else{ellipse(ctx,-9,-14,4,6,role==='quarry'?'#9da897':'#c59d58');limb(-12,-14,-6,-14,'#e4d3a3',1);}}
 if(working){ctx.save();ctx.translate(8,-10-swing);ctx.rotate(-.6+Math.sin(time*6)*.7);limb(0,1,0,-14,'#76502d',2);if(['lumber','quarry','builder'].includes(role)){limb(-4,-12,4,-14,'#d0d4bd',3.5);}else ellipse(ctx,0,-13,2.5,2,'#d4b568');ctx.restore();}
 ctx.restore();
}

function routePosition(points, fraction) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? distance / lengths[i] : 0;
      return { x: points[i][0] + (points[i + 1][0] - points[i][0]) * f, y: points[i][1] + (points[i + 1][1] - points[i][1]) * f, direction: points[i + 1][0] >= points[i][0] ? 1 : -1 };
    }
    distance -= lengths[i];
  }
  return { x: points[0][0], y: points[0][1], direction: 1 };
}

const ROUTES = {
  stone: {
    farm: [[33, 57], [40, 60], [47, 64], [53, 61]],
    lumber: [[32, 56], [26, 52], [23, 43], [20, 34]],
    quarry: [[40, 54], [47, 49], [51, 42], [56, 33]],
    fisher: [[43, 61], [51, 72], [65, 72], [73, 65]],
    builder: [[26, 65], [31, 61], [38, 54]],
  },
  valley: {
    farm: [[38, 64], [44, 63], [50, 62], [57, 64]],
    lumber: [[40, 61], [37, 53], [34, 45], [31, 39]],
    quarry: [[46, 54], [50, 48], [54, 40], [60, 34]],
    fisher: [[47, 64], [57, 68], [67, 60], [72, 57]],
    builder: [[37, 63], [40, 59], [47, 54]],
  },
};

export class LivingSettlement {
  constructor(canvas, getState, getBuildingPosition) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.getState = getState;
    this.getBuildingPosition = getBuildingPosition;
    this.active = true;
    this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0; this.lastFrame = 0; this.deliveries = new Map(); this.particles = [];
    canvas.width = 1536; canvas.height = 1024;
    this.frame = this.frame.bind(this); requestAnimationFrame(this.frame);
  }
  frame(now) {
    requestAnimationFrame(this.frame);
    if (!this.active || document.hidden || now - this.lastFrame < 33) return;
    if (!this.paused) this.time += Math.min(.08, (now - (this.lastFrame || now)) / 1000);
    this.lastFrame = now;
    const state = this.getState(), ctx = this.ctx, t = this.time;
    ctx.clearRect(0, 0, 1536, 1024);
    const roads = state.era === 0 ? ROUTES.stone : ROUTES.valley;
    const roles = ['farm', 'lumber', 'quarry', 'fisher', 'farm', 'builder'];
    const actors = [];
    const count = Math.min(26, Math.max(6, Math.floor(state.population) - (state.world.survey ? 3 : 0)));
    for (let i = 0; i < count; i++) {
      let role = roles[i % roles.length];
      if (role === 'builder' && !state.construction.length) role = 'farm';
      const cycleLength = 27 + i % 5 * 4, phase = (t + i * 7.13) % cycleLength;
      const cycle = Math.floor((t + i * 7.13) / cycleLength);
      const walkTime = cycleLength * .35, workTime = cycleLength * .21;
      let fraction, walking = true, working = false, carrying = false;
      if (phase < walkTime) fraction = phase / walkTime;
      else if (phase < walkTime + workTime) { fraction = 1; walking = false; working = true; }
      else if (phase < walkTime * 2 + workTime) { fraction = 1 - (phase - walkTime - workTime) / walkTime; carrying = true; }
      else { fraction = 0; walking = false; }
      let route = roads[role];
      if (role === 'builder' && state.construction.length) {
        const [x, y] = this.getBuildingPosition(state.construction[0].id);
        route = [route[0], route[1], [x - 2, y + 3]];
      }
      const road = route.map(([x, y]) => [x * 15.36, y * 10.24]);
      const pos = routePosition(road, fraction);
      const offset = (i % 3 - 1) * 8;
      actors.push({ ...pos, x: pos.x + offset, y: pos.y + offset * .4, walking, working, carrying, role, phase, index: i });
      if (this.deliveries.has(i) && this.deliveries.get(i) !== cycle) this.particles.push({ x: road[0][0] + offset, y: road[0][1] - 20, start: t, label: role === 'lumber' ? '木材入库' : role === 'quarry' ? '石料入库' : role === 'builder' ? '施工中' : '补给入库' });
      this.deliveries.set(i, cycle);
    }
    actors.sort((a, b) => a.y - b.y);
    actors.forEach(actor => drawPerson(ctx, actor.x, actor.y, t + actor.index, { ...actor, direction: actor.carrying ? -actor.direction : actor.direction, scale: 1.08, era: state.era }));
    this.canvas.dataset.actorCount = String(count);
    this.canvas.dataset.frameTime = t.toFixed(2);
    // Highlight active construction without interrupting workers' continuous routes.
    if (state.construction.length) {
      const point = state.era === 0 ? [38 * 15.36, 54 * 10.24] : [47 * 15.36, 54 * 10.24];
      for (let i = 0; i < 3; i++) {
        const a = (t * 1.7 + i * 2) % 3;
        ellipse(ctx, point[0] + i * 8, point[1] - a * 12, 2 - a * .4, 2 - a * .4, `rgba(237,209,131,${1 - a / 3})`);
      }
    }
    if (state.era === 0) {
      const x = 69 * 15.36, y = 70 * 10.24;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 19 + Math.sin(t * 7) * 3);
      glow.addColorStop(0, '#ffd17c70'); glow.addColorStop(1, '#e89c2a00'); ctx.fillStyle = glow; ctx.fillRect(x - 24, y - 24, 48, 48);
    }
    this.particles = this.particles.filter(p => t - p.start < 2.6);
    for (const p of this.particles) {
      const age = t - p.start;
      ctx.globalAlpha = Math.sin(age / 2.6 * Math.PI) * .85;
      ctx.font = '12px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3;
      ctx.strokeStyle = '#254837aa'; ctx.strokeText(p.label, p.x, p.y - age * 14); ctx.fillStyle = '#fff1bd'; ctx.fillText(p.label, p.x, p.y - age * 14);
    }
    ctx.globalAlpha = 1;
    // Small light traces follow the visible river rather than covering the whole screen.
    const riverX = state.era === 0 ? 86 : 74;
    for (let i = 0; i < 14; i++) {
      const y = 220 + (i * 57 + t * 9) % 650;
      const x = riverX * 15.36 + Math.sin(y * .006) * 35;
      line(ctx, [[x, y], [x + 8 + Math.sin(t + i) * 3, y - 2]], `rgba(246,248,211,${.15 + Math.sin(t * 2 + i) * .1})`, 1.2);
    }
  }
}

function hexPath(ctx, id, radius = WORLD.radius) {
  const p = tilePoint(id); ctx.beginPath();
  for (let i = 0; i < 6; i++) { const angle = Math.PI / 180 * (60 * i - 30); const x = p.x + Math.cos(angle) * radius, y = p.y + Math.sin(angle) * radius; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath();
}

export class WorldMap {
  constructor(canvas, getState, onSelect) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.getState = getState; this.onSelect = onSelect;
    this.background = document.createElement('canvas'); this.background.width = WORLD.width; this.background.height = WORLD.height;
    this.mapContext = this.background.getContext('2d'); this.image = new Image(); this.image.src = new URL('./assets/world-atlas.webp', import.meta.url).href;
    this.image.onload = () => { this.stamp = ''; this.update(); };
    this.active = false; this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches; this.selected = WORLD.home;
    this.camera = { ...tilePoint(WORLD.home), zoom: .95 }; this.following = false; this.lastFrame = 0; this.width = 1; this.height = 1;
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    this.bindInput();
    this.frame = this.frame.bind(this); requestAnimationFrame(this.frame);
  }
  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect();
    this.width = box.width; this.height = box.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.8);
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.ratio = ratio;
  }
  update() {
    const world = this.getState().world;
    const stamp = `${world.revealed.join(',')}|${world.sites.join(',')}`;
    if (this.stamp === stamp || !this.image.complete || !this.image.naturalWidth) return;
    this.stamp = stamp;
    const ctx = this.mapContext;
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    ctx.drawImage(this.image, 0, 0, WORLD.width, WORLD.height);
    const known = new Set(world.revealed), border = new Set(frontier(this.getState()));
    for (let id = 0; id < WORLD.columns * WORLD.rows; id++) {
      hexPath(ctx, id, WORLD.radius + .7);
      if (!known.has(id)) {
        ctx.fillStyle = border.has(id) ? '#284e48e8' : '#23453fff'; ctx.fill();
        ctx.strokeStyle = border.has(id) ? '#b4ae7638' : '#7990700c'; ctx.lineWidth = .65; ctx.stroke();
        const p = tilePoint(id), variation = Math.sin(id * 37.8);
        if (variation > .4) { ellipse(ctx, p.x, p.y, 23, 10, '#87977b0b'); }
      } else {
        ctx.strokeStyle = '#fff3b52b'; ctx.lineWidth = .6; ctx.stroke();
      }
    }
    for (const id of world.revealed) {
      const tile = tileInfo(id), p = tilePoint(id);
      if (tile.site) this.drawSite(ctx, p, tile.site, world.sites.includes(id));
    }
    this.drawHome(ctx);
  }
  drawHome(ctx) {
    const p = tilePoint(WORLD.home);
    ellipse(ctx, p.x, p.y + 8, 15, 6, '#243b2b77');
    ctx.fillStyle = '#e8dfb5'; ctx.fillRect(p.x - 8, p.y - 7, 17, 16);
    ctx.fillStyle = '#9c6c42'; ctx.beginPath(); ctx.moveTo(p.x - 13, p.y - 6); ctx.lineTo(p.x, p.y - 19); ctx.lineTo(p.x + 14, p.y - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#554837'; ctx.fillRect(p.x - 2, p.y + 1, 5, 8);
    line(ctx, [[p.x + 12, p.y - 6], [p.x + 12, p.y - 28]], '#ddca8a', 1.6);
    ctx.fillStyle = '#dbb96c'; ctx.fillRect(p.x + 12, p.y - 28, 11, 7);
    this.label(ctx, '曦原', p.x, p.y + 27, '#fff1bd');
  }
  label(ctx, text, x, y, color = '#f4ebc8') {
    ctx.font = '11px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#24483ee6'; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  drawSite(ctx, p, site, claimed) {
    ellipse(ctx, p.x, p.y + 4, 9, 3.5, '#263d2860');
    const color = claimed ? '#d4d6a8' : '#e7bd64';
    if (site === 'ruin') {
      ctx.fillStyle = '#b9b8a0'; ctx.fillRect(p.x - 9, p.y - 10, 4, 13); ctx.fillRect(p.x + 5, p.y - 10, 4, 13); ctx.fillRect(p.x - 10, p.y - 13, 20, 4);
    } else if (site === 'mine') {
      ctx.fillStyle = '#aab7b1'; ctx.beginPath(); ctx.moveTo(p.x - 10, p.y + 3); ctx.lineTo(p.x - 4, p.y - 12); ctx.lineTo(p.x + 8, p.y - 6); ctx.lineTo(p.x + 11, p.y + 4); ctx.closePath(); ctx.fill();
    } else if (site === 'grove') {
      line(ctx, [[p.x, p.y - 5], [p.x, p.y + 5]], '#b7a679', 3); ellipse(ctx, p.x, p.y - 12, 9, 9, '#d0c480');
    } else {
      ctx.fillStyle = '#e1d6b3'; ctx.fillRect(p.x - 7, p.y - 7, 15, 10); ctx.fillStyle = '#9b7153'; ctx.beginPath(); ctx.moveTo(p.x - 10, p.y - 7); ctx.lineTo(p.x, p.y - 16); ctx.lineTo(p.x + 11, p.y - 7); ctx.fill();
    }
    if (!claimed) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y - 5, 17, 0, TAU); ctx.stroke(); }
  }
  explorerPosition() {
    const state = this.getState(), task = state.world.survey;
    if (!task) return { ...tilePoint(state.world.position), direction: 1 };
    const fraction = Math.max(0, Math.min(1, (Date.now() - task.start) / (task.end - task.start)));
    return routePosition(task.path.map(id => { const p = tilePoint(id); return [p.x, p.y]; }), fraction);
  }
  frame(now) {
    requestAnimationFrame(this.frame);
    if (!this.active || document.hidden || now - this.lastFrame < 33) return;
    this.lastFrame = now;
    const ctx = this.ctx, state = this.getState(), world = state.world;
    const explorer = this.explorerPosition();
    if (this.following) { this.camera.x += (explorer.x - this.camera.x) * .06; this.camera.y += (explorer.y - this.camera.y) * .06; }
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0); ctx.fillStyle = '#203f3b'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.translate(this.width / 2, this.height / 2); ctx.scale(this.camera.zoom, this.camera.zoom); ctx.translate(-this.camera.x, -this.camera.y);
    ctx.drawImage(this.background, 0, 0);
    if (world.survey) {
      const points = world.survey.path.map(id => { const p = tilePoint(id); return [p.x, p.y]; });
      ctx.setLineDash([4, 5]); line(ctx, points, '#f5d593c9', 2); ctx.setLineDash([]);
      const end = tilePoint(world.survey.target);
      ctx.strokeStyle = '#f7db8e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(end.x, end.y, 10 + (this.paused ? 0 : Math.sin(now * .003) * 3), 0, TAU); ctx.stroke();
    }
    if (this.selected !== null) { hexPath(ctx, this.selected, WORLD.radius - 1); ctx.fillStyle = '#efd9951b'; ctx.fill(); ctx.strokeStyle = '#e7cb7d'; ctx.lineWidth = 2; ctx.stroke(); }
    const t = this.paused ? 0 : now / 1000;
    const boat = tileInfo(world.position).biome === 'ocean' || world.survey && tileInfo(world.survey.target).biome === 'ocean';
    if (boat) {
      ctx.fillStyle = '#a98652'; ctx.beginPath(); ctx.ellipse(explorer.x, explorer.y + 3, 13, 4, .1, 0, Math.PI); ctx.fill();
      line(ctx, [[explorer.x, explorer.y + 1], [explorer.x, explorer.y - 23]], '#d7c69b', 1.5);
      ctx.fillStyle = '#f0dfb3'; ctx.beginPath(); ctx.moveTo(explorer.x + 1, explorer.y - 23); ctx.lineTo(explorer.x + 12, explorer.y - 5); ctx.lineTo(explorer.x + 1, explorer.y - 4); ctx.fill();
    } else {
      for (let i = 2; i >= 0; i--) drawPerson(ctx, explorer.x - i * 9, explorer.y + i * 5, t - i * .2, { walking: !!world.survey && !this.paused, direction: explorer.direction, scale: .88, carrying: i === 2, era: state.era });
    }
    this.label(ctx, world.survey ? '探索队 · 行进中' : '探索队 · 驻扎', explorer.x, explorer.y - 34, '#ffe5a1');
    this.canvas.dataset.explorerPosition = `${explorer.x.toFixed(1)},${explorer.y.toFixed(1)}`;
    this.canvas.dataset.revealed = String(world.revealed.length);
  }
  select(id) { this.selected = id; }
  home() { this.camera = { ...tilePoint(WORLD.home), zoom: .95 }; this.following = false; }
  follow() { const p = this.explorerPosition(); this.camera.x = p.x; this.camera.y = p.y; this.following = true; }
  fit() { this.camera = { x: WORLD.width / 2, y: WORLD.height / 2, zoom: Math.min(this.width / WORLD.width, this.height / WORLD.height) * .96 }; this.following = false; }
  zoomBy(factor) { this.camera.zoom = Math.max(.15, Math.min(2.5, this.camera.zoom * factor)); }
  pick(x, y) {
    const worldX = (x - this.width / 2) / this.camera.zoom + this.camera.x;
    const worldY = (y - this.height / 2) / this.camera.zoom + this.camera.y;
    const row = Math.max(0, Math.min(WORLD.rows - 1, Math.round((worldY - 27) / 37.5)));
    const col = Math.max(0, Math.min(WORLD.columns - 1, Math.round((worldX - 28) / (Math.sqrt(3) * WORLD.radius) - row % 2 * .5)));
    const id = row * WORLD.columns + col;
    return [id, ...neighbors(id)].sort((a, b) => { const p = tilePoint(a), q = tilePoint(b); return Math.hypot(p.x - worldX, p.y - worldY) - Math.hypot(q.x - worldX, q.y - worldY); })[0];
  }
  bindInput() {
    let drag = null; const fingers=new Map();let pinch=null;
    this.canvas.addEventListener('pointerdown', e => { fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===2){const [a,b]=[...fingers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:this.camera.zoom};drag=null;this.canvas.setPointerCapture(e.pointerId);return;} drag = { x: e.clientX, y: e.clientY, cx: this.camera.x, cy: this.camera.y }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', e => {
      if(fingers.has(e.pointerId))fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===2&&pinch){const [a,b]=[...fingers.values()];this.camera.zoom=Math.max(.15,Math.min(2.5,pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));return;}
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
      this.following = false;
      this.camera.x = Math.max(-100, Math.min(WORLD.width + 100, drag.cx - (e.clientX - drag.x) / this.camera.zoom));
      this.camera.y = Math.max(-100, Math.min(WORLD.height + 100, drag.cy - (e.clientY - drag.y) / this.camera.zoom));
    });
    this.canvas.addEventListener('pointerup', e => { fingers.delete(e.pointerId);if(pinch){if(!fingers.size)pinch=null;drag=null;return;}
      if (drag && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) { const box = this.canvas.getBoundingClientRect(); this.selected = this.pick(e.clientX - box.left, e.clientY - box.top); this.onSelect(this.selected); }
      drag = null;
    });
    this.canvas.addEventListener('pointercancel', () => { drag = null;fingers.clear();pinch=null; });
    this.canvas.addEventListener('wheel', e => { if (!this.active) return; e.preventDefault(); this.zoomBy(e.deltaY > 0 ? .9 : 1.1); }, { passive: false });
    this.canvas.addEventListener('keydown', e => {
      const deltas = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60] };
      if (deltas[e.key]) { e.preventDefault(); this.following = false; this.camera.x += deltas[e.key][0] / this.camera.zoom; this.camera.y += deltas[e.key][1] / this.camera.zoom; }
      if (e.key === '+' || e.key === '=') this.zoomBy(1.2);
      if (e.key === '-') this.zoomBy(.8);
      if (e.key.toLowerCase() === 'h') this.home();
    });
  }
}
