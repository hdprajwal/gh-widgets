// Widget manifest: the landing page (tabs, status table, examples, builders,
// API tables) is rendered entirely from this data by app.js.
//
// To add a widget:
//   1. Implement its render function in worker.js and register it in WIDGETS.
//   2. Add an entry here with status 'working' and fill in route/examples/
//      params/builder. Entries with status 'soon' render as disabled tabs.
//
// Builder field types: 'text', 'number', 'select' (needs options).

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
		id: 'stars',
		status: 'soon',
		description: 'Star-count badges for a repository.',
	},
	{
		id: 'ci-status',
		status: 'soon',
		description: 'Build/CI status badges.',
	},
];
