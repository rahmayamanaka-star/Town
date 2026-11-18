import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { houseWalk, fishingStory, fishingProgress, fishingRodPose, FISHING_ROD_TIP } from './season-state.js';

/** Tiny, readable toy people; all geometry is shared within this scene. */
export class TownCharacters {
  constructor(town, comic) {
    this.town=town;this.materials=[];this.geometries=[];this.textures=[];
    const g=geometry=>{this.geometries.push(geometry);return geometry;};
    const m=material=>{this.materials.push(material);return material;};
    const colors=new Map();
    const color=hex=>{if(!colors.has(hex))colors.set(hex,m(new THREE.MeshStandardMaterial({color:hex,roughness:.9})));return colors.get(hex);};
    const sphere=g(new THREE.SphereGeometry(1,14,10));
    const soft=g(new RoundedBoxGeometry(1,1,1,3,.15));
    const cylinder=g(new THREE.CylinderGeometry(1,1,1,12));
    const part=(parent,geometry,hex,position,scale,outline=true)=>{const mesh=new THREE.Mesh(geometry,color(hex));mesh.position.set(...position);mesh.scale.set(...scale);mesh.userData.comicOutline=outline?'silhouette':'none';parent.add(mesh);return mesh;};
    const person=(winter=false,coat='#d6ab56')=>{
      const root=new THREE.Group();
      part(root,soft,coat,[0,.43,0],[winter?.43:.34,.46,winter?.33:.27]);
      part(root,sphere,'#f4d4a0',[0,.81,.018],[.155,.16,.147]);
      for(const x of [-.055,.055])part(root,sphere,'#252a22',[x,.83,.155],[.017,.019,.012],false);
      const legs=[];for(const x of [-.10,.10]){
        const leg=new THREE.Group();leg.position.set(x,.22,0);root.add(leg);
        part(leg,soft,'#2f4144',[0,-.09,0],[.13,.24,.15]);part(leg,soft,winter?'#493a33':'#786044',[0,-.19,.04],[.16,.11,.22]);legs.push(leg);
      }
      const arms=[];for(const x of [-.22,.22]){
        const arm=new THREE.Group();arm.position.set(x,.61,0);root.add(arm);
        part(arm,soft,coat,[0,-.10,0],[.13,.28,.16]);part(arm,sphere,winter?'#593e3a':'#f4d4a0',[0,-.25,.015],[.073,.075,.07]);arms.push(arm);
      }
      if(winter){
        part(root,cylinder,'#3c6077',[0,.94,0],[.18,.075,.18]);part(root,sphere,'#3c6077',[0,1.005,-.01],[.176,.10,.175]);part(root,sphere,'#fff4de',[.015,1.10,-.01],[.056,.056,.056]);
        part(root,soft,'#bf6a4c',[0,.655,.035],[.39,.09,.35]);part(root,soft,'#bf6a4c',[.10,.49,.18],[.10,.25,.055]);
      }else part(root,sphere,'#715238',[0,.93,-.025],[.16,.06,.15]);
      comic.apply(root);return {root,arms,legs};
    };
    this.walker=person();town.root.add(this.walker.root);
    const house=town.entries.find(e=>e.kind==='house').model;this.house=house;
    const door=house.getObjectByName('house-door');
    const recess=new THREE.Mesh(door.geometry,m(new THREE.MeshBasicMaterial({color:'#28271f',toneMapped:false})));recess.position.copy(door.position);recess.position.z=.181;house.add(recess);
    this.doorHinge=new THREE.Group();this.doorHinge.position.set(.020,.045,.185);house.add(this.doorHinge);this.doorHinge.add(door);door.position.set(.044,0,0);
    const treeLand=town.entries.find(e=>e.kind==='land'&&e.x===0).model;
    const sea=town.entries.find(e=>e.kind==='sea').model;
    this.picnic=new THREE.Group();treeLand.add(this.picnic);this.picnic.visible=false;
    const cloth=document.createElement('canvas');cloth.width=cloth.height=64;const cc=cloth.getContext('2d');cc.fillStyle='#fff0cd';cc.fillRect(0,0,64,64);cc.fillStyle='#c16c4a';for(let i=0;i<64;i+=16){cc.fillRect(i,0,8,64);cc.fillRect(0,i,64,8);}const texture=new THREE.CanvasTexture(cloth);texture.colorSpace=THREE.SRGBColorSpace;this.textures.push(texture);
    const blanket=new THREE.Mesh(g(new THREE.PlaneGeometry(.39,.31)),m(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false})));blanket.rotation.x=-Math.PI/2;blanket.rotation.z=.10;blanket.position.set(.17,.191,.24);this.picnic.add(blanket);
    this.picnicPeople=[person(false,'#dbb65f'),person(false,'#8b9d6b')];
    this.picnicPeople.forEach((p,i)=>{this.picnic.add(p.root);p.root.position.set(i===0?.03:.31,.18,i===0?.26:.18);p.root.scale.setScalar(.20);p.root.rotation.y=i===0?.9:-.7;p.legs.forEach(leg=>leg.rotation.x=-1.15);p.arms[0].rotation.x=-.5;});
    const picnicObjects=new THREE.Group();this.picnic.add(picnicObjects);
    part(picnicObjects,soft,'#b9854b',[.27,.23,.35],[.10,.065,.07]);
    const basketHandle=new THREE.Mesh(g(new THREE.TorusGeometry(.036,.006,4,16,Math.PI)),color('#67472f'));basketHandle.position.set(.27,.265,.35);picnicObjects.add(basketHandle);
    part(picnicObjects,cylinder,'#fff8de',[.14,.198,.30],[.045,.007,.045]);part(picnicObjects,soft,'#e6be6a',[.14,.207,.30],[.04,.012,.032]);comic.apply(picnicObjects);
    this.winter=new THREE.Group();sea.add(this.winter);this.winter.visible=false;
    this.fisher=person(true,'#b9684e');this.winter.add(this.fisher.root);this.fisher.root.position.set(-.12,.17,-.16);this.fisher.root.scale.setScalar(.255);this.fisher.root.rotation.y=.89;this.fisher.arms[1].rotation.x=-.9;
    this.rod=new THREE.Group();this.winter.add(this.rod);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(0,.22,.025),new THREE.Vector3(...FISHING_ROD_TIP)]);
    const rodMesh=new THREE.Mesh(g(new THREE.TubeGeometry(curve,14,.0065,6,false)),m(new THREE.MeshBasicMaterial({color:'#2d3028',toneMapped:false})));this.rod.add(rodMesh);
    part(this.rod,cylinder,'#bd9a63',[0,.04,0],[.012,.10,.012],false);
    this.linePositions=new Float32Array(9);this.lineGeometry=g(new THREE.BufferGeometry());this.lineGeometry.setAttribute('position',new THREE.BufferAttribute(this.linePositions,3).setUsage(THREE.DynamicDrawUsage));this.fishingLine=new THREE.Line(this.lineGeometry,m(new THREE.LineBasicMaterial({color:'#263e45',transparent:true,opacity:.75})));this.winter.add(this.fishingLine);
    const sign=(kind)=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.strokeStyle='#222c24';c.lineWidth=8;c.lineJoin='round';c.fillStyle='#fff2bc';
      if(kind==='alarm'){for(let i=0;i<3;i++){c.beginPath();c.moveTo(18+i*35,80-i*8);c.lineTo(37+i*35,26-i*5);c.lineTo(49+i*35,31-i*5);c.lineTo(31+i*35,85-i*8);c.closePath();c.fill();c.stroke();}}
      else{c.beginPath();c.moveTo(52,15);c.lineTo(79,13);c.lineTo(74,83);c.lineTo(55,85);c.closePath();c.fill();c.stroke();c.beginPath();c.arc(65,107,10,0,Math.PI*2);c.fill();c.stroke();}
      const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;this.textures.push(t);const sprite=new THREE.Sprite(m(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false})));sprite.scale.set(.22,.22,1);this.winter.add(sprite);return sprite;
    };
    this.alarm=sign('alarm');this.alarm.position.set(.17,.36,.08);
    this.surprise=sign('!');this.surprise.position.set(-.12,.64,-.16);
    this.holeRipple=new THREE.Mesh(g(new THREE.RingGeometry(.118,.128,32)),m(new THREE.MeshBasicMaterial({color:'#f7ffff',transparent:true,opacity:0,side:THREE.DoubleSide,toneMapped:false,depthWrite:false})));this.holeRipple.rotation.x=-Math.PI/2;this.holeRipple.position.set(.17,.177,.08);this.winter.add(this.holeRipple);
    this.snowman=new THREE.Group();treeLand.add(this.snowman);this.snowman.position.set(.28,.20,.25);this.snowman.visible=false;
    part(this.snowman,sphere,'#fffced',[0,.075,0],[.08,.08,.075]);part(this.snowman,sphere,'#fffced',[0,.185,0],[.058,.058,.055]);
    for(const x of [-.021,.021])part(this.snowman,sphere,'#2c3732',[x,.194,.050],[.007,.008,.007],false);
    const nose=new THREE.Mesh(g(new THREE.ConeGeometry(.012,.053,7)),color('#d78b42'));nose.rotation.x=Math.PI/2;nose.position.set(0,.18,.069);this.snowman.add(nose);
    part(this.snowman,cylinder,'#b96f50',[0,.142,0],[.061,.025,.059]);part(this.snowman,cylinder,'#334e62',[0,.241,0],[.072,.018,.068]);part(this.snowman,cylinder,'#334e62',[0,.267,0],[.044,.050,.044]);
    const twig=(x)=>{const twig=new THREE.Mesh(g(new THREE.CylinderGeometry(.004,.005,.10,5)),color('#5c5948'));twig.position.set(x,.115,.005);twig.rotation.z=x>0?-.9:.9;this.snowman.add(twig);};twig(-.10);twig(.10);comic.apply(this.snowman);
  }
  update(time,build,state) {
    const walk=houseWalk(build);
    this.walker.root.visible=build>.82 && state.p<.08 && walk.scale>.001;
    this.walker.root.position.set(-1+walk.x*1.08,.211+walk.hop,walk.z*1.08);this.walker.root.rotation.y=walk.yaw;this.walker.root.rotation.z=Math.sin(walk.t*Math.PI*18)*.09;
    this.walker.root.scale.setScalar(.25*walk.scale);this.walker.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(walk.t*Math.PI*18+i*Math.PI)*.35);
    this.doorHinge.rotation.y=-walk.door*1.35;
    this.picnic.visible=state.autumn>.65 && state.winter<.35;
    this.picnicPeople.forEach((p,i)=>{p.arms[1].rotation.x=-.7+Math.sin(time*1.1+i)*.12;p.root.rotation.z=Math.sin(time*.8+i)*.025;});
    this.winter.visible=this.snowman.visible=state.winter>.65;
    if(!this.winter.visible)return null;
    const story=fishingStory(fishingProgress(state.p));
    this.fisher.root.position.y=.17+story.jump;this.fisher.root.rotation.z=-story.retrieve*.22;
    this.fisher.arms[0].rotation.x=story.surprise*-.7;this.fisher.arms[1].rotation.x=-.9-story.surprise*.8;
    const rod=fishingRodPose(story.dropped);
    this.rod.position.set(rod.x,rod.y,rod.z);this.rod.rotation.set(rod.tilt,0,rod.roll);
    const tip=new THREE.Vector3(...FISHING_ROD_TIP).applyEuler(this.rod.rotation).add(this.rod.position);
    this.linePositions.set([tip.x,tip.y,tip.z,tip.x+.025,.30,.08,.17,.172,.08]);this.lineGeometry.attributes.position.needsUpdate=true;this.fishingLine.visible=story.dropped<.12;
    this.alarm.material.opacity=story.alarm;this.alarm.scale.setScalar(.22+story.alarm*.045);this.surprise.material.opacity=story.surprise;this.surprise.position.y=.65+story.jump;
    this.holeRipple.material.opacity=story.alarm*.85;this.holeRipple.scale.setScalar(1+story.alarm*.8);
    return story.phase;
  }
  dispose(){this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());}
}
