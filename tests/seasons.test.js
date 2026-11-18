import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BUILD_END, JOURNEY_DISTANCE, BUILD_DISTANCE, WEATHER_DISTANCE, HOUSE_START, HOUSE_END, FISHING_START, FISHING_END, buildDistanceAt, weatherDistanceAt, fishingProgress, showcaseJourney, seasonState, houseWalk, fishingStory, fishingRodPose, FISHING_ROD_TIP, foregroundLeafPose, lightningPulse, keywordPose } from '../src/world/season-state.js';
import { createIceGeometry } from '../src/world/season-town.js';

test('longer walking and fishing sections preserve the surrounding scroll distances', () => {
  assert.deepEqual(showcaseJourney(0), { build: 0, weather: 0, exit: 0 });
  assert.deepEqual(showcaseJourney(BUILD_END), { build: 1, weather: 0, exit: 0 });
  assert.deepEqual(showcaseJourney(1), { build: 1, weather: 1, exit: 1 });
  assert.equal(showcaseJourney((BUILD_DISTANCE+WEATHER_DISTANCE)/JOURNEY_DISTANCE).exit,0);
  assert.equal(buildDistanceAt(.5),165);
  assert.ok(buildDistanceAt(HOUSE_END)-buildDistanceAt(HOUSE_START)>190);
  assert.ok(weatherDistanceAt(FISHING_END)-weatherDistanceAt(FISHING_START)>240);
  for(let i=0;i<=1000;i++){
    const p=i/1000;
    assert.ok(Math.abs(showcaseJourney(buildDistanceAt(p)/JOURNEY_DISTANCE).build-p)<1e-12);
    assert.ok(Math.abs(showcaseJourney((BUILD_DISTANCE+weatherDistanceAt(p))/JOURNEY_DISTANCE).weather-p)<1e-12);
  }
});

test('season weights stay normalized and reverse scrolling restores the same world', () => {
  const positions = Array.from({ length: 501 }, (_, i) => i / 500);
  const states = positions.map(seasonState);
  for (const state of states) {
    assert.ok(Math.abs(state.weights.reduce((a, b) => a + b, 0) - 1) < 1e-10);
    for (const key of ['rain','winter','autumn','cloud']) assert.ok(state[key] >= 0 && state[key] <= 1);
  }
  assert.deepEqual(positions.toReversed().map(seasonState).toReversed(), states);
  assert.equal(seasonState(.3).rain, 1);
  assert.equal(seasonState(.63).autumn, 1);
  assert.equal(seasonState(.97).winter, 1);
  assert.equal(seasonState(.97).rain, 0);
});

test('each title change happens halfway through a covering cloud sweep', () => {
  for (const p of [.145, .475, .795]) {
    const s = seasonState(p);
    assert.ok(s.cloudsVisible);
    assert.ok(s.cloud > .46 && s.cloud < .54);
    assert.notEqual(seasonState(p - .001).theme, s.theme);
  }
});

test('the walker goes around the solid house before approaching the open door', () => {
  for(let i=0;i<=1000;i++){
    const p=houseWalk(i/1000);
    if(p.t>.02 && p.t<.91)assert.ok(Math.abs(p.x)>.21||Math.abs(p.z)>.23);
    if(p.t>.84&&p.t<.98)assert.equal(p.door,1);
  }
  assert.equal(houseWalk(1).scale,0);assert.equal(houseWalk(1).door,0);
  assert.equal(houseWalk(1).x,.064);assert.equal(houseWalk(1).z,.20);
});

test('scrolling through winter always crosses the sound, jump and fallen-rod poses',()=>{
  assert.equal(fishingStory(0).phase,'fishing');assert.equal(fishingStory(.24).phase,'ripple');
  assert.ok(fishingStory(.42).jump>.18);assert.equal(fishingStory(.42).surprise,1);
  assert.equal(fishingStory(.8).dropped,1);assert.equal(fishingStory(.8).jump,0);
  assert.equal(fishingStory(1).dropped,1);assert.equal(fishingStory(1).phase,'dropped');
  assert.equal(fishingProgress(.92),0);assert.equal(fishingProgress(1),1);
  const forward=Array.from({length:101},(_,i)=>fishingStory(i/100));
  assert.deepEqual(Array.from({length:101},(_,i)=>fishingStory((100-i)/100)).toReversed(),forward);
});

test('the foreground leaf stays within autumn, and all three words share the same entry and exit direction',()=>{
  assert.equal(foregroundLeafPose(.4).visible,false);assert.equal(foregroundLeafPose(.60).visible,true);assert.equal(foregroundLeafPose(.70).visible,false);
  for(const i of [1,2])assert.equal(keywordPose(0,i).x,115);
  for(const i of [0,1,2]){assert.equal(keywordPose(1,i).x,0);assert.equal(keywordPose(1,i).y,-135);assert.equal(keywordPose(1,i).opacity,0);}
  for(let i=0;i<=1260;i++){const flash=lightningPulse(i/100);assert.ok(flash>=0&&flash<=1);}
});

test('the complete fallen fishing rod stays above the ice and lies nearly flat',()=>{
  const rod=fishingRodPose(1),rotation=new THREE.Euler(rod.tilt,0,rod.roll);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(0,.22,.025),new THREE.Vector3(...FISHING_ROD_TIP)]);
  const points=curve.getPoints(100).map(p=>p.applyEuler(rotation).add(new THREE.Vector3(rod.x,rod.y,rod.z)));
  const bounds=new THREE.Box3().setFromPoints(points),size=bounds.getSize(new THREE.Vector3());
  assert.ok(bounds.min.y>.17);
  assert.ok(size.y<.03);
  assert.ok(Math.hypot(size.x,size.z)>.4);
  const screenRight=new THREE.Vector3(7,0,-5).normalize();
  assert.ok(Math.abs(points.at(-1).clone().sub(points[0]).dot(screenRight))>.3);
});

test('winter ice has an actual open hole, not a dark disc over the ice', () => {
  const geometry = createIceGeometry();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster(new THREE.Vector3(.17,-.08,1),new THREE.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(mesh).length, 0);
  ray.set(new THREE.Vector3(-.25,.25,1),new THREE.Vector3(0,0,-1));
  assert.ok(ray.intersectObject(mesh).length > 0);
  mesh.material.dispose();geometry.dispose();
});
