# Hero video spec — oratio.co

The homepage hero expects a short, cinematic loop. Drop your generated files into this `/public/` folder with these exact names:

- `hero.mp4` — H.264, main fallback (widest browser support)
- `hero.webm` — VP9/AV1, better compression (served first when supported)
- `hero-poster.jpg` — the static first frame (used for `prefers-reduced-motion`, slow networks, and as the image fallback)

If any of the three are missing the site still looks intentional — there's a deep-ink radial-gradient fallback already in the CSS.

## Content direction

**Vibe:** quiet, atmospheric, not literal. The video is the *mood* of the work, not an illustration of it.

Avoid:
- Church buildings, crosses, hands-in-prayer (too literal, and we're consciously moving away from the old church-SVG era)
- Stock-imagery clichés (lightbulbs for ideas, handshakes for partnership, gears for process)
- Fast cuts, text overlays, anything that competes with the typography

Lean toward one of these:
- **Abstract material motion** — paper folding, ink diffusing in water, fabric moving in slow motion, light through rippled glass
- **Architectural light** — soft light shifting across a surface (wall, floor, textured stone or wood), no recognizable space
- **Cinematic drawing** — top-down, macro, slow: pencil on paper, hand sketching, pages turning. Keep hands out of frame or only glimpsed
- **Tonal gradients in motion** — slow-shifting color fields (warm to cool), organic, hand-painted feel — not digital noise

## Technical

- **Aspect ratio:** 16:9 or wider (21:9 can work for cinematic feel)
- **Resolution:** 1920×1080 minimum; 2560×1440 ideal
- **Duration:** 8–15 seconds, **seamlessly loopable** (first and last frame identical / feather-blendable)
- **Framerate:** 24 or 30 fps
- **Color palette:** muted, tonal. Keep a hint of the brand gradient (soft blues, warm golds) but much more desaturated than the old hero
- **Brightness:** midtones-heavy. The overlay gradient darkens the video further so don't start too dark
- **Motion:** slow, contemplative — nothing rapid or attention-grabbing
- **File sizes (targets):**
  - `hero.mp4` under 3 MB
  - `hero.webm` under 2 MB
  - `hero-poster.jpg` under 200 KB (progressive JPEG, quality ~80)

## Compression command reference

Once you have a source master (e.g. `source.mov`):

```bash
# MP4 / H.264
ffmpeg -i source.mov -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-2" -movflags +faststart -an hero.mp4

# WebM / VP9
ffmpeg -i source.mov -c:v libvpx-vp9 -crf 35 -b:v 0 -vf "scale=1920:-2" -an hero.webm

# Poster frame (first frame as JPEG)
ffmpeg -i source.mov -vframes 1 -vf "scale=1920:-2" -q:v 4 hero-poster.jpg
```

The `-an` strips audio (we autoplay muted anyway — no audio, smaller file).

## How it's used

```html
<video autoplay muted loop playsinline preload="metadata" poster="/hero-poster.jpg">
  <source src="/hero.webm" type="video/webm" />
  <source src="/hero.mp4" type="video/mp4" />
</video>
```

Users with `prefers-reduced-motion: reduce` see the poster instead — the video is hidden.
