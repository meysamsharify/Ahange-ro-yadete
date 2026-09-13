# DESIGN.md — Night Radio

The design contract for **آهنگا رو یادته؟**. Read this before adding UI.

This replaces the Apple design system the project carried previously. Apple's language is
built on restraint — "UI recedes so the product can speak", no gradients, one accent, one
shadow. That is the right contract for a product catalogue and the wrong one for a music
game, where the whole point is the thrill of recognising a song you half-remember. One
contract at a time: nothing here should be blended back with the Apple tokens.

## Concept

A warm, nocturnal room with a glowing tube amplifier in it. Persian pop of the cassette
era — Ebi, Aryan — heard late at night. The canvas is a warm near-black, never grey and
never blue-purple. Light in this system is **emitted by the music**: the amber-to-rose
glow belongs to the waveform and the primary action, and it brightens when audio plays.

The interface is quiet until you press play, then it comes alive. That contrast is the
design.

**Key characteristics**
- Warm near-black canvas (`--void`), never a cool grey.
- One luminous gradient — amber → coral → rose — reserved for sound and the primary action.
- The waveform is a real-time spectrum analyser, not decoration. It is the hero.
- Ambient bloom behind the player reacts to live audio amplitude.
- Persian-first typography: IranSans, generous leading, no negative tracking.
- Motion is expressive but short; everything respects `prefers-reduced-motion`.

## Colour

```
--void        #08080A   page canvas, warm near-black
--surface     #121215   elevated panels, the player
--surface-2   #1B1B20   inputs, chips, pressed states
--hairline    rgba(255,255,255,.10)

--glow-1      #FFB13D   amber   — start of the sound gradient
--glow-2      #FF6B6B   coral   — middle
--glow-3      #E8457F   rose    — end

--ink         #F7F4F0   warm white, primary text
--ink-muted   #9A948C   secondary text
--ink-faint   #615C56   disabled, fine print

--mint        #4FE3A1   correct answer
--rose        #FF5E7A   lives, wrong answer
```

**Rules**
- The glow gradient is for the waveform, the primary CTA, and progress. Never for body text.
- `--mint` and `--rose` are state colours only — never decoration.
- No cool greys. Every neutral leans warm; that is what separates this from a default dark theme.
- Text never sits directly on the glow gradient at small sizes.

## Type

IranSans, self-hosted at `assets/fonts/`, weights 300 / 400 / 500 / 700.

| Token | Size | Weight | Leading | Use |
|---|---|---|---|---|
| `display-xl` | clamp(44px, 11vw, 72px) | 700 | 1.12 | Final score |
| `display` | clamp(28px, 7.2vw, 44px) | 700 | 1.35 | Round headline |
| `title` | clamp(20px, 4.6vw, 26px) | 500 | 1.6 | Revealed answer, dialog heads |
| `lead` | clamp(17px, 4vw, 20px) | 400 | 1.75 | Instructions |
| `body` | 17px | 400 | 1.85 | Paragraphs, lyrics |
| `caption` | 14px | 400 | 1.6 | Secondary, clock, fine print |
| `micro` | 12px | 500 | 1.4 | Labels, nav |

**Rules**
- **Never apply negative letter-spacing.** Persian is a connected script; tightening breaks
  the visual joins. This is the single most important typographic rule here, and it is the
  opposite of what the previous Apple contract asked for.
- Body leading is 1.85 and never below 1.7. Persian needs the air.
- Persian digits (`۰۱۲۳`) throughout, via the `fa()` helper in `app.js`.
- Weight 700 is the only headline weight; 500 for emphasis; 400 for body; 300 for large numerals.

## Space, shape, depth

Spacing: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 px. Radii: 12 (chips) · 18 (cards) · 28
(panels) · 999 (pills and the primary action).

Depth is **warm light, not black shadow**:
- `--lift` `0 18px 50px -14px rgba(0,0,0,.75)` — panels off the canvas.
- `--bloom` `0 0 60px -10px rgba(255,177,61,.45)` — only things that emit sound.

No inner strokes on panels except a single `--hairline` top edge where a surface needs
definition against the canvas.

## Motion

```
--fast  160ms    press, hover, colour
--base  280ms    entrances, state changes
--slow  520ms    round transitions, reveals
--ease  cubic-bezier(.16, 1, .3, 1)
```

- Buttons press to `scale(.96)` and lose their bloom for the duration.
- A new round enters with a short rise-and-fade; the reveal scales up from `.96`.
- The score counts up rather than jumping.
- The ambient bloom tracks live audio amplitude through the `--energy` custom property
  (0 → 1), set from the analyser each frame.
- **Every animation above must be disabled under `prefers-reduced-motion: reduce`.** The
  waveform falls back to its static silhouette and the score sets directly.

## The waveform

The signature component. `app.js` routes the `<audio>` element through a Web Audio
`AnalyserNode` and drives each bar's `scaleY` from live frequency data.

- **Idle**: bars rest at the clip's stored peak silhouette (`puzzles.json`).
- **Playing**: bars track live spectrum, smoothed toward the target each frame.
- **Heard vs unheard**: bars behind the playhead take the glow gradient; ahead of it they
  stay `--ink-faint`. Progress is read through colour, level through height.
- **Failure is silent**: if `AudioContext` is unavailable or blocked, the bars keep the
  static silhouette and the heard/unheard colouring. Playback must never depend on it.

Bars animate with `transform`, never `height`, so the loop never triggers layout.

## Don't

- Don't add a second gradient or a third accent hue.
- Don't use cool grey, pure black `#000`, or pure white `#fff`.
- Don't apply negative letter-spacing to Persian text, anywhere, at any size.
- Don't put a glow on something that does not make or represent sound.
- Don't animate `height`, `top`, or `width` in a per-frame loop.
- Don't ship an animation without a reduced-motion fallback.

## Fonts and licensing

IranSans (IRANSansWeb) is a commercial release by Fontiran, vendored here at the repo
owner's direction from the public `iransans` npm package. It is **not** open-licensed like
Vazirmatn. If this project is ever redistributed or handed to another owner, confirm the
licence covers that use, or swap `assets/fonts/` for Vazirmatn (SIL OFL) — the type scale
above needs no other change.
