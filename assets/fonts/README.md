# Self-hosted fonts

These are shipped with the site so every visitor renders the same faces. The
site previously used a system font stack led by Avenir Next, which is installed
on macOS but not on Windows, so Windows silently fell back to different
typefaces.

All three are variable fonts — one file covers the whole weight range — and are
subset to Latin (`U+0000-00FF` plus common punctuation).

| File | Family | Axes | Used for |
|---|---|---|---|
| `archivo-var.woff2` | Archivo | `wght` 100–900, `wdth` 62–125 | Display / headings, at `font-stretch: 75%` |
| `nunitosans-var.woff2` | Nunito Sans | `wght` 200–1000 | Body text |
| `jetbrainsmono-var.woff2` | JetBrains Mono | `wght` 100–800 | Labels, nav, buttons, data |

`plan-b/fonts/` carries its own copy of `jetbrainsmono-var.woff2` so that page
resolves its fonts relative to itself.

## Licence

All three are licensed under the SIL Open Font License 1.1, which permits
bundling and redistribution with a website, including commercially. Full text:
<https://openfontlicense.org/open-font-license-official-text/>

- Archivo — Copyright The Archivo Project Authors (<https://github.com/Omnibus-Type/Archivo>)
- Nunito Sans — Copyright The Nunito Sans Project Authors (<https://github.com/googlefonts/NunitoSans>)
- JetBrains Mono — Copyright The JetBrains Mono Project Authors (<https://github.com/JetBrains/JetBrainsMono>)

Files were retrieved from the Google Fonts CSS API; to refresh them, request the
family with a modern browser User-Agent and download the `latin` subset `woff2`.
