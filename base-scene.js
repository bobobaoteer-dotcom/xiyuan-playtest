import {walkRoute,pointOnPath,walkableCells} from './walkways.js?v=7';
import {iso,gridPoint,screenToWorld,worldToScreen,placementAt,zoomAt,buildingGeometry,obstacleAnchor,contains,spriteContains,MASK_SIZE} from './spatial.js?v=7';
export {iso} from './spatial.js?v=7';
import {Landscape,noise,oval,softShadow} from './landscape.js?v=7';
import {terrainAt,isCleared,OBSTACLES,canClear} from './frontier.js?v=7';
import {FOOTPRINT, fits, placementIssue, GRID} from './base.js?v=7';
import {BUILDINGS, buildingName} from './engine.js?v=7';
import {drawPerson} from './scene.js?v=7';
function diamond(ctx,x,y,size,fill,stroke){const p=iso(x,y);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+size*40,p.y+size*20);ctx.lineTo(p.x,p.y+size*40);ctx.lineTo(p.x-size*40,p.y+size*20);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
export class BaseScene{
 constructor(canvas,getState,onSelect,onPlace,onTerrain){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=getState;this.onSelect=onSelect;this.onPlace=onPlace;this.onTerrain=onTerrain;this.hitRegions=[];this.spriteMasks=new Map();this.active=true;this.paused=false;this.time=0;this.last=0;this.camera={x:960,y:540,zoom:.9};this.selected='hall';this.focused=false;this.bursts=[];this.lastClearing=null;this.placing=null;this.ghost={x:14,y:12};this.paths=new Map();
  this.stoneAtlas=new Image();this.stoneAtlas.src=new URL('./assets/village-atlas-v6.webp',import.meta.url).href;
  this.landscape=new Landscape(iso);
  this.atlas=new Image();this.atlas.src=new URL('./assets/buildings.png',import.meta.url).href;
  new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.input();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,2.5);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;}
 home(){this.camera={x:960,y:590,zoom:Math.min(1.15,Math.max(.86,this.w/650))};}
 viewport(){const r=this.canvas.getBoundingClientRect();return{left:r.left,top:r.top,width:r.width,height:r.height,logicalWidth:this.w,logicalHeight:this.h};}
 zoomBy(f,screen){const v=this.viewport(),point=screen??{x:v.left+v.width/2,y:v.top+v.height/2};this.camera=zoomAt(this.camera,this.worldPoint(point.x,point.y),point,v,this.camera.zoom*f);}
 pick(clientX,clientY){const p=gridPoint(this.worldPoint(clientX,clientY));return{x:Math.floor(p.x),y:Math.floor(p.y)};}
 worldPoint(clientX,clientY){return screenToWorld({x:clientX,y:clientY},this.camera,this.viewport());}
 hitBuilding(clientX,clientY){const p=this.worldPoint(clientX,clientY),regions=[...this.hitRegions].reverse();return regions.find(r=>contains(p,r.label))??regions.find(r=>spriteContains(p,r,this.spriteMasks.get(r.mask)));}
 hitGhost(clientX,clientY){if(!this.placing)return false;const p=this.worldPoint(clientX,clientY),g=buildingGeometry(this.placing,this.ghost,this.getState().era),key=(this.getState().era===0?'stone:':'later:')+(this.getState().era===0?g.index:BUILDINGS.find(b=>b.id===this.placing).sprite),cell=gridPoint(p),n=FOOTPRINT[this.placing];return spriteContains(p,{...g.rect,mask:key},this.spriteMasks.get(key))||cell.x>=this.ghost.x&&cell.x<=this.ghost.x+n&&cell.y>=this.ghost.y&&cell.y<=this.ghost.y+n;}
 begin(id){
  const state=this.getState();this.placing=id;this.ghost={...(state.base.positions[id]??{x:14,y:12})};
  if(!state.base.positions[id]&&!fits(state.base,id,this.ghost)){const spots=[];for(let y=3;y<21;y++)for(let x=3;x<21;x++)if(fits(state.base,id,{x,y}))spots.push({x,y});spots.sort((a,b)=>(a.x-12)**2+(a.y-12)**2-((b.x-12)**2+(b.y-12)**2));if(spots.length)this.ghost=spots[0];}
  const g=buildingGeometry(id,this.ghost,state.era),screen=worldToScreen(g.pos,this.camera,this.viewport());if(screen.x<70||screen.x>this.w-70||screen.y<190||screen.y>this.h-260){this.camera.x=g.pos.x;this.camera.y=g.pos.y+(this.h/2-this.h*.46)/this.camera.zoom;}
  this.onPlace(this.ghost);
 }
 nudge(dx,dy){if(!this.placing)return;this.ghost={x:this.ghost.x+dx,y:this.ghost.y+dy};this.onPlace(this.ghost);}
 input(){
  const touches=new Map();let gesture=null,pinch=null,suppressTap=false;
  const startGesture=e=>{const world=this.worldPoint(e.clientX,e.clientY);gesture={x:e.clientX,y:e.clientY,camera:{...this.camera},world,ghost:{...this.ghost},mode:this.placing&&this.hitGhost(e.clientX,e.clientY)?'place':'pan',moved:false};};
  this.canvas.addEventListener('pointerdown',e=>{touches.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture(e.pointerId);if(touches.size===1){suppressTap=false;startGesture(e);}else if(touches.size===2){const[a,b]=[...touches.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),camera:{...this.camera},anchor:this.worldPoint(mid.x,mid.y)};gesture=null;suppressTap=true;}});
  this.canvas.addEventListener('pointermove',e=>{
   if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinch&&touches.size===2){const[a,b]=[...touches.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};this.camera=zoomAt(pinch.camera,pinch.anchor,mid,this.viewport(),pinch.camera.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance);return;}
   if(!gesture)return;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7)gesture.moved=true;if(!gesture.moved)return;
   if(gesture.mode==='place'&&this.placing){const a=gridPoint(gesture.world),b=gridPoint(this.worldPoint(e.clientX,e.clientY));this.ghost={x:gesture.ghost.x+Math.round(b.x-a.x),y:gesture.ghost.y+Math.round(b.y-a.y)};this.onPlace(this.ghost);}
   else{this.camera.x=gesture.camera.x-(e.clientX-gesture.x)/this.camera.zoom;this.camera.y=gesture.camera.y-(e.clientY-gesture.y)/this.camera.zoom;}
  });
  this.canvas.addEventListener('pointerup',e=>{
   if(!touches.has(e.pointerId))return;
   if(!suppressTap&&!pinch&&gesture&&!gesture.moved){
    if(this.placing){if(gesture.mode!=='place')this.ghost=placementAt(this.worldPoint(e.clientX,e.clientY),FOOTPRINT[this.placing]);this.onPlace(this.ghost);}
    else{const hit=this.hitBuilding(e.clientX,e.clientY);if(hit?.id){this.selected=hit.id;this.onSelect(hit.id);}else if(hit?.kind==='terrain')this.onTerrain(hit.cell);else{const p=this.pick(e.clientX,e.clientY);if(p.x>=0&&p.y>=0&&p.x<GRID&&p.y<GRID)this.onTerrain(p);}}
   }
   touches.delete(e.pointerId);gesture=null;if(touches.size===1){pinch=null;const p=[...touches.values()][0];startGesture({clientX:p.x,clientY:p.y});suppressTap=true;}if(!touches.size){pinch=null;suppressTap=false;}
  });
  this.canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);gesture=null;pinch=null;suppressTap=true;});
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoomBy(e.deltaY>0?.9:1.1,{x:e.clientX,y:e.clientY});},{passive:false});
  this.canvas.addEventListener('keydown',e=>{const step={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(step){e.preventDefault();if(this.placing)this.nudge(...step);else{this.camera.x+=step[0]*60;this.camera.y+=step[1]*60;}}if(e.key==='+')this.zoomBy(1.15);if(e.key==='-')this.zoomBy(.85);});
 }
 frame(now){
  requestAnimationFrame(this.frame);if(!this.active||document.hidden||now-this.last<33)return;if(!this.paused)this.time+=Math.min(.08,(now-(this.last||now))/1000);this.last=now;
  const ctx=this.ctx,state=this.getState(),t=this.time;
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0);const bg=ctx.createLinearGradient(0,0,this.w,this.h);bg.addColorStop(0,'#759952');bg.addColorStop(1,'#5f804a');ctx.fillStyle=bg;ctx.fillRect(0,0,this.w,this.h);ctx.translate(this.w/2,this.h/2);ctx.scale(this.camera.zoom,this.camera.zoom);ctx.translate(-this.camera.x,-this.camera.y);
  this.landscape.update(state,this.placing);ctx.drawImage(this.landscape.ground,0,0);
  if(this.placing||this.terrainSelected)this.drawPlacementGrid(ctx,state);
  this.hitRegions=[];
  const objects=[];
  for(const f of this.landscape.features){const sx=(f.pos.x-this.camera.x)*this.camera.zoom+this.w/2,sy=(f.pos.y-this.camera.y)*this.camera.zoom+this.h/2;if(sx< -150||sx>this.w+150||sy< -30||sy>this.h+f.size*this.camera.zoom)continue;objects.push({depth:f.pos.y,draw:()=>this.obstacle(ctx,f,t)});}
  for(const [id,p] of Object.entries(state.base.positions)){if(this.placing===id)continue;const n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2);objects.push({depth:pos.y,draw:()=>this.building(ctx,state,id,p)});}
  const stamp=JSON.stringify(state.base.positions)+JSON.stringify(state.base.jobs)+JSON.stringify(state.base.clearing)+state.base.cleared.length+(state.construction[0]?.id??'');if(stamp!==this.stamp){this.stamp=stamp;this.paths.clear();this.workEdges={};this.patrol=null;}
  const hall=state.base.positions.hall??{x:11,y:11},start={x:hall.x+3,y:hall.y+2};
  for(const [role,count] of Object.entries(state.base.jobs))for(let n=0;n<Math.min(count,18);n++){
   const i=({wood:0,stone:37,food:74,builder:111})[role]+n,edges=this.workEdges[role]??(this.workEdges[role]=state.base.cleared.map(k=>{const [x,y]=k.split(',').map(Number);return{x,y};}).filter(p=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!isCleared(state.base,p.x+dx,p.y+dy)&&terrainAt(p.x+dx,p.y+dy)===(role==='stone'?'rock':'forest')))),edge=edges[(n+2)%Math.max(1,edges.length)]??{x:15,y:14},target=['wood','stone','food'].includes(role)?edge:state.construction.length?(()=>{const id=state.construction[0].id,p=state.base.positions[id];return{x:p.x+FOOTPRINT[id],y:p.y+1};})():{x:hall.x+4,y:hall.y+1};
   if(!this.paths.has(i))this.paths.set(i,walkRoute(state,start,target));const path=this.paths.get(i),phase=role==='builder'&&!state.construction.length?31.5:(t+i*7)%32;if(!path.length)continue;
   const f=phase<12?phase/12:phase<19?1:phase<31?1-(phase-19)/12:0;const step=Math.min(path.length-2,Math.floor(f*(path.length-1))),mix=f*(path.length-1)-step,a=path[step]??path[0],b=path[step+1]??a;
   const pos={x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix};if(phase>=12&&phase<19&&role!=='builder')objects.push({depth:pos.y-.1,draw:()=>{const beat=(t*2.5+i)%1;oval(ctx,pos.x-8+beat*12,pos.y-15-beat*15,2*(1-beat),2*(1-beat),role==='stone'?'#d6d4af':'#d9bb69');}});objects.push({depth:pos.y,draw:()=>drawPerson(ctx,pos.x,pos.y,t+i,{role:role==='wood'?'lumber':role==='stone'?'quarry':role,walking:phase<12||phase>19&&phase<31,working:phase>=12&&phase<19,carrying:phase>19&&phase<31,direction:(b.x-a.x)*(phase>19?-1:1)>=0?1:-1,scale:1.65,era:state.era})});
  }
  if(state.base.clearing){
   const job=state.base.clearing,p=this.landscape.features.find(f=>f.x===job.x&&f.y===job.y)?.pos??iso(job.x+.5,job.y+.5),allowed=walkableCells(state),adjacent=[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>({x:job.x+dx,y:job.y+dy})).filter(c=>allowed.has(`${c.x},${c.y}`)),cell=adjacent[0];
   if(cell){const stand=iso(cell.x+.5,cell.y+.5),foot={x:stand.x*.7+p.x*.3,y:stand.y*.7+p.y*.3};objects.push({depth:foot.y,draw:()=>{drawPerson(ctx,foot.x,foot.y,t,{working:true,walking:false,role:terrainAt(job.x,job.y)==='rock'?'quarry':'lumber',direction:p.x>=foot.x?1:-1,scale:1.65});ctx.strokeStyle='#f0ca77';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-45,15,-Math.PI/2,-Math.PI/2+Math.min(1,(Date.now()-job.start)/(job.end-job.start))*Math.PI*2);ctx.stroke();}});}
  }
  const soldiers=Math.min(24,state.base.army.militia+state.base.army.archer);if(soldiers&&!this.patrol)this.patrol=walkRoute(state,start,{x:hall.x+5,y:hall.y+5});
  for(let i=0;i<soldiers;i++){const phase=(t*.035+i/Math.max(soldiers,1))%2,f=phase<=1?phase:2-phase,p=pointOnPath(this.patrol,f);if(!p)continue;objects.push({depth:p.y,draw:()=>{drawPerson(ctx,p.x,p.y,t+i,{scale:1.65,walking:true,role:'soldier',direction:p.direction*(phase<=1?1:-1),era:state.era});ctx.strokeStyle='#ddd9bf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+11,p.y-3);ctx.lineTo(p.x+11,p.y-44);ctx.stroke();}});}
  objects.sort((a,b)=>a.depth-b.depth);objects.forEach(o=>o.draw());
  for(const [id,p] of Object.entries(state.base.positions))if(id!==this.placing&&(this.focused&&id===this.selected||state.construction.some(j=>j.id===id)))this.label(ctx,state,id,p);
  this.atmosphere(ctx,state,t);
  this.canvas.dataset.visibleLabels=String(this.hitRegions.filter(r=>r.label).length);
  if(this.placing){const valid=fits(state.base,this.placing,this.ghost);diamond(ctx,this.ghost.x,this.ghost.y,FOOTPRINT[this.placing],valid?'#8bdc7780':'#e3665f88',valid?'#d7ffc0':'#ffd6c5');const issue=placementIssue(state.base,this.placing,this.ghost);for(const cell of issue?.cells??[])diamond(ctx,cell.x,cell.y,1,'#e9866d88','#ffc2a6');this.building(ctx,state,this.placing,this.ghost,true);const center=buildingGeometry(this.placing,this.ghost,state.era).pos;ctx.strokeStyle='#fffde3';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(center.x,center.y,4/this.camera.zoom,0,Math.PI*2);ctx.stroke();}
  this.canvas.dataset.ghost=this.placing?JSON.stringify({id:this.placing,...this.ghost,center:buildingGeometry(this.placing,this.ghost,state.era).pos,rect:buildingGeometry(this.placing,this.ghost,state.era).rect}):'';
  this.canvas.dataset.camera=JSON.stringify(this.camera);this.canvas.dataset.terrainSelection=this.terrainSelected?`${this.terrainSelected.x},${this.terrainSelected.y}`:'';
  this.canvas.dataset.workers=String(state.base.workers);this.canvas.dataset.soldiers=String(soldiers);this.canvas.dataset.frameTime=t.toFixed(2);
 }
 obstacle(ctx,f,t){
  const image=this.stoneAtlas;if(!image.complete||!image.naturalWidth)return;
  const {pos:p,size,index,type}=f,sw=image.naturalWidth/3,sh=image.naturalHeight/3;
  softShadow(ctx,p.x+12,p.y+3,size*.28,size*.11,.36);if(this.terrainSelected?.x===f.x&&this.terrainSelected?.y===f.y){ctx.strokeStyle='#fff0a2';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,size*.29,size*.12,0,0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.translate(p.x,p.y);if(type==='forest')ctx.rotate(Math.sin(t*.8+f.phase)*.012);ctx.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,-size/2,-size*obstacleAnchor(type),size,size);ctx.restore();
  const maskKey='stone:'+index;this.ensureMask(image,index,3,maskKey);
  this.hitRegions.push({kind:'terrain',cell:{x:f.x,y:f.y},mask:maskKey,angle:type==='forest'?Math.sin(t*.8+f.phase)*.012:0,origin:p,x:p.x-size/2,y:p.y-size*obstacleAnchor(type),w:size,h:size});
 }
 ensureMask(image,index,rows,key){
  if(this.spriteMasks.has(key)||!image.complete||!image.naturalWidth)return;
  const c=document.createElement('canvas');c.width=c.height=MASK_SIZE;const m=c.getContext('2d',{willReadFrequently:true}),sw=image.naturalWidth/3,sh=image.naturalHeight/rows;
  m.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,0,0,MASK_SIZE,MASK_SIZE);this.spriteMasks.set(key,m.getImageData(0,0,MASK_SIZE,MASK_SIZE).data);
 }
 drawPlacementGrid(ctx,state){
  if(this.placing)for(let y=3;y<21;y++)for(let x=3;x<21;x++)if(isCleared(state.base,x,y)&&Math.abs(x-this.ghost.x)+Math.abs(y-this.ghost.y)<8)diamond(ctx,x,y,1,'#ffffff02','#f2f3cc40');
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
  const b=BUILDINGS.find(b=>b.id===id),n=FOOTPRINT[id],geometry=buildingGeometry(id,p,state.era),{pos,size,rect}=geometry;
  if(id===this.selected&&this.focused||ghost){oval(ctx,pos.x,pos.y+3,n*36,n*17,'#d0e48e33');ctx.strokeStyle='#f9e58ec9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pos.x,pos.y+3,n*36,n*17,0,0,Math.PI*2);ctx.stroke();}
  const primitive=state.era===0,image=primitive?this.stoneAtlas:this.atlas;
  const index=primitive?({hall:0,farm:1,lumber:2,quarry:3,homes:4,library:5,warehouse:2,market:4,tower:0,barracks:4})[id]:b.sprite;
  if(image.complete&&image.naturalWidth){const sw=image.naturalWidth/3,sh=image.naturalHeight/(primitive?3:2);softShadow(ctx,pos.x+10,pos.y+7,size*.40,size*.14,ghost?.18:.30);softShadow(ctx,pos.x,pos.y+2,size*.28,size*.09,ghost?.12:.19);ctx.globalAlpha=ghost?.78:1;ctx.imageSmoothingQuality='high';ctx.drawImage(image,index%3*sw,Math.floor(index/3)*sh,sw,sh,rect.x,rect.y,size,size);ctx.globalAlpha=1;}
  const maskKey=(primitive?'stone:':'later:')+index;this.ensureMask(image,index,primitive?3:2,maskKey);
  if(!ghost)this.hitRegions.push({id,mask:maskKey,...rect});
  if(ghost)this.label(ctx,state,id,p,true);
 }
 label(ctx,state,id,p,ghost=false){
  const b=BUILDINGS.find(b=>b.id===id),n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2),job=state.construction.find(j=>j.id===id);
  ctx.font='600 13px "PingFang SC",sans-serif';ctx.textAlign='center';const text=buildingName(state,b)+(ghost?'':job?' · 施工中':' · Lv.'+state.buildings[id]),w=Math.max(100,ctx.measureText(text).width+22);
  ctx.fillStyle='#2d4b32ee';ctx.beginPath();ctx.roundRect(pos.x-w/2,pos.y+15,w,27,9);ctx.fill();ctx.fillStyle='#fff9e0';ctx.fillText(text,pos.x,pos.y+33);
  const region=this.hitRegions.find(r=>r.id===id);if(region)region.label={x:pos.x-w/2,y:pos.y+15,w,h:27};
 }
}
