import {FOOTPRINT} from './base.js?v=7';
export const MASK_SIZE=192;
export function iso(x,y){return{x:960+(x-y)*40,y:70+(x+y)*20};}
export function gridPoint(p){return{x:((p.y-70)/20+(p.x-960)/40)/2,y:((p.y-70)/20-(p.x-960)/40)/2};}
export function screenToWorld(p,c,v){const sx=v.width/(v.logicalWidth??v.width),sy=v.height/(v.logicalHeight??v.height);return{x:(p.x-v.left-v.width/2)/sx/c.zoom+c.x,y:(p.y-v.top-v.height/2)/sy/c.zoom+c.y};}
export function worldToScreen(p,c,v){const sx=v.width/(v.logicalWidth??v.width),sy=v.height/(v.logicalHeight??v.height);return{x:v.left+v.width/2+(p.x-c.x)*c.zoom*sx,y:v.top+v.height/2+(p.y-c.y)*c.zoom*sy};}
export function placementAt(p,size){const g=gridPoint(p);return{x:Math.round(g.x-size/2),y:Math.round(g.y-size/2)};}
export function zoomAt(camera,anchor,screen,viewport,zoom,min=.28){const c={...camera,zoom:Math.max(min,Math.min(2.5,zoom))};const sx=viewport.width/(viewport.logicalWidth??viewport.width),sy=viewport.height/(viewport.logicalHeight??viewport.height);c.x=anchor.x-(screen.x-viewport.left-viewport.width/2)/sx/c.zoom;c.y=anchor.y-(screen.y-viewport.top-viewport.height/2)/sy/c.zoom;return c;}
export function buildingGeometry(id,p,era){
 const n=FOOTPRINT[id],pos=iso(p.x+n/2,p.y+n/2),size=n===3?204:156;
 const index=({hall:0,farm:1,lumber:2,quarry:3,homes:4,library:5,warehouse:2,market:4,tower:0,barracks:4})[id];
 const anchor=era===0?([.82,.79,.83,.84,.82,.84][index]??.83):.83;
 return{pos,size,index,anchor,rect:{x:pos.x-size/2,y:pos.y-size*anchor,w:size,h:size}};
}
export function obstacleAnchor(type){return type==='forest'?.94:type==='rock'?.89:.87;}
export function contains(p,r){return!!r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
export function spriteContains(p,r,mask){
 const angle=r.angle??0,anchor=r.origin;if(angle&&anchor){const dx=p.x-anchor.x,dy=p.y-anchor.y;p={x:anchor.x+dx*Math.cos(angle)+dy*Math.sin(angle),y:anchor.y-dx*Math.sin(angle)+dy*Math.cos(angle)};}
 if(!contains(p,r))return false;if(!mask)return false;
 const x=Math.min(MASK_SIZE-1,Math.max(0,Math.floor((p.x-r.x)/r.w*MASK_SIZE))),y=Math.min(MASK_SIZE-1,Math.max(0,Math.floor((p.y-r.y)/r.h*MASK_SIZE)));
 return mask[(y*MASK_SIZE+x)*4+3]>55;
}
