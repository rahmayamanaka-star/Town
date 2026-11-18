# Third-party notices

## React Bits

ScrollFloat and ScrollReveal are used from [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits/tree/d01aa914dcbe76da8b2923ebf872b5c8b1066e4c), fixed commit `d01aa914dcbe76da8b2923ebf872b5c8b1066e4c`. Source JSX/CSS are retained unchanged under `src/components/react-bits/`; local typography is overridden by `src/styles.css`.

Copyright and complete MIT + Commons Clause terms are included in `public/licenses/REACT-BITS-LICENSE.md` and shipped with the website. These components must not be independently sold contrary to those terms.

## Runtime libraries

- [GSAP](https://github.com/greensock/GSAP), 3.15.1, GSAP Standard License: https://gsap.com/standard-license . Its distributed copyright and license notice is retained in the compiled dependency.
- [Lenis](https://github.com/darkroomengineering/lenis), 1.3.27, MIT; complete license in `public/licenses/LENIS-LICENSE.txt`.
- [Three.js](https://github.com/mrdoob/three.js), 0.187.0, MIT; complete license in `public/licenses/THREE-LICENSE.txt`.
- [React](https://github.com/facebook/react), 19.3.1, MIT; complete React and React DOM licenses in `public/licenses/`.
- [Manrope](https://github.com/sharanda/manrope), self-hosted through `@fontsource-variable/manrope` 5.3.0, SIL Open Font License 1.1; complete terms in `public/licenses/MANROPE-LICENSE.txt`.

The Town outline wordmark is derived from the installed Manrope variable font at weight 800. Its four glyph paths are stored in `src/assets/town-paths.json`; provenance and normalization are documented in `src/assets/TOWN-WORDMARK-SOURCE.md`. The same SIL Open Font License is retained above.

Exact research sources are recorded in `DEPENDENCY-SOURCES.json`; npm versions are locked in `package-lock.json`.

## Visual references and project assets

[Bulletproof](https://www.wearebulletproof.com/) and [Santalarch](https://santalarch.com/) informed large typography, generous space and scroll transitions. No branding, imagery or source code was copied from those sites.

Town geometry and marker SVG assets are taken from the user's existing local Town prototype. The copied marker SVGs have explicit rasterization dimensions added. They illustrate the interaction rather than footage of a live recognition session.

## Town Brush / ZCOOL KuaiLe

Imagination headings and copy use a 41-character WOFF2 subset of **ZCOOL KuaiLe (站酷快乐体)**, Regular 400. Copyright 2018 The ZCOOL KuaiLe Project Authors. Official source: [Google Fonts](https://github.com/google/fonts/tree/6d49995f5d8f1c7d476760a580ffb89ce1e52c5d/ofl/zcoolkuaile). Licensed under SIL Open Font License 1.1, retained in `public/licenses/TOWN-BRUSH-OFL.txt`. The modified subset is internally named Town Brush Subset; provenance and hash verification are recorded in `src/assets/TOWN-BRUSH-SOURCE.md`.

Bevelled reality geometry uses the installed Three.js RoundedBoxGeometry addon under the existing Three.js MIT license. Paper grain, pixel leaves, glints and cartoon smoke are procedurally drawn project assets.
