import React from 'react';

const WORDS = { land: '陆地', sea: '海洋', life: '生活', rain: '雨天', autumn: '秋天', winter: '冬天' };
function Pawn({back=false}) { return <g className={`house-pawn ${back?'house-pawn-back':'house-pawn-front'}`} transform="translate(490 187)"><ellipse cy="1.5" rx="6.5" ry="2" fill="#182117" opacity=".15" stroke="none" /><path d="M-5 0Q-6-3-3-5L-2-12h4L3-5Q6-3 5 0Z" fill="#e7b457" strokeWidth="1.8" /><circle cy="-15" r="4" fill="#fff3cb" strokeWidth="1.8" /></g>; }

export default function ThemedTitle({ theme }) {
  const word = WORDS[theme], clip = `title-clip-${theme}`;
  return <h3 className={`stage-word stage-${theme} themed-title`} aria-label={word}>
    <svg viewBox="0 0 520 235" aria-hidden="true">
      <defs>
        <linearGradient id={`title-${theme}-land-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dbed88" /><stop offset=".6" stopColor="#8fba59" /><stop offset=".61" stopColor="#b99869" /><stop offset="1" stopColor="#8b6c49" /></linearGradient>
        <linearGradient id={`title-${theme}-life-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff5d4" /><stop offset="1" stopColor="#f4bc80" /></linearGradient>
        <pattern id={`title-${theme}-sea-fill`} width="86" height="48" patternUnits="userSpaceOnUse"><rect width="86" height="48" fill="#78cbd3" /><path d="M-20 12Q0-1 22 12T65 12T108 12M-20 36Q0 23 22 36T65 36T108 36" fill="none" stroke="#dbf7ef" strokeWidth="5" /></pattern>
        <linearGradient id={`title-${theme}-rain-fill`} x2="0" y2="1"><stop stopColor="#f4f6e9" /><stop offset="1" stopColor="#a4cad6" /></linearGradient>
        <linearGradient id={`title-${theme}-autumn-fill`} x2="0" y2="1"><stop stopColor="#ffdf8a" /><stop offset="1" stopColor="#c65f34" /></linearGradient>
        <linearGradient id={`title-${theme}-winter-fill`} x2="0" y2="1"><stop stopColor="#fffef5" /><stop offset="1" stopColor="#9bcbd6" /></linearGradient>
        <clipPath id={clip}><text x="12" y="196" className="themed-glyph">{word}</text></clipPath>
      </defs>
      {[10, 7, 4].map(offset => <text key={offset} className="themed-glyph" x={12 + offset} y={196 + offset} stroke="#182117" strokeWidth="7" fill={theme === 'sea' ? '#377f89' : theme === 'land' ? '#755b3e' : '#b56e4e'}>{word}</text>)}
      <text x="12" y="196" className="themed-glyph" stroke="#182117" strokeWidth="6" paintOrder="stroke fill" fill={`url(#title-${theme}-${theme}-fill)`}>{word}</text>
      {theme === 'land' && <g stroke="#22351b" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M77 47Q72 21 56 20Q52 44 77 47M78 46Q82 18 100 20Q103 43 78 46M278 44Q273 17 260 17Q252 37 278 44M279 44Q290 21 304 28Q300 49 279 44" fill="#8fbd59" />
        <g transform="translate(436 176)"><path d="M0 13V-5" /><path d="M-1-4C-31-5-17-30-3-18C5-39 29-22 13-9C35 1 10 25 0 7C-9 28-31 7-12-2Z" fill="#fff4cf" /><circle r="6" cy="-4" fill="#efbe51" /></g>
      </g>}
      {theme === 'sea' && <g fill="none" stroke="#213f40" strokeWidth="3.5"><circle cx="435" cy="173" r="16" fill="#d8f7f0" /><circle cx="463" cy="136" r="8" fill="#bfeef0" /><path d="M430 163Q437 159 442 164" stroke="#fff" strokeLinecap="round" /><path d="M86 32Q105 9 124 32M289 32Q310 10 331 32" stroke="#eefbfa" strokeWidth="8" strokeLinecap="round" /></g>}
      {theme === 'life' && <>
        <g clipPath={`url(#${clip})`} stroke="#4f4531" strokeWidth="3" fill="#89c4ca">{[64, 107, 252, 295].map(x => <g key={x}><rect x={x} y="103" width="22" height="26" rx="4" /><path d={`M${x+11} 104v24M${x} 116h22`} /></g>)}</g>
        <g stroke="#30251c" strokeWidth="3.5" strokeLinejoin="round"><path d="M232 38 280 10 328 38Z" fill="#e88e6d" /><path d="M253 37h54" fill="none" /></g>
        <g className="life-vignette" transform="translate(440 182) scale(2) translate(-440 -182)" stroke="#30251c" strokeWidth="2.2" strokeLinejoin="round">
          <Pawn back/><path d="M423 187v-30h34v30Z" fill="#ffe1a6" /><path d="M416 158 440 140 464 158Z" fill="#df8664" /><path d="M436 187v-16h9v16" fill="#4a3829" /><rect className="tiny-door" x="0" y="0" width="9" height="16" fill="#8fae77" transform="translate(436 171)" /><Pawn/>
        </g>
      </>}
      {theme === 'rain' && <g stroke="#243d49" strokeWidth="3" strokeLinecap="round" fill="#c9e1e3"><path d="M70 37Q63 15 47 29Q23 23 25 44H87Q92 26 74 29" /><path d="M50 52 45 65M72 52 67 65M275 27l-7 17M311 29l-7 18" stroke="#e9f8fa" strokeWidth="5" /><path d="M439 148Q420 170 425 180Q440 197 451 180Q455 170 439 148Z" /><path d="M432 177q3 5 8 4" stroke="#fff" fill="none" /></g>}
      {theme === 'autumn' && <g stroke="#51351d" strokeWidth="3" strokeLinejoin="round"><path d="M83 41 55 33 61 20 45 10 71 12 78-4 89 12 110 6 101 25 117 32Z" fill="#dc7a38" /><path d="m82 39-7-27M439 148Q409 150 421 175Q436 190 453 163Q456 146 439 148Z" fill="#f4c35a" /><path d="m421 184 25-26" fill="none" /></g>}
      {theme === 'winter' && <g stroke="#2a4a52" strokeWidth="3" strokeLinecap="round"><path d="M40 35Q50 19 67 30Q76 10 94 30Q108 19 120 36L119 42H40ZM263 33Q273 17 286 31Q303 14 318 34L318 42H264Z" fill="#fffef4" /><g transform="translate(441 165)" stroke="#f9fcf7" strokeWidth="5"><path d="M-18 0h36M-9-16 9 16M-9 16 9-16" /><path d="m-18-5 5 5-5 5m36-10-5 5 5 5" /></g></g>}
    </svg>
  </h3>;
}
