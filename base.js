import {initialClearing,isCleared,restoreFrontier} from './frontier.js?v=7';
export const GRID = 24;
export const FOOTPRINT = { hall:3, farm:3, lumber:2, quarry:2, homes:2, library:3, warehouse:2, market:3, tower:2, barracks:3 };
export const DEFAULT_POSITIONS = { hall:[11,11],farm:[15,11],lumber:[7,10],quarry:[11,6],homes:[8,15],library:[15,15],warehouse:[5,14],market:[16,6],tower:[6,5],barracks:[11,17] };
export const JOBS = {wood:'砍树',stone:'挖矿',food:'采集食物',builder:'施工'};
export const TROOPS = { militia:{name:'长矛兵',food:40,wood:15,coin:12,seconds:20,level:1,power:10},archer:{name:'弓箭手',food:45,wood:30,coin:20,seconds:30,level:2,power:16} };
export function newBase(buildings) {
  return {cleared:initialClearing(),clearing:null,positions:Object.fromEntries(Object.keys(buildings).filter(id=>buildings[id]>0).map(id=>[id,{x:DEFAULT_POSITIONS[id][0],y:DEFAULT_POSITIONS[id][1]}])),workers:3,jobs:{wood:1,stone:1,food:0,builder:1},recruit:[],training:[],army:{militia:0,archer:0}};
}
export function placementIssue(base,id,p){
 const n=FOOTPRINT[id];if(!n||!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<3||p.y<3||p.x+n>21||p.y+n>21)return{type:'boundary'};
 const blocked=[];for(let y=p.y;y<p.y+n;y++)for(let x=p.x;x<p.x+n;x++)if(!isCleared(base,x,y))blocked.push({x,y});
 if(blocked.length)return{type:'uncleared',cells:blocked};
 for(const[other,q]of Object.entries(base.positions))if(other!==id&&!(p.x+n<=q.x||q.x+FOOTPRINT[other]<=p.x||p.y+n<=q.y||q.y+FOOTPRINT[other]<=p.y))return{type:'occupied',id:other};
 return null;
}
export function fits(base,id,p){return placementIssue(base,id,p)===null;}
export function restoreBase(saved,state,now) {
  const b=newBase(state.buildings);
  if(!saved){for(const j of state.construction)if(!b.positions[j.id])b.positions[j.id]={x:DEFAULT_POSITIONS[j.id][0],y:DEFAULT_POSITIONS[j.id][1]};restoreFrontier(b,null);return b;}
  b.positions={};
  b.cleared=Array.from({length:24*24},(_,i)=>`${i%24},${Math.floor(i/24)}`);
  for(const id of Object.keys(FOOTPRINT)) {
    if(!state.buildings[id]&&!state.construction.some(j=>j.id===id))continue;
    const preferred=saved.positions?.[id];
    if(fits(b,id,preferred))b.positions[id]={x:preferred.x,y:preferred.y};
    else {
      const fallback={x:DEFAULT_POSITIONS[id][0],y:DEFAULT_POSITIONS[id][1]};
      if(fits(b,id,fallback))b.positions[id]=fallback;
      else outer:for(let y=3;y<21;y++)for(let x=3;x<21;x++)if(fits(b,id,{x,y})){b.positions[id]={x,y};break outer;}
    }
  }
  b.workers=Number.isInteger(saved.workers)?Math.max(0,Math.min(4000,saved.workers)):3;
  let remaining=b.workers;
  for(const id of Object.keys(JOBS)){const n=Math.max(0,Math.min(remaining,Math.floor(Number(saved.jobs?.[id])||0)));b.jobs[id]=n;remaining-=n;}
  for(const id of Object.keys(TROOPS))b.army[id]=Math.max(0,Math.min(4000,Math.floor(Number(saved.army?.[id])||0)));
  const valid=j=>j&&Number.isFinite(j.start)&&Number.isFinite(j.end)&&j.end>j.start&&j.start>=0;
  b.recruit=(Array.isArray(saved.recruit)?saved.recruit:[]).filter(valid).slice(0,5);
  b.training=(Array.isArray(saved.training)?saved.training:[]).filter(j=>valid(j)&&TROOPS[j.type]).slice(0,5);
  if(state.construction.length&&b.jobs.builder===0&&b.workers>0){const donor=Object.keys(JOBS).find(id=>b.jobs[id]>0);if(donor)b.jobs[donor]--;b.jobs.builder=1;}
  restoreFrontier(b,saved);
  return b;
}
export function armySize(state){return Object.values(state.base.army).reduce((a,b)=>a+b,0);}
export function idleWorkers(state){return state.base.workers-Object.values(state.base.jobs).reduce((a,b)=>a+b,0)-(state.base.clearing?1:0);}
export function assignJob(state,id,delta){
  if(!JOBS[id]||![1,-1].includes(delta))return {ok:false,message:'请选择工作'};
  if(delta>0&&idleWorkers(state)<1)return {ok:false,message:'没有空闲农民，请先招募或从其他工作调回'};
  if(delta<0&&state.base.jobs[id]===0)return {ok:false,message:'此工作尚未分配农民'};
  if(id==='builder'&&delta<0&&state.base.jobs.builder===1&&state.construction.length)return {ok:false,message:'工程进行中，请至少保留一名建筑工'};
  state.base.jobs[id]+=delta;return {ok:true,message:`${JOBS[id]}已安排 ${state.base.jobs[id]} 人`};
}
export function recruitFarmer(state,now=Date.now()){
  if(state.base.recruit.length>=5)return {ok:false,message:'招募队列已满'};
  const occupied=state.base.workers+armySize(state)+state.base.recruit.length+state.base.training.length;
  if(occupied>=Math.floor(state.population))return {ok:false,message:'可招募居民不足，建造住房并等候人口增长'};
  if(state.resources.food<30||state.resources.coin<10)return {ok:false,message:'招募需要 30 食物和 10 财富'};
  state.resources.food-=30;state.resources.coin-=10;
  const start=Math.max(now,state.base.recruit.at(-1)?.end??now);state.base.recruit.push({start,end:start+12000});return {ok:true,message:'开始招募农民，完成后可分配工作'};
}
export function trainTroop(state,type,now=Date.now()){
  const unit=TROOPS[type];if(!unit)return {ok:false,message:'未知兵种'};
  if((state.buildings.barracks??0)<unit.level)return {ok:false,message:`需要 Lv.${unit.level} 兵营`};
  if(state.base.training.length>=5)return {ok:false,message:'训练队列已满'};
  if(state.base.workers+armySize(state)+state.base.recruit.length+state.base.training.length>=Math.floor(state.population))return {ok:false,message:'可训练居民不足，请扩建住房并等待人口增长'};
  if(['food','wood','coin'].some(id=>state.resources[id]<unit[id]))return {ok:false,message:'训练所需资源不足'};
  for(const id of ['food','wood','coin'])state.resources[id]-=unit[id];
  const start=Math.max(now,state.base.training.at(-1)?.end??now);state.base.training.push({type,start,end:start+unit.seconds*1000});return {ok:true,message:`${unit.name}已加入训练队列`};
}
export function moveBuilding(state,id,position){
  if(!state.base.positions[id]||!fits(state.base,id,position))return {ok:false,message:'此位置被占用或超出可建造范围'};
  state.base.positions[id]={...position};return {ok:true,message:'建筑位置已调整'};
}
