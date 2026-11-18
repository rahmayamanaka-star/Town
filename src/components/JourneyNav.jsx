import React, { useEffect, useRef } from 'react';
import { BUILD_DISTANCE, buildDistanceAt, weatherDistanceAt, FISHING_START } from '../world/season-state.js';

export const CHAPTERS = [
  ['home', 'Town'], ['about', '想象'], ['land', '陆地'], ['sea', '海洋'], ['life', '生活'],
  ['rain', '雨天'], ['autumn', '秋天'], ['winter', '冬天'], ['how-to-play', '玩法'], ['ending', '尾声'],
];
export function chapterPositions() {
  const h = window.innerHeight;
  const absolute = id => { const element = document.getElementById(id); return element ? element.getBoundingClientRect().top + window.scrollY : 0; };
  const showcase = absolute('showcase');
  const weather = showcase + BUILD_DISTANCE / 100 * h;
  const build = p => showcase + buildDistanceAt(p) / 100 * h;
  const season = p => weather + weatherDistanceAt(p) / 100 * h;
  return [0, (document.getElementById('home').offsetHeight - h) * .50, build(.25), build(.51), build(.86), season(.30), season(.63), season(FISHING_START), absolute('how-to-play'), absolute('ending')];
}

export default function JourneyNav({ ready, onNavigate }) {
  const nav = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const update = () => {
      const stops = chapterPositions();
      const progress = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      nav.current.style.setProperty('--journey-progress', progress);
      nav.current.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', Math.round(progress * 100));
      const current = stops.findLastIndex(top => window.scrollY >= top - window.innerHeight * .25);
      nav.current.querySelectorAll('.chapter-link').forEach((link, i) => link.setAttribute('aria-current', i === current ? 'step' : 'false'));
    };
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [ready]);
  return <nav ref={nav} className={`journey-nav ${ready ? 'is-ready' : ''}`} aria-label="浏览章节">
    <a href="#home" className="journey-plus" aria-label="回到 Town" onClick={event => { event.preventDefault(); onNavigate(0); }}>+</a>
    <div className="journey-chapters">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`} className="chapter-link" onClick={event => { event.preventDefault(); onNavigate(chapterPositions()[i]); }}>{label}</a>)}</div>
    <div className="journey-track" role="progressbar" aria-label="页面浏览进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i /></div>
  </nav>;
}
