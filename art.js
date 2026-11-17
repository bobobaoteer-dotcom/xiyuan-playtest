const SERVICES={warehouse:0,market:1,tower:2,barracks:3};
export function buildingArt(id,era,legacy=0){
 if(era===0&&Object.hasOwn(SERVICES,id))return{file:'services-v8.webp',columns:2,rows:2,index:SERVICES[id],key:'service:'+SERVICES[id],uv:[{x:0,y:0,w:610/1263,h:600/1246},{x:620/1263,y:0,w:643/1263,h:600/1246},{x:0,y:600/1246,w:550/1263,h:646/1246},{x:550/1263,y:600/1246,w:713/1263,h:646/1246}][SERVICES[id]]};
 const index=era===0?({hall:0,farm:1,lumber:2,quarry:3,homes:4,library:5})[id]:legacy;
 return{file:era===0?'village-atlas-v6.webp':'buildings.png',columns:3,rows:era===0?3:2,index,key:(era===0?'stone:':'later:')+index};
}
