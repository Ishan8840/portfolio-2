# portfolio

Personal site — React 19, Vite, TypeScript, Tailwind v4.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production build
npm run lint
```

## Blog

Posts live in a Notion database and are pulled in as markdown.

```bash
npm run refresh-blog
```

This writes one `public/posts/<slug>.md` per post plus the listing metadata in
`src/data/blog-posts.json`. Both are committed, so the deployed site serves what
was last fetched — not whatever is currently live in Notion.

It needs a `.env` in this directory:

```
NOTION_KEY=...            # integration secret from notion.so/my-integrations
NOTION_DATABASE_ID=...    # the 32-char id in the database URL
```

The database must also be shared with the integration (`···` → Connections). A
valid key without access returns an empty result rather than an error.

Expected properties: `Name` (title), `Status` (must be `Published`), `Date`,
`Description`, `ReadTime`, `Tags`.

Note that the script never deletes: unpublishing a post in Notion drops it from
the listing but leaves its `.md` behind.

## Projects

Add the entry to `src/data/projects.ts` and drop the clip in `public/videos/`,
then:

```bash
npm run posters
```

That writes `public/posters/<name>.webp` from each clip's first frame. The cards
reference it by deriving the path from the video, so there is no poster field to
set and the still can never disagree with the video it stands in for.

Videos use `preload="none"` — they only download on hover. `preload="metadata"`
looks the same at rest but pulls the entire file (measured: 15.6MB across the
three clips), which is what the posters exist to avoid.

## Layout

```
src/
  components/
    DiffusionTransition.tsx   page transition over the page's real pixels
    CommandPalette.tsx        ⌘K / "/" jump-to-anything
    Rail.tsx                  left hairline nav, bottom bar on small screens
    AmbientAudio.tsx          background track, starts on first interaction
    ClickSound.tsx            click tick
    CursorTrail.tsx           pixel trail behind the cursor
  lib/
    rasterize.ts              paints the live DOM to a canvas
    click-sound.ts            Web Audio playback
    nav.ts                    routes, key bindings
  pages/
  data/                       jobs, projects, generated blog metadata
```

Navigation is keyboard-first: `1`–`4` jump to sections, `j`/`k` step through
them, `/` or `⌘K` opens the palette.
