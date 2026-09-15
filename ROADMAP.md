# ROADMAP — catalogue and localisation

How the game gets from 16 Persian songs to a large catalogue in several languages. A designed
version of this document is published at
<https://claude.ai/code/artifact/64d4849a-8d0d-4d09-a565-59e2f589f19d>; this file is the one that
travels with the code.

Figures below were measured from the working tree on 15 September 2026, not estimated.

| | |
|---|---|
| Catalogue today | 16 songs |
| Bundled audio | 8.7 MB across 32 files |
| Per song | ~545 KB (clip + full) |
| At 1,000 songs × 4 languages | ~2.2 GB of binaries |
| Persian text runs in `app.js` + `index.html` | 86 |
| Waveform bars, and therefore `peaks` length | 40 |

## M0 — Settle where the music comes from

**This blocks everything else.** It is not only a rights question; it is a hard engineering ceiling.

At the measured ~545 KB per song, a four-language catalogue of a thousand tracks is roughly 2.2 GB of
binaries. GitHub Pages has a 1 GB soft repository limit, and Git retains every version of every binary
forever, so the repository only ever grows. **Bundling audio runs out of road somewhere around 300–400
songs regardless of how the rights question is answered.**

Separately: sound recordings and lyrics are two different rights, and the game needs both. The
recordings currently in the repository are commercial releases, and the lyrics in `puzzles.json` are
likewise not covered by any licence we hold. Scaling the catalogue scales that in direct proportion.

Four routes:

| Route | How it works | Catalogue | Offline | Nostalgia | Cost |
|---|---|---|---|---|---|
| **A · Preview APIs** | Stream 30-second previews from Spotify / Deezer / Apple Music official endpoints. Host no audio; store only gap metadata and timings. | Millions | Lost | Yes | Free tier |
| **B · CC / public domain** | Free Music Archive, Jamendo CC-BY, genuinely public-domain traditional recordings. Bundle as today. | Thousands | Kept | No | Free |
| **C · Direct licence** | Licence the diaspora-pop catalogue from the labels that hold it. Bundle within the licence terms. | Negotiated | Kept | Yes | Money + months |
| **D · Status quo** | Continue bundling unlicensed recordings. Listed for completeness. | ~350 max | Kept | Yes | Takedown risk |

**Recommendation: A, with B as an offline fallback tier.** Route A removes the hosting ceiling entirely
and supplies popularity data — which is how "best songs" stops being a matter of taste and becomes a
sortable field. Ship a small Route B set as a bundled offline pack so the PWA still works without a
network, and stream everything else. Route C only makes sense if this becomes a commercial product.

Note that the game needs a short phrase per song rather than a full lyric sheet. That is a materially
smaller ask in any licensing conversation.

**Exit criteria** — a written source decision; one round playing end to end from the chosen source; a
recorded decision about the 16 tracks already published.

## M1 — Content pipeline, Persian only

Six stages from a search query to a playable round. Three are deterministic scripts, two are agents,
and one is a human. The review gate is not optional: the failure mode of an unreviewed gap is a round
nobody can solve, which is indistinguishable from a bug.

| Stage | Does | Run by |
|---|---|---|
| 1 · Discover | Rank candidates per locale and era by streaming popularity, not editorial taste | `song-scout` |
| 2 · Fetch lyrics | Pull the timed lyric line for the candidate window | script |
| 3 · Propose gaps | Score every word in the line, emit the top 3–5 with reasoning | `gap-smith` |
| 4 · **Human accept** | One person hears the clip, picks a gap or rejects the track (~20 s) | you |
| 5 · Cut & measure | ffmpeg cuts the clip window, computes the 40 peak values | `cut-clip.py` |
| 6 · Validate | Schema, collision and duplicate checks before the record is written | `validate.py` |

Two constraints worth writing down. `peaks` must contain exactly 40 floats or the waveform renders
wrong — the deck draws one bar per entry. And the clip should end a beat or two *after* the gap word,
never on it, so the player hears the phrase resolve.

Gaps are chosen **by hand** at this stage. That is deliberate: those 50 hand-picked gaps become the
labelled set that M2 calibrates against. Automating first would leave no way to tell whether the agent
is any good.

**Exit criteria** — 50 Persian songs in the catalogue; adding one takes under two minutes of human time.

## M2 — Gap selection that works

This is the part that decides whether the game is fun, and the hardest thing here to automate.

### The test that matters

Give a model the surrounding words and **no audio**, and ask it to fill the gap.

- **If it succeeds, reject the gap.** It is a language puzzle, not a music puzzle — the player never
  needed to press play.
- **A person who knows the song should produce the word instantly on hearing the phrase.** If a fan
  would hesitate, the gap is noise rather than recall.

**A good gap is hard from text alone and trivial with the tune.** That sentence is the acceptance
criterion for the whole content pipeline, and half of it automates for free.

### Signals

| Weight | Signal | Why |
|---|---|---|
| 0.30 | Chorus repetition | Repeated lines are the ones people have actually memorised |
| 0.25 | Terminal position | Last word of the line, where melody resolves and rhyme lands — highest recall by a wide margin |
| 0.20 | Carries the hook | The word the title or refrain is built on |
| 0.15 | Lexically distinctive | Low corpus frequency relative to the line |
| 0.10 | Stressed beat | Syllable falls on a downbeat; needs timed lyrics, so skip rather than fake it |

Automatic rejections:

- **Function words** (`و`, `را`, `به` and equivalents) — guessable from grammar alone, so they fail the
  text-only test by construction.
- **Word appears in the visible context** — the answer is printed on screen.
- **Normalise collision** — two plausible answers collapse to the same string under the locale's
  matcher, so both would have to be accepted or the round is unfair.

**Exit criteria** — the agent's top proposal matches the human pick on ≥70% of the M1 set; no accepted
gap passes the text-only check.

## M3 — Localisation refactor

Persian stays the only locale through this milestone, so the refactor lands with nothing else moving.

Four changes, in rising order of difficulty:

1. **86 inline strings.** Persian text is hardcoded across `app.js` and `index.html`. Extract to
   `i18n/<locale>.json` and load the active locale only. Mechanical, but touches every render template.

2. **The `fa()` helper.** Every number is force-converted to Persian digits unconditionally. It has to
   become locale-aware — Persian and Arabic keep their numerals, everything else uses
   `Intl.NumberFormat`.

3. **`normalize()` in `game.js`.** The real work. It folds `ي`/`ى`→`ی` and `ك`→`ک`, then strips *all*
   whitespace and punctuation, so `دل نمیکنم` matches `دلنمیکنم`. That is a deliberate and correct
   choice for Persian, where spacing is genuinely unstable — and it is wrong as a default for other
   languages, where it collapses distinct answers into collisions. Each locale needs its own matcher
   plus a fixture set of near-miss pairs that should and should not match.

4. **Font payload per script.** IranSans covers Persian and Arabic. Latin, Cyrillic and CJK locales each
   need their own face, and four weights per script would balloon the offline cache. Load faces per
   active locale, and let the service worker cache only that locale's fonts and audio.

Two things are already in good shape. `style.css` uses logical properties (`padding-inline`,
`margin-inline`) throughout, so switching `dir` between RTL and LTR should mostly just work. And the
waveform, clock and progress rail are already pinned to `direction:ltr`, because time runs
left-to-right regardless of script.

**Exit criteria** — zero hardcoded strings; locale-aware digits and matcher; the Persian build behaves
identically to before.

## M4 — Second language, end to end

Pick a language that stresses the architecture rather than an easy one. An LTR Latin-script locale
exercises direction switching, font swapping and the matcher rewrite all at once.

**Exit criteria** — 50 songs in the second locale; the switcher persists the choice; both locales pass
their matcher fixtures.

## M5 — Scale out

Batch discovery per locale and era, a review queue rather than one-at-a-time acceptance, and telemetry
on solve rate per gap so genuinely unfair rounds can be found and retired after launch.

**Exit criteria** — four locales; 250+ songs each; per-gap solve rate visible; an unfair gap can be
retired without a deploy.

## Agents and skills

Two agents do judgement work. Everything deterministic stays a plain script, because a script that cuts
audio should fail loudly rather than improvise.

| Name | Kind | Does | Produces |
|---|---|---|---|
| `/add-song <query\|locale>` | skill | Runs the pipeline for one track or a batch, stopping at the human gate; resumes without re-running discovery | staged record, pending review |
| `song-scout` | agent | Ranked candidates with popularity, year and provider IDs; deduplicates against the existing catalogue | `candidates.json` |
| `gap-smith` | agent | Scores words against the signal weights, then runs the text-only check on its own proposals and discards what it can solve unaided | 3–5 gaps + rationale + score |
| `locale-qa` | agent | For a new language, derives answer-matching rules and adversarial near-miss fixtures | matcher rules + fixtures |
| `cut-clip.py` | script | ffmpeg window cut ending after the gap word, loudness normalisation, 40-value peak array | clip + full + `peaks[40]` |
| `validate.py` | script | Schema conformance, peak count, duplicate answers, normalise collisions across the locale | pass / itemised failures |

## Open questions

1. **Is offline play negotiable?** It decides Route A versus C, and therefore the whole architecture.
   Worth knowing how many players actually rely on it before trading it away.
2. **Which four languages, and why those?** Locale choice should follow where the players are. It also
   determines whether a CJK matcher is needed, which is materially harder than a Latin one.
3. **Is the catalogue shared or per-locale?** A Persian speaker in Toronto may want both Persian and
   English rounds. That is a different data model from one catalogue per language, and retrofitting it
   later is expensive.
4. **What happens to the 16 published tracks?** They are live and public now. Whatever M0 decides should
   apply to them too.

---

Sizing, for one person's focused effort — sequence matters more than the numbers:
M0 1–2 wks · M1 2–3 wks · M2 2 wks · M3 2 wks · M4 2–3 wks · M5 4+ wks.
