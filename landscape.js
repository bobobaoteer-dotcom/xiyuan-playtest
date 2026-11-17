import {walkRoute} from './walkways.js?v=8';
import {terrainAt,isCleared} from './frontier.js?v=8';
import {FOOTPRINT} from './base.js?v=8';
const TAU=Math.PI*2;
export function noise(x,y=0){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
export function oval(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
let shadowTexture;
export function softShadow(ctx,x,y,rx,ry,opacity=.25){
 if(!shadowTexture){shadowTexture=document.createElement('canvas');shadowTexture.width=128;shadowTexture.height=64;const c=shadowTexture.getContext('2d');c.scale(1,.5);const g=c.createRadialGradient(64,64,8,64,64,64);g.addColorStop(0,'#213628b0');g.addColorStop(.55,'#21362855');g.addColorStop(1,'#21362800');c.fillStyle=g;c.fillRect(0,0,128,128);}
 ctx.save();ctx.globalAlpha*=opacity;ctx.drawImage(shadowTexture,x-rx,y-ry,rx*2,ry*2);ctx.restore();
}
export class Landscape{
 constructor(iso){this.iso=iso;this.ground=document.createElement('canvas');this.ground.width=2120;this.ground.height=1210;this.features=[];this.details=[];}
 update(state,hiddenId){
  const stamp=state.base.cleared.join('|')+JSON.stringify(state.base.positions)+'|'+hiddenId;
  if(stamp===this.stamp)return;this.stamp=stamp;
  const ctx=this.ground.getContext('2d'),iso=this.iso;
  ctx.clearRect(0,0,2120,1210);
  const ground=ctx.createLinearGradient(300,0,1550,1200);ground.addColorStop(0,'#729a52');ground.addColorStop(.5,'#83a95d');ground.addColorStop(1,'#597b43');ctx.fillStyle=ground;ctx.fillRect(0,0,2120,1210);
  const texture=document.createElement('canvas');texture.width=106;texture.height=61;const tc=texture.getContext('2d'),pixels=tc.createImageData(106,61);
  for(let i=0;i<106*61;i++){const v=noise(i%106,Math.floor(i/106)),j=i*4;pixels.data[j]=v>.5?172:49;pixels.data[j+1]=v>.5?183:92;pixels.data[j+2]=v>.5?104:50;pixels.data[j+3]=Math.round(Math.abs(v-.5)*32);}
  tc.putImageData(pixels,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(texture,0,0,2120,1210);
  // Overlapping soft patches remove the visible tile grid while retaining exact build cells.
  for(const key of state.base.cleared){const [x,y]=key.split(',').map(Number),p=iso(x+.5,y+.5);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.52);const patch=ctx.createRadialGradient(0,0,15,0,0,66);patch.addColorStop(0,'#afc57c');patch.addColorStop(.65,'#a6be73e8');patch.addColorStop(1,'#a6be7300');ctx.fillStyle=patch;ctx.fillRect(-68,-68,136,136);ctx.restore();}
  const hall=state.base.positions.hall??{x:11,y:11},home=iso(hall.x+1.5,hall.y+2.2);
  for(const [id,p] of Object.entries(state.base.positions)){if(id===hiddenId)continue;const n=FOOTPRINT[id],a=iso(p.x+n/2,p.y+n/2+.3);oval(ctx,a.x,a.y,55+n*6,24+n*2,'#c9b0795c');if(id!=='hall'){const route=walkRoute(state,{x:hall.x+3,y:hall.y+2},{x:p.x+n,y:p.y+1});if(route.length>1){for(const[color,width]of [['#687d3b25',23],['#c2b3806b',15],['#e1c99a29',5]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(route[0].x,route[0].y);for(let i=1;i<route.length;i++){const next=route[i+1]??route[i];ctx.quadraticCurveTo(route[i].x,route[i].y,(route[i].x+next.x)/2,(route[i].y+next.y)/2);}ctx.stroke();}}}}
  // Tiny grasses and flowers are stable across reloads and stay out of building floors.
  for(let i=0;i<2800;i++){const x=noise(i,21)*24,y=noise(i,22)*24,p=iso(x,y);if(p.x<0||p.x>2120||p.y<0||p.y>1210)continue;const clear=isCleared(state.base,Math.floor(x),Math.floor(y));if(clear&&noise(i,23)>.3)continue;ctx.strokeStyle=clear?'#6d923944':'#385e3545';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x-2,p.y);ctx.lineTo(p.x-3,p.y-3);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+1,p.y-4);ctx.stroke();if(i%31===0)oval(ctx,p.x+2,p.y-3,1.4,1,'#f4df9bcc');}
  const occupied=(x,y)=>Object.entries(state.base.positions).some(([id,p])=>x>=p.x-.3&&x<=p.x+FOOTPRINT[id]+.3&&y>=p.y-.3&&y<=p.y+FOOTPRINT[id]+.3);
  this.details=[];for(const key of state.base.cleared){const[x,y]=key.split(',').map(Number);if(occupied(x+.5,y+.5))continue;const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!isCleared(state.base,x+dx,y+dy));if(edge&&noise(x+4,y)<.4)this.details.push({pos:iso(x+.2,y+.3),size:22+noise(x,y)*13});}
  this.features=[];
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){
   if(isCleared(state.base,x,y))continue;const type=terrainAt(x,y);
   if(type==='mountain'&&!((x===1||x===22)&&y%5===1||(y===1||y===22)&&x%5===3))continue;
   const near=state.base.cleared.some(key=>{const [cx,cy]=key.split(',').map(Number);return Math.abs(cx-x)+Math.abs(cy-y)<=2;});
   if(type==='forest'&&!near&&noise(x+31,y)<.40)continue;
   const p=iso(x+.5+(noise(x,y)-.5)*.35,y+.5+(noise(y,x+1)-.5)*.35);
   const size=type==='mountain'?145+noise(x,y+4)*65:type==='rock'?64+noise(x,y+5)*28:85+noise(x,y+5)*38;
   this.features.push({x,y,type,pos:p,size,variant:Math.floor(noise(x+9,y+23)*3),index:type==='forest'?6:type==='rock'?7:8,phase:noise(x,y+6)*TAU});
  }
 }
}
