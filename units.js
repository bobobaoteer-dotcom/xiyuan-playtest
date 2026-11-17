import {softShadow} from './landscape.js?v=8';
let atlas=null,frames=null;
const WALK=[0,1,2,3],WORK=[1,0,2,3];
function loadAtlas(){
 if(atlas||typeof Image==='undefined')return;
 atlas=new Image();atlas.src=new URL('./assets/villagers-v7.webp',import.meta.url).href;
 atlas.onload=()=>{
  const canvas=document.createElement('canvas'),w=Math.floor(atlas.naturalWidth/4),h=Math.floor(atlas.naturalHeight/4);canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});frames=[];
  for(let i=0;i<16;i++){
   ctx.clearRect(0,0,w,h);ctx.drawImage(atlas,i%4*atlas.naturalWidth/4,Math.floor(i/4)*atlas.naturalHeight/4,atlas.naturalWidth/4,atlas.naturalHeight/4,0,0,w,h);
   const data=ctx.getImageData(0,0,w,h).data;let foot=.94;
   // Ground contact follows the shoes, not changing pose height or tool reach.
   outer:for(let y=h-1;y>h*.65;y--)for(let x=Math.floor(w*.25);x<w*.69;x++)if(data[(y*w+x)*4+3]>210){foot=(y+1)/h;break outer;}
   frames.push({foot});
  }
 };
}
export function drawVillager(ctx,x,y,time,options={}){
 loadAtlas();if(!atlas?.complete||!atlas.naturalWidth||!frames||options.era>=3)return false;
 const{scale=1,direction=1,walking=true,working=false,carrying=false,role='farm'}=options;
 const row=working?(role==='lumber'?1:role==='quarry'||role==='builder'?2:0):carrying&&role==='lumber'?3:0;
 const order=row===1||row===2?WORK:WALK,col=working&&row===0?1:(working||walking)?order[Math.floor(time*(working?5.8:6.5))%4]:1,index=row*4+col,sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/4,size=43*scale,foot=frames[index].foot;
 softShadow(ctx,x+2,y+1,7*scale,2.6*scale,.34);
 ctx.save();ctx.translate(x,y);ctx.rotate(walking?Math.sin(time*6.5)*.012:0);ctx.scale(direction,!walking&&row===0?1+Math.sin(time*2.5)*.006:1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,col*sw,row*sh,sw,sh,-size*.5,-size*foot,size,size);ctx.restore();
 return true;
}
