# Orange Aquaculture — Storefront Concepts

Two frontend-only storefront concepts for **Orange Aquaculture**, a marine hatchery in
Chennai, India that breeds clownfish and grows live feed cultures (phytoplankton, copepods,
rotifers). Orders currently happen over Instagram DM
([@orangeaquaculture](https://www.instagram.com/orangeaquaculture)) — both concepts funnel
every call-to-action there. No backend, no build step, no dependencies: open `index.html`
and it works.

| Concept | Live URL | Folder |
|---|---|---|
| Plan A — The Dive | https://bk-roopac.github.io/orange-aquaculture/ | `/` |
| Plan B — The Hatchery Journal | https://bk-roopac.github.io/orange-aquaculture/plan-b/ | `/plan-b/` |

---

## Plan A — "The Dive" 🌊

**Narrative:** the visitor is a diver. The page is a descent from the sunlit surface to a
40-metre abyss, and the shop unfolds on the way down. Dark, cinematic, single committed
dark theme.

### Features

- **Dive-torch cursor** — a soft warm-cyan light follows the pointer with watery lag
  (lerped position, `mix-blend-mode: screen` radial gradients).
- **Living plankton field** — a full-page `<canvas>` of drifting motes that brighten inside
  the torch beam and perform real copepod escape-jumps (velocity impulse away from the
  cursor) when it gets too close.
- **Procedural clownfish** — three canvas-drawn fish (bezier bodies, clipped white bands,
  animated tail/fin wag) swim in the hero, gently curious about the light but keeping their
  distance. They fade out as you dive past the surface.
- **Click = bubbles** — pointer-down releases a wobbling breath of bubbles that rises and pops.
- **Depth-reactive water** — scroll progress interpolates the fixed background gradient
  through four colour stops (sunlit teal → near-black), so the page literally darkens with depth.
- **Depth gauge rail** — fixed monospace gauge on the right maps scroll to metres
  (0 m surface → −40 m hatchery), with section zones tagged by depth (−6 m live feeds,
  −14 m clownfish, −26 m why-live, −40 m visit).
- **Water-refraction hover** — product cards run an animated SVG `feTurbulence` +
  `feDisplacementMap` filter on their artwork, plus 3D tilt and rising CSS bubbles;
  culture bottles "swirl" like they've just been shaken.
- **Hidden torch text** — one line in the hero is masked by a radial gradient positioned at
  the cursor: readable only under your light.
- **Caustics & sun shafts** — layered animated gradients in the hero fake sunlight through water.
- Scroll-triggered reveals (blur-to-sharp), `prefers-reduced-motion` fallbacks throughout,
  responsive down to small phones.

### Files

```
index.html   markup, inline SVG defs (water filter, clownfish illustrations)
styles.css   design tokens, layout, hover/animation systems
app.js       canvas world (motes/fish/bubbles), torch, depth gauge, reveals
assets/      brand logo
```

---

## Plan B — "The Hatchery Journal" 🔬

**Narrative:** a diary of raising one clownfish batch, day-stamped from Day 0 to Day 30+.
Light, editorial, warm — the products appear at the exact life stage they feed. Rotifers
show up on hatch night, phytoplankton in the greenwater chapter, copepods when the story
reaches *your* tank.

### Features

- **Loupe cursor** — over any "specimen panel" the cursor becomes a magnifying glass
  (canvas-rendered lens: clipped magnified projection `p' = lens + (p − lens) × k`, glass
  shading, specular rim). When nobody is hovering, the loupe drifts on its own so
  touch/mobile visitors still see the magic.
- **Specimen 01, egg clutch** — rows of swaying capsule eggs; under the loupe each egg
  reveals silver embryo eyes and a curled body.
- **Specimen 02, hatch night** — a dark tank panel where eyelash-sized larvae swim *toward*
  your cursor light (real clownfish phototaxis — the inverse of Plan A's fleeing plankton),
  with rotifer specks drifting in the beam.
- **Specimen 03, greenwater** — hundreds of drifting green specks resolve under the loupe
  into individual Nannochloropsis cells with walls and chloroplasts.
- **Specimen 04, refugium** — copepod dashes become full pods under glass: teardrop bodies,
  fork tails, twitching antennae, characteristic hop.
- **Metamorphosis strip** — three SVG stages (silver sliver → bands inking in → three clean
  bands); hovering fades the white bands in, like watching the stripes arrive.
- **Day-counter rail** — fixed left rail maps scroll to Day 0 → 34 (Plan B's answer to
  Plan A's depth gauge).
- **Real typography** — self-hosted variable fonts, latin subsets, zero external requests:
  - **Fraunces** (display; optical sizing + `WONK` axis on for a hand-set feel)
  - **Newsreader** (body; designed for journal text)
  - system monospace for day tags and lab labels
- Scroll reveals, `prefers-reduced-motion` static fallbacks, responsive.

### Files

```
plan-b/index.html   chapters Day 0 → Day 30+, inline SVG fish stages
plan-b/styles.css   light editorial token system
plan-b/app.js       loupe engine, four specimen simulations, day rail
plan-b/fonts.css    @font-face for self-hosted fonts
plan-b/fonts/       Fraunces + Newsreader woff2 (latin subsets, ~430 KB total)
```

---

## Deployment

Hosted on **GitHub Pages** from the `main` branch root — every push redeploys
automatically in under a minute:

```bash
git add -A && git commit -m "…" && git push
```

Works identically on Netlify (drag-and-drop the folder at app.netlify.com/drop) or Vercel
(`vercel --prod`) since there is no build step.

---

## Recommended stack (when this grows up)

The current zero-dependency setup is deliberate: perfect for deciding between concepts and
cheap to host anywhere. When the winning concept becomes the real store:

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Astro** | Static-first (keeps the GitHub Pages/Netlify simplicity and the speed), components for the repeated cards/chapters, and interactive "islands" only where the canvas work lives. Next.js is the alternative if a server/API layer is coming soon. |
| Styling | Keep hand-written CSS with design tokens (or port tokens to Tailwind if the team prefers utilities) | Both concepts already run on small token systems; don't add a framework for its own sake. |
| Content/stock | A `stock.json` in the repo first; **Decap CMS** or **Sanity** later | Lets non-developers update "current batch" availability without touching code. |
| Ordering | Instagram DM (today) → **WhatsApp Business deep links** (`wa.me/<number>?text=…` prefilled per product) → **Razorpay** payment links/checkout when ready | Matches how Indian aquarium hobbyists actually buy; Razorpay is already proven in the ROOPAC stack. |
| Images | Real hatchery photos via **Cloudinary** (or Astro's built-in image optimization) | The illustrated placeholders should give way to actual clutch/culture photos — they're the strongest asset the brand has. |
| Analytics | **Plausible** or GA4 | Measure which concept/page converts to DMs. |
| Domain | `orangeaquaculture.in` via any registrar, CNAME to GitHub Pages/Netlify | One DNS record + one repo setting. |
| SEO/social | Per-page meta + Open Graph images, `sitemap.xml` | DM-driven sales still start with a Google/Instagram search. |

### Roadmap ideas

1. Swap illustrated specimens for real photos and short video loops (clutch, greenwater, pods).
2. "Current batch" stock board fed by `stock.json`.
3. WhatsApp ordering buttons alongside Instagram DM.
4. Custom domain + OG cards.
5. Razorpay checkout for cultures (fixed-price, courier-friendly) while fish stay DM-first.

---

*Built with Claude Code. Both concepts are pure HTML/CSS/JS — view source is the documentation.*
