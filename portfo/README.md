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

The database must also be shared with the integration (`···` → Connections). Check both the credentials and database access if the request fails.

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

Videos use `preload="none"` and WebP posters. They load on hover, keyboard focus,
or a touch tap on the Projects page, and stop when leaving the viewport.
Posters keep the initial page load lightweight.

## SEO

`npm run build` runs `make-sitemap.js` first, which writes `public/sitemap.xml`
and `public/robots.txt`. Routes come from `src/lib/nav.ts` and posts from
`blog-posts.json`, so neither needs a second list kept in sync. Output carries no
build timestamp, so an unchanged site rebuilds to an identical file.

Change the domain at the top of `make-sitemap.js` if it moves.

## Layout

```
src/
  components/                 navigation, search, video previews, cursor trail
  lib/                        route definitions and shared formatting helpers
  pages/                      home, experience, projects, writing, articles
  data/                       jobs, projects, generated blog metadata
```

Navigation is keyboard-first: `1`–`4` jump to sections, `j`/`k` step through
them, `/` or `⌘K` opens the palette.

## Design and maintenance

The site is light-only, with a 640px content column, shared color tokens in
`src/index.css`, and a single navigation definition in `src/lib/nav.ts`.
Page headings are available to screen readers without adding visible titles.
Keep project video behavior in `ProjectVideo.tsx` and use `SiteLink.tsx` for links
that may point to either local articles or external sites.

Markdown rendering and the command palette load only when needed. Article
transitions use CSS and respect reduced-motion preferences; automatic video
playback also respects that setting. The Home music shelf loads audio only after a cover is clicked. Cover palettes
and track paths live in `src/data/music.ts`; assets live in `public/music`.
Clicking the active cover pauses playback. Playback and the cover gradient persist across routes. The active track loops
until paused by clicking its cover on Home.

Run `npm run lint`, `npm run format:check`, and `npm run build` before committing.
`npm run format` applies the repository's formatting. Poster generation requires
FFmpeg. Blog refresh requires network access and the Notion credentials above;
normal development and builds use the checked-in content.
