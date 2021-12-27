self.bundlelessPluginResultFirst = self.bundlelessPluginResultFirst || ((self) => {
	const factory = ({cacheName = 'default', prefix = 'uResultFirst'} = {}) => {
		prefix = `${prefix}:`
		cacheName = [prefix, cacheName].join('')

		const init = () => {
			self.addEventListener('install', (e) => {
				e.waitUntil(caches.keys()
				.then(keys => keys.filter(key => key.startsWith(prefix)))
				.then(oldCaches => Promise.all(oldCaches.map(oldCache => caches.delete(oldCache)
				.then(() => {
					console.log(`[bundleless] Cache "${oldCache}" deleted`)
				})))))
			})
		}

		const before = (req, send) => caches.open(cacheName)
		.then(cache => cache.match(req))
		.then((resp) => {
			if (resp) return send(resp)
			return
		})

		const after = (req, resp) => {
			if (resp.ok && resp.type === 'default') {
				const clonedResp = resp.clone()
				return caches.open(cacheName)
				.then(cache => cache.put(req, clonedResp))
				.then(() => resp)
			}

			return resp
		}

		return {init, before, after}
	}

	return factory
})(self)