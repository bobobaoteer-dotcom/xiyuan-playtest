import {terrainAt,isCleared} from './frontier.js?v=6';
import {FOOTPRINT} from './base.js?v=6';
const TAU=Math.PI*2;
export function noise(x,y=0){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
export function oval(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
export class Landscape{
 constructor(iso){this.iso=iso;this.ground=document.createElement('canvas');this.ground.width=2120;this.ground.height=1210;this.features=[];}
 update(state){
  const stamp=state.base.cleared.join('|')+JSON.stringify(state.base.positions);
  if(stamp===this.stamp)return;this.stamp=stamp;
  const ctx=this.ground.getContext('2d'),iso=this.iso;
  ctx.clearRect(0,0,2120,1210);
  const ground=ctx.createLinearGradient(300,0,1550,1200);ground.addColorStop(0,'#729a52');ground.addColorStop(.5,'#83a95d');ground.addColorStop(1,'#597b43');ctx.fillStyle=ground;ctx.fillRect(0,0,2120,1210);
  for(let i=0;i<700;i++){const x=noise(i,1)*2120,y=noise(i,2)*1210;oval(ctx,x,y,25+noise(i,3)*80,9+noise(i,4)*30,i%2?'#bccb7220':'#426d3a18');}
  // Overlapping soft patches remove the visible tile grid while retaining exact build cells.
  for(const key of state.base.cleared){const [x,y]=key.split(',').map(Number),p=iso(x+.5,y+.5);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.52);const patch=ctx.createRadialGradient(0,0,15,0,0,66);patch.addColorStop(0,'#afc57c');patch.addColorStop(.65,'#a6be73e8');patch.addColorStop(1,'#a6be7300');ctx.fillStyle=patch;ctx.fillRect(-68,-68,136,136);ctx.restore();}
  const hall=state.base.positions.hall??{x:11,y:11},home=iso(hall.x+1.5,hall.y+2.2);
  for(const [id,p] of Object.entries(state.base.positions)){const n=FOOTPRINT[id],a=iso(p.x+n/2,p.y+n/2+.3);oval(ctx,a.x,a.y,55+n*6,24+n*2,'#c9b0795c');if(id!=='hall'){ctx.strokeStyle='#c1b07a66';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(home.x,home.y);ctx.quadraticCurveTo((home.x+a.x)/2+20,home.y+25,a.x,a.y);ctx.stroke();}}
  // Tiny grasses and flowers are stable across reloads and stay out of building floors.
  for(let i=0;i<2800;i++){const x=noise(i,21)*24,y=noise(i,22)*24,p=iso(x,y);if(p.x<0||p.x>2120||p.y<0||p.y>1210)continue;const clear=isCleared(state.base,Math.floor(x),Math.floor(y));if(clear&&noise(i,23)>.3)continue;ctx.strokeStyle=clear?'#6d923944':'#385e3545';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x-2,p.y);ctx.lineTo(p.x-3,p.y-3);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+1,p.y-4);ctx.stroke();if(i%31===0)oval(ctx,p.x+2,p.y-3,1.4,1,'#f4df9bcc');}
  this.features=[];
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){
   if(isCleared(state.base,x,y))continue;const type=terrainAt(x,y);
   if(type==='mountain'&&(!(x===1||y===1||x===22||y===22)||(x+y)%3!==0))continue;
   const near=state.base.cleared.some(key=>{const [cx,cy]=key.split(',').map(Number);return Math.abs(cx-x)+Math.abs(cy-y)<=2;});
   if(type==='forest'&&!near&&noise(x+31,y)<.28)continue;
   const p=iso(x+.5+(noise(x,y)-.5)*.35,y+.5+(noise(y,x+1)-.5)*.35);
   const size=type==='mountain'?190+noise(x,y+4)*55:type==='rock'?64+noise(x,y+5)*28:85+noise(x,y+5)*38;
   this.features.push({x,y,type,pos:p,size,index:type==='forest'?6:type==='rock'?7:8,phase:noise(x,y+6)*TAU});
  }
 }
}
