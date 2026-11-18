import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import OpeningStory from './components/OpeningStory';
import WorldView from './components/WorldView';
import ShowcaseHUD, { updateShowcaseHUD } from './components/ShowcaseHUD';
import HowIntro from './components/HowIntro';
import EndingGarden from './components/EndingGarden';
import JourneyNav from './components/JourneyNav';
import { showcaseJourney, seasonState, showcasePaper, JOURNEY_DISTANCE } from './world/season-state.js';
import ScrollReveal from './components/react-bits/ScrollReveal';
import { WorldCanvas } from './world/WorldCanvas';
import { setWorldMotion } from './world/motion-store';

gsap.registerPlugin(ScrollTrigger);
// Keep GSAP and Lenis on wall-clock time when a tab resumes or drops frames.
gsap.ticker.lagSmoothing(0);
const CODE = 'const town = new Town();\ntown.createGround();\ntown.addLife();\ntown.render();';
const LAST_LINE = CODE.lastIndexOf('\n') + 1;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

function Loader({ ready, reduced, onComplete }) {
  const [count, setCount] = useState(0);
  const overlay = useRef(null);
  const code = useRef(null);
  const caret = useRef(null);
  const portal = useRef(null);
  useEffect(() => {
    if (count >= CODE.length || (count >= LAST_LINE && !ready)) return;
    const timer = setTimeout(() => setCount(n => Math.min(n + (reduced ? CODE.length : 1), CODE.length)), reduced ? 80 : CODE[count] === '\n' ? 240 : 40);
    return () => clearTimeout(timer);
  }, [count, ready, reduced]);
  useLayoutEffect(() => {
    if (!ready || count < CODE.length) return;
    const ctx = gsap.context(() => {
      const timer = gsap.delayedCall(reduced ? 0.15 : 0.8, () => {
        if (reduced) {
          gsap.to(overlay.current, { opacity: 0, duration: 0.2, onComplete });
          return;
        }
        const r = caret.current.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const scale = Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 2.5;
        gsap.set(portal.current, { left: r.left, top: r.top, width: r.width, height: r.height, visibility: 'visible' });
        gsap.set(code.current, { transformOrigin: `${x - code.current.getBoundingClientRect().left}px ${y - code.current.getBoundingClientRect().top}px` });
        // The solid portal takes over from the still-blinking caret. It never flashes full screen.
        gsap.timeline({ onComplete })
          .to(code.current, { scale: 20, opacity: 0, duration: 0.95, ease: 'power3.in' }, 0)
          .to(portal.current, { scale, duration: 1.05, ease: 'power3.in' }, 0);
      });
      return () => timer.kill();
    }, overlay);
    return () => ctx.revert();
  }, [count, ready, reduced, onComplete]);
  return <div ref={overlay} id="loader" className="loader" role="status" aria-label="正在准备 Town">
    <pre ref={code} className="loader-code" aria-hidden="true"><span>{CODE.slice(0, count)}</span><i ref={caret} className="typing-caret" /></pre>
    <div ref={portal} className="caret-portal" />
  </div>;
}

export default function App() {
  const reduced = useReducedMotion();
  const [worldReady, setWorldReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [wordReady, setWordReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const main = useRef(null);
  const lenis = useRef(null);
  const complete = React.useCallback(() => { window.scrollTo(0, 0); setEntered(true); }, []);
  const completeWord = React.useCallback(() => setWordReady(true), []);

  useEffect(() => {
    document.fonts.load('24px "Town Brush"').then(() => document.fonts.ready).then(() => setFontsReady(true), () => setFontsReady(true));
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => { history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !entered || !wordReady);
    return () => document.documentElement.classList.remove('is-loading');
  }, [entered, wordReady]);

  useLayoutEffect(() => {
    if (!entered) return;
    if (reduced) {
      setWorldMotion('showcase', 1);
      setWorldMotion('how', 1);
      return;
    }
    const smooth = new Lenis({ duration: 1.12, smoothWheel: true, syncTouch: false, anchors: false });
    lenis.current = smooth;
    if (!wordReady) smooth.stop();
    smooth.on('scroll', ScrollTrigger.update);
    const tick = time => smooth.raf(time * 1000);
    gsap.ticker.add(tick);
    const ctx = gsap.context(() => {
      const updateShowcase = self => {
        const { build, weather, exit } = showcaseJourney(self.progress);
        const state = seasonState(weather);
        setWorldMotion('showcase', build); setWorldMotion('weather', weather);setWorldMotion('seasonExit',exit);
        updateShowcaseHUD(build, state, self.isActive,exit);
        document.querySelector('.showcase-frame')?.style.setProperty('background-color', showcasePaper(build, state));
      };
      ScrollTrigger.create({
        trigger: '#showcase', start: 'top top', end: 'bottom bottom',
        onUpdate: updateShowcase, onToggle: updateShowcase, onRefresh: updateShowcase,
      });
      ScrollTrigger.create({ trigger: '.how-scroll', start: 'top top', end: 'bottom bottom', onUpdate: self => {
        setWorldMotion('how', self.progress);
        document.querySelector('.how-frame')?.setAttribute('data-step', String(Math.min(2, Math.floor(self.progress * 3))));
        document.querySelector('.how-frame')?.style.setProperty('--process-progress',self.progress);
      } });
      gsap.fromTo('.ending-word', { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#ending', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }, main);
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
    return () => { ctx.revert(); gsap.ticker.remove(tick); smooth.destroy(); lenis.current = null; window.removeEventListener('load', refresh); };
  }, [entered, reduced]);

  useEffect(() => { if (wordReady) lenis.current?.start(); }, [wordReady, entered]);

  const backToTop = event => {
    event.preventDefault();
    history.replaceState(null, '', window.location.pathname);
    const home = document.getElementById('home');
    if (lenis.current) lenis.current.scrollTo(0, { duration: 1.6, onComplete: () => home?.focus({ preventScroll: true }) });
    else { window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' }); home?.focus({ preventScroll: true }); }
  };
  const navigate=top=>{if(lenis.current)lenis.current.scrollTo(top,{duration:1.35});else window.scrollTo({top,behavior:reduced?'instant':'smooth'});};
  const jumpStep=index=>{const element=document.querySelector('.how-scroll');navigate(element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-window.innerHeight)*[.27,.63,.98][index]);};

  return <>
    <WorldCanvas reduced={reduced} onReady={() => setWorldReady(true)} onUnavailable={() => setFallback(true)} />
    <JourneyNav ready={wordReady} onNavigate={navigate} />
    <ShowcaseHUD reduced={reduced} />
    <main ref={main} inert={!entered || !wordReady ? true : undefined} className={reduced ? 'reduced-motion' : ''}>
      <OpeningStory entered={entered} reduced={reduced} fallback={fallback} onWordReady={completeWord} />

      <section id="showcase" className="showcase" style={{'--showcase-height':`${JOURNEY_DISTANCE+100}svh`}} aria-label="小镇展示">
        <div className="showcase-frame" data-stage="0">
          <WorldView id="showcase" className="showcase-world" fallback={fallback} label="从陆地、海洋到生活：花海生长、鱼儿跃起，小镇依次经历阴雨傍晚、金色秋天和积雪冬天，暖窗、落叶与冰洞随季节变化" />
        </div>
      </section>

      <section id="how-to-play" className="how" aria-label="游戏玩法">
        <HowIntro reduced={reduced}/>
        <div className="how-scroll">
          <div className="how-frame" data-step="0">
            <WorldView id="how" className="how-world" fallback={fallback} label="玩法示意：先铺两块陆地和一块海洋，再在陆地上添加房子和树，最后移动方块重组小镇" />
            <ol className="how-steps">
              {['铺出地形。','添上房子与树。','移动方块，重组小镇。'].map((text,i)=><li key={text} className={`process-card process-card-${i}`}>
                <span className="step-index" aria-hidden="true">0{i+1}</span>
                <svg className="process-icon" viewBox="0 0 110 80" aria-hidden="true">
                  {i===0?<><path d="m8 50 30-17 30 17-30 18Zm40-24L78 9l27 16-29 18Z" fill="#bad182"/><path d="M8 50v9l30 17 30-17v-9M38 68v8" fill="none"/><path d="m48 50 30-17 27 16-29 18Z" fill="#8fc6ce"/></>:i===1?<><path d="m12 58 35-20 35 20-35 19Z" fill="#b2ce7b"/><path d="M29 52V28h31v24M21 29 45 9l25 20Z" fill="#f5c58f"/><path d="M73 58V40m-13-2 13-20 13 20Z" fill="#88a95b"/></>:<><path d="M10 26h69l-11-11m11 11L68 38M98 55H29l11-11M29 55l11 12" fill="none"/><path d="m42 48 16-9 16 9-16 9Z" fill="#e9c27d"/></>}
                </svg>
                <ScrollReveal containerClassName="process-title" textClassName="process-title-text" splitBy="chars" effect="rise" mode="enter" baseOpacity={.3} enableBlur={false} stagger={.025}>{text}</ScrollReveal>
                <span className="process-rule" aria-hidden="true"/>
              </li>)}
            </ol>
            <div className="process-controls" aria-label="选择玩法步骤">{[0,1,2].map(i=><button key={i} type="button" onClick={()=>jumpStep(i)} aria-label={`查看第 ${i+1} 步`}>0{i+1}</button>)}</div>
            <p className="placement-rule"><span className="rule-dot" aria-hidden="true" />房子和树，放在陆地上。</p>
          </div>
        </div>
      </section>

      <footer id="ending" className="ending">
        <div className="ending-frame">
        <div className="ending-top"><h2>让想象，<br />继续生长。</h2><a className="back-to-top" href="#home" onClick={backToTop}><span>回到开头</span><span className="back-arrow" aria-hidden="true">↗</span></a></div>
        <div className="ending-word" aria-label="Town">Town<span className="ending-period" aria-hidden="true">.</span></div>
        <EndingGarden reduced={reduced}/>
        <div className="ending-credits"><p className="artist-signature"><span>AN INTERACTIVE WORLD BY</span>JIAYI XU</p><p className="ai-disclosure">Created by JIAYI XU.<br/>Developed with AI assistance.</p></div>
        </div>
      </footer>
    </main>
    {!entered && <Loader ready={worldReady && fontsReady} reduced={reduced} onComplete={complete} />}
  </>;
}

