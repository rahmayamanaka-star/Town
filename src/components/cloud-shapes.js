const random=(seed,n)=>{const v=Math.sin(seed*71.7+n*113.3)*43758.54;return v-Math.floor(v);};
const number=n=>Number(n.toFixed(3));

/** Each outline has its own billow count, asymmetry and proportions. */
export function cloudShape(seed) {
  const count=96,lobes=7+Math.floor(random(seed,1)*4),phase=random(seed,2)*Math.PI*2;
  const circles=Array.from({length:lobes},(_,i)=>{
    const a=i/lobes*Math.PI*2+phase+(random(seed,i+20)-.5)*.20;
    return {x:Math.cos(a)*(1.52+random(seed,i+40)*.25),y:Math.sin(a)*(.66+random(seed,i+60)*.22),r:.72+random(seed,i+80)*.36};
  });
  const width=Math.max(...circles.map(c=>Math.abs(c.x)+c.r)),height=Math.max(...circles.map(c=>Math.abs(c.y)+c.r));
  const points=Array.from({length:count},(_,i)=>{
    const a=i/count*Math.PI*2;
    const dx=Math.cos(a),dy=Math.sin(a);let radius=1.22;
    for(const c of circles){
      const projection=c.x*dx+c.y*dy,perpendicular=c.x*c.x+c.y*c.y-projection*projection;
      if(perpendicular<c.r*c.r)radius=Math.max(radius,projection+Math.sqrt(c.r*c.r-perpendicular));
    }
    return [dx*radius,dy*radius];
  });
  let d=`M${points[0].map(number).join(' ')}`;
  for(let i=0;i<count;i++){
    const a=points[(i+count-1)%count],b=points[i],c=points[(i+1)%count],e=points[(i+2)%count];
    d+=`C${[b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6,c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6,...c].map(number).join(' ')}`;
  }
  const top=circles.toSorted((a,b)=>a.y-b.y).slice(0,2);
  const contour=top.map(c=>`M${number(c.x-c.r*.65)} ${number(c.y+.06)}Q${number(c.x-c.r*.44)} ${number(c.y-c.r*.63)} ${number(c.x+c.r*.35)} ${number(c.y-c.r*.46)}`).join('');
  return {d:d+'Z',width,height,lobes,grain:.052+random(seed,5)*.026,dot:.0055+random(seed,6)*.0035,contour};
}

export function cloudLayout() {
  const banks=[-8,-4.8,-1.6,1.6,4.8,8].map((row,i)=>({seed:31+i*17,row,lead:-.72,sx:2.65+random(i+1,5)*.7,sy:2.4+random(i+3,8)*.7,angle:random(i+2,3)*12-6,back:true}));
  const wisps=[-7,-4.1,-1.3,1.2,3.5,5.8,8].map((row,i)=>({seed:223+i*23,row,lead:-1.1+random(i+30,2)*1.4,sx:.58+random(i+12,2)*1.05,sy:.55+random(i+9,1)*.7,angle:random(i+19,4)*18-9,back:false}));
  return [...banks,...wisps].map(item=>({...item,...cloudShape(item.seed)}));
}
