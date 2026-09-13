# آهنگا رو یادته؟

A Persian music guessing game with 16 rounds, typed answers, hints, scoring, saved progress, and 32 bundled audio clips.

## Working version

The 41 game files were imported byte-for-byte from the user-confirmed working archive `Ahanga-PWA-Deploy (1).zip`. The startup correction uses `puzzles.length`, not `puzzles.length()`. No game or audio files were changed during that import.

## Design

The interface follows **Night Radio**, the design contract in [DESIGN.md](DESIGN.md): a warm
near-black canvas, one luminous amber-to-rose gradient reserved for sound and the primary
action, and an ambient bloom that brightens with the music. Type is IranSans throughout.

This replaced an Apple-derived design system that shipped earlier. Apple's language is built
on restraint — "UI recedes so the product can speak", no gradients, one accent. That suits a
product catalogue and not a music game, so it was swapped out wholesale rather than blended.
Read `DESIGN.md` before adding UI, and don't mix the two vocabularies.

**The waveform is a real spectrum analyser.** `app.js` routes the `<audio>` element through a
Web Audio `AnalyserNode` and drives each bar from live frequency data. Two things about it are
measured rather than guessed, and both are easy to get wrong if you touch it:

- These clips are lowpassed around 8 kHz — only the lowest ~third of the FFT range carries any
  energy (measured at bin 43 of 128). Spreading bars across the full spectrum leaves half the
  row permanently dead, which is exactly what the first implementation did.
- A raw spectrum of this material is nearly flat, so a gamma curve expands the contrast. Without
  it the bars barely move.

If Web Audio is unavailable or blocked, the bars fall back to the static silhouette stored in
`puzzles.json` and playback is unaffected — the analyser must never cost us the audio.

## Fonts

IranSans (IRANSansWeb, weights 300/400/500/700) is vendored in `assets/fonts/` and cached for
offline play. It is a **commercial Fontiran release, not open-licensed** like Vazirmatn, and was
bundled at the repo owner's direction. If this project changes hands or is redistributed, confirm
the licence covers that use or swap in Vazirmatn (SIL OFL) — no other change to the type scale is
needed. `DESIGN.md` records the same caveat.

## Download and play on Windows

Choose **Code → Download ZIP**, extract the ZIP, and open a terminal in the folder containing `index.html`.

With Python installed, run:

```bat
py -m http.server 8002 --bind 127.0.0.1
```

Open http://localhost:8002 and press the play button. Keep the terminal open. Do not launch by double-clicking index.html.

## Publish a link for friends with GitHub Pages

GitHub Free requires a public repository for Pages. If needed, change repository visibility under Settings → General → Danger Zone → Change repository visibility. Making the repository public exposes the source, answers, and bundled audio.

Then open **Settings → Pages** and select **Deploy from a branch**, branch **main**, folder **/(root)**, and click **Save**. Wait for GitHub to report that the site is deployed.

The expected address after deployment is:
https://meysamsharify.github.io/Ahange-ro-yadete/

This address is not a claim that Pages has already been enabled or verified. Open the published site, test playback, then share it. For offline play, first wait for the game to finish caching its assets.

Reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Verification

The source ZIP passed its integrity check. Imported Git blobs are checked against the source bytes. The user confirmed the game works on localhost; phone playback and GitHub Pages deployment have not been tested in this import.

The Night Radio redesign was driven in a browser on localhost. Verified: IranSans loads and
applies; the analyser receives real audio and, after tuning, drives all 40 bars with 0% dead and
~1% clipping (down from 50% dead on the first attempt); every text colour clears WCAG AA on all
three surfaces; no touch target is under 44px; no horizontal overflow at 375px or desktop; the
round, hint, lost-round and finale states all render correctly; all 45 assets cache for offline
play including the four fonts.

**Two caveats.** The `requestAnimationFrame` animations — the reacting waveform, the ambient
bloom, the score count-up — could not be observed running in the automated browser, because its
preview pane does not paint and so never fires rAF. The analyser input and the frequency-to-bar
mapping were verified numerically against live audio instead, and the score count-up was made
fail-safe after that limitation exposed a real bug (the final score rendered as ۰ and depended on
rAF to correct itself). The motion itself still wants a look on real hardware. And none of this
has been tested on a phone.
Ready to play.
