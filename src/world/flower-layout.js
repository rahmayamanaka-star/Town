export const TREE_BASE_RADIUS=.22*1.12;
export const SQUIRREL_POSITION={x:.28,z:.27};

/** Keep the complete flower square clear of the scaled tree foot, at any angle. */
export function createFlowerLayout() {
  const flowers=[];
  for(let r=0;r<16;r++)for(let c=0;c<16;c++){
    const id=r*16+c;
    const x=-.425+c*.055+Math.sin(id*8.2)*.009;
    const z=-.425+r*.055+Math.cos(id*4.7)*.009;
    const size=.067+id%4*.005,reach=size*Math.SQRT1_2;
    if(Math.hypot(x,z)<TREE_BASE_RADIUS+reach+.012)continue;
    if(Math.hypot(x-SQUIRREL_POSITION.x,z-SQUIRREL_POSITION.z)<.083+reach+.008)continue;
    flowers.push({id,x,z,size,angle:id*2.39,delay:Math.hypot(x,z)*.33});
  }
  return flowers;
}
