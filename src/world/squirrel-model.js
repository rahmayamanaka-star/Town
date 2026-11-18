import * as THREE from 'three';

function taperedTail() {
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.043,-.044),new THREE.Vector3(-.007,.095,-.118),
    new THREE.Vector3(-.012,.218,-.156),new THREE.Vector3(-.01,.323,-.118),
    new THREE.Vector3(0,.348,-.038),new THREE.Vector3(.006,.304,.006),
    new THREE.Vector3(.004,.273,-.025),
  ]);
  const geometry=new THREE.TubeGeometry(curve,56,1,14,false);
  const positions=geometry.attributes.position,point=new THREE.Vector3();
  for(let row=0;row<=56;row++){
    const t=row/56,center=curve.getPointAt(t);
    const radius=(.022+.024*Math.sin(t*Math.PI)**.7)*(1-.77*THREE.MathUtils.smoothstep(t,.79,1));
    for(let side=0;side<=14;side++){
      const index=row*15+side;point.fromBufferAttribute(positions,index).sub(center).multiplyScalar(radius).add(center);positions.setXYZ(index,point.x,point.y,point.z);
    }
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

/** Rounded woodland toy with a broad curling tail, cream cheeks and an acorn. */
export function createSquirrel(pool) {
  const root=new THREE.Group();root.name='squirrel';
  const geometry=(key,make)=>{if(!pool.geometries.has(key))pool.geometries.set(key,make());return pool.geometries.get(key);};
  const sphere=geometry('squirrel:smooth-sphere',()=>new THREE.SphereGeometry(1,24,16));
  const part=(parent,name,color,scale,position,shape=sphere,outline=true)=>{
    const mesh=new THREE.Mesh(shape,pool.material(color));mesh.name=name;mesh.scale.set(...scale);mesh.position.set(...position);mesh.userData.comicOutline=outline?'silhouette':'none';parent.add(mesh);return mesh;
  };
  const tail=part(root,'squirrel-tail',0xb17b47,[1,1,1],[0,0,0],geometry('squirrel:tapered-curl-v2',taperedTail));
  part(root,'squirrel-haunch-left',0xbf8b51,[.044,.066,.047],[-.034,.073,-.018]);
  part(root,'squirrel-haunch-right',0xbf8b51,[.044,.066,.047],[.034,.073,-.018]);
  part(root,'squirrel-body',0xc99860,[.062,.102,.057],[0,.118,0]);
  part(root,'squirrel-belly',0xf3dbac,[.046,.079,.020],[0,.115,.046]);
  for(const x of [-.038,.038]){
    part(root,`squirrel-foot-${x}`,0xa97443,[.027,.018,.041],[x,.019,.039]);
  }
  const head=new THREE.Group();head.name='squirrel-head';head.position.set(0,.218,.016);root.add(head);
  part(head,'squirrel-skull',0xd2a16a,[.057,.051,.049],[0,0,0]);
  const earGeometry=geometry('squirrel:ear',()=>new THREE.ConeGeometry(1,1,18));
  for(const x of [-.035,.035]){
    const ear=part(head,`squirrel-ear-${x}`,0xb8844e,[.017,.054,.019],[x,.053,-.008],earGeometry);ear.rotation.z=x>0?-.16:.16;
    const inner=part(head,`squirrel-inner-ear-${x}`,0xe9c79d,[.009,.030,.007],[x,.052,.006],earGeometry,false);inner.rotation.z=ear.rotation.z;
    part(head,`squirrel-cheek-${x}`,0xf0d3a4,[.028,.023,.025],[x*.57,-.014,.039]);
    part(head,`squirrel-eye-${x}`,0x261e17,[.010,.013,.009],[x*1.18,.011,.033]);
    part(head,`squirrel-eye-light-${x}`,0xfff8e7,[.0032,.004,.0028],[x*1.16-.002,.017,.041],sphere,false);
  }
  part(head,'squirrel-nose',0x39291f,[.011,.009,.010],[0,-.005,.065]);
  const line=(key,points,radius=.0015)=>geometry(`squirrel:${key}`,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),12,radius,5,false));
  part(head,'squirrel-mouth',0x5a3925,[1,1,1],[0,0,0],line('mouth',[[0,-.013,.067],[0,-.022,.065],[-.012,-.026,.060]]),false);
  part(root,'squirrel-acorn',0xb9793c,[.024,.035,.024],[0,.133,.085]);
  part(root,'squirrel-acorn-cap',0x715334,[.029,.015,.027],[0,.161,.084]);
  part(root,'squirrel-acorn-stem',0x62472b,[.004,.010,.004],[0,.180,.083]);
  for(const sign of [-1,1]){
    const arm=part(root,`squirrel-arm-${sign}`,0xcb985d,[.017,.038,.018],[sign*.043,.147,.047]);arm.rotation.x=-.72;arm.rotation.z=sign*.45;
    part(root,`squirrel-paw-${sign}`,0xe7bd82,[.021,.016,.021],[sign*.026,.140,.080]);
    for(let digit=0;digit<2;digit++){
      part(root,`squirrel-finger-${sign}-${digit}`,0x8b5a32,[1,1,1],[0,0,0],line(`finger-${sign}-${digit}`,[[sign*.027,.137+digit*.006,.098],[sign*.016,.136+digit*.006,.101]],.0012),false);
    }
  }
  tail.userData.role='curled-tail';return root;
}
