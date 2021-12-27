self.bundlelessPluginCacheFirst = self.bundlelessPluginCacheFirst || ((self) => {
	const factory = ({cacheName = 'default', prefix = 'uCacheFirst'} = {}, initCacheList = []) => {
		prefix = `${prefix}:`
		cacheName = [prefix, cacheName].join('')

		const init = () => {
			self.addEventListener('install', (e) => {
				e.waitUntil(caches.keys()
				.then(keys => keys.filter(key => key.startsWith(prefix)))
				.then(oldCaches => Promise.all(oldCaches.map(oldCache => caches.delete(oldCache)
				.then(() => {
					console.log(`[bundleless] Cache "${oldCache}" deleted`)
				}))))
				.then(() => caches.open(cacheName)))
				// .then(cache => cache.addAll(initCacheList)))
			})
		}

		const before = req => caches.open(cacheName)
		.then(cache => cache.match(req)
		.then((resp) => {
			const backgroundFetch = fetch(req)
			.then((resp) => {
				if (resp.ok) cache.put(req, resp.clone())
				.catch((err) => {
					console.log(`[bundleless] Cache could not update for "${req.url}":\n`, err)
				})
				return resp
			})

			if (resp) return resp
			return backgroundFetch
		}))

		return {init, before}
	}

	return factory
})(self)