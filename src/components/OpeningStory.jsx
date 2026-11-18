import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import wordmark from '../assets/town-paths.json';
import { openingState, portalExpansion, portalSpread } from './opening-state';
import { motion, setWorldMotion } from '../world/motion-store';
import { paperCutState } from '../world/animation-state.js';
import WorldView from './WorldView';
import PaperCutOverlay from './PaperCutOverlay';

// Close only the counter of “o” during contour union. A very wide SVG stroke
// around this reverse-wound inner contour otherwise leaves a small black shard.
const counter = 'M' + wordmark.letters.find(l => l.char === 'o').d.split('M')[2];

function useViewport() {
  const read = () => ({ width: document.documentElement.clientWidth, height: window.innerHeight });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const update = () => setSize(previous => { const next = read(); return previous.width === next.width && previous.height === next.height ? previous : next; });
    const observer = new ResizeObserver(update); observer.observe(document.documentElement);
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return size;
}

function StoryType({ imagined = false }) {
  return imagined ? null : <div className="sr-only"><h2>现实，搭进想象。</h2><p>摆放实体方块，生成你的三维小镇。</p></div>;
}

export default function OpeningStory({ entered, reduced, fallback, onWordReady }) {
  const section = useRef(null);
  const overlays = useRef(null);
  const progress = useRef(0);
  const applyProgress = useRef(() => {});
  const { width, height } = useViewport();
  const scale = Math.min(width * 0.83 / wordmark.width, height * 0.5 / wordmark.height);
  const fit = `translate(${(width - wordmark.width * scale) / 2} ${(height - wordmark.height * scale) / 2}) scale(${scale})`;

  useLayoutEffect(() => {
    if (!entered) return;
    if (reduced) { onWordReady(); setWorldMotion('scan', 1); return; }
    const ctx = gsap.context(() => {
      const paths = [...overlays.current.querySelectorAll('.word-outline')];
      overlays.current.dataset.introPhase = 'outline';
      paths.forEach(path => { const length = path.getTotalLength(); gsap.set(path, { strokeDasharray: length, strokeDashoffset: length }); });
      gsap.set('.word-fill-rect', { attr: { y: wordmark.height + 8 } });
      gsap.timeline({ onComplete: () => {
        window.scrollTo(0, 0);
        overlays.current.dataset.introPhase = 'ready';
        applyProgress.current(0);
        onWordReady();
      } })
        .to(paths, { strokeDashoffset: 0, duration: 2.05, stagger: 0.14, ease: 'power2.inOut' })
        .call(() => { overlays.current.dataset.introPhase = 'fill'; })
        .to('.word-fill-rect', { attr: { y: -8 }, duration: 1.05, stagger: 0.075, ease: 'power2.inOut' });
    }, overlays);
    return () => ctx.revert();
  }, [entered, reduced, onWordReady]);

  useLayoutEffect(() => {
    if (!entered || reduced) return;
    const root = section.current;
    const overlay = overlays.current;
    const maskLetters = overlay.querySelectorAll('.portal-letter');
    const apply = p => {
      if (overlay.dataset.introPhase !== 'ready') p = 0;
      progress.current = p;
      const s = openingState(p);
      root.style.setProperty('--scan', s.scan);
      root.style.setProperty('--scan-right', `${(1 - s.scan) * 100}%`);
      overlay.style.setProperty('--scan-position', `${s.scan * 100}%`);
      overlay.style.setProperty('--scan-opacity', s.scan > 0.001 && s.scan < 0.999 ? '1' : '0');
      overlay.style.setProperty('--guides-opacity', `${(1 - s.cover) * (1 - s.exit) * 0.55}`);
      gsap.set(overlay.querySelector('.portal-shade'), { opacity: 1 - s.glimpse });
      gsap.set(overlay.querySelector('.wordmark-ink'), { opacity: 1 - s.glimpse });
      gsap.set(overlay.querySelector('.wordmark-cover'), { opacity: s.cover });
      const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
      const fitScale = Math.min(viewportWidth * 0.83 / wordmark.width, viewportHeight * 0.5 / wordmark.height);
      const spread = portalSpread(s.expand, viewportWidth, viewportHeight, fitScale);
      const zoom = portalExpansion(s.wordZoom);
      overlay.querySelector('.portal-word').setAttribute('transform', `${fit} translate(${wordmark.width / 2} ${wordmark.height / 2}) scale(${zoom}) translate(${-wordmark.width / 2} ${-wordmark.height / 2})`);
      maskLetters.forEach(letter => {
        letter.removeAttribute('transform');
        const path = letter.querySelector('path');
        path.setAttribute('stroke', 'black'); path.setAttribute('stroke-width', spread);
        path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
      });
      overlay.querySelector('.portal-counter-cleanup').setAttribute('opacity', Math.min(1, s.expand * 12));
      gsap.set(root.querySelectorAll('.story-note'), { opacity: s.cut * (1 - s.exit) });
      const paper = document.querySelector('.paper-cut-svg');
      if (paper) paper.style.visibility = paperCutState(p, motion.showcase).visible ? 'visible' : 'hidden';
      const showcase = document.querySelector('.showcase-frame');
      if (showcase) showcase.style.visibility = p >= 0.9999 ? 'visible' : 'hidden';
      overlay.style.visibility = p >= 0.9999 ? 'hidden' : 'visible';
      setWorldMotion('scan', s.scan);
      setWorldMotion('opening', p);
    };
    applyProgress.current = apply;
    const trigger = ScrollTrigger.create({
      trigger: root, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        apply(self.progress);
      },
      onRefresh: self => apply(self.progress),
    });
    apply(trigger.progress);
    return () => { trigger.kill(); applyProgress.current = () => {}; };
  }, [entered, reduced, fit]);

  useLayoutEffect(() => { applyProgress.current(progress.current); }, [width, height]);

  const scene = <section id="about" className="about-stage" aria-label="现实转为想象">
    <div className="reality-surface"><WorldView id="physical" className="story-world" fallback={fallback} label="现实定位板：细化倒角、纸面与贴纸的实体方块" /><StoryType /></div>
    <div className="imagination-surface"><WorldView id="virtual" className="story-world" fallback={fallback} label="竖线扫过后出现手绘漫画小镇，包含像素水光、飘落树叶与末段渐起的烟囱烟雾" /><StoryType imagined /></div>
    <span className="story-note">交互示意</span>
    {fallback && <p className="story-fallback" role="status">三维预览不可用，已显示静态示意。</p>}
  </section>;

  if (reduced) return <>
    <section id="home" className="reduced-home" tabIndex={-1} aria-label="Town"><h1 className="sr-only">Town</h1><svg viewBox={`-8 -8 ${wordmark.width + 16} ${wordmark.height + 16}`} aria-hidden="true">{wordmark.letters.map(l => <path key={l.char} d={l.d} fill="#fff" />)}</svg></section>
    <div className="opening-reduced">{scene}</div>
  </>;

  return <>
    <section id="home" ref={section} className="opening-story" tabIndex={-1} aria-label="Town">
      <h1 className="sr-only">Town</h1>
      <div className="story-frame">{scene}</div>
    </section>
    {createPortal(<><PaperCutOverlay /><div ref={overlays} className={`opening-overlay ${entered ? 'has-entered' : ''}`} aria-hidden="true">
      <div className="story-guides"><i /><i /><b /></div>
      <div className="scan-cursor" />
      <div className="portal-shade" />
      <svg className="wordmark-cover" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs><mask id="town-portal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height} style={{ maskType: 'luminance' }}>
          <rect width={width} height={height} fill="white" />
          <g className="portal-word" transform={fit} fill="black">{wordmark.letters.map(l => <g key={l.char} className="portal-letter"><path d={l.d} /></g>)}<path className="portal-counter-cleanup" d={counter} fill="black" stroke="none" opacity="0" /></g>
        </mask></defs>
        <rect width={width} height={height} fill="#11130e" mask="url(#town-portal-mask)" />
      </svg>
      <svg className="wordmark-ink" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>{wordmark.letters.map((l, i) => <clipPath key={l.char} id={`town-fill-${i}`}><rect className="word-fill-rect" x="-8" y={wordmark.height + 8} width={wordmark.width + 16} height={wordmark.height + 16} /></clipPath>)}</defs>
        <g transform={fit}>{wordmark.letters.map((l, i) => <g key={l.char}>
          <path d={l.d} fill="#fff" clipPath={`url(#town-fill-${i})`} />
          <path className="word-outline" d={l.d} fill="none" stroke="#fff" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
        </g>)}</g>
      </svg>
    </div></>, document.body)}
  </>;
}
