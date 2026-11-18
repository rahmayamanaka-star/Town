"""Convert the existing OFL-licensed font subset to outlines for extruded board text."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'src/assets/town-brush.woff2')
glyphs = font.getGlyphSet()

class ThreePen(BasePen):
    def __init__(self):
        super().__init__(glyphs)
        self.tokens = []
        self.start = None
    def out(self, op, *points):
        self.tokens.append(op)
        self.tokens.extend(str(round(v, 3)) for point in points for v in point)
    def _moveTo(self, p):
        self.start = p
        self.out('m', p)
    def _lineTo(self, p): self.out('l', p)
    def _qCurveToOne(self, p1, p2): self.out('q', p2, p1)
    def _curveToOne(self, p1, p2, p3): self.out('b', p3, p1, p2)
    def _closePath(self): self.out('l', self.start)
    def _endPath(self): pass

cmap = font.getBestCmap()
converted = {}
for char in '现实，搭进想象。':
    pen = ThreePen()
    glyph = glyphs[cmap[ord(char)]]
    glyph.draw(pen)
    converted[char] = {'ha': glyph.width, 'o': ' '.join(pen.tokens)}
data = {'glyphs': converted, 'familyName': 'Town Brush Outline Subset', 'resolution': font['head'].unitsPerEm,
        'boundingBox': {'yMin': font['head'].yMin, 'yMax': font['head'].yMax},
        'underlineThickness': 0, 'ascender': font['hhea'].ascent, 'descender': font['hhea'].descent,
        'original_font_information': {'copyright': '2018 The ZCOOL KuaiLe Project Authors', 'license': 'SIL Open Font License 1.1; see /licenses/'}}
(root / 'src/assets/board-typeface.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('Generated board outlines:', len(converted), 'glyphs')
