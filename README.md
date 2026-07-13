<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)"
            srcset="https://gh-widgets.hdprajwal.dev/header/graph.svg?title=gh-widgets&amp;subtitle=Self-hosted+SVG+widgets+for+GitHub+READMEs&amp;font=geist-mono&amp;border=false&amp;mode=dark" />
    <img alt="gh-widgets: self-hosted SVG widgets for GitHub READMEs"
         src="https://gh-widgets.hdprajwal.dev/header/graph.svg?title=gh-widgets&amp;subtitle=Self-hosted+SVG+widgets+for+GitHub+READMEs&amp;font=geist-mono&amp;border=false&amp;mode=light" />
  </picture>
</p>

<p align="center">
  <a href="https://astro.build"><picture><source media="(prefers-color-scheme: dark)" srcset="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=built+with&amp;message=astro&amp;logo=astro&amp;logoColor=bc52ee&amp;color=bc52ee&amp;mode=dark" /><img alt="built with astro" src="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=built+with&amp;message=astro&amp;logo=astro&amp;logoColor=bc52ee&amp;color=bc52ee&amp;mode=light" /></picture></a>
  <a href="https://workers.cloudflare.com"><picture><source media="(prefers-color-scheme: dark)" srcset="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=runs+on&amp;message=cloudflare+workers&amp;logo=cloudflare&amp;logoColor=f38020&amp;color=f38020&amp;mode=dark" /><img alt="runs on cloudflare workers" src="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=runs+on&amp;message=cloudflare+workers&amp;logo=cloudflare&amp;logoColor=f38020&amp;color=f38020&amp;mode=light" /></picture></a>
  <a href="https://gh-widgets.hdprajwal.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=docs&amp;message=live&amp;color=3fb950&amp;mode=dark" /><img alt="docs live" src="https://gh-widgets.hdprajwal.dev/badge/static.svg?label=docs&amp;message=live&amp;color=3fb950&amp;mode=light" /></picture></a>
  <a href="https://github.com/hdprajwal/gh-widgets/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://gh-widgets.hdprajwal.dev/github/license.svg?repo=hdprajwal/gh-widgets&amp;mode=dark" /><img alt="license" src="https://gh-widgets.hdprajwal.dev/github/license.svg?repo=hdprajwal/gh-widgets&amp;mode=light" /></picture></a>
  <a href="https://github.com/hdprajwal/gh-widgets/stargazers"><picture><source media="(prefers-color-scheme: dark)" srcset="https://gh-widgets.hdprajwal.dev/github/stars.svg?repo=hdprajwal/gh-widgets&amp;mode=dark" /><img alt="stars" src="https://gh-widgets.hdprajwal.dev/github/stars.svg?repo=hdprajwal/gh-widgets&amp;mode=light" /></picture></a>
</p>

Every image above is rendered by this repo's own worker. More in the
[examples gallery](https://gh-widgets.hdprajwal.dev/examples).

Self-hosted SVG widgets for GitHub READMEs. One Cloudflare Worker renders
header images from options you pass in the URL. Graphs, star counts, and more
are coming later. Your README never depends on someone else's image service.

The landing page at `/` shows live examples, a builder that generates the
dark/light `<picture>` snippet for you, and the full API reference. The
`/self-host` page walks through running your own copy.

## Run locally

The SVG API is `worker.js`. The site is an Astro project in `src/` that
builds to static files in `dist/`, served by the same worker deploy.

```bash
npm install
```

For day-to-day work, run two terminals. The site proxies image requests to
the worker, and both reload on save:

```bash
npx wrangler dev   # the SVG API on :8787
npm run dev        # the site on :4321
```

To serve everything the way production does, from one command:

```bash
npm run preview    # builds the site, then wrangler dev serves dist + worker
```

The raw SVG API works either way:
`http://localhost:8787/header/graph.svg?title=hello&subtitle=world`.

## Deploy

```bash
npm run build
npx wrangler deploy
```

If you deploy through Cloudflare's git integration, set the build command
to `npm run build` in the worker's Settings, under Builds.

The first deploy gives you a `gh-widgets.<account>.workers.dev` URL.
`wrangler.jsonc` also declares `gh-widgets.hdprajwal.dev` as a custom domain.
That binds on deploy as long as the `hdprajwal.dev` zone is on the same
Cloudflare account. Remove the `routes` block if you do not want it, and if
you forked this repo, remove it before your first deploy.

The stars, license, and release badges need a `GITHUB_TOKEN` secret in
production (`npx wrangler secret put GITHUB_TOKEN`), because
unauthenticated GitHub API calls share rate limits across Cloudflare's
egress IPs.

### Deploy with an AI agent

[AGENTS.md](AGENTS.md) has step-by-step instructions written for AI coding
agents: fork-specific config changes, non-interactive Cloudflare auth, the
GitHub token secret, and verification checks. Paste this to your agent:

```text
Fork and deploy https://github.com/hdprajwal/gh-widgets to my Cloudflare
account. Follow AGENTS.md in the repo root exactly. Ask me for a Cloudflare
API token for the deploy, and for a fine-grained GitHub token (public repos,
read-only) for the GITHUB_TOKEN secret.
```

## API

```
GET /header/graph.svg
```

| Param       | Values                       | Description                                              |
| ----------- | ---------------------------- | -------------------------------------------------------- |
| `title`     | string                       | Main heading. Max 80 chars. Long titles shrink to fit.    |
| `subtitle`  | string                       | Line under the title. Optional, max 140 chars.            |
| `mode`      | `dark` \| `light`            | Color theme. Default `dark`.                              |
| `align`     | `left` \| `center`           | Text alignment. Default `left`.                           |
| `font`      | `geist-mono` \| `inter` \| `serif` | Font stack. Default `inter`.                        |
| `border`    | `true` \| `false`            | 1px rounded border. Default `true`.                       |
| `logo`      | slug                         | [simple-icons](https://simpleicons.org) slug, drawn above the title. |
| `logoColor` | hex (no `#`)                 | Logo fill color. Default `848484`.                        |
| `width`     | 200 to 2000                  | Image width in px. Default 750.                           |
| `height`    | 80 to 1000                   | Image height in px. Default 260.                          |
| `bg`        | hex (no `#`)                 | Background color override.                                |
| `fg`        | hex (no `#`)                 | Text color override.                                      |

Responses are SVG images, cached on Cloudflare's edge for 30 minutes per
URL, and usable from any site. Error badges cache for one minute so they
recover quickly.

### README snippet, auto dark/light

```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)"
            srcset="https://gh-widgets.hdprajwal.dev/header/graph.svg?title=my-project&amp;mode=dark" />
    <img alt="my-project"
         src="https://gh-widgets.hdprajwal.dev/header/graph.svg?title=my-project&amp;mode=light" />
  </picture>
</p>
```

GitHub shows the dark or light version to match each visitor's theme. The
builder on the landing page generates this for you.

## Adding a widget

Routes follow `/<widget>/<variant>.svg`. Two steps:

1. In `worker.js`, write a render function that takes `(searchParams, ctx)`
   and returns SVG markup, then register it:

   ```js
   const WIDGETS = {
     'header/graph': headerWidget,
     'stars/badge': starsWidget, // new
   };
   ```

2. In `src/data/widgets.js`, add an entry with `status: 'working'`, the
   route, examples, param docs, and builder fields. The site builds the
   widget's page, examples, builder, and API docs from that file. There is
   no HTML to touch.

Widgets you have not built yet can sit in the file with `status: 'soon'`.
They show up in the status table as coming soon.

Adding a widget never changes an existing URL, so published READMEs keep
working.

## Notes

- The worker calls no other service, with one exception. The `logo` parameter
  fetches an icon from simple-icons through jsDelivr and caches it on the
  edge for 30 days. If you skip `logo`, nothing external is ever called.
- Fonts in the SVG are font-family stacks, not embedded files. GitHub renders
  the image with whatever fonts the viewer has installed, same as
  shieldcn.dev. `geist-mono` falls back to the system monospace font.

## License

[Apache-2.0](LICENSE)
