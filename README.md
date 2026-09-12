# آهنگا رو یادته؟

A Persian music guessing game with 16 rounds, typed answers, hints, scoring, saved progress, and 32 bundled audio clips.

## Working version

The 41 game files were imported byte-for-byte from the user-confirmed working archive `Ahanga-PWA-Deploy (1).zip`. The startup correction uses `puzzles.length`, not `puzzles.length()`. No game or audio files were changed during that import.

## Design

The presentation layer follows the Apple design system recorded in [DESIGN.md](DESIGN.md): a white and parchment canvas, near-black full-bleed tiles, a single Action Blue (`#0066cc`) for every interactive element, the SF Pro type ladder, pill CTAs, and exactly one drop-shadow — reserved for the waveform, which is this app's "product render".

Read `DESIGN.md` before adding UI. Two substitutions are documented at the top of `style.css`: SF Pro is proprietary, so the font stack leads with `-apple-system` and falls back to Segoe UI / Vazirmatn / Tahoma off Apple platforms; and Persian body copy runs above Apple's 1.47 line-height because connected Perso-Arabic script needs the extra leading.

The redesign changed `style.css`, `index.html`, the markup templates in `app.js`, and the colours in `manifest.webmanifest`. Game logic (`game.js`), the puzzle set (`puzzles.json`), and all 32 audio clips are untouched. The service-worker cache was bumped to `ahanga-offline-v2` so existing installs pick the new shell up instead of serving the old one forever.

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

The redesign was driven in a browser on localhost: a round was played end to end (clip playback, correct answer, score, reveal, advance), and the hint, finale, and both dialogs were checked at 320px, 375px, and desktop widths with no console errors and no horizontal overflow. It has not been tested on a real phone.
Ready to play.
