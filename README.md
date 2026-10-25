# ALISHER — Kinetic Monochrome / 11

A standalone, static, black-and-ivory portfolio for Alisher Ozodov.

## Launch and deploy

Open `index.html` directly in a browser, or upload the directory to any static hosting provider (Vercel, Netlify, GitHub Pages). No Node.js, npm, CDN, or build step is required. All website files are local.

For a one-file deployment, use `standalone.html` instead (the stylesheet and JavaScript are embedded).

## Motion design

- 820 ms opening black-to-ivory wipe, pointer-events disabled; nothing can get trapped underneath it.
- Two editorial hero lines reveal through clipped masks, with weighted 620 ms easing.
- On-scroll headings unroll in 480 ms; cards enter with short, staggered, transform-based transitions.
- Two mathematically seamless monochrome text ribbons.
- A native-scroll black/white split scene with a single bounded typographic offset and progress index.
- Hard-cut 120 ms hover inversions, a mechanical three-state ticker, and native project dialogs.
- Optional inverted cursor only for fine-pointer desktop use. It does not capture events, and its animation loop stops when settled.
- Reduced motion and a Motion ON/OFF control, without affecting JavaScript click handlers.

This deliberately **does not** include a global smooth-scroll hijacker, mandatory GSAP dependency, pinned horizontal gallery, or scroll snapping across the entire site. Those patterns caused accessibility and interaction regressions in previous versions.

## Files

`index.html` — markup and Alisher's actual supplied content.
`styles.css` — base responsive styles.
`motion.css` — kinetic animation and split-scene styles.
`script.js` — menu, progress, observer, project dialogs, tabs, terminal, cursor, motion controls.
`standalone.html` — all-in-one build.
`assets/favicon.svg` — favicon.
`previews/` — screenshots.

## Editing

Change the main navigation links inside `#desktopNav`; the mobile menu is generated from these links at startup and automatically adjusts to removed entries. Navigation width is intrinsic.

Seven project details live in the `projects` object in `script.js`. Project cards live in `#projectGrid` in the HTML. Schools and achievements are in their own HTML sections. Social accounts remain non-clickable labels because destination URLs have not been provided—replace them with real `<a href="...">` links before publishing.

## Quality checks

Chromium checks completed on 320×640, 390×844, 768×1024, 844×390, 1440×900, and 2560×1080. They included horizontal overflow and JavaScript error checks. All seven project buttons, terminal modal and command submission, inquiry tabs, mobile navigation, and native modal closing passed at 320–1440 widths. A separate 2560 px and reduced-motion browser check also passed. Removing two desktop navigation links reduced the navbar width by approximately 150 pixels. Results are test-environment observations, not guarantees about all devices or frame rates.
