import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ThemedTitle from './ThemedTitle';
import CloudBank from './CloudBank';
import { houseWalk, foregroundLeafPose, smooth } from '../world/season-state.js';

export function updateShowcaseHUD(build, weather, active, exit=0) {
  const hud = document.querySelector('.showcase-hud');
  const layer = document.querySelector('.weather-layer');
  if (!hud) return;
  const stage = weather.theme === 'life' ? (build < .34 ? 'land' : build < .69 ? 'sea' : 'life') : weather.theme;
  hud.dataset.theme = stage;
  hud.dataset.weather = String(Math.round(weather.p * 1000));
  hud.dataset.build = String(Math.round(build * 1000));
  hud.dataset.active = String(active);
  hud.dataset.many = String(weather.many);
  hud.querySelector('.one-possibility').setAttribute('aria-hidden', String(weather.many));
  hud.querySelector('.many-possibilities').setAttribute('aria-hidden', String(!weather.many));
  hud.querySelectorAll('.stage-word').forEach(title => title.setAttribute('aria-hidden', String(!title.classList.contains(`stage-${stage}`))));
  hud.style.setProperty('--showcase-type', Math.min(1, Math.max(0, (build - .10) / .11)));
  hud.style.setProperty('--rain', weather.rain);
  const walk=houseWalk(build);
  const pawn={x:432+walk.x*130,y:184+walk.z*44-walk.hop*180,lean:Math.sin(walk.t*Math.PI*18)*8,scale:walk.scale,door:walk.door};
  hud.querySelectorAll('.house-pawn').forEach(figure=>{
    figure.setAttribute('transform',`translate(${pawn.x} ${pawn.y}) rotate(${pawn.lean}) scale(${pawn.scale})`);
    figure.setAttribute('opacity',String(figure.classList.contains('house-pawn-back')===walk.back?1:0));
  });
  hud.querySelector('.tiny-door')?.setAttribute('transform', `translate(436 171) skewY(${-pawn.door * 18}) scale(${1 - pawn.door * .88} 1)`);
  if (layer) {
    layer.dataset.active = String(active);
    layer.dataset.clouds = String(weather.cloudsVisible);
    layer.dataset.kind = weather.cloudKind;
    layer.style.setProperty('--rain', weather.rain);
    layer.style.setProperty('--snow', weather.winter);
  }
  const leaf=foregroundLeafPose(weather.p), foreground=document.querySelector('.foreground-leaf');
  if(foreground){foreground.dataset.active=String(active&&leaf.visible);foreground.style.transform=`translate(${leaf.x}vw,${leaf.y}vh) rotate(${leaf.rotation}deg) scale(${leaf.scale})`;}
  const wipe=document.querySelector('.season-exit-overlay');
  if(wipe){wipe.dataset.active=String(active&&exit>0);wipe.dataset.progress=String(Math.round(exit*1000));wipe.querySelector('.paper-fan').setAttribute('transform',`translate(1600 1000) rotate(${smooth(0,.94,exit)*90})`);const word=wipe.querySelector('.exit-first-word');word.style.transform=`translate(calc(-50% + ${(1-smooth(.60,.92,exit))*115}vw),-50%) rotate(${(1-smooth(.60,.92,exit))*9}deg)`;word.style.opacity=smooth(.60,.75,exit);}
}

export default function ShowcaseHUD({ reduced }) {
  useEffect(() => {
    if (!reduced) return;
    const observer = new IntersectionObserver(entries => {
      const active = entries[0].isIntersecting;
      document.querySelector('.showcase-hud').dataset.active = String(active);
    }, { threshold: .3 });
    observer.observe(document.querySelector('#showcase'));
    return () => observer.disconnect();
  }, [reduced]);
  return createPortal(<>
    <div className="showcase-hud" data-theme={reduced ? 'life' : 'land'} data-active="false" data-many="false">
      <h2 className="showcase-title"><span className="one-possibility">一格，<br />一种可能。</span><span className="many-possibilities">一格，<br /><em>多</em>种可能。</span></h2>
      <div className="stage-words">{['land', 'sea', 'life', 'rain', 'autumn', 'winter'].map(theme => <ThemedTitle key={theme} theme={theme} />)}</div>
      <div className="stage-lines" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
    </div>
    <div className="weather-layer" data-active="false" data-clouds="false" data-kind="rain" aria-hidden="true">
      <svg className="weather-svg" preserveAspectRatio="none">
        <g className="weather-rain">{Array.from({ length: 65 }, (_, i) => <path key={i} d={`M${(i * 137.51) % 1600} ${(i * 97.3) % 1000}l-7 24`} style={{ animationDelay: `${-(i % 11) * .11}s`, animationDuration: `${.55 + i % 4 * .07}s` }} />)}</g>
        <CloudBank />
      </svg>
      <div className="lightning-wash" />
    </div>
    <svg className="foreground-leaf" data-active="false" viewBox="-180 -190 360 420" aria-hidden="true"><path d="M0 169C-9 120-11 107-5 84L-46 106-43 78-105 80-87 50-151 20-110 3-129-50-83-36-84-103-42-79 0-164 35-89 76-116 78-55 127-73 112-12 154 7 105 47 118 73 55 75 48 107 10 82C5 114 9 143 13 169Z" fill="#080b08"/></svg>
    <div className="season-exit-overlay" data-active="false" aria-hidden="true"><svg viewBox="0 0 1600 1000" preserveAspectRatio="none"><g className="paper-fan" transform="translate(1600 1000)"><path d="M0 0H-2800V2800H0Z" fill="#f7f7f0"/>{[0,-14,-35,-62].map((y,i)=><path key={y} d={`M-2800 ${y}H0`} stroke="#171c16" strokeWidth={i===0?4:1.4} fill="none"/>)}</g></svg><div className="kinetic-word exit-first-word">放下。</div></div>
  </>, document.body);
}
