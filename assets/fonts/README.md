# Self-hosted fonts

These are shipped with the site so every visitor renders the same faces. The
site originally used a system font stack led by Avenir Next, which is installed
on macOS but not on Windows, so Windows silently fell back to different
typefaces.

| File | Family | Weight | Used for |
|---|---|---|---|
| `pally-400.woff2` | Pally | 400 | Display, reserve weight |
| `pally-500.woff2` | Pally | 500 | Brand lockup subtitle |
| `pally-700.woff2` | Pally | 700 | Headings, card titles, pull quote |
| `switzer-400.woff2` | Switzer | 400 | Body text |
| `switzer-500.woff2` | Switzer | 500 | Body emphasis |
| `jetbrainsmono-var.woff2` | JetBrains Mono | 100–800 variable | Labels, nav, buttons, data |

**Pally ships only at 400, 500 and 700.** Nothing in the CSS may ask for 600 or
800 — the browser would fake the weight by smearing the outlines. `--display-bold`
in `styles.css` exists so heading weight is set in one place. Pally is also normal
width, not condensed like the face it replaced, so display type runs roughly 7%
wider. The existing clamp() sizes absorb that; new headline copy should be
checked at a 390px viewport before shipping.

Only JetBrains Mono declares a `unicode-range`, because it is the Latin subset
from Google Fonts. The Fontshare files are not subset, so constraining them
would make characters outside the range fall back to another font.

`plan-b/fonts/` carries its own copy of `jetbrainsmono-var.woff2` so that page
resolves its fonts relative to itself.

## Licence

- **Pally** and **Switzer** — Indian Type Foundry, via [Fontshare](https://www.fontshare.com).
  Free for personal and commercial use, including self-hosting on a website.
- **JetBrains Mono** — SIL Open Font License 1.1. Copyright The JetBrains Mono
  Project Authors (<https://github.com/JetBrains/JetBrainsMono>). Full text:
  <https://openfontlicense.org/open-font-license-official-text/>

To refresh the Fontshare files, request the family from
`https://api.fontshare.com/v2/css?f[]=<slug>@<weights>` with a modern browser
User-Agent and download the `woff2` from each `@font-face` block. Request one
family per call — asking for several at once silently drops most of them.
