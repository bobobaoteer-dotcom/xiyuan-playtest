// Transparent terrain meshes drawn natively, so slopes have no rectangular image matte.
export function ridgeSprite(seed,texture){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 if(texture){const points=[[.01,.90],[.08,.63],[.22,.49],[.36,.06],[.47,.02],[.59,.37],[.72,.23],[.84,.46],[.95,.78],[.99,.92],[.76,.98],[.28,.98]];ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*256,y*256):ctx.moveTo(x*256,y*256));ctx.closePath();ctx.clip();const sw=texture.naturalWidth/3,sh=texture.naturalHeight/3;ctx.drawImage(texture,sw*2,sh*2,sw,sh,0,0,256,256);return c;}

 const polygon=(points,fill)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 const a=[68+seed*6,31+seed*8],b=[173-seed*5,81-seed*6];
 polygon([[8,218],[35,150],a,[111,95],b,[213,152],[248,222],[194,239],[91,237]],'#8a8a73');
 polygon([[8,218],[35,150],a,[80,157],[64,219]],'#c8c3a3');polygon([a,[111,95],[128,200],[80,157]],'#a7a78d');polygon([a,[80,157],[48,195]],'#ddd5b5');
 polygon([[80,157],[128,200],[91,237],[64,219]],'#9b9d82');polygon([[111,95],b,[150,158],[128,200]],'#c0bea0');polygon([b,[213,152],[194,239],[181,167]],'#8b927c');polygon([b,[150,158],[128,200],[181,167]],'#d0c9a9');
 polygon([[181,167],[194,239],[248,222],[213,152]],'#747e6b');polygon([[35,150],[48,195],[8,218]],'#a3a58a');polygon([[128,200],[150,158],[161,224],[91,237]],'#aaa98a');
 for(let i=0;i<18;i++){const x=27+(i*37+seed*17)%207,y=198+(i*13)%30;ctx.fillStyle=i%2?'#778547':'#93a35a';ctx.beginPath();ctx.ellipse(x,y,10+i%7,3+i%3,-.1,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#747c663e';ctx.lineWidth=1;for(const[x,y]of [[80,120],[156,140],[119,190],[202,185]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+22);ctx.lineTo(x-3,y+33);ctx.stroke();}return c;
}
