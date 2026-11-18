import React, { useLayoutEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { smooth } from '../world/season-state.js';

const nodes=[[115,526,-42,.1],[132,450,39,.22],[126,365,-39,.32],[167,284,44,.43],[181,205,-36,.54]];
export default function EndingGarden({ reduced }) {
  const plant=useRef(null);
  useLayoutEffect(()=>{
    const apply=p=>{
      plant.current.style.setProperty('--stem',smooth(0,.82,p));
      plant.current.style.setProperty('--bloom',smooth(.66,.92,p));
      plant.current.dataset.bloom=String(Math.round(smooth(.67,1,p)*1000));
      plant.current.querySelectorAll('.plant-leaf').forEach((leaf,i)=>leaf.style.setProperty('--leaf',smooth(nodes[i][3],nodes[i][3]+.19,p)));
      plant.current.querySelectorAll('.plant-petal').forEach((petal,i)=>petal.style.setProperty('--petal',smooth(.66+i*.012,.88+i*.012,p)));
    };
    if(reduced){apply(1);return;}
    const trigger=ScrollTrigger.create({trigger:'#ending',start:'top top',end:'bottom bottom',onUpdate:self=>apply(self.progress),onRefresh:self=>apply(self.progress)});apply(trigger.progress);
    return()=>trigger.kill();
  },[reduced]);
  return <svg ref={plant} className="ending-plant" viewBox="0 0 360 640" aria-label="随滚动生长并开花的黑色植物剪影">
    <path className="plant-stem" d="M103 627C95 545 157 509 130 430S110 334 165 284S204 191 212 103" fill="none" stroke="black" strokeWidth="10" strokeLinecap="round" pathLength="1" />
    {nodes.map(([x,y,angle],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}><path className="plant-leaf" d="M0 0C-10-34-35-60-27-100C11-88 29-42 0 0Z" fill="black"/></g>)}
    <g transform="translate(212 103)">{Array.from({length:9},(_,i)=><g key={i} transform={`rotate(${i*40})`}><path className="plant-petal" d="M0 7C-37-10-35-58-12-75C18-78 34-28 0 7Z" fill="black"/></g>)}<circle className="plant-center" r="19" fill="black" /></g>
  </svg>;
}
