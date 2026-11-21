# Horse-Sized Duck

A scroll-driven study of the question "would you rather fight 100 duck-sized horses or one horse-sized duck?" The answer depends on what "sized" means (weight, height, volume or skin area), and the last panel runs the fight in a small battle simulator.

## Run it

Needs Node 20.19+ or 22 (see `.nvmrc`).

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check and build to dist/
```

## Deploy (Netlify)

`netlify.toml` is set up: build command `npm run build`, publish folder `dist`, Node 22. Push the repo to GitHub and connect it in Netlify. Once you know the site URL, make the `og:image` tag in `index.html` absolute (for example `https://your-site.netlify.app/og.png`) so link previews show the image everywhere.

## Layout

- `src/data.ts`: the mallard and horse, with sources, and the scaling math for each meaning of "sized". Every number on the page comes from here.
- `src/scenes.ts`: the eight scenes, in order: HTML, interactive setup and scroll timeline.
- `src/decor.ts`: per-scene extras (balance scale, ruler, water tank, skin squares, Dromornis).
- `src/art.ts`: the SVG illustrations. Colours are CSS tokens in `src/styles.css`.
- `src/battle/`: the battle simulator. `ubs.ts` and `engine.ts` port the stat model and melee loop from Taylor_UBS (differences are listed at the top of `ubs.ts`); `fighters.ts` sets base stats and size scaling; `view.ts` draws it.
- `src/state.ts`: the reader's answers, kept in localStorage.
- `public/`: favicon and the link-preview image.

Reduced-motion users get the final frames without scroll pinning. On phones, the stages crop to their middle so the animals stay large.

## Later

- Duck-type picker (Pekin and others)
- Counting everyone's answers, with visualizations of the results
- More battle options
