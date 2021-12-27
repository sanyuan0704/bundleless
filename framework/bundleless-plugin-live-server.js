self.bundlelessPluginLiveServer = self.bundlelessPluginLiveServer || ((self) => {
	const factory = ({channelName = 'bundleless-plugin-live-server'} = {}) => {
		const init = () => {
			const protocol = self.location.protocol === 'http:' ? 'ws://' : 'wss://'
			// eslint-disable-next-line prefer-template
			const address = protocol + self.location.host + '/ws'
			const socket = new WebSocket(address)

			self.addEventListener('install', (e) => {
				e.waitUntil(caches.delete(channelName)
				.then(() => {
					console.log(`[bundleless] Cache "${channelName}" deleted`)
				}))
			})

			socket.addEventListener('message', (e) => {
				if (e.data === 'reload') {
					caches.open(channelName)
					.then(cache => cache.keys()
					.then(keys => Promise.all(keys.map(key => cache.add(key)))))
					.then(() => {
						self.clients.matchAll({includeUncontrolled: true})
						.then((clients) => {
							for (let client of clients) {
								client.postMessage({scope: 'bundleless', channel: 'broadcast', message: 'reload'})
							}
						})
					})
				}
			})
			console.log('[bundleless] Live Server enabled.')
		}

		const before = req => caches.open(channelName)
		.then(cache => cache.match(req))

		const accept = (req, resp) => {
			if (!resp) return
			if (!resp.ok) return
			const requestURL = new URL(req.url)
			if (requestURL.host !== self.location.host) return

			caches.open(channelName)
			.then(cache => cache.put(req, resp))

			const contentType = resp.headers.get('content-type')
			return contentType && contentType.indexOf('/html') > 0
		}

		const handle = (req, resp) => resp.text()
		.then((source) => {
			source = source.replace(`<!-- Code injected by live-server -->
<script type="text/javascript">
	// <![CDATA[  <-- For SVG support
	if ('WebSocket' in window) {
		(function() {
			function refreshCSS() {
				var sheets = [].slice.call(document.getElementsByTagName("link"));
				var head = document.getElementsByTagName("head")[0];
				for (var i = 0; i < sheets.length; ++i) {
					var elem = sheets[i];
					head.removeChild(elem);
					var rel = elem.rel;
					if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {
						var url = elem.href.replace(/(&|\\?)_cacheOverride=\\d+/, '');
						elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
					}
					head.appendChild(elem);
				}
			}
			var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
			var address = protocol + window.location.host + window.location.pathname + '/ws';
			var socket = new WebSocket(address);
			socket.onmessage = function(msg) {
				if (msg.data == 'reload') window.location.reload();
				else if (msg.data == 'refreshcss') refreshCSS();
			};
			console.log('Live reload enabled.');
		})();
	}
	// ]]>
</script>
`, `<!-- Code injected by bundleless-plugin-live-server -->
<script type="text/javascript">
	// <![CDATA[  <-- For SVG support
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.addEventListener('message', (e) => {
			if (e.data && e.data.scope === 'bundleless' && e.data.message === 'reload') window.location.reload()
		})
		console.log('Live reolad enabled.')
	}
	// ]]>
</script>
	`)

			const response = new Response(source, resp)
			response.headers.set('Content-Length', source.length)

			return response
		})

		return {init, before, accept, handle}
	}

	return factory
})(self)