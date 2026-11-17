import {FOOTPRINT} from './base.js?v=8';
import {iso} from './spatial.js?v=8';
export function walkableCells(state){
 const occupied=new Set();for(const[id,p]of Object.entries(state.base.positions))for(let y=p.y;y<p.y+FOOTPRINT[id];y++)for(let x=p.x;x<p.x+FOOTPRINT[id];x++)occupied.add(`${x},${y}`);
 return new Set(state.base.cleared.filter(k=>!occupied.has(k)));
}
export function walkRoute(state,start,goal){
 const allowed=walkableCells(state),key=p=>`${p.x},${p.y}`;
 const cells=[...allowed].map(k=>{const[x,y]=k.split(',').map(Number);return{x,y};});
 if(!cells.length)return[];
 const distance=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
 const first=allowed.has(key(start))?start:cells.sort((a,b)=>distance(a,start)-distance(b,start))[0];
 const queue=[first],previous=new Map([[key(first),null]]);let best=first;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(distance(p,goal)<distance(best,goal))best=p;if(distance(p,goal)===0){best=p;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(allowed.has(k)&&!previous.has(k)){previous.set(k,p);queue.push(n);}}}
 const path=[];for(let p=best;p;p=previous.get(key(p)))path.unshift(iso(p.x+.5,p.y+.5));return path;
}
export function pointOnPath(path,fraction){
 if(!path.length)return null;if(path.length===1)return{...path[0],direction:1};
 const f=Math.max(0,Math.min(1,fraction))*(path.length-1),i=Math.min(path.length-2,Math.floor(f)),mix=f-i,a=path[i],b=path[i+1];return{x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix,direction:b.x>=a.x?1:-1};
}
