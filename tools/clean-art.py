"""Remove the generator watermark from the quartermaster illustration and emit
web-sized copies. The raw 7.4MB PNG is far too heavy to ship in a bundle that
already carries a 13k-item catalog and 379 icon sheets."""
from PIL import Image
import numpy as np, os

SRC = 'src/assets/b1-quartermaster-v2.png'
im = Image.open(SRC).convert('RGB')
W, H = im.size

# Measured bbox of the sparkle, plus margin.
X0, Y0, X1, Y1 = 2465, 1252, 2556, 1339
PAD = 22
box = (X0-PAD, Y0-PAD, X1+PAD, Y1+PAD)
bw, bh = box[2]-box[0], box[3]-box[1]

# Clone from clean neighbouring ground rather than blurring the watermark
# itself — a blur just smears a bright mark into a glowing smudge.
a = np.asarray(im).astype(np.float32)
best, best_off = None, None
for dx, dy in [(-150,0), (-220,0), (0,-170), (-150,-120), (-260,-60), (150,-140)]:
    sx0, sy0 = box[0]+dx, box[1]+dy
    if sx0 < 0 or sy0 < 0 or sx0+bw > W or sy0+bh > H: continue
    patch = a[sy0:sy0+bh, sx0:sx0+bw]
    if patch.mean(-1).max() > 90:      # contains another bright feature; skip
        continue
    dst_ring = a[box[1]:box[3], box[0]:box[2]].mean(-1)
    score = abs(patch.mean() - np.median(dst_ring))
    if best is None or score < best:
        best, best_off = score, (dx, dy)
print('clone offset', best_off)
dx, dy = best_off
src = im.crop((box[0]+dx, box[1]+dy, box[2]+dx, box[3]+dy))

yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
r = np.sqrt(((xx-bw/2)/(bw/2))**2 + ((yy-bh/2)/(bh/2))**2)
mask = np.clip((1.12 - r) / 0.5, 0, 1) * 255
im.paste(src, (box[0], box[1]), Image.fromarray(mask.astype(np.uint8)))

chk = np.asarray(im.crop((X0-40, Y0-40, X1+40, Y1+40)).convert('L'))
print('post-patch max luminance in region:', chk.max(), '(background median ~17)')

im.save('src/assets/b1-quartermaster-v2-clean.png')
for width, name in ((1920, 'quartermaster-1920.webp'), (1280, 'quartermaster-1280.webp')):
    out = im.resize((width, round(H*width/W)), Image.LANCZOS)
    out.save(name, format='WEBP', quality=82, method=6)
    print('{}  {}x{}  {:.0f} KB'.format(name, out.width, out.height, os.path.getsize(name)/1024))
