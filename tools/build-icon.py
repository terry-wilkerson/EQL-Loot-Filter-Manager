"""Clean the generated mark into an on-palette EQL Loot app icon.

Takes the raw Gemini output in src/assets/, removes the AI watermark, remaps the
three colour families onto DESIGN.md tokens, recentres and scales the mark to a
standard icon fill, and writes both an opaque source (for `npx tauri icon`) and
a transparent variant (for the in-app tile and README).
"""
from PIL import Image
import numpy as np

SRC = 'src/assets/a4-quill-icon-v1.png'
FILL = 0.80          # fraction of the canvas the mark should occupy
WATERMARK = (1740, 1740, 1875, 1875)

# Colour families as generated
SRC_BG    = np.array([20, 25, 44],  np.float32)
SRC_PAPER = np.array([244,245,250], np.float32)
SRC_INK   = np.array([82, 80, 217], np.float32)

# DESIGN.md tokens
INK_SLATE     = np.array([0x0f,0x17,0x2a], np.float32)
VELLUM_INDIGO = np.array([0x1e,0x1b,0x4b], np.float32)
SLATE_PAPER   = np.array([0xf8,0xfa,0xfc], np.float32)
INDIGO_HI     = np.array([0x63,0x66,0xf1], np.float32)
INDIGO_LO     = np.array([0x4f,0x46,0xe5], np.float32)

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape
x0,y0,x1,y1 = WATERMARK
a[y0:y1, x0:x1] = SRC_BG

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
g = np.clip(((xx/W) + (yy/H)) / 2, 0, 1)[..., None]          # 135deg ramp
new_ink = INDIGO_HI*(1-g) + INDIGO_LO*g

d = np.stack([np.linalg.norm(a-c, axis=-1) for c in (SRC_BG, SRC_PAPER, SRC_INK)], -1)
order = np.argsort(d, -1)
i0, i1 = order[...,0], order[...,1]
d0 = np.take_along_axis(d, i0[...,None], -1)[...,0]
d1 = np.take_along_axis(d, i1[...,None], -1)[...,0]
t = np.where(d0+d1 > 1e-6, d0/(d0+d1), 0.0)[..., None]

targets = [np.zeros_like(a), np.broadcast_to(SLATE_PAPER, a.shape), new_ink]
def pick(idx):
    out = np.zeros_like(a)
    for k in range(3):
        m = idx == k
        out[m] = targets[k][m]
    return out
rgb = pick(i0)*(1-t) + pick(i1)*t
alpha = np.where(i0 == 0, t[...,0], np.where(i1 == 0, 1-t[...,0], 1.0))
alpha = np.clip(alpha, 0, 1)

mark = Image.fromarray(np.dstack([np.clip(rgb,0,255).astype(np.uint8),
                                  (alpha*255).astype(np.uint8)]), 'RGBA')
mark = mark.crop(mark.getbbox())
mw, mh = mark.size
scale = (W*FILL) / max(mw, mh)
mark = mark.resize((max(1,round(mw*scale)), max(1,round(mh*scale))), Image.LANCZOS)
mw, mh = mark.size
print('mark {}x{} -> {:.0f}% of canvas'.format(mw, mh, 100*max(mw,mh)/W))

# Transparent variant
tr = Image.new('RGBA', (W, H), (0,0,0,0))
tr.paste(mark, ((W-mw)//2, (H-mh)//2), mark)
tr.save('icon-transparent-2048.png')

# Opaque variant: the mark over the app's own dark ground
r = np.clip(np.sqrt(((xx-W/2)/(W/2))**2 + ((yy-H/2)/(H/2))**2)/1.414*1.15, 0, 1)[..., None]
bg = Image.fromarray(np.clip(VELLUM_INDIGO*(1-r) + INK_SLATE*r, 0, 255).astype(np.uint8))
op = bg.convert('RGBA'); op.alpha_composite(tr)
op.convert('RGB').save('icon-source-2048.png')

# Legibility strip, dark ground and light ground
for name, ground in (('icon-sizes-dark.png', (15,23,42)), ('icon-sizes-light.png', (224,231,255))):
    sizes = (16,32,48,64,128)
    strip = Image.new('RGB', (sum(sizes)+16*(len(sizes)+1), 160), ground)
    x = 16
    for s in sizes:
        strip.paste(op.convert('RGB').resize((s,s), Image.LANCZOS), (x, (160-s)//2)); x += s+16
    strip.save(name)
print('written icon-source-2048.png, icon-transparent-2048.png, size strips')
