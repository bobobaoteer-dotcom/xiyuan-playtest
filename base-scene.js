import {Landscape,noise,oval} from './landscape.js?v=6';
import {terrainAt,isCleared,OBSTACLES,canClear} from './frontier.js?v=6';
import {FOOTPRINT, fits, GRID} from './base.js?v=6';
import {BUILDINGS, buildingName} from './engine.js?v=6';
import {drawPerson} from './scene.js?v=6';
export function iso(x,y){return {x:960+(x-y)*40,y:70+(x+y)*20};}
function diamond(ctx,x,y,size,fill,stroke){const p=iso(x,y);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+size*40,p.y+size*20);ctx.lineTo(p.x,p.y+size*40);ctx.lineTo(p.x-size*40,p.y+size*20);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function route(state,start,goal){
 const blocked=new Set();for(const [id,p] of Object.entries(state.base.positions))for(let x=p.x;x<p.x+FOOTPRINT[id];x++)for(let y=p.y;y<p.y+FOOTPRINT[id];y++)blocked.add(x+','+y);
 const key=p=>p.x+','+p.y,queue=[start],previous=new Map([[key(start),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(goal))break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy};if(n.x<1||n.y<1||n.x>22||n.y>22||blocked.has(key(n))||!isCleared(state.base,n.x,n.y)||previous.has(key(n)))continue;previous.set(key(n),p);queue.push(n);}}
 if(!previous.has(key(goal)))return [iso(start.x,start.y),iso(goal.x,goal.y)];
 const path=[];for(let p=goal;p;p=previous.get(key(p)))path.unshift(iso(p.x+.5,p.y+.5));return path;
}
export class BaseScene{
 constructor(canvas,getState,onSelect,onPlace,onTerrain){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=getState;this.onSelect=onSelect;this.onPlace=onPlace;this.onTerrain=onTerrain;this.hitRegions=[];this.spriteMasks=new Map();this.active=true;this.paused=false;this.time=0;this.last=0;this.camera={x:960,y:540,zoom:.9};this.selected='hall';this.focused=false;this.bursts=[];this.lastClearing=null;this.placing=null;this.ghost={x:14,y:12};this.paths=new Map();
  this.stoneAtlas=new Image();this.stoneAtlas.src=new URL('./assets/village-atlas-v6.webp',import.meta.url).href;
  this.landscape=new Landscape(iso);
  this.atlas=new Image();this.atlas.src=new URL('./assets/buildings.png',import.meta.url).href;
  new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.input();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,1.7);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;}
 home(){this.camera={x:960,y:590,zoom:Math.min(1.15,Math.max(.86,this.w/650))};}
 zoomBy(f){this.camera.zoom=Math.max(.28,Math.min(2.5,this.camera.zoom*f));}
 pick(clientX,clientY){const r=this.canvas.getBoundingClientRect(),x=(clientX-r.left-this.w/2)/this.camera.zoom+this.camera.x,y=(clientY-r.top-this.h/2)/this.camera.zoom+this.camera.y;return {x:Math.floor(((y-70)/20+(x-960)/40)/2),y:Math.floor(((y-70)/20-(x-960)/40)/2)};}
 worldPoint(clientX,clientY){const r=this.canvas.getBoundingClientRect();return {x:(clientX-r.left-this.w/2)/this.camera.zoom+this.camera.x,y:(clientY-r.top-this.h/2)/this.camera.zoom+this.camera.y};}
 hitBuilding(clientX,clientY){const p=this.worldPoint(clientX,clientY);const regions=[...this.hitRegions].reverse(),inside=r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;return regions.find(r=>r.label&&inside(r.label))??regions.find(r=>{if(!inside(r))return false;const mask=this.spriteMasks.get(r.mask);if(!mask)return true;const x=Math.max(0,Math.min(63,Math.floor((p.x-r.x)/r.w*64))),y=Math.max(0,Math.min(63,Math.floor((p.y-r.y)/r.h*64)));return mask[(y*64+x)*4+3]>35;});}
 begin(id){this.placing=id;this.ghost={x:14,y:12};this.onPlace(this.ghost);}
 input(){
  const touches=new Map();let drag=null,pinch=null,moved=false;
  this.canvas.addEventListener('pointerdown',e=>{touches.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture(e.pointerId);moved=false;if(touches.size===2){const [a,b]=[...touches.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:this.camera.zoom};drag=null;}else drag={x:e.clientX,y:e.clientY,cx:this.camera.x,cy:this.camera.y};});
  this.canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2&&pinch){const [a,b]=[...touches.values()];this.camera.zoom=Math.max(.28,Math.min(2.5,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance));moved=true;return;}if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)moved=true;this.camera.x=drag.cx-(e.clientX-drag.x)/this.camera.zoom;this.camera.y=drag.cy-(e.clientY-drag.y)/this.camera.zoom;});
  this.canvas.addEventListener('pointerup',e=>{if(!moved&&!pinch){const p=this.pick(e.clientX,e.clientY);if(this.placing){this.ghost=p;this.onPlace(p);}else {const state=this.getState();const hit=this.hitBuilding(e.clientX,e.clientY);if(hit?.kind==='terrain'){this.onTerrain(hit.cell);touches.delete(e.pointerId);drag=null;return;}const found=hit?.id ?? Object.entries(state.base.positions).find(([id,q])=>p.x>=q.x&&p.x<q.x+FOOTPRINT[id]&&p.y>=q.y&&p.y<q.y+FOOTPRINT[id])?.[0];if(found){this.selected=found;this.onSelect(found);}else if(p.x>=0&&p.y>=0&&p.x<GRID&&p.y<GRID)this.onTerrain(p);}}touches.delete(e.pointerId);drag=null;if(!touches.size)pinch=null;});
  this.canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);drag=null;pinch=null;});
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoomBy(e.deltaY>0?.9:1.1);},{passive:false});
  this.canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(this.placing){if(e.key==='ArrowLeft')this.ghost.x--;if(e.key==='ArrowRight')this.ghost.x++;if(e.key==='ArrowUp')this.ghost.y--;if(e.key==='ArrowDown')this.ghost.y++;this.onPlace(this.ghost);}else{this.camera.x+=e.key==='ArrowRight'?60:e.key==='ArrowLeft'?-60:0;this.camera.y+=e.key==='ArrowDown'?60:e.key==='ArrowUp'?-60:0;}}if(e.key==='+')this.zoomBy(1.15);if(e.key==='-')this.zoomBy(.85);});
 }
 frame(now){
  requestAnimationFrame(this.frame);if(!this.active||document.hidden||now-this.last<33)return;if(!this.paused)this.time+=Math.min(.08,(now-(this.last||now))/1000);this.last=now;
  const ctx=this.ctx,state=this.getState(),t=this.time;
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0);const bg=ctx.createLinearGradient(0,0,this.w,this.h);bg.addColorStop(0,'#759952');bg.addColorStop(1,'#5f804a');ctx.fillStyle=bg;ctx.fillRect(0,0,this.w,this.h);ctx.translate(this.w/2,this.h/2);ctx.scale(this.camera.zoom,this.camera.zoom);ctx.translate(-this.camera.x,-this.camera.y);
  this.landscape.update(state);ctx.drawImage(this.landscape.ground,0,0);
  this.hitRegions=[];
  const objects=[];
  for(const f of this.landscape.features){const sx=(f.pos.x-this.camera.x)*this.camera.zoom+this.w/2,sy=(f.pos.y-this.camera.y)*this.camera.zoom+this.h/2;if(sx< -150||sx>this.w+150||sy< -30||sy>this.h+f.size*this.camera.zoom)continue;objects.push({depth:f.pos.y,draw:()=>this.obstacle(ctx,f,t)});}
  for(const [id,p] of Object.entries(state.base.positions)){const n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2);objects.push({depth:pos.y,draw:()=>this.building(ctx,state,id,p)});}
  const stamp=JSON.stringify(state.base.positions)+JSON.stringify(state.base.jobs)+JSON.stringify(state.base.clearing)+state.base.cleared.length+(state.construction[0]?.id??'');if(stamp!==this.stamp){this.stamp=stamp;this.paths.clear();this.workEdges={};}
  const hall=state.base.positions.hall??{x:11,y:11},start={x:hall.x+3,y:hall.y+2};let index=0;
  for(const [role,count] of Object.entries(state.base.jobs))for(let n=0;n<Math.min(count,18);n++){
   const i=index++,edges=this.workEdges[role]??(this.workEdges[role]=state.base.cleared.map(k=>{const [x,y]=k.split(',').map(Number);return{x,y};}).filter(p=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!isCleared(state.base,p.x+dx,p.y+dy)&&terrainAt(p.x+dx,p.y+dy)===(role==='stone'?'rock':'forest')))),edge=edges[(n+2)%Math.max(1,edges.length)]??{x:15,y:14},target=['wood','stone','food'].includes(role)?edge:state.construction.length?(()=>{const id=state.construction[0].id,p=state.base.positions[id];return{x:p.x+FOOTPRINT[id],y:p.y+1};})():{x:hall.x+4,y:hall.y+1};
   if(!this.paths.has(i))this.paths.set(i,route(state,start,target));const path=this.paths.get(i),phase=(t+i*7)%32;
   const f=phase<12?phase/12:phase<19?1:phase<31?1-(phase-19)/12:0;const step=Math.min(path.length-2,Math.floor(f*(path.length-1))),mix=f*(path.length-1)-step,a=path[step]??path[0],b=path[step+1]??a;
   const pos={x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix};if(phase>=12&&phase<19&&role!=='builder')objects.push({depth:pos.y-.1,draw:()=>{const beat=(t*2.5+i)%1;oval(ctx,pos.x-8+beat*12,pos.y-15-beat*15,2*(1-beat),2*(1-beat),role==='stone'?'#d6d4af':'#d9bb69');}});objects.push({depth:pos.y,draw:()=>drawPerson(ctx,pos.x+(n%3)*5,pos.y,t+i,{role:role==='wood'?'lumber':role==='stone'?'quarry':role,walking:phase<12||phase>19&&phase<31,working:phase>=12&&phase<19,carrying:phase>19,direction:b.x>=a.x?1:-1,scale:1.65,era:state.era})});
  }
  if(state.base.clearing){const job=state.base.clearing,p=iso(job.x+.5,job.y+.5);objects.push({depth:p.y,draw:()=>{drawPerson(ctx,p.x+12,p.y+5,t,{working:true,role:terrainAt(job.x,job.y)==='rock'?'quarry':'lumber',scale:1.65});ctx.strokeStyle='#f0ca77';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-35,15,-Math.PI/2,-Math.PI/2+Math.min(1,(Date.now()-job.start)/(job.end-job.start))*Math.PI*2);ctx.stroke();}});}
  const soldiers=Math.min(24,state.base.army.militia+state.base.army.archer);for(let i=0;i<soldiers;i++){const angle=t*.12+i*6.28/Math.max(soldiers,1),p=iso(12+Math.cos(angle)*6,12+Math.sin(angle)*6);objects.push({depth:p.y,draw:()=>{drawPerson(ctx,p.x,p.y,t+i,{scale:1.35,walking:true,role:'quarry',era:4});ctx.strokeStyle='#eee4c7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+8,p.y);ctx.lineTo(p.x+8,p.y-38);ctx.stroke();}});}
  objects.sort((a,b)=>a.depth-b.depth);objects.forEach(o=>o.draw());
  for(const [id,p] of Object.entries(state.base.positions))if(this.focused&&id===this.selected||state.construction.some(j=>j.id===id))this.label(ctx,state,id,p);
  if(this.placing||this.terrainSelected)this.drawPlacementGrid(ctx,state);
  this.atmosphere(ctx,state,t);
  this.canvas.dataset.visibleLabels=String(this.hitRegions.filter(r=>r.label).length);
  if(this.placing){const valid=fits(state.base,this.placing,this.ghost);diamond(ctx,this.ghost.x,this.ghost.y,FOOTPRINT[this.placing],valid?'#8bdc7780':'#e3665f88',valid?'#d7ffc0':'#ffd6c5');this.building(ctx,state,this.placing,this.ghost,true);}
  this.canvas.dataset.camera=JSON.stringify(this.camera);this.canvas.dataset.terrainSelection=this.terrainSelected?`${this.terrainSelected.x},${this.terrainSelected.y}`:'';
  this.canvas.dataset.workers=String(state.base.workers);this.canvas.dataset.soldiers=String(soldiers);this.canvas.dataset.frameTime=t.toFixed(2);
 }
 obstacle(ctx,f,t){
  const image=this.stoneAtlas;if(!image.complete||!image.naturalWidth)return;
  const {pos:p,size,index,type}=f,sw=image.naturalWidth/3,sh=image.naturalHeight/3;
  oval(ctx,p.x+8,p.y-1,size*.32,size*.12,type==='mountain'?'#263c2f35':'#29472d30');
  ctx.save();ctx.translate(p.x,p.y);if(type==='forest')ctx.rotate(Math.sin(t*.8+f.phase)*.012);ctx.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,-size/2,-size*.87,size,size);ctx.restore();
  const maskKey='stone:'+index;this.ensureMask(image,index,3,maskKey);
  this.hitRegions.push({kind:'terrain',cell:{x:f.x,y:f.y},mask:maskKey,x:p.x-size/2,y:p.y-size*.87,w:size,h:size});
 }
 ensureMask(image,index,rows,key){
  if(this.spriteMasks.has(key)||!image.complete||!image.naturalWidth)return;
  const c=document.createElement('canvas');c.width=c.height=64;const m=c.getContext('2d',{willReadFrequently:true}),sw=image.naturalWidth/3,sh=image.naturalHeight/rows;
  m.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,0,0,64,64);this.spriteMasks.set(key,m.getImageData(0,0,64,64).data);
 }
 drawPlacementGrid(ctx,state){
  if(this.placing)for(let y=3;y<21;y++)for(let x=3;x<21;x++)if(isCleared(state.base,x,y))diamond(ctx,x,y,1,'#ffffff05','#ffffff45');
  if(this.terrainSelected){const p=this.terrainSelected;diamond(ctx,p.x,p.y,1,'#f6dd6d44','#fff1a2');}
 }
 atmosphere(ctx,state,t){
  const hall=state.base.positions.hall??{x:11,y:11},p=iso(hall.x+1.5,hall.y+1.5);
  // Fire, embers and smoke are independent of the baked building sprite.
  if(state.era<3){
   const x=p.x+22,y=p.y-14,glow=ctx.createRadialGradient(x,y,1,x,y,40);glow.addColorStop(0,'#ffcb5b2a');glow.addColorStop(1,'#ffb73500');ctx.fillStyle=glow;ctx.fillRect(x-42,y-42,84,84);
   for(let i=0;i<3;i++){const h=9+Math.sin(t*8+i*3)*3;ctx.fillStyle=['#ef923be0','#ffca60e8','#ffe6a1e8'][i];ctx.beginPath();ctx.moveTo(x-4+i*2,y);ctx.quadraticCurveTo(x-7+i*3,y-h*.5,x-1+i*2+Math.sin(t*6+i)*2,y-h);ctx.quadraticCurveTo(x+5+i,y-h*.5,x+2+i,y);ctx.fill();}
   for(let i=0;i<7;i++){const f=(t*.13+i/7)%1;oval(ctx,x+Math.sin(f*5+i)*7+f*15,y-12-f*80,5+f*11,3+f*8,`rgba(240,234,206,${(1-f)*.15})`);}
   for(let i=0;i<6;i++){const f=(t*.32+i*.17)%1;oval(ctx,x+Math.sin(f*8+i)*7,y-f*37,1.1*(1-f),1.7*(1-f),`rgba(255,210,91,${1-f})`);}
  }
  for(let i=0;i<12;i++){const x=580+(t*5+i*97)%800,y=320+Math.sin(t*.4+i*2)*95+i*20;ctx.save();ctx.translate(x,y);ctx.rotate(t*.45+i);oval(ctx,0,0,2.4,1,'#dbe39a65');ctx.restore();}
  if(this.lastClearing&&!state.base.clearing&&isCleared(state.base,this.lastClearing.x,this.lastClearing.y))this.bursts.push({...this.lastClearing,at:t});
  this.lastClearing=state.base.clearing?{x:state.base.clearing.x,y:state.base.clearing.y}:null;
  this.bursts=this.bursts.filter(b=>t-b.at<1.8);
  for(const b of this.bursts){const q=iso(b.x+.5,b.y+.5),f=(t-b.at)/1.8;for(let i=0;i<14;i++){const a=i*2.4;oval(ctx,q.x+Math.cos(a)*f*45,q.y+Math.sin(a)*f*20-f*35,3*(1-f),2*(1-f),i%2?'#ead49ac0':'#d9c48ac0');}ctx.globalAlpha=1-f;ctx.fillStyle='#fff8c4';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('新土地',q.x,q.y-35-f*25);ctx.globalAlpha=1;}
 }
 building(ctx,state,id,p,ghost=false){
  const b=BUILDINGS.find(b=>b.id===id),n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2);
  if(id===this.selected&&this.focused||ghost){oval(ctx,pos.x,pos.y+3,n*36,n*17,'#d0e48e33');ctx.strokeStyle='#f9e58ec9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pos.x,pos.y+3,n*36,n*17,0,0,Math.PI*2);ctx.stroke();}
  const primitive=state.era===0,image=primitive?this.stoneAtlas:this.atlas;
  const index=primitive?({hall:0,farm:1,lumber:2,quarry:3,homes:4,library:5,warehouse:2,market:4,tower:0,barracks:4})[id]:b.sprite;
  const size=n===3?204:156;
  if(image.complete&&image.naturalWidth){const sw=image.naturalWidth/3,sh=image.naturalHeight/(primitive?3:2);ctx.globalAlpha=ghost?.55:1;ctx.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,pos.x-size/2,pos.y-size*.83,size,size);ctx.globalAlpha=1;}
  const maskKey=(primitive?'stone:':'later:')+index;this.ensureMask(image,index,primitive?3:2,maskKey);
  if(!ghost)this.hitRegions.push({id,mask:maskKey,x:pos.x-size/2,y:pos.y-size*.83,w:size,h:size});
  if(ghost)this.label(ctx,state,id,p);
 }
 label(ctx,state,id,p){
  const b=BUILDINGS.find(b=>b.id===id),n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2),job=state.construction.find(j=>j.id===id);
  ctx.font='600 13px "PingFang SC",sans-serif';ctx.textAlign='center';const text=buildingName(state,b)+(job?' · 施工中':' · Lv.'+state.buildings[id]),w=Math.max(100,ctx.measureText(text).width+22);
  ctx.fillStyle='#2d4b32ee';ctx.beginPath();ctx.roundRect(pos.x-w/2,pos.y+15,w,27,9);ctx.fill();ctx.fillStyle='#fff9e0';ctx.fillText(text,pos.x,pos.y+33);
  const region=this.hitRegions.find(r=>r.id===id);if(region)region.label={x:pos.x-w/2,y:pos.y+15,w,h:27};
 }
}
