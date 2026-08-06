# ISE Day 2026 Story Generator

A single-page web app that lets NC State ISE students, alumni, faculty and staff
build a branded ISE Day 2026 social graphic in about a minute: pick a template,
add a photo, type a story, download a 2160×2700 PNG ready for Instagram or
LinkedIn.

Everything runs in the browser. **Uploaded photos are never sent anywhere** —
they are read with `FileReader` and drawn straight to a local `<canvas>`. There
is no backend, no build step, no dependencies, and no analytics.

---

## Running it locally

```bash
python3 serve.py
```

Then open <http://127.0.0.1:8770>. A server is required (rather than opening
`index.html` directly) because the app uses ES modules, which browsers refuse to
load over `file://`.

## Deploying

GitHub Pages already serves this repo from the root of `main`, so deploying is
just a push:

```bash
git push origin main
```

The site is <https://dacornej.github.io/NSCU_ISE_app/> and updates within a
minute or two. There is no build step — the repo root *is* the site, which is
why `index.html`, `app.js`, `templates.js` and `assets/` all sit at the top
level rather than in a subdirectory.

Any static host works equally well if you ever move off Pages.

---

## How it is put together

| File | Role |
|---|---|
| `index.html` | Markup and all CSS. NC State brand UI: Roboto, Wolfpack Red. |
| `templates.js` | **Single source of truth** — all six template specs. |
| `app.js` | State, form generation, canvas renderer, cropper, export. |
| `assets/frames/` | The six flattened template backgrounds, 2160×2700. |
| `assets/thumbs/` | Small versions for the template picker. |
| `assets/fonts/` | Self-hosted Montserrat, Maven Pro, Roboto (variable woff2). |
| `assets/logos/` | Departmental ISE logo, white and full-colour. |

### Editing templates

`templates.js` drives both the form and the renderer, so adding a field or
nudging a text box needs no changes to `app.js`. Every coordinate is a
**percentage of the canvas**, which is why the same spec renders correctly at
preview size and at full export size. Font sizes are in **points at the original
11.25in slide scale**, matching the source PowerPoint.

Each template declares:

- `photo` — the clip region (`ellipse` or `rect`)
- `fields` — what the form asks for
- `slots` — where that text is drawn, with font, size, colour and alignment
- `footer` — the `Celebrate #ISEDay` block, or `null` where it is already
  painted into the frame art
- `cobrand` — where the NC State lockup goes on that particular frame

Dates, hashtags and URLs all live in this file rather than scattered through the
markup, so rolling the campaign forward a year is a single-file edit.

---

## Where the artwork came from

The six frames were extracted from IISE's official ISE Day 2026 PowerPoint
templates (`ISEDay2026_*.pptx`). Each deck is one slide holding a flattened
3000×3749 background plus live text boxes; the geometry in `templates.js` was
parsed directly out of `ppt/slides/slide1.xml` rather than eyeballed.

> **Note:** five of the six decks also contain a placeholder headshot tagged
> `© Getty Images`. Those are **deliberately not in this repo** — only the
> background frame from each deck was extracted. If you ever re-run the
> extraction, keep the Getty guard in place.

---

## Two things to settle before this goes public

1. **IISE artwork.** This app serves IISE's template artwork rather than just
   redistributing the `.pptx` files. IISE publishes these templates for exactly
   this purpose, but worth a confirming note to them.

2. **Brand compliance is partial, by design.** NC State's guide
   ([brand.ncsu.edu](https://brand.ncsu.edu)) asks that Wolfpack Red
   *predominate* and that Roboto lead the type hierarchy. That cannot be true of
   a graphic built on IISE's navy-and-cyan campaign art. The split taken here:

   - **The app UI is fully compliant** — Roboto, `#CC0000`, WCAG AA throughout
     (lowest measured contrast ratio 5.89:1), red bookending the page.
   - **The generated graphic is co-branded.** IISE's art leads, with the
     departmental ISE logo and a Wolfpack Red rule added to each frame. Red
     appears as a keyline rather than as type, because `#CC0000` on the
     templates' navy has poor contrast.

   Worth a sign-off from Robert Lasson, Director of Creative Services
   (<rrlasson@ncsu.edu>), before launch.

---

## Accessibility

Targets WCAG 2.1 AA, which NC State requires.

- Every control has a real `<label>`; visible focus rings throughout
- Touch targets ≥44px; the whole flow is keyboard-operable
- Text drawn onto the graphic was contrast-checked against the actual pixels
  underneath it. Where a text box crosses a colour transition in the frame art,
  the auto-fit floor keeps type large enough for its measured ratio to pass —
  see the `tellme_2` story note in `templates.js`.

---

## Licensing

The **code** in this repository (`index.html`, `app.js`, `templates.js`,
`serve.py`) is licensed under GPL-3.0, per `LICENSE`.

The **assets are not covered by that licence** and are included under their
respective owners' terms:

- `assets/frames/` and `assets/thumbs/` — ISE Day 2026 campaign artwork,
  © [IISE](https://www.iise.org/ISEDay)
- `assets/logos/` — departmental marks, © NC State University, from
  [ise.ncsu.edu media resources](https://ise.ncsu.edu/news/media-resources/)
- `assets/fonts/` — Montserrat, Maven Pro and Roboto, all under the
  SIL Open Font License

Reusing this project elsewhere means swapping the artwork for your own.
