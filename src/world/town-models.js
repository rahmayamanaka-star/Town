import * as THREE from 'three';
import { createHouse } from './curved-house.js';

export const GROUND_Y=.04;
export const TERRAIN_HEIGHT={land:.18,sea:.135};

/** Shared GPU resources live for the scene lifetime; removed roots own no assets. */
export class ModelResources {
  constructor(){this.geometries=new Map();this.materials=new Map();}
  geometry(type,args){
    const key=type+JSON.stringify(args);
    if(!this.geometries.has(key)){
      let geometry;
      if(type==='box')geometry=new THREE.BoxGeometry(...args);
      else if(type==='cone')geometry=new THREE.ConeGeometry(...args);
      else if(type==='cylinder')geometry=new THREE.CylinderGeometry(...args);
      else if(type==='leaf')geometry=new THREE.IcosahedronGeometry(...args);
      else if(type==='roof'){
        geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute([
          -.27,.37,.25, .27,.37,.25, 0,.59,.25,
          -.27,.37,-.25, .27,.37,-.25, 0,.59,-.25,
        ],3));
        geometry.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,0,2,5,0,5,3,1,4,5,1,5,2]);
        geometry.computeVertexNormals();
      }else throw Error('Unknown model geometry');
      this.geometries.set(key,geometry);
    }
    return this.geometries.get(key);
  }
  material(color,water=false){
    const key=`${color}:${water}`;
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:water ? .38 : .86,metalness:water ? .04 : 0,flatShading:true}));
    return this.materials.get(key);
  }
  dispose(){
    for(const g of this.geometries.values())g.dispose();
    for(const m of this.materials.values())m.dispose();
    this.geometries.clear();this.materials.clear();
  }
}

export function createModel(kind,pool,config){
  if(kind==='house') return createHouse(pool);
  const root=new THREE.Group();
  const mesh=(type,args,color,x=0,y=0,z=0,water=false)=>{
    const part=new THREE.Mesh(pool.geometry(type,args),pool.material(color,water));
    part.position.set(x,y,z);part.castShadow=part.receiveShadow=true;root.add(part);return part;
  };
  const box=(w,h,d,color,x,y,z,water=false)=>mesh('box',[w,h,d],color,x,y,z,water);
  const size=config.physical.terrainSideMm/config.board.cellMm;
  if(kind==='land'){
    box(size,.13,size,0xc4ac7b,0,.065,0);
    box(size,.05,size,0x91b56a,0,.155,0);
    // Keep the centre free for a building, and the near-left corner for its cell label.
    for(const [x,z] of [[-.34,-.32],[.34,.31],[.30,-.34]]){
      const tuft=mesh('cone',[.028,.075,3],0x628d45,x,.2175,z);tuft.rotation.z=.12;
      const stem=mesh('cone',[.019,.055,3],0xb4cc7c,x+.033,.2075,z+.012);stem.rotation.z=-.2;
    }
  }else if(kind==='sea'){
    box(size,.085,size,0xc7b88d,0,.0425,0);
    box(size,.05,size,0x68b8ce,0,.11,0,true);
    // Static wave strokes are visible in both views without a perpetual render loop.
    for(const [x,z,length] of [[-.20,-.23,.22],[.18,.19,.24],[-.12,.29,.12],[.23,-.12,.14]]){
      box(length,.004,.012,0xc5eced,x,.138,z,true);
      box(length*.35,.004,.012,0xc5eced,x+length*.55,.138,z-.025,true);
    }
  }else if(kind==='house'){
    box(.46,.035,.40,0xe4d6b6,0,.0175,0);
    box(.39,.34,.32,0xf5e8c9,0,.205,0);
    mesh('roof',[],0xbc624c);
    box(.075,.15,.014,0x806243,.085,.11,.169);
    box(.088,.088,.016,0xfdf7df,-.10,.245,.169);
    box(.060,.059,.018,0x8bb8c2,-.10,.245,.180);
    box(.013,.091,.102,0xfdf7df,.201,.235,-.01);
    box(.015,.063,.072,0x8bb8c2,.210,.235,-.01);
    box(.014,.007,.062,0xfdf7df,.220,.235,-.01);
    box(.070,.15,.080,0x95684e,.14,.50,-.09);
    box(.09,.025,.10,0xd4b79a,.14,.58,-.09);
    box(.13,.009,.22,0xd9ceb2,.085,.0045,.32);
  }else if(kind==='tree'){
    mesh('cylinder',[.19,.22,.018,8],0xb1c47f,0,.009,0);
    mesh('cylinder',[.037,.052,.29,7],0x886845,0,.155,0);
    mesh('leaf',[.19,0],0x6e9a50,-.08,.34,.015);
    mesh('leaf',[.17,0],0x8aaf5c,.09,.39,-.025);
    mesh('leaf',[.19,0],0x78a654,-.015,.49,.005);
  }
  return root;
}

/** Rendering consumes only TownState.entities; gameplay legality stays in TownState. */
export class TownModels {
  constructor(parent,config){this.parent=parent;this.config=config;this.pool=new ModelResources();this.entries=new Map();}
  sync(entities){
    const supported=new Set(['land','sea','house','tree']);
    const {rows,columns}=this.config.board;
    const desired=new Map();
    for(const entity of entities){
      if(!supported.has(entity.kind)||!Number.isInteger(entity.row)||!Number.isInteger(entity.column)||entity.row<0||entity.row>=rows||entity.column<0||entity.column>=columns)continue;
      desired.set(entity.id,entity);
    }
    for(const [id,entry] of this.entries){
      if(!desired.has(id)||desired.get(id).kind!==entry.kind){this.parent.remove(entry.root);this.entries.delete(id);}
    }
    for(const entity of desired.values()){
      let entry=this.entries.get(entity.id);
      if(!entry){
        const root=createModel(entity.kind,this.pool,this.config);root.name=`${entity.kind}-${entity.id}`;
        entry={root,kind:entity.kind};this.entries.set(entity.id,entry);this.parent.add(root);
      }
      const y=GROUND_Y+(entity.role==='object'?TERRAIN_HEIGHT.land:0);
      entry.root.position.set(entity.column-(columns-1)/2,y,entity.row-(rows-1)/2);
      entry.root.userData={id:entity.id,kind:entity.kind,role:entity.role,row:entity.row,column:entity.column,cell:entity.cell};
    }
    return [...this.entries.values()].map(e=>({...e.root.userData}));
  }
  dispose(){
    for(const {root} of this.entries.values())this.parent.remove(root);
    this.entries.clear();this.pool.dispose();
  }
}
