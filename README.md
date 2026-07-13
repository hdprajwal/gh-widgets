# gh-widgets

Self-hosted SVG widgets for GitHub READMEs. One Cloudflare Worker renders
header images from options you pass in the URL. Graphs, star counts, and more
are coming later. Your README never depends on someone else's image service.

The landing page at `/` shows live examples, a builder that generates the
dark/light `<picture>` snippet for you, and the full API reference. The
`/self-host` page walks through running your own copy.

## Run locally

The worker is one file, so local development is just wrangler:

```bash
cd gh-widgets
npx wrangler dev
```

Then open:

- `http://localhost:8787/` for the landing page and the builder
- `http://localhost:8787/header/graph.svg?title=hello&subtitle=world` for the raw SVG

Wrangler reloads on its own when you save a file.

## Deploy

```bash
npx wrangler deploy
```

The first deploy gives you a `gh-widgets.<account>.workers.dev` URL.
`wrangler.jsonc` also declares `gh-widgets.hdprajwal.dev` as a custom domain.
That binds on deploy as long as the `hdprajwal.dev` zone is on the same
Cloudflare account. Remove the `routes` block if you do not want it, and if
you forked this repo, remove it before your first deploy.

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

Responses are SVG images, cached on Cloudflare's edge for a day, and usable
from any site.

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

2. In `public/widgets.js`, add an entry with `status: 'working'`, the route,
   examples, param docs, and builder fields. The landing page builds its
   status table, tabs, examples, builder, and API docs from that file. There
   is no HTML to touch.

Widgets you have not built yet can sit in the file with `status: 'soon'`.
They show up in the status table and as disabled tabs.

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
