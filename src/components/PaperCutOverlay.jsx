import React from 'react';

export default function PaperCutOverlay() {
  return <svg className="paper-cut-svg" aria-hidden="true" preserveAspectRatio="none">
    <defs>
      <pattern id="cut-paper-grain" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f5f2d9" /><circle cx="3" cy="3" r="0.65" fill="#232719" fillOpacity="0.13" /></pattern>
      <mask id="cut-paper-outside" maskUnits="userSpaceOnUse"><rect className="cut-mask-full" fill="white" /><path className="cut-hole" fill="black" /></mask>
      <mask id="cut-guide-reveal" maskUnits="userSpaceOnUse"><path className="cut-guide-mask" fill="none" stroke="white" strokeWidth="16" /></mask>
    </defs>
    <rect className="cut-paper-sheet" fill="url(#cut-paper-grain)" mask="url(#cut-paper-outside)" />
    <g className="cut-guide-layer" mask="url(#cut-guide-reveal)">
      <path className="cut-guide-halo" fill="none" stroke="#fffdf2" strokeWidth="8" />
      <path className="cut-guide" fill="none" stroke="#182016" strokeWidth="3.5" strokeDasharray="10 8" />
    </g>
    <path className="cut-seam" fill="none" stroke="#fffdf2" strokeWidth="3" />
    <g className="paper-scissors" stroke="#171e16" strokeWidth="3.5" strokeLinejoin="round">
      <g className="scissor-upper"><path d="M-32-5Q-12-12 4 0L-29 7Z" fill="#f5f4e7" /><path d="M-32-4-55-18" strokeWidth="9" /><ellipse cx="-63" cy="-23" rx="14" ry="11" fill="#f59c84" /><ellipse cx="-63" cy="-23" rx="6" ry="4" fill="#f5f2d9" strokeWidth="2.5" /></g>
      <g className="scissor-lower"><path d="M-32 5Q-12 12 4 0L-29-7Z" fill="#d7e4dc" /><path d="M-32 4-55 18" strokeWidth="9" /><ellipse cx="-63" cy="23" rx="14" ry="11" fill="#a8d2b2" /><ellipse cx="-63" cy="23" rx="6" ry="4" fill="#f5f2d9" strokeWidth="2.5" /></g>
      <circle cx="-30" cy="0" r="6" fill="#f3cd71" /><circle cx="-30" cy="0" r="1.5" fill="#171e16" stroke="none" />
    </g>
  </svg>;
}
