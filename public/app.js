// Renders the widget status table, tabs, and per-widget panels (examples,
// builder, API table) from WIDGET_MANIFEST in widgets.js.
(function () {
	function escHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	// ---- status table -------------------------------------------------------
	document.getElementById('status').innerHTML = WIDGET_MANIFEST.map(function (w) {
		var status = w.status === 'working'
			? '<td class="status live">working</td>'
			: '<td class="status soon">coming soon</td>';
		return '<tr><td class="cmd">' + escHtml(w.id) + '</td>' + status +
			'<td class="desc">' + escHtml(w.description) + '</td></tr>';
	}).join('');

	// ---- tabs ---------------------------------------------------------------
	var live = WIDGET_MANIFEST.filter(function (w) { return w.status === 'working'; });
	var tabs = document.getElementById('tabs');
	tabs.innerHTML = WIDGET_MANIFEST.map(function (w, i) {
		if (w.status !== 'working') {
			return '<button class="tab" role="tab" aria-selected="false" disabled title="coming soon">' +
				escHtml(w.id) + '</button>';
		}
		var active = w.id === live[0].id;
		return '<button class="tab' + (active ? ' active' : '') + '" role="tab" aria-selected="' +
			active + '" data-tab="' + escHtml(w.id) + '">' + escHtml(w.id) + '</button>';
	}).join('');

	tabs.addEventListener('click', function (e) {
		var tab = e.target.closest('.tab');
		if (!tab || tab.disabled || !tab.dataset.tab) return;
		tabs.querySelectorAll('.tab').forEach(function (b) {
			b.classList.toggle('active', b === tab);
			b.setAttribute('aria-selected', b === tab ? 'true' : 'false');
		});
		document.querySelectorAll('.tab-panel').forEach(function (p) {
			p.hidden = p.dataset.panel !== tab.dataset.tab;
		});
	});

	// ---- panels -------------------------------------------------------------
	function fieldHtml(f) {
		var inner;
		if (f.type === 'select') {
			inner = '<select name="' + escHtml(f.name) + '">' + f.options.map(function (o) {
				return '<option value="' + escHtml(o) + '">' + escHtml(o) + '</option>';
			}).join('') + '</select>';
		} else {
			inner = '<input name="' + escHtml(f.name) + '" type="' + (f.type === 'number' ? 'number' : 'text') + '"' +
				(f.value ? ' value="' + escHtml(f.value) + '"' : '') +
				(f.placeholder ? ' placeholder="' + escHtml(f.placeholder) + '"' : '') + ' />';
		}
		return '<label' + (f.wide ? ' class="wide"' : '') + '>' + escHtml(f.name) + ' ' + inner + '</label>';
	}

	function panelHtml(w) {
		var examples = w.examples.map(function (ex) {
			var url = w.route + '?' + ex.query;
			return '<div class="example">' +
				'<img src="' + escHtml(url) + '" alt="' + escHtml(ex.alt) + '" loading="lazy" />' +
				'<pre><code>' + escHtml(url) + '</code></pre></div>';
		}).join('');

		var params = w.params.map(function (p) {
			return '<tr><td class="cmd">' + escHtml(p.name) + '</td><td class="mode">' +
				escHtml(p.values) + '</td><td class="desc">' + escHtml(p.desc) + '</td></tr>';
		}).join('');

		return '<h2>Examples</h2>' +
			'<p>Every image below is rendered live by this worker.</p>' + examples +
			'<h2 id="builder-' + escHtml(w.id) + '">Builder</h2>' +
			'<p>Edit the fields. The previews and the snippet update as you type.</p>' +
			'<form class="builder">' + w.builder.map(fieldHtml).join('') + '</form>' +
			'<div class="preview">' +
			'<img class="preview-dark" alt="dark preview" />' +
			'<img class="preview-light" alt="light preview" /></div>' +
			'<div class="snippet-head"><span>README snippet, auto dark/light</span>' +
			'<button class="copy" type="button">copy</button></div>' +
			'<pre class="snippet"></pre>' +
			'<h2 id="api-' + escHtml(w.id) + '">API</h2>' +
			'<p>Each widget is one endpoint, and every option is a query parameter. ' +
			'Responses are SVG images, cached on Cloudflare\'s edge, and usable from any site.</p>' +
			'<pre><code>GET ' + escHtml(w.route) + '</code></pre>' +
			'<div class="table-wrap"><table><tbody>' + params + '</tbody></table></div>';
	}

	function wireBuilder(panel, w) {
		var form = panel.querySelector('form.builder');
		var darkImg = panel.querySelector('.preview-dark');
		var lightImg = panel.querySelector('.preview-light');
		var snippet = panel.querySelector('.snippet');
		var copy = panel.querySelector('button.copy');
		var t;

		function build(mode) {
			var p = new URLSearchParams(new FormData(form));
			var drop = [];
			p.forEach(function (v, k) { if (!v) drop.push(k); });
			drop.forEach(function (k) { p.delete(k); });
			p.set('mode', mode);
			return location.origin + w.route + '?' + p.toString();
		}

		function update() {
			var dark = build('dark');
			var light = build('light');
			darkImg.src = dark;
			lightImg.src = light;
			var title = new FormData(form).get('title') || w.id;
			snippet.textContent =
				'<p align="center">\n' +
				'  <picture>\n' +
				'    <source media="(prefers-color-scheme: dark)" srcset="' + dark.split('&').join('&amp;') + '" />\n' +
				'    <img alt="' + title + '" src="' + light.split('&').join('&amp;') + '" />\n' +
				'  </picture>\n' +
				'</p>';
		}

		form.addEventListener('input', function () {
			clearTimeout(t);
			t = setTimeout(update, 300);
		});
		copy.addEventListener('click', function () {
			navigator.clipboard.writeText(snippet.textContent).then(function () {
				copy.textContent = 'copied';
				setTimeout(function () { copy.textContent = 'copy'; }, 1200);
			});
		});
		update();
	}

	var panels = document.getElementById('panels');
	live.forEach(function (w, i) {
		var panel = document.createElement('section');
		panel.className = 'tab-panel';
		panel.dataset.panel = w.id;
		panel.hidden = i !== 0;
		panel.innerHTML = panelHtml(w);
		panels.appendChild(panel);
		wireBuilder(panel, w);
	});
})();
