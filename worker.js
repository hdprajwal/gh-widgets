/**
 * gh-widgets — self-hosted SVG widgets for GitHub READMEs.
 *
 * This worker is the SVG API. The landing page lives in ./public and is
 * served as static assets (see wrangler.jsonc). Routes follow
 * /:widget/:variant.svg. Currently implemented:
 *
 *   GET /header/graph.svg?title=...&subtitle=...&mode=dark|light&align=left|center
 *       &font=geist-mono|inter|serif&border=true|false&logo=<simple-icons slug>
 *       &logoColor=848484&width=750&height=260&bg=09090b&fg=fafafa
 *
 * To add a widget (stars, graphs, ...), write a render function that takes
 * (searchParams, ctx) and returns SVG markup, then register it in WIDGETS.
 *
 * The only optional outbound request is for `logo=` (simple-icons via jsDelivr),
 * cached at the edge for 30 days. Omit `logo` and the worker is fully self-contained.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const FONTS = {
  'geist-mono':
    "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  inter:
    "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

const THEMES = {
  dark: {
    bg: '#09090b',
    title: '#fafafa',
    subtitle: 'rgba(250,250,250,0.74)',
    grid: '255, 255, 255',
    border: '#27272a',
    logo: '#848484',
  },
  light: {
    bg: '#ffffff',
    title: '#18181b',
    subtitle: 'rgba(24,24,27,0.72)',
    grid: '0, 0, 0',
    border: '#e4e4e7',
    logo: '#848484',
  },
};

export function esc(s) {
  return s
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function hexColor(v, fallback) {
  if (!v) return fallback;
  const m = v.replace(/^#/, '');
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(m) ? `#${m}` : fallback;
}

export function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Fetch a simple-icons path by slug, cached at the edge. Best-effort. */
async function fetchLogoPath(slug, ctx) {
  if (!slug) return '';
  try {
    const url = `https://cdn.jsdelivr.net/npm/simple-icons@14/icons/${slug}.svg`;
    const cache = caches.default;
    const key = new Request(url);
    let res = await cache.match(key);
    if (!res) {
      res = await fetch(url, { cf: { cacheTtl: 2592000 } });
      if (!res.ok) return '';
      res = new Response(await res.text(), {
        headers: { 'cache-control': 'public, max-age=2592000, immutable' },
      });
      ctx.waitUntil(cache.put(key, res.clone()));
    }
    const svg = await res.text();
    const m = svg.match(/\bd="([^"]+)"/);
    return m ? m[1] : '';
  } catch {
    return ''; // render the widget without the icon
  }
}

// ---------------------------------------------------------------------------
// Widget: header
// ---------------------------------------------------------------------------

export function parseHeaderParams(searchParams) {
  const q = (k) => searchParams.get(k) || '';
  const mode = q('mode') === 'light' ? 'light' : 'dark';
  const theme = THEMES[mode];
  return {
    title: q('title').slice(0, 80) || 'title',
    subtitle: q('subtitle').slice(0, 140),
    mode,
    align: q('align') === 'center' ? 'center' : 'left',
    font: FONTS[q('font')] || FONTS.inter,
    isMono: (q('font') || '').includes('mono'),
    border: q('border') !== 'false',
    logo: (q('logo') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60),
    logoColor: hexColor(q('logoColor'), theme.logo),
    width: clampInt(q('width'), 200, 2000, 750),
    height: clampInt(q('height'), 80, 1000, 260),
    bg: hexColor(q('bg'), theme.bg),
    titleColor: hexColor(q('fg'), theme.title),
    subtitleColor: q('fg') ? `${hexColor(q('fg'), theme.title)}bd` : theme.subtitle,
    grid: theme.grid,
    borderColor: theme.border,
  };
}

export function renderHeaderSVG(p, logoPath) {
  const { width: w, height: h } = p;
  const pad = 56;
  const maxTextW = w - pad * 2;

  // Shrink the title if it would overflow (approximate glyph widths, no
  // text measurement available in Workers).
  const charW = p.isMono ? 0.62 : 0.56;
  let titleSize = 40;
  if (p.title.length * charW * titleSize > maxTextW) {
    titleSize = Math.max(18, Math.floor(maxTextW / (p.title.length * charW)));
  }
  const subSize = 17;
  const logoSize = 44;

  // Vertically center the logo + title + subtitle block.
  const titleH = titleSize * 0.73;
  const subH = subSize * 0.73;
  const rows =
    (logoPath ? logoSize + 22 : 0) + titleH + (p.subtitle ? 20 + subH : 0);
  const top = (h - rows) / 2;
  const titleBaseline = top + (logoPath ? logoSize + 22 : 0) + titleH;
  const subBaseline = titleBaseline + 20 + subH;

  const anchor = p.align === 'center' ? 'middle' : 'start';
  const tx = p.align === 'center' ? w / 2 : pad;
  const logoX = p.align === 'center' ? (w - logoSize) / 2 : pad;

  const logo = logoPath
    ? `<g transform="translate(${logoX}, ${top}) scale(${logoSize / 24})"><path d="${logoPath}" fill="${p.logoColor}" /></g>`
    : '';

  const subtitle = p.subtitle
    ? `<text x="${tx}" y="${subBaseline.toFixed(2)}" text-anchor="${anchor}" font-size="${subSize}" font-weight="400" fill="${p.subtitleColor}" font-family="${p.font}">${esc(p.subtitle)}</text>`
    : '';

  const border = p.border
    ? `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="11.5" fill="none" stroke="${p.borderColor}" stroke-width="1" />`
    : '';

  const label = p.subtitle ? `${p.title} — ${p.subtitle}` : p.title;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <defs>
    <clipPath id="clip"><rect x="0" y="0" width="${w}" height="${h}" rx="12" /></clipPath>
    <pattern id="gridF" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(${p.grid}, 0.04)" stroke-width="1" /></pattern>
    <pattern id="gridC" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="rgba(${p.grid}, 0.06)" stroke-width="1" /></pattern>
  </defs>
  <g clip-path="url(#clip)">
    <rect x="0" y="0" width="${w}" height="${h}" fill="${p.bg}" />
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#gridF)" />
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#gridC)" />
    ${logo}
    <text x="${tx}" y="${titleBaseline.toFixed(2)}" text-anchor="${anchor}" font-size="${titleSize}" font-weight="700" fill="${p.titleColor}" font-family="${p.font}" letter-spacing="-0.02em">${esc(p.title)}</text>
    ${subtitle}
  </g>
  ${border}
</svg>`;
}

async function headerWidget(searchParams, ctx) {
  const p = parseHeaderParams(searchParams);
  const logoPath = await fetchLogoPath(p.logo, ctx);
  return renderHeaderSVG(p, logoPath);
}

// ---------------------------------------------------------------------------
// Widget: badge (static)
// ---------------------------------------------------------------------------

const BADGE_THEMES = {
  dark: {
    bg: '#0e0e0e',
    border: '#27272a',
    label: '#a0a0a0',
    message: '#47a8ff',
    logo: '#848484',
  },
  light: {
    bg: '#ffffff',
    border: '#e4e4e7',
    label: '#71717a',
    message: '#2563eb',
    logo: '#848484',
  },
};

export function parseBadgeParams(searchParams) {
  const q = (k) => searchParams.get(k) || '';
  const mode = q('mode') === 'light' ? 'light' : 'dark';
  const theme = BADGE_THEMES[mode];
  return {
    label: q('label').slice(0, 40),
    message: q('message').slice(0, 60) || 'message',
    mode,
    color: hexColor(q('color'), theme.message),
    labelColor: hexColor(q('labelColor'), theme.label),
    logo: (q('logo') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60),
    logoColor: hexColor(q('logoColor'), theme.logo),
    bg: hexColor(q('bg'), theme.bg),
    borderColor: theme.border,
  };
}

const BADGE_H = 28;
const BADGE_PAD_X = 10;

/**
 * Lays out one badge's content (logo, label, message) starting at x=0,
 * without a pill around it, so the group widget can put several segments
 * inside a single pill.
 */
export function buildBadgeContent(p, logoPath, logoViewBox = 24) {
  const h = BADGE_H;
  const fontSize = 12;
  const charW = fontSize * 0.62; // Geist Mono advance width, approximate
  const gap = 8;
  const logoSize = 14;

  const textY = h / 2 + fontSize * 0.36;
  const font = FONTS['geist-mono'];

  let x = 0;
  let parts = '';
  if (logoPath) {
    parts += `<g transform="translate(${x}, ${(h - logoSize) / 2}) scale(${logoSize / logoViewBox})"><path d="${logoPath}" fill="${p.logoColor}" /></g>`;
    x += logoSize + 6;
  }
  if (p.label) {
    parts += `<text x="${x}" y="${textY.toFixed(2)}" font-size="${fontSize}" fill="${p.labelColor}" font-family="${font}">${esc(p.label)}</text>`;
    x += p.label.length * charW + gap;
  }
  parts += `<text x="${x}" y="${textY.toFixed(2)}" font-size="${fontSize}" font-weight="500" fill="${p.color}" font-family="${font}">${esc(p.message)}</text>`;
  x += p.message.length * charW;

  return { width: x, parts };
}

/** One badge content wrapped in its own pill, at origin. */
export function buildBadge(p, logoPath, logoViewBox = 24) {
  const c = buildBadgeContent(p, logoPath, logoViewBox);
  const w = Math.round(c.width + BADGE_PAD_X * 2);
  const group =
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${BADGE_H - 1}" rx="6" fill="${p.bg}" stroke="${p.borderColor}" stroke-width="1" />` +
    `<g transform="translate(${BADGE_PAD_X}, 0)">${c.parts}</g>`;
  return { width: w, height: BADGE_H, group };
}

export function renderBadgeSVG(p, logoPath, logoViewBox = 24) {
  const b = buildBadge(p, logoPath, logoViewBox);
  const label = p.label ? `${p.label}: ${p.message}` : p.message;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="0 0 ${b.width} ${b.height}" role="img" aria-label="${esc(label)}">
  ${b.group}
</svg>`;
}

async function staticBadgeWidget(searchParams, ctx) {
  const p = parseBadgeParams(searchParams);
  const logoPath = await fetchLogoPath(p.logo, ctx);
  return renderBadgeSVG(p, logoPath);
}

// ---------------------------------------------------------------------------
// Widget: badge group
//
// Each badge is one repeatable `b` param holding `key:value` pairs separated
// by `|`, e.g. ?b=label:build|message:passing|color:3fb950&b=message:v1.2.0
// Keys are the same ones /badge/static.svg accepts.
// ---------------------------------------------------------------------------

function parseBadgeSpec(spec, groupMode) {
  const params = new URLSearchParams();
  if (groupMode) params.set('mode', groupMode);
  for (const pair of spec.split('|')) {
    const i = pair.indexOf(':');
    if (i < 1) continue;
    params.set(pair.slice(0, i).trim(), pair.slice(i + 1));
  }
  return parseBadgeParams(params);
}

async function groupWidget(searchParams, ctx) {
  const groupMode = searchParams.get('mode') === 'light' ? 'light' : 'dark';
  const theme = BADGE_THEMES[groupMode];
  const bg = hexColor(searchParams.get('bg'), theme.bg);
  let specs = searchParams.getAll('b').slice(0, 8);
  if (specs.length === 0) specs = ['message:add ?b= params'];

  const badges = await Promise.all(
    specs.map(async (spec) => {
      const p = parseBadgeSpec(spec, groupMode);
      const logoPath = await fetchLogoPath(p.logo, ctx);
      return { p, content: buildBadgeContent(p, logoPath) };
    })
  );

  // One pill: segments side by side with a vertical divider between them.
  const h = BADGE_H;
  const segPad = 12;
  let x = 0;
  const parts = [];
  badges.forEach(({ content }, i) => {
    if (i > 0) {
      parts.push(`<line x1="${x + 0.5}" y1="4" x2="${x + 0.5}" y2="${h - 4}" stroke="${theme.border}" stroke-width="1" />`);
      x += 1;
    }
    x += segPad;
    parts.push(`<g transform="translate(${x}, 0)">${content.parts}</g>`);
    x += content.width + segPad;
  });
  const w = Math.round(x);
  const label = badges
    .map(({ p }) => (p.label ? `${p.label}: ${p.message}` : p.message))
    .join(', ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="${bg}" stroke="${theme.border}" stroke-width="1" />
  ${parts.join('\n  ')}
</svg>`;
}

// ---------------------------------------------------------------------------
// Widget: GitHub stars
// ---------------------------------------------------------------------------

/**
 * Fetches a GitHub API path as JSON, cached at the edge for 5 minutes.
 * Returns { data } on success or { error: 'rate limited' | 'unavailable' }.
 *
 * Unauthenticated GitHub API calls are limited to 60/hour per IP, and
 * Cloudflare's egress IPs are shared, so in production a GITHUB_TOKEN
 * secret (wrangler secret put GITHUB_TOKEN) is effectively required —
 * it switches the limit to 5000/hour per token.
 */
async function fetchGitHubJSON(path, env, ctx, ttl = 3600) {
  const url = `https://api.github.com/${path}`;
  try {
    const cache = caches.default;
    const key = new Request(url);
    const hit = await cache.match(key);
    if (hit) return { data: await hit.json() };

    const headers = {
      'user-agent': 'gh-widgets (https://github.com/hdprajwal/gh-widgets)',
      accept: 'application/vnd.github+json',
    };
    if (env && env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
    // Fail fast on a hung upstream: README image proxies time out and show
    // a broken image, so a quick fallback badge beats a slow perfect one.
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (res.status === 403 || res.status === 429) return { error: 'rate limited' };
    if (!res.ok) return { error: 'unavailable' };

    const body = await res.text();
    ctx.waitUntil(
      cache.put(
        key,
        new Response(body, {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${ttl}, s-maxage=${ttl}`,
          },
        })
      )
    );
    return { data: JSON.parse(body) };
  } catch {
    return { error: 'unavailable' };
  }
}

export function formatCount(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n < 1000) return String(n);
  if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '') + 'k';
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
}

function parseRepoParam(searchParams) {
  const repo = (searchParams.get('repo') || '').trim();
  return /^[\w.-]+\/[\w.-]+$/.test(repo) ? repo : null;
}

// GitHub octicon star (filled), 16x16 viewBox.
const STAR_ICON =
  'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z';

/**
 * Renders a badge whose message comes from data, reusing the badge params.
 * `icon` is a built-in 16x16 path drawn when the user sets no logo; it
 * inherits the message color unless logoColor is given.
 */
async function dataBadge(searchParams, ctx, { label, message, color, icon }) {
  const params = new URLSearchParams(searchParams);
  params.set('message', message);
  if (label && !params.get('label')) params.set('label', label);
  if (color && !params.get('color')) params.set('color', color);
  const iconParam = searchParams.get('icon');
  if (iconParam === 'none' || iconParam === 'false') icon = null;
  const p = parseBadgeParams(params);
  let logoPath = await fetchLogoPath(p.logo, ctx);
  let logoViewBox = 24;
  if (!logoPath && icon) {
    logoPath = icon;
    logoViewBox = 16;
    if (!searchParams.get('logoColor')) p.logoColor = p.color;
  }
  return renderBadgeSVG(p, logoPath, logoViewBox);
}

// GitHub octicon law (scales), 16x16 viewBox.
const LAW_ICON =
  'M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.985V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z';

async function licenseWidget(searchParams, ctx, env) {
  const repo = parseRepoParam(searchParams);
  if (!repo) {
    return dataBadge(searchParams, ctx, { message: 'add ?repo=owner/name', color: '8f8f8f', icon: LAW_ICON });
  }
  const { data, error } = await fetchGitHubJSON(`repos/${repo}`, env, ctx);
  if (error) {
    return { svg: await dataBadge(searchParams, ctx, { message: error, color: '8f8f8f', icon: LAW_ICON }), ttl: 60 };
  }
  const spdx = data.license && data.license.spdx_id;
  const message = !spdx ? 'no license' : spdx === 'NOASSERTION' ? 'custom' : spdx;
  return dataBadge(searchParams, ctx, { message, color: spdx && spdx !== 'NOASSERTION' ? 'a78bfa' : '8f8f8f', icon: LAW_ICON });
}

// GitHub octicon tag, 16x16 viewBox.
const TAG_ICON =
  'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z';

async function releaseWidget(searchParams, ctx, env) {
  const repo = parseRepoParam(searchParams);
  if (!repo) {
    return dataBadge(searchParams, ctx, { message: 'add ?repo=owner/name', color: '8f8f8f', icon: TAG_ICON });
  }
  const { data, error } = await fetchGitHubJSON(`repos/${repo}/releases/latest`, env, ctx, 900);
  if (error === 'rate limited') {
    return { svg: await dataBadge(searchParams, ctx, { message: error, color: '8f8f8f', icon: TAG_ICON }), ttl: 60 };
  }
  if (error || !data.tag_name) {
    return dataBadge(searchParams, ctx, { message: 'no releases', color: '8f8f8f', icon: TAG_ICON });
  }
  return dataBadge(searchParams, ctx, { message: String(data.tag_name).slice(0, 40), color: '3fb950', icon: TAG_ICON });
}

async function starsWidget(searchParams, ctx, env) {
  const repo = parseRepoParam(searchParams);
  if (!repo) {
    return dataBadge(searchParams, ctx, { message: 'add ?repo=owner/name', color: '8f8f8f', icon: STAR_ICON });
  }
  const { data, error } = await fetchGitHubJSON(`repos/${repo}`, env, ctx);
  const count = error ? null : formatCount(data.stargazers_count);
  if (count === null) {
    return { svg: await dataBadge(searchParams, ctx, { message: error || 'unavailable', color: '8f8f8f', icon: STAR_ICON }), ttl: 60 };
  }
  return dataBadge(searchParams, ctx, { message: count, color: 'eac54f', icon: STAR_ICON });
}

// ---------------------------------------------------------------------------
// Widget registry — add new widgets here.
// Key is "<widget>/<variant>" matching the URL /<widget>/<variant>.svg
// Value is async (searchParams, ctx) => svg string.
// ---------------------------------------------------------------------------

const WIDGETS = {
  'header/graph': headerWidget,
  'badge/static': staticBadgeWidget,
  'group/badges': groupWidget,
  'github/stars': starsWidget,
  'github/license': licenseWidget,
  'github/release': releaseWidget,
};

// ---------------------------------------------------------------------------
// Router — static assets in ./public are served before this handler runs.
//
// Rendered images are cached at the edge by full URL for CACHE_TTL seconds.
// Widgets return either an svg string, or { svg, ttl } to shorten caching
// (error badges use a short ttl so they recover quickly).
// ---------------------------------------------------------------------------

const CACHE_TTL = 1800; // 30 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const m = url.pathname.match(/^\/([a-z-]+)\/([a-z-]+)\.svg$/);
    const widget = m && WIDGETS[`${m[1]}/${m[2]}`];
    if (widget) {
      const cache = caches.default;
      const cacheKey = new Request(url.toString());
      if (request.method === 'GET') {
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
      }

      // Tolerate HTML-escaped URLs pasted from README snippets, where every
      // "&" arrives as "&amp;" and param names come through as "amp;title".
      const params = new URLSearchParams();
      for (const [k, v] of url.searchParams) {
        params.append(k.replace(/^amp;/, ''), v);
      }
      let result = await widget(params, ctx, env);
      if (typeof result === 'string') result = { svg: result };
      const ttl = result.ttl || CACHE_TTL;
      const response = new Response(result.svg, {
        headers: {
          'content-type': 'image/svg+xml; charset=utf-8',
          'cache-control': `public, max-age=${ttl}, s-maxage=${ttl}`,
          'access-control-allow-origin': '*',
        },
      });
      if (request.method === 'GET') {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return response;
    }

    return new Response('Not found', { status: 404 });
  },
};
