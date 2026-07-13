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
export function buildBadgeContent(p, logoPath) {
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
    parts += `<g transform="translate(${x}, ${(h - logoSize) / 2}) scale(${logoSize / 24})"><path d="${logoPath}" fill="${p.logoColor}" /></g>`;
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
export function buildBadge(p, logoPath) {
  const c = buildBadgeContent(p, logoPath);
  const w = Math.round(c.width + BADGE_PAD_X * 2);
  const group =
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${BADGE_H - 1}" rx="6" fill="${p.bg}" stroke="${p.borderColor}" stroke-width="1" />` +
    `<g transform="translate(${BADGE_PAD_X}, 0)">${c.parts}</g>`;
  return { width: w, height: BADGE_H, group };
}

export function renderBadgeSVG(p, logoPath) {
  const b = buildBadge(p, logoPath);
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
// Widget registry — add new widgets here.
// Key is "<widget>/<variant>" matching the URL /<widget>/<variant>.svg
// Value is async (searchParams, ctx) => svg string.
// ---------------------------------------------------------------------------

const WIDGETS = {
  'header/graph': headerWidget,
  'badge/static': staticBadgeWidget,
  'group/badges': groupWidget,
};

// ---------------------------------------------------------------------------
// Router — static assets in ./public are served before this handler runs.
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const m = url.pathname.match(/^\/([a-z-]+)\/([a-z-]+)\.svg$/);
    const widget = m && WIDGETS[`${m[1]}/${m[2]}`];
    if (widget) {
      // Tolerate HTML-escaped URLs pasted from README snippets, where every
      // "&" arrives as "&amp;" and param names come through as "amp;title".
      const params = new URLSearchParams();
      for (const [k, v] of url.searchParams) {
        params.append(k.replace(/^amp;/, ''), v);
      }
      const svg = await widget(params, ctx);
      return new Response(svg, {
        headers: {
          'content-type': 'image/svg+xml; charset=utf-8',
          'cache-control': 'public, max-age=86400, s-maxage=604800',
          'access-control-allow-origin': '*',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
