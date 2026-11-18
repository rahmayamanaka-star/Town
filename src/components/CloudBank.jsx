import React, { useMemo } from 'react';
import { cloudLayout } from './cloud-shapes.js';

export default function CloudBank() {
  const clouds=useMemo(cloudLayout,[]);
  return <g className="cloud-plane">
    <defs>
      <linearGradient id="cloud-paper-fill" x1="0" y1="0" x2=".2" y2="1"><stop className="cloud-light"/><stop offset="1" className="cloud-dark"/></linearGradient>
      <linearGradient id="cloud-tone-falloff" x1="0" y1="-1.6" x2="0" y2="1.6" gradientUnits="userSpaceOnUse"><stop stopColor="black"/><stop offset=".42" stopColor="#777"/><stop offset="1" stopColor="white"/></linearGradient>
      <mask id="cloud-tone-mask" x="-4" y="-2" width="8" height="4" maskUnits="userSpaceOnUse"><rect x="-4" y="-2" width="8" height="4" fill="url(#cloud-tone-falloff)"/></mask>
      {clouds.map((c,i)=><pattern key={i} id={`cloud-grain-${i}`} width={c.grain} height={c.grain} patternUnits="userSpaceOnUse" patternTransform={`scale(${1/c.sx} ${1/c.sy})`}><circle cx={c.grain*.3} cy={c.grain*.3} r={c.dot} fill="#40534c" opacity=".45"/></pattern>)}
    </defs>
    <g className="cloud-travel">{clouds.map((c,i)=><g key={c.seed} className={c.back?'cloud-bank-back':'cloud-bank-front'} transform={`translate(${c.row+c.lead} ${c.row-c.lead}) rotate(${c.angle}) scale(${c.sx} ${c.sy})`}>
      <path d={c.d} transform="translate(.025 .045)" className="cloud-shadow"/>
      <path d={c.d} fill="url(#cloud-paper-fill)" stroke="#2c3a32" strokeOpacity={c.back?.65:.95} strokeWidth={c.back?1.3:1.8} vectorEffect="non-scaling-stroke"/>
      <path d={c.d} fill={`url(#cloud-grain-${i})`} mask="url(#cloud-tone-mask)"/>
      <path d={c.contour} fill="none" stroke="#60776e" strokeOpacity=".35" strokeWidth="1.1" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      <path d={c.contour} transform="translate(.01 -.045)" fill="none" stroke="#fffef2" strokeOpacity=".8" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </g>)}</g>
  </g>;
}
