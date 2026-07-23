# Hyperframes Composition Brief: StyleSync AI

## Objective
Create a short launch-style brag video for StyleSync AI.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape - 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: D:\Padhai\Style-Sync-AI
- Primary files read: frontend/app/page.tsx, frontend/components/landing/landing-page.tsx, frontend/app/globals.css, frontend/app/layout.tsx, frontend/app/editor/page.tsx, frontend/components/recommendation/todays-recommendations.tsx, README.md, PRODUCT.md
- Product name: StyleSync AI
- Tagline / strongest claim: "The average wardrobe holds 77 items. Most people wear 20% of them."
- Key UI or visual moment to recreate: the landing hero's clip-and-reveal headline ("Your wardrobe, intelligently curated.") with corner index marks (SS.AI / 001) and thin editorial rules, plus the real "Today's Recommendation" dashboard card (weather icon, match-score badge, outfit collage)
- Copy that must appear verbatim:
  - "Your wardrobe, intelligently curated."
  - "The average wardrobe holds 77 items. Most people wear 20% of them."
  - "Dress with intention."
  - "Create Your Wardrobe"

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium editorial film. Precise, unhurried, magazine-confident. No hype language, no metric-grid flex.
- Interpretation: fewer scenes, longer holds, soft crossfades instead of hard cuts. Type does the work; motion stays restrained and deliberate.
- Angle: StyleSync's own brand voice is "measured, deliberate, editorial" and explicitly rejects big-metric-grid SaaS energy. The video plays like an editorial fashion-magazine spread that happens to be a software product: serif type, sand/sage/dark palette, a slow confident reveal, and one real, quietly damning stat carrying the argument, proven by a garment actually getting classified and a real outfit card landing with a match score.
- Hook: the site's own hero headline reveal, "Your wardrobe," then italic sage "intelligently," then "curated.", with corner marks SS.AI / 001 and the thin rule.
- Outro / punchline: "Dress with intention." on dark background, sage italic word, then the "Create Your Wardrobe" CTA and the StyleSync AI serif wordmark as the final hold.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #faf6f0 (sand) for light scenes; #121210 (dark charcoal) for the claim and outro scenes
- Text: #1c1917 on light scenes; #fcfbf9 (cream) on dark scenes
- Accent: #708272 (sage), used italic for emphasis words throughout
- Display font: Cormorant Garamond (serif, weight 300-400, italic for accent words) — fall back to Georgia/serif if unavailable in the render environment
- Body font: Geist Sans (uppercase, wide letter-spacing, small size for eyebrows/labels/CTAs) — fall back to system-ui/sans-serif
- Visual references from the project: hero corner index marks (SS.AI / 001), thin horizontal/vertical editorial rules, clip-and-reveal headline lines, the stats-band quote treatment on dark background, the final CTA section's dark background with cream headline and sage italic word

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook - Headline — 3.5s — hero headline clip-reveal ("Your wardrobe," / "intelligently" / "curated."), corner marks, thin rule, eyebrow line
2. The claim — 3.5s — full-bleed dark-background quote: "The average wardrobe holds 77 items." then "Most people wear 20% of them." in sage italic
3. The product, in use — 8s — garment card with tag pills ("Wool", "Sage", "Tailored") landing one by one, then crossfade to the real "Today's Recommendation" dashboard card: weather icon, match-score badge (e.g. "94% Match"), outfit collage settling into place
4. Outro — 5s — dark background, "Dress with" / italic sage "intention.", then cream "Create Your Wardrobe" CTA pill, then the StyleSync AI serif wordmark as the final frame

## Audio
- Audio role: warm, restrained bed with sparse professional accents
- Audio arc: steady low-volume bed under the whole video, gentle presence swell as the recommendation card resolves in scene 3, gentle swell into the outro headline, fade out over the final second under the wordmark hold
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3 (109.96 BPM, steady/clean, matches polished tone)
- Music treatment: fade in under scene 1 at volume 0.3, hold steady through scenes 2-3, gentle swell under scene 4's headline, fade to silence over the last ~1s as the wordmark holds
- Music cue guidance: bundled preset at assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json. Strong cues within the 0-20s window: 8.74s (0.99), 13.11s (0.98), 17.47s (0.99), 18.56s (0.99). Bias the tag-pill sequence start toward 8.74s and the outro card entrance toward 17.47-18.56s; treat as bias only, never override readability or the planned scene holds.
- Audio-reactive treatment: subtle — the hero's sage glow and the recommendation card's presence may breathe slightly with music RMS/bass. No waveform, equalizer, or particle visuals.
- Audio-coupled moments:
  - Scene 1 headline reveal — no SFX, let the type carry it, music fades in underneath
  - Scene 3 tag pills — soft drop sound on the first pill only, thin out for the rest
  - Scene 3 match-score badge landing — one gentle bell/bong accent
  - Scene 4 CTA pill appearing — one soft accent, nothing on the final wordmark hold
- SFX selection guidance: 2-3 total cues, minimal but present, nothing aggressive. Prefer `interface/drop_001` or `interface/drop_002` for the tag-pill pop, `interface/bong_001` or `impact/impactSoft_medium_*` for the match-score/CTA accents. Match the gesture (a pill landing, a card resolving) rather than decorating text reads.
- SFX analysis guidance: read `sfx-analysis.md` beside the SFX library (assets/sfx/sfx-analysis.md) and prefer low/medium high-frequency-risk files since this is a polished, repeated-moment tone.
- Exact SFX choice: Hyperframes should choose exact filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music (and any Hyperframes-selected SFX) into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). `/brag` is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo/launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the dashboard recommendation card and the hero headline both qualify).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (target 20s).
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose exact SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints; ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use 1-3 strong cue locks total.
- Use SFX to support motion and interaction: card/drop sounds for the tag pills and card reveals, a short announcement cue for the match-score payoff, restraint everywhere else.
- Honor the planned music fade-in/fade-out and the swell into the outro.
- When music is present, use the Hyperframes audio-reactive workflow for subtle glow/presence breathing per the guidance above.
- Use local assets for audio and any required runtime/media dependencies.
- Run `hyperframes check` before render — it is brag's single gate.
