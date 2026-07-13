// @ts-check
import { defineConfig } from 'astro/config';

// The SVG API lives in worker.js, not in Astro. During `astro dev`, proxy
// the widget routes to `wrangler dev` (run it in another terminal on 8787)
// so example images and builder previews render.
const WIDGET_ROUTES = ['/header', '/badge', '/group', '/github'];

// https://astro.build/config
export default defineConfig({
	site: 'https://gh-widgets.hdprajwal.dev',
	// Emit /self-host.html instead of /self-host/index.html so URLs serve
	// without a trailing-slash redirect, matching the pre-Astro site.
	build: { format: 'file' },
	// Astro 7's default ('jsx') collapses the whitespace between an element
	// and the following text, eating spaces before inline links in prose.
	compressHTML: false,
	vite: {
		server: {
			proxy: Object.fromEntries(
				WIDGET_ROUTES.map((p) => [p, 'http://localhost:8787'])
			),
		},
	},
});
