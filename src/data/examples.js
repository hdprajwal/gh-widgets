// Gallery entries for the /examples page. Each renders live from the worker;
// clicking one opens a dialog with the URL and markdown that reproduce it.
// Queries carry no mode: the page appends it to match the site theme.

export const HEADER_EXAMPLES = [
	{
		alt: 'Dark mono header',
		route: '/header/graph.svg',
		query: 'title=codexpass&subtitle=Use+your+Codex+login+anywhere&font=geist-mono&border=false',
	},
	{
		alt: 'Centered header with a logo',
		route: '/header/graph.svg',
		query: 'title=gh-widgets&subtitle=Self-hosted+README+widgets&align=center&logo=cloudflare&logoColor=f38020',
	},
	{
		alt: 'Custom colors',
		route: '/header/graph.svg',
		query: 'title=night+shift&subtitle=custom+background+and+foreground&bg=0a1929&fg=7dd3fc&font=geist-mono&border=false',
	},
	{
		alt: 'Serif, centered',
		route: '/header/graph.svg',
		query: 'title=The+Quiet+Project&subtitle=A+calmer+kind+of+header&font=serif&align=center',
	},
	{
		alt: 'Compact banner',
		route: '/header/graph.svg',
		query: 'title=tiny-tools&subtitle=120px+tall&height=120&font=geist-mono',
	},
];

export const BADGE_EXAMPLES = [
	{
		alt: 'Build passing',
		route: '/badge/static.svg',
		query: 'label=build&message=passing&color=3fb950',
	},
	{
		alt: 'Version',
		route: '/badge/static.svg',
		query: 'label=version&message=v1.2.0',
	},
	{
		alt: 'License',
		route: '/badge/static.svg',
		query: 'label=license&message=Apache-2.0&color=a78bfa',
	},
	{
		alt: 'Docs live',
		route: '/badge/static.svg',
		query: 'label=docs&message=live&color=47a8ff',
	},
	{
		alt: 'Experimental',
		route: '/badge/static.svg',
		query: 'label=status&message=experimental&color=f97316',
	},
	{
		alt: 'Deprecated',
		route: '/badge/static.svg',
		query: 'label=status&message=deprecated&color=ef4444',
	},
	{
		alt: 'Made with Rust',
		route: '/badge/static.svg',
		query: 'label=made+with&message=rust&logo=rust&logoColor=f74c00&color=f74c00',
	},
	{
		alt: 'Runs on Cloudflare Workers',
		route: '/badge/static.svg',
		query: 'label=runs+on&message=workers&logo=cloudflare&logoColor=f38020&color=f38020',
	},
	{
		alt: 'Built with TypeScript',
		route: '/badge/static.svg',
		query: 'label=built+with&message=typescript&logo=typescript&logoColor=3178c6&color=3178c6',
	},
	{
		alt: 'Tests badge',
		route: '/badge/static.svg',
		query: 'label=tests&message=312+passed&color=16a34a',
	},
	{
		alt: 'Custom background',
		route: '/badge/static.svg',
		query: 'label=theme&message=midnight&bg=0a1929&color=7dd3fc',
	},
	{
		alt: 'Message only',
		route: '/badge/static.svg',
		query: 'message=hello+world',
	},
	{
		alt: 'Group: build, version, license',
		wide: true,
		route: '/group/badges.svg',
		query: 'b=label:build|message:passing|color:3fb950&b=label:version|message:v1.2.0&b=label:license|message:Apache-2.0|color:a78bfa',
	},
	{
		alt: 'Group with logos',
		wide: true,
		route: '/group/badges.svg',
		query: 'b=logo:cloudflare|logoColor:f38020|label:runs+on|message:workers&b=logo:github|label:source|message:gh-widgets',
	},
	{
		alt: 'Group of two',
		wide: true,
		route: '/group/badges.svg',
		query: 'b=label:build|message:passing|color:16a34a&b=label:docs|message:live',
	},
	{
		alt: 'Stars',
		route: '/github/stars.svg',
		query: 'repo=cloudflare/workerd',
	},
	{
		alt: 'Stars with GitHub logo',
		route: '/github/stars.svg',
		query: 'repo=facebook/react&logo=github',
	},
	{
		alt: 'Stars, text label instead of icon',
		route: '/github/stars.svg',
		query: 'repo=openai/codex&icon=none&label=stars',
	},
	{
		alt: 'Repo license',
		route: '/github/license.svg',
		query: 'repo=facebook/react',
	},
	{
		alt: 'Latest release',
		route: '/github/release.svg',
		query: 'repo=hdprajwal/codexpass',
	},
];
