// Widget manifest: the landing page (tabs, status table, examples, builders,
// API tables) is rendered entirely from this data by app.js.
//
// To add a widget:
//   1. Implement its render function in worker.js and register it in WIDGETS.
//   2. Add an entry here with status 'working' and fill in route/examples/
//      params/builder. Entries with status 'soon' render as disabled tabs.
//
// Builder field types: 'text', 'number', 'select' (needs options).

// Bump this whenever a widget's rendering changes. It is appended to the
// example and preview image URLs so browsers do not show stale cached SVGs.
const WIDGET_VERSION = '3';

const WIDGET_MANIFEST = [
	{
		id: 'header',
		status: 'working',
		description: 'README header images with title, subtitle, logo, and grid background.',
		route: '/header/graph.svg',
		examples: [
			{
				alt: 'dark left-aligned header',
				query: 'title=codexpass&subtitle=Use+your+Codex+login+anywhere&font=geist-mono&border=false',
			},
			{
				alt: 'light centered header with logo',
				query: 'title=gh-widgets&subtitle=Self-hosted+README+widgets&mode=light&align=center&logo=cloudflare&logoColor=f38020',
			},
			{
				alt: 'custom-color header',
				query: 'title=night+shift&subtitle=custom+background+and+foreground&bg=0a1929&fg=7dd3fc&font=geist-mono&border=false',
			},
			{
				alt: 'compact header',
				query: 'title=compact&height=120&font=geist-mono',
			},
		],
		params: [
			{ name: 'title', values: 'string', desc: 'Main heading. Max 80 chars; long titles shrink to fit.' },
			{ name: 'subtitle', values: 'string', desc: 'Line under the title. Optional, max 140 chars.' },
			{ name: 'mode', values: 'dark | light', desc: 'Color theme. Default dark.' },
			{ name: 'align', values: 'left | center', desc: 'Text alignment. Default left.' },
			{ name: 'font', values: 'geist-mono | inter | serif', desc: 'Font stack. Default inter.' },
			{ name: 'border', values: 'true | false', desc: '1px rounded border. Default true.' },
			{ name: 'logo', values: 'slug', desc: 'simple-icons slug (e.g. openai, cloudflare), drawn above the title.' },
			{ name: 'logoColor', values: 'hex', desc: 'Logo fill color, without #. Default 848484.' },
			{ name: 'width', values: '200 to 2000', desc: 'Image width in px. Default 750.' },
			{ name: 'height', values: '80 to 1000', desc: 'Image height in px. Default 260.' },
			{ name: 'bg', values: 'hex', desc: 'Background color override, without #.' },
			{ name: 'fg', values: 'hex', desc: 'Text color override, without #.' },
		],
		builder: [
			{ name: 'title', type: 'text', value: 'my-project', wide: true },
			{ name: 'subtitle', type: 'text', value: 'A one-line description of the project', wide: true },
			{ name: 'align', type: 'select', options: ['left', 'center'] },
			{ name: 'font', type: 'select', options: ['geist-mono', 'inter', 'serif'] },
			{ name: 'border', type: 'select', options: ['false', 'true'] },
			{ name: 'logo', type: 'text', placeholder: 'simple-icons slug' },
			{ name: 'logoColor', type: 'text', placeholder: '848484' },
			{ name: 'width', type: 'number', value: '750' },
			{ name: 'height', type: 'number', value: '260' },
			{ name: 'bg', type: 'text', placeholder: 'hex, overrides mode' },
			{ name: 'fg', type: 'text', placeholder: 'hex, overrides mode' },
		],
	},
	{
		id: 'badge',
		status: 'working',
		description: 'Static badges with a label, a message, and a color.',
		route: '/badge/static.svg',
		examples: [
			{
				alt: 'build passing badge',
				query: 'label=build&message=passing&color=3fb950',
			},
			{
				alt: 'version badge',
				query: 'label=version&message=v1.2.0',
			},
			{
				alt: 'badge with a logo',
				query: 'label=runs+on&message=cloudflare+workers&logo=cloudflare&logoColor=f38020',
			},
			{
				alt: 'light mode badge',
				query: 'label=license&message=Apache-2.0&mode=light&color=a78bfa',
			},
		],
		params: [
			{ name: 'label', values: 'string', desc: 'Left text, muted. Optional, max 40 chars.' },
			{ name: 'message', values: 'string', desc: 'Right text, colored. Max 60 chars.' },
			{ name: 'mode', values: 'dark | light', desc: 'Color theme. Default dark.' },
			{ name: 'color', values: 'hex', desc: 'Message color, without #. Default blue.' },
			{ name: 'labelColor', values: 'hex', desc: 'Label color, without #.' },
			{ name: 'logo', values: 'slug', desc: 'simple-icons slug, drawn before the label.' },
			{ name: 'logoColor', values: 'hex', desc: 'Logo fill color, without #. Default 848484.' },
			{ name: 'bg', values: 'hex', desc: 'Background color override, without #.' },
		],
		builder: [
			{ name: 'label', type: 'text', value: 'build', wide: true },
			{ name: 'message', type: 'text', value: 'passing', wide: true },
			{ name: 'color', type: 'text', placeholder: '3fb950' },
			{ name: 'labelColor', type: 'text', placeholder: 'hex, optional' },
			{ name: 'logo', type: 'text', placeholder: 'simple-icons slug' },
			{ name: 'logoColor', type: 'text', placeholder: '848484' },
			{ name: 'bg', type: 'text', placeholder: 'hex, overrides mode' },
		],
	},
	{
		id: 'group',
		status: 'working',
		description: 'Several badges in one pill, separated by dividers.',
		route: '/group/badges.svg',
		examples: [
			{
				alt: 'three badges in one image',
				query: 'b=label:build|message:passing|color:3fb950&b=label:version|message:v1.2.0&b=label:license|message:Apache-2.0|color:a78bfa',
			},
			{
				alt: 'badges with logos',
				query: 'b=logo:cloudflare|logoColor:f38020|label:runs+on|message:workers&b=logo:github|label:source|message:gh-widgets',
			},
			{
				alt: 'light mode group',
				query: 'mode=light&b=label:build|message:passing|color:16a34a&b=label:docs|message:live',
			},
		],
		params: [
			{ name: 'b', values: 'key:value|key:value', desc: 'One segment. Repeat b for more, up to 8. Keys are the same options /badge/static.svg takes: label, message, color, labelColor, logo, logoColor.' },
			{ name: 'mode', values: 'dark | light', desc: 'Color theme for the whole pill. Default dark.' },
			{ name: 'bg', values: 'hex', desc: 'Pill background override, without #.' },
		],
		builder: [
			{ name: 'b', label: 'segment 1', type: 'text', value: 'label:build|message:passing|color:3fb950', wide: true },
			{ name: 'b', label: 'segment 2', type: 'text', value: 'label:version|message:v1.2.0', wide: true },
			{ name: 'b', label: 'segment 3', type: 'text', placeholder: 'label:license|message:Apache-2.0', wide: true },
		],
	},
	{
		id: 'stars',
		status: 'soon',
		description: 'Star-count badge for a repository.',
	},
	{
		id: 'license',
		status: 'soon',
		description: 'License badge for a repository.',
	},
	{
		id: 'release',
		status: 'soon',
		description: 'Latest-release badge for a repository.',
	},
	{
		id: 'ci-status',
		status: 'soon',
		description: 'Build/CI status badges.',
	},
];
