import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollFloat from './react-bits/ScrollFloat';
import { keywordPose } from '../world/season-state.js';

export default function HowIntro({ reduced }) {
  const root=useRef(null);
  useLayoutEffect(()=>{
    if(reduced)return;
    const apply=self=>{
      root.current.dataset.word=String(Math.min(2,Math.floor(self.progress*3)));
      root.current.querySelectorAll('.kinetic-word').forEach((word,i)=>{
        const p=keywordPose(self.progress,i);
        word.style.transform=`translate(calc(-50% + ${p.x}vw),calc(-50% + ${p.y}vh)) rotate(${p.rotation}deg)`;
        word.style.opacity=p.opacity;
      });
    };
    const trigger=ScrollTrigger.create({trigger:root.current,start:'top top',end:'bottom bottom',onUpdate:apply,onRefresh:apply});apply(trigger);
    return()=>trigger.kill();
  },[reduced]);
  return <div ref={root} className={`how-intro ${reduced?'is-reduced':''}`} aria-label="放下。叠上。改变。">
    <div className="how-intro-frame">
      {['放下。','叠上。','改变。'].map((word,i)=><div className="kinetic-word" key={word}>
        <ScrollFloat containerClassName="kinetic-glyphs" textClassName="kinetic-text" effect="wave" stretch={1.16} distance={30} stagger={.03} scrollStart="top bottom" scrollEnd="top top" ease="power2.out">{word}</ScrollFloat>
        <svg className={`word-object object-${i}`} viewBox="0 0 120 120" aria-hidden="true">
          {i===0?<><path d="m20 66 40-22 40 22-40 23Z" fill="#b7d477"/><path d="M20 66v13l40 24 40-24V66M60 89v14" fill="none"/><path d="M60 9v22m-9-8 9 9 9-9" fill="none"/></>:i===1?<><path d="m20 81 40-22 40 22-40 23Zm0-22 40-22 40 22-40 23Zm0-23L60 14l40 22-40 23Z" fill="#e9be80"/></>:<><path d="M22 55a38 38 0 0 1 65-25M87 12v20H67M98 68a38 38 0 0 1-65 25M33 109V89h20" fill="none"/><path d="m42 58 18-10 18 10-18 11Z" fill="#a7cbd4"/></>}
        </svg>
      </div>)}
      <div className="how-intro-index" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>
    </div>
  </div>;
}
