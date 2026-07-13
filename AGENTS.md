# Agent instructions for gh-widgets

This file tells AI coding agents how to deploy and work on this project.
The human-facing docs are README.md and https://gh-widgets.hdprajwal.dev/self-host.

## What this is

- `worker.js`: a single Cloudflare Worker that renders SVG widgets (headers,
  badges, GitHub stats) from query parameters. No database, no build step of
  its own, plain JavaScript, no dependencies.
- `src/`: an Astro site (docs, examples, builders) that builds to static
  files in `dist/`. The same worker deploy serves both.
- `src/data/widgets.js`: the manifest that drives the whole site. Widget
  pages, examples, builders, and API tables render from this data.

Requires Node >= 22.12.

## Deploy to the user's Cloudflare account

Follow these steps in order. Do not skip step 2.

1. `npm install`

2. Edit `wrangler.jsonc` and delete the `routes` block. It pins the worker
   to `gh-widgets.hdprajwal.dev`, a domain the user's account does not own,
   and the deploy fails if it stays. If the user has their own domain on
   Cloudflare, replace the pattern instead of deleting:

   ```jsonc
   "routes": [
     { "pattern": "widgets.example.com", "custom_domain": true }
   ],
   ```

3. Authenticate wrangler. `npx wrangler login` opens a browser, which
   headless agents cannot complete. Prefer environment variables: ask the
   user for an API token (Cloudflare dashboard → My Profile → API Tokens →
   "Edit Cloudflare Workers" template) and run deploys with
   `CLOUDFLARE_API_TOKEN` set. If the account has multiple accounts
   attached, also set `CLOUDFLARE_ACCOUNT_ID`.

4. `npm run build` (builds the site into `dist/`; the deploy fails without it)

5. `npx wrangler deploy`

6. Set the GitHub token secret. The stars, license, release, and ci-status
   badges call the GitHub API; without a token they will often render
   "rate limited" in production because Cloudflare egress IPs share
   GitHub's per-IP limit. Ask the user for a fine-grained personal access
   token with "Public repositories (read-only)" access and no other
   permissions, then:

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```

7. Verify. All three must pass:

   ```bash
   curl -s -o /dev/null -w '%{http_code}' https://<deployed-host>/                                  # 200, html
   curl -s -o /dev/null -w '%{http_code}' "https://<deployed-host>/header/graph.svg?title=test"     # 200, image/svg+xml
   curl -s "https://<deployed-host>/github/stars.svg?repo=octocat/hello-world" | grep -v 'rate limited'
   ```

Continuous deploys (optional): connect the repo in the Cloudflare dashboard
(Workers & Pages → the worker → Settings → Builds) and set the build command
to `npm run build`. Pushes to the default branch then build and deploy
automatically.

## Local development

```bash
npx wrangler dev   # SVG API on :8787
npm run dev        # site on :4321, proxies widget routes to :8787
npm run preview    # or: build once and serve dist + worker together
```

## Adding a widget

1. In `worker.js`: write a render function `(searchParams, ctx, env) => svg`
   (or `{ svg, ttl }` to shorten caching) and register it in the `WIDGETS`
   map under `'<widget>/<variant>'`. Escape every user-supplied string with
   `esc()`, validate colors with `hexColor()`, clamp numbers with
   `clampInt()`.
2. In `src/data/widgets.js`: add a manifest entry with `status: 'working'`,
   the route, examples, param docs, and builder fields. The site generates
   the widget's page from it.
3. If an existing widget's rendering changed, bump `WIDGET_VERSION` in
   `src/data/widgets.js` so cached example images refresh.
4. Never change the shape of an existing URL. Published READMEs depend on
   them.

## Conventions

- Rendered SVGs are edge-cached by full URL (30 minutes default; widgets
  return `{ svg, ttl }` to override; error badges use 60 seconds).
- GitHub API calls go through `fetchGitHubJSON` (cached, 8s timeout,
  distinguishes "rate limited" from "unavailable"). Reuse it.
- Site prose is plain English: short sentences, no em dashes, no jargon.
- Do not commit secrets. `GITHUB_TOKEN` lives only in worker secrets.
