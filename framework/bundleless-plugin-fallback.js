self.bundlelessPluginFallback = self.bundlelessPluginFallback || ((self) => {
	const factory = ({cacheName = 'default', prefix = 'uFallback'} = {}) => {
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

		const after = (req, resp) => {
			if (resp.ok && resp.type === 'default') {
				const clonedResp = resp.clone()
				return caches.open(cacheName)
				.then(cache => cache.put(req, clonedResp))
				.then(() => resp)
			}

			return resp
		}

		const catchErr = (err, req) => {
			console.error(`[bundleless] Error loading "${req.url}", falling back to last cached successful response.\n`, err)
			return caches.open(cacheName)
			.then(cache => cache.match(req))
			.then((resp) => {
				if (resp) return resp
				console.error(`[bundleless] Cache not found for ${req.url}`)
				throw err
			})
		}

		return {init, after, catchErr}
	}

	return factory
})(self)