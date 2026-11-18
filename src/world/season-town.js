import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { seasonState, lightningPulse, fishingProgress } from './season-state.js';
import { TownCharacters } from './town-characters.js';

const dummy = new THREE.Object3D();
const fract = n => n - Math.floor(n);
const rand = n => fract(Math.sin(n * 127.1 + 17.3) * 43758.5453);
const palette = {
  board: ['#edf0d9', '#82929c', '#d8bc8b', '#d0dfe0'],
  land: ['#91b56a', '#63766e', '#b99450', '#acbfbd'],
  soil: ['#c4ac7b', '#7c7c70', '#aa885c', '#8b9f9f'],
  tree: ['#78a654', '#48685c', '#cb813b', '#91aba6'],
  trunk: ['#886845', '#5f655d', '#886045', '#687c7b'],
  sea: ['#68b8ce', '#476d81', '#789fa0', '#315769'],
  house: ['#ffedc8', '#b9c5ba', '#edce9d', '#e3ece6'],
  roof: ['#d77e5f', '#8c716c', '#b96543', '#b5c6c9'],
};
function blend(colors, weights) {
  const result = new THREE.Color(0, 0, 0);
  colors.forEach((c, i) => { result.r += c.r * weights[i]; result.g += c.g * weights[i]; result.b += c.b * weights[i]; });
  return result;
}

export function createIceGeometry() {
  const shape = new THREE.Shape();
  const s = .468, r = .055;
  shape.moveTo(-s+r,-s); shape.lineTo(s-r,-s); shape.quadraticCurveTo(s,-s,s,-s+r);
  shape.lineTo(s,s-r); shape.quadraticCurveTo(s,s,s-r,s); shape.lineTo(-s+r,s);
  shape.quadraticCurveTo(-s,s,-s,s-r); shape.lineTo(-s,-s+r); shape.quadraticCurveTo(-s,-s,-s+r,-s);
  const hole = new THREE.Path(); hole.absarc(.17, -.08, .115, 0, Math.PI * 2, true); shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth: .021, bevelEnabled: true, bevelSegments: 2, bevelSize: .004, bevelThickness: .003, curveSegments: 24 });
}

/** Seasonal assets belong only to the showcase town; the game and other views
 * keep their original shared materials. Particles use a few instanced draws. */
export class SeasonTown {
  constructor(view, town, comic, ambient) {
    this.view = view; this.town = town; this.ambient = ambient;
    this.geometries = []; this.materials = []; this.textures = []; this.palettes = [];
    this.lastPose = -1; this.state = seasonState(0);
    const geometry = g => { this.geometries.push(g); return g; };
    const material = m => { this.materials.push(m); return m; };
    const basic = (color, opacity = 1) => material(new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, depthWrite: opacity >= 1 }));
    const toon = color => material(new THREE.MeshToonMaterial({ color, gradientMap: comic.gradient, toneMapped: false }));
    const adopt = (root, role) => {
      const cache = new Map();
      root.traverse(mesh => {
        if (!mesh.isMesh || !mesh.material.isMeshToonMaterial) return;
        const source = mesh.material;
        let kind = role;
        if (role === 'land' && mesh.position.y < .14) kind = 'soil';
        if (role === 'tree' && mesh.geometry.type !== 'IcosahedronGeometry') kind = 'trunk';
        if (role === 'house' && mesh.name === 'house-roof') kind = 'roof';
        if (role === 'sea' && mesh.position.y < .08) kind = 'soil';
        const key = `${source.uuid}:${kind}`;
        if (!cache.has(key)) {
          const clone = material(source.clone()); clone.onBeforeCompile = source.onBeforeCompile; clone.customProgramCacheKey = source.customProgramCacheKey;
          const colors = palette[kind].map(c => new THREE.Color(c)); colors[0] = source.color.clone();
          cache.set(key, clone); this.palettes.push({ material: clone, colors });
        }
        mesh.material = cache.get(key);
      });
    };
    adopt(town.base, 'board'); town.entries.forEach(e => adopt(e.model, e.kind));
    const house = town.entries.find(e => e.kind === 'house').model;
    const tree = town.entries.find(e => e.kind === 'tree').model;
    const sea = town.entries.find(e => e.kind === 'sea').model;
    const lands = town.entries.filter(e => e.kind === 'land').map(e => e.model);
    this.house = house;
    const snowMaterial = toon('#fffdf1');
    const snowMesh = (parent, g, position, scale) => {
      const mesh = new THREE.Mesh(g, snowMaterial); mesh.position.set(...position);
      if (scale) mesh.scale.set(...scale); mesh.userData.comicOutline = 'silhouette'; mesh.castShadow = true; mesh.receiveShadow = true;
      parent.add(mesh); return mesh;
    };
    this.snowParts = [];
    for (const land of lands) {
      const snow = new THREE.Group(); land.add(snow); this.snowParts.push(snow);
      snowMesh(snow, geometry(new RoundedBoxGeometry(.94, .027, .94, 3, .012)), [0, .19, 0]);
      for (let i = 0; i < 5; i++) snowMesh(snow, geometry(new THREE.SphereGeometry(1, 12, 6)), [-.35 + i * .17, .194, .39], [.1, .025, .07]);
      comic.apply(snow);
    }
    const roofSnow = new THREE.Group(); house.add(roofSnow); this.snowParts.push(roofSnow);
    const roof = house.getObjectByName('house-roof');
    const roofCap = snowMesh(roofSnow, geometry(roof.geometry.clone()), [0, .018, -.215], [1.025, 1.02, 1.045]);
    roofCap.castShadow = false;
    snowMesh(roofSnow, geometry(new RoundedBoxGeometry(.10, .024, .105, 3, .012)), [.13, .685, -.08]);
    comic.apply(roofSnow);
    const treeSnow = new THREE.Group(); tree.add(treeSnow); this.snowParts.push(treeSnow);
    const blob = geometry(new THREE.IcosahedronGeometry(1, 1));
    [[-.08,.455,.015,.17], [.09,.495,-.025,.15], [-.015,.624,.005,.145]].forEach(([x,y,z,size]) => snowMesh(treeSnow, blob, [x,y,z], [size,.045,size]));
    comic.apply(treeSnow);
    this.iceGroup = new THREE.Group(); sea.add(this.iceGroup); this.snowParts.push(this.iceGroup);
    const iceMaterial = basic('#b7e2e6');
    const ice = new THREE.Mesh(geometry(createIceGeometry()), iceMaterial); ice.rotation.x = -Math.PI / 2; ice.position.y = .142; this.iceGroup.add(ice);
    const rim = new THREE.Mesh(geometry(new THREE.TorusGeometry(.118,.009,5,32)), basic('#f6ffff')); rim.rotation.x = -Math.PI/2; rim.position.set(.17,.170,.08); this.iceGroup.add(rim);
    const cracks = [];
    for (const [x,z,angle,length] of [[-.3,.2,.2,.13],[.25,.31,-.4,.12],[-.26,-.24,.8,.16]]) {
      cracks.push(x,.170,z,x+Math.cos(angle)*length,.170,z+Math.sin(angle)*length);
      cracks.push(x,.170,z,x-.04,.170,z+.06);
    }
    const crackGeo = geometry(new THREE.BufferGeometry()); crackGeo.setAttribute('position',new THREE.Float32BufferAttribute(cracks,3));
    this.iceGroup.add(new THREE.LineSegments(crackGeo, material(new THREE.LineBasicMaterial({ color:'#f8ffff',toneMapped:false }))));
    // Fallen leaves and two small pumpkins remain attached to the land tiles.
    this.autumnProps = new THREE.Group(); lands[1].add(this.autumnProps);
    const leaf = new THREE.Shape(); leaf.moveTo(0,-.5); leaf.bezierCurveTo(-.6,-.2,-.45,.45,0,.5); leaf.bezierCurveTo(.45,.45,.6,-.2,0,-.5);
    const leafGeo = geometry(new THREE.ShapeGeometry(leaf));
    const leaves = new THREE.InstancedMesh(leafGeo, basic('#efc64c'), 34); this.autumnProps.add(leaves);
    for (let i=0;i<34;i++) { dummy.position.set((rand(i)-.5)*.84,.187,(rand(i+60)-.5)*.84); dummy.rotation.set(-Math.PI/2,0,rand(i+90)*6.28); dummy.scale.setScalar(.025+rand(i+20)*.028); dummy.updateMatrix(); leaves.setMatrixAt(i,dummy.matrix); }
    for (const [x,z,size] of [[.31,.27,.055],[.23,.34,.037]]) {
      const pumpkin = new THREE.Mesh(geometry(new THREE.SphereGeometry(size,10,7)), toon('#d98b39')); pumpkin.position.set(x,.18+size*.8,z); pumpkin.scale.y=.78; this.autumnProps.add(pumpkin);
      const stem = new THREE.Mesh(geometry(new THREE.CylinderGeometry(.005,.008,.025,5)),toon('#5e6542')); stem.position.set(x,.18+size*1.6,z); this.autumnProps.add(stem);
    }
    comic.apply(this.autumnProps);
    this.autumnProps.visible = false;
    // Separate glowing glass sits clear of the original wall and window bezel.
    this.warm = basic('#ffd47d',.0);
    const glass = new THREE.Mesh(geometry(new THREE.CircleGeometry(.0335,24)),this.warm); glass.position.set(-.085,.263,.194); house.add(glass);
    const haloCanvas = document.createElement('canvas'); haloCanvas.width=haloCanvas.height=64;
    const ctx=haloCanvas.getContext('2d'), gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(255,199,93,.55)');gradient.addColorStop(.3,'rgba(255,180,65,.22)');gradient.addColorStop(1,'rgba(255,180,65,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    const haloTexture=new THREE.CanvasTexture(haloCanvas); this.textures.push(haloTexture);
    this.haloMaterial=material(new THREE.SpriteMaterial({map:haloTexture,color:'#ffd58a',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
    const halo=new THREE.Sprite(this.haloMaterial);halo.position.set(-.085,.263,.205);halo.scale.set(.29,.29,1);house.add(halo);
    this.lamp=new THREE.PointLight('#ffc56e',0,1.4,2);this.lamp.position.set(.06,.16,.30);house.add(this.lamp);
    // Ground-level mist uses soft alpha textures, never opaque particle cards.
    const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=64;
    const mc=mistCanvas.getContext('2d'), mg=mc.createRadialGradient(32,32,0,32,32,32);mg.addColorStop(0,'#edf3efbb');mg.addColorStop(1,'#edf3ef00');mc.fillStyle=mg;mc.fillRect(0,0,64,64);
    const mistTexture=new THREE.CanvasTexture(mistCanvas);this.textures.push(mistTexture);
    this.mists=Array.from({length:6},(_,i)=>{
      const m=material(new THREE.SpriteMaterial({map:mistTexture,transparent:true,depthWrite:false,opacity:0,toneMapped:false}));
      const sprite=new THREE.Sprite(m);sprite.scale.set(2.0,.32,1);town.root.add(sprite);return sprite;
    });
    this.precipitation=new THREE.Group();view.group.add(this.precipitation);
    this.rainMaterial=material(new THREE.LineBasicMaterial({color:'#d5e8ee',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
    this.rainGeometry=geometry(new THREE.BufferGeometry());this.rainPositions=new Float32Array(180*6);this.rainGeometry.setAttribute('position',new THREE.BufferAttribute(this.rainPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.rainMesh=new THREE.LineSegments(this.rainGeometry,this.rainMaterial);this.rainMesh.frustumCulled=false;this.precipitation.add(this.rainMesh);
    this.snowPositions=new Float32Array(110*3);this.flakeGeometry=geometry(new THREE.BufferGeometry());this.flakeGeometry.setAttribute('position',new THREE.BufferAttribute(this.snowPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.flakeMaterial=material(new THREE.PointsMaterial({color:'#fffdf3',size:4,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
    this.flakes=new THREE.Points(this.flakeGeometry,this.flakeMaterial);this.flakes.frustumCulled=false;this.precipitation.add(this.flakes);
    this.ripples=new THREE.InstancedMesh(geometry(new THREE.RingGeometry(.05,.059,18)),basic('#cde6e9',.55),28);this.ripples.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.ripples.frustumCulled=false;town.root.add(this.ripples);
    this.splash=new THREE.InstancedMesh(geometry(new THREE.BoxGeometry(.008,.025,.008)),basic('#d5eaeb',.6),24);this.splash.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.splash.frustumCulled=false;town.root.add(this.splash);
    this.fog=new THREE.FogExp2('#8194a4',0);view.scene.fog=this.fog;
    this.snowParts.forEach(part=>{part.visible=false;});
    this.characters=new TownCharacters(town,comic);
    this.afterKey='';
  }
  set(progress) {
    if (progress===this.lastPose) return;
    this.lastPose=progress;
    const s=this.state=seasonState(progress), weights=s.weights;
    this.palettes.forEach(({material,colors})=>material.color.copy(blend(colors,weights)));
    const hemi=this.view.scene.children.find(c=>c.isHemisphereLight);
    this.view.sun.intensity=1.65*(1-s.dusk)+.45*s.dusk;
    this.view.sun.intensity=THREE.MathUtils.lerp(this.view.sun.intensity,1.7,s.autumn);
    this.view.sun.intensity=THREE.MathUtils.lerp(this.view.sun.intensity,1.05,s.winter);
    hemi.intensity=THREE.MathUtils.lerp(1.25,.76,s.dusk);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,1.1,s.autumn);
    this.baseSun=this.view.sun.intensity;this.baseHemi=hemi.intensity;
    this.view.sun.color.set(s.winter>.5?'#d9ecff':s.autumn>.5?'#ffd59a':s.dusk>.5?'#b3c9e6':'#fff5e5');
    this.snowParts.forEach(p=>{p.visible=s.winter>.5;});
    this.autumnProps.visible=s.autumn>.5 && s.winter<.5;
    this.warm.opacity=Math.min(1,s.warmth);this.haloMaterial.opacity=Math.min(.75,s.warmth*.75);this.lamp.intensity=s.warmth*.022;
    this.rainMaterial.opacity=s.rain*.42;this.rainMesh.visible=s.rain>.01;
    this.flakeMaterial.opacity=s.winter*.9;this.flakes.visible=s.winter>.01;
    this.ripples.visible=this.splash.visible=s.rain>.01;
    this.ripples.material.opacity=s.rain*.4;this.splash.material.opacity=s.rain*.45;
    this.fog.color.set(s.winter>.5?'#c8dce0':'#99aaba');this.fog.density=s.rain*.048+s.winter*.010;
    this.view.host.dataset.season=s.theme;
  }
  animate(time,build=1) {
    const s=this.state;
    this.ambient.setConditions(s);
    const flash=lightningPulse(time)*s.rain;
    this.view.sun.intensity=this.baseSun+flash*.95;
    this.view.scene.children.find(c=>c.isHemisphereLight).intensity=this.baseHemi+flash*.65;
    const weatherLayer=document.querySelector('.weather-layer');
    if(weatherLayer){weatherLayer.style.setProperty('--lightning',flash*.17);weatherLayer.dataset.flash=flash>.1?'lit':'rest';}
    const action=this.characters.update(time,build,s);this.view.host.dataset.winterAction=action??'none';
    this.view.host.dataset.fishingProgress=String(Math.round(fishingProgress(s.p)*1000));
    if (s.rain>.001) {
      for(let i=0;i<180;i++) {
        const x=(rand(i)-.5)*11, z=(rand(i+250)-.5)*10, y=3.7-fract(time*1.2+rand(i+500))*4.2;
        this.rainPositions.set([x,y,z,x-.032,y-.15,z+.025],i*6);
      }
      this.rainGeometry.attributes.position.needsUpdate=true;
      for(let i=0;i<28;i++) {
        const tile=i%3, phase=fract(time*.9+i*.137), x=(tile===1?0:-1)+(rand(i+80)-.5)*.8, z=(tile===0?0:1)+(rand(i+140)-.5)*.8;
        dummy.position.set(x,tile===2?.174:.216,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(.2+phase*1.5);dummy.updateMatrix();this.ripples.setMatrixAt(i,dummy.matrix);
      }
      this.ripples.instanceMatrix.needsUpdate=true;
      for(let i=0;i<24;i++) {
        const p=fract(time*1.1+i*.17), sea=i%2===0;
        dummy.position.set(-1+(rand(i+61)-.5)*.85,(sea?.17:.22)+Math.sin(p*Math.PI)*.045,(sea?1:0)+(rand(i+83)-.5)*.85);dummy.rotation.set(0,i,Math.sin(i)*.6);dummy.scale.setScalar(Math.sin(p*Math.PI)*.8);dummy.updateMatrix();this.splash.setMatrixAt(i,dummy.matrix);
      }this.splash.instanceMatrix.needsUpdate=true;
    }
    if(s.winter>.001) {
      for(let i=0;i<110;i++)this.snowPositions.set([(rand(i+430)-.5)*10+Math.sin(time*.4+i)*.13,3.7-fract(time*.11+rand(i+650))*4.1,(rand(i+860)-.5)*9],i*3);
      this.flakeGeometry.attributes.position.needsUpdate=true;
    }
    this.mists.forEach((sprite,i)=>{sprite.material.opacity=s.rain*(.27+Math.sin(time*.4+i)*.065)+s.winter*.035;sprite.visible=sprite.material.opacity>.001;sprite.position.set(-1.35+i*.43+Math.sin(time*.16+i)*.23,.27+Math.sin(time*.3+i)*.035,.1+i%3*.43);});
  }
  afterProject(rect) {
    const s=this.state;
    const key=[s.p,rect.top,rect.width,rect.height].join(':');if(key===this.afterKey)return;this.afterKey=key;
    const svg=document.querySelector('.weather-svg'), plane=svg?.querySelector('.cloud-plane'), travel=svg?.querySelector('.cloud-travel');if(!plane)return;
    this.view.group.updateWorldMatrix(true,false);this.view.camera.updateMatrixWorld();
    const project=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).applyMatrix4(this.view.group.matrixWorld).project(this.view.camera);return [(v.x+1)*rect.width/2+rect.left,(1-v.y)*rect.height/2+rect.top];};
    const a=project(0,1.4,0),b=project(1,1.4,0),c=project(0,1.4,1);
    svg.setAttribute('viewBox',`0 0 ${document.documentElement.clientWidth} ${window.innerHeight}`);
    plane.setAttribute('transform',`matrix(${b[0]-a[0]} ${b[1]-a[1]} ${c[0]-a[0]} ${c[1]-a[1]} ${a[0]} ${a[1]})`);
    const shift=s.cloud*22-11;travel.setAttribute('transform',`translate(${shift} ${-shift})`);
  }
  dispose() { this.characters.dispose();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());this.ripples.dispose();this.splash.dispose(); }
}
