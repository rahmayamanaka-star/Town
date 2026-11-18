import React from 'react';

function StaticTown() {
  return <svg className="static-town" viewBox="0 0 600 470" role="img" aria-label="陆地、海洋、房子与树构成的小镇示意">
    <g transform="translate(300 75)">
      <path d="M0 0 250 145 0 290-250 145Z" fill="#edece4" stroke="#aeb2a3" />
      <path d="m-166 97 250 145M-83 49l250 145M83 49-250 145M166 97-250 145" stroke="#c8ccbf" />
      <path d="m0 97 80 47-80 47-80-47Z" fill="#91b56a" />
      <path d="m83 145 80 47-80 47-80-47Z" fill="#91b56a" />
      <path d="m-83 145 80 47-80 47-80-47Z" fill="#68b8ce" />
      <path d="m-25 110 25 15 25-15v42L0 167l-25-15Z" fill="#efe3c3" />
      <path d="m-35 112 35-40 35 40-35 20Z" fill="#bc624c" />
      <path d="m80 150 6 3v35l-6-3Z" fill="#886845" /><path d="m83 106 28 22-8 30-27 9-20-25Z" fill="#78a654" />
    </g>
  </svg>;
}

export default function WorldView({ id, className = '', label, fallback }) {
  return <div className={`world-view ${className}`} data-world={id} role="img" aria-label={label}>
    {fallback && <StaticTown />}
  </div>;
}

