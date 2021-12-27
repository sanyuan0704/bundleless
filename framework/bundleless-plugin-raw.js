self.bundlelessPluginRaw = self.bundlelessPluginRaw || (() => {
	const factory = ({queryParam = 'uRaw'} = {}) => {
		const before = (req, send) => {
			const requestURL = new URL(req.url)
			const requestedMIME = requestURL.searchParams.get(queryParam)
			if (requestedMIME !== null) {
				requestURL.searchParams.delete(queryParam)
				const request = new Request(requestURL.href)
				const fetchArgs = [request]
				if (req.mode !== 'navigate') fetchArgs.push(req)

				return fetch(...fetchArgs)
				.then((resp) => {
					resp = new Response(resp.body, resp)
					resp.headers.set('Content-Type', requestedMIME || 'application/octet-stream')
					if (!requestedMIME) {
						const filename = requestURL.pathname.split('/').pop() || 'download'
						resp.headers.set('Content-Disposition', `attachment; filename=${JSON.stringify(filename)}`)
					}
					return send(resp)
				})
			}
		}

		return {before}
	}

	return factory
})(self)