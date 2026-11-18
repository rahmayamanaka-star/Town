import * as THREE from 'three';
import { paperCutState } from './animation-state.js';
let previousLayout = '';

function hull(points) {
  const cross = (a, b, c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const sorted = points.sort((a,b)=>a.x-b.x || a.y-b.y), lower = [], upper = [];
  for (const p of sorted) { while(lower.length>1 && cross(lower.at(-2),lower.at(-1),p)<=0) lower.pop(); lower.push(p); }
  for (const p of sorted.toReversed()) { while(upper.length>1 && cross(upper.at(-2),upper.at(-1),p)<=0) upper.pop(); upper.push(p); }
  return lower.slice(0,-1).concat(upper.slice(0,-1));
}
export function updatePaperCut(camera, group, piece, viewport, progress, showcaseProgress = 0) {
  const svg = document.querySelector('.paper-cut-svg'); if (!svg) return;
  const s = paperCutState(progress, showcaseProgress); svg.style.visibility = s.visible ? 'visible' : 'hidden'; if (!s.visible) return;
  const w = document.documentElement.clientWidth, h = window.innerHeight;
  const layout = `${progress}:${showcaseProgress}:${w}:${h}:${viewport.left}:${viewport.top}:${viewport.width}:${viewport.height}`;
  if (layout === previousLayout) return;
  previousLayout = layout;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.querySelectorAll('.cut-mask-full, .cut-paper-sheet').forEach(rect => { rect.setAttribute('width', w); rect.setAttribute('height', h); });
  group.updateMatrixWorld(true); camera.updateMatrixWorld();
  const points = [];
  for (const [xs,ys,zs] of [[[-0.49,0.49],[0.02,0.22],[0.51,1.49]],[[-0.28,0.28],[0.25,1.04],[0.74,1.26]]]) {
    for (const x of xs) for (const y of ys) for (const z of zs) {
      const p = new THREE.Vector3(x,y,z).applyMatrix4(piece.matrixWorld).project(camera);
      points.push({ x:viewport.left+(p.x+1)*viewport.width/2, y:viewport.top+(1-p.y)*viewport.height/2 });
    }
  }
  const polygon = hull(points); const center = polygon.reduce((a,p)=>({x:a.x+p.x/polygon.length,y:a.y+p.y/polygon.length}),{x:0,y:0});
  polygon.forEach(p => { const d=Math.hypot(p.x-center.x,p.y-center.y); p.x+=(p.x-center.x)/d*14; p.y+=(p.y-center.y)/d*14; });
  const radius = Math.min(...polygon.map((a,i) => {
    const b = polygon[(i+1)%polygon.length];
    return Math.abs((b.x-a.x)*(center.y-a.y)-(b.y-a.y)*(center.x-a.x))/Math.hypot(b.x-a.x,b.y-a.y);
  }));
  const frameScale = 1 + s.expand ** 2 * (Math.hypot(w,h)/Math.max(1,radius) + 1);
  polygon.forEach(p => { p.x=center.x+(p.x-center.x)*frameScale; p.y=center.y+(p.y-center.y)*frameScale; });
  const start = polygon.reduce((best,p,i)=>p.x>polygon[best].x?i:best,0);
  const ordered = polygon.slice(start).concat(polygon.slice(0,start)); ordered.push(ordered[0]);
  const lengths=ordered.slice(1).map((p,i)=>Math.hypot(p.x-ordered[i].x,p.y-ordered[i].y));
  const length=lengths.reduce((a,b)=>a+b,0), d='M'+ordered.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('L')+'Z';
  svg.querySelectorAll('path.cut-hole, path.cut-guide-mask, path.cut-guide-halo, path.cut-guide, path.cut-seam').forEach(path=>path.setAttribute('d',d));
  const mask=svg.querySelector('.cut-guide-mask'); mask.setAttribute('stroke-dasharray',`${s.guide*length} ${length+1}`);
  const seam=svg.querySelector('.cut-seam'); seam.setAttribute('stroke-dasharray',`${s.cut*length} ${length+1}`);
  svg.querySelector('.cut-paper-sheet').style.opacity=s.cover;
  svg.querySelector('.cut-guide-layer').style.opacity=1;
  seam.style.opacity=s.cut < 1 ? 1 : 0;
  const scissors=svg.querySelector('.paper-scissors'); scissors.style.opacity=s.scissors?1:0;
  let distance=s.cut*length, i=0;
  while(i<lengths.length-1 && distance>lengths[i]) distance-=lengths[i++];
  const t=distance/lengths[i], a=ordered[i], b=ordered[i+1];
  scissors.setAttribute('transform',`translate(${a.x+(b.x-a.x)*t} ${a.y+(b.y-a.y)*t}) rotate(${Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI})`);
  const snip=9+Math.sin(s.cut*Math.PI*38)*9;
  svg.querySelector('.scissor-upper').setAttribute('transform',`rotate(${-snip} -30 0)`);
  svg.querySelector('.scissor-lower').setAttribute('transform',`rotate(${snip} -30 0)`);
  svg.dataset.cut=s.cut.toFixed(3); svg.dataset.guide=s.guide.toFixed(3);
  svg.dataset.expand=s.expand.toFixed(3);
}
