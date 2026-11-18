import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ModelResources, createModel } from '../src/world/town-models.js';
import { ComicStyle } from '../src/world/comic-style.js';
import { createSquirrel } from '../src/world/squirrel-model.js';
import { createFlowerLayout } from '../src/world/flower-layout.js';
import { cloudLayout } from '../src/components/cloud-shapes.js';

test('every full flower square clears the actual scaled tree foot',()=>{
  const pool=new ModelResources();
  try{
    const tree=createModel('tree',pool,{physical:{terrainSideMm:43.2},board:{cellMm:45}});
    const foot=tree.children.find(mesh=>mesh.geometry.type==='CylinderGeometry'&&mesh.geometry.parameters.radiusBottom>.2);
    const vertices=foot.geometry.attributes.position;
    let radius=0;for(let i=0;i<vertices.count;i++)radius=Math.max(radius,Math.hypot(vertices.getX(i),vertices.getZ(i))*1.12);
    const flowers=createFlowerLayout();assert.ok(flowers.length>100);
    for(const {x,z,size,angle} of flowers){
      const px=-x*Math.cos(angle)-z*Math.sin(angle),pz=x*Math.sin(angle)-z*Math.cos(angle);
      const clearance=Math.hypot(Math.max(0,Math.abs(px)-size/2),Math.max(0,Math.abs(pz)-size/2));
      assert.ok(clearance>radius+.005,`flower at ${x},${z} touches the tree foot`);
    }
  }finally{pool.dispose();}
});

test('the squirrel has a raised tapered curl, separate paws and black silhouette contours',()=>{
  const pool=new ModelResources(),comic=new ComicStyle();
  try{
    const squirrel=createSquirrel(pool);squirrel.updateMatrixWorld(true);
    const tail=squirrel.getObjectByName('squirrel-tail');tail.geometry.computeBoundingBox();
    assert.ok(tail.geometry.boundingBox.max.y>.33);
    assert.ok(squirrel.getObjectByName('squirrel-acorn')&&squirrel.getObjectByName('squirrel-paw--1')&&squirrel.getObjectByName('squirrel-paw-1'));
    for(const number of tail.geometry.attributes.position.array)assert.ok(Number.isFinite(number));
    comic.apply(squirrel);
    let outlines=0;squirrel.traverse(mesh=>{if(mesh.isMesh&&mesh.material.side===THREE.BackSide&&mesh.material.color.getHex()===0x15190f)outlines++;});
    assert.ok(outlines>=15);
  }finally{comic.dispose();pool.dispose();}
});

test('cloud banks have unique outlines and a substantial large-to-small size range',()=>{
  const clouds=cloudLayout();assert.equal(new Set(clouds.map(c=>c.d)).size,clouds.length);
  const widths=clouds.map(c=>c.width*c.sx);
  assert.ok(Math.max(...widths)/Math.min(...widths)>3);
  assert.ok(new Set(clouds.map(c=>c.lobes)).size>=3);
  for(const c of clouds){assert.ok(!c.d.includes('NaN'));assert.ok(c.d.endsWith('Z'));}
});
