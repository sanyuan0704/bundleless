self.bundlelessPluginReplace = self.bundlelessPluginReplace || (() => {
	const factory = (patterns) => {
		const replacers = patterns.filter(i => i).map((i) => {
			if (i.call) return i
			const [pattern, replaced] = i
			return source => source.replace(pattern, replaced)
		})

		const accept = (req, resp) => {
			if (!resp) return
			if (!resp.ok) return
			if (!req.__forceHandle && req.destination !== 'script') return
			const contentType = resp.headers.get('Content-Type')
			return contentType && contentType.indexOf('/javascript') > 0
		}

		const handle = (req, resp) => resp.text()
		.then((source) => {
			for (let replacer of replacers) {
				source = replacer(source)
			}

			const response = new Response(source, resp)
			response.headers.set('Content-Length', source.length)

			return response
		})

		return {accept, handle}
	}

	return factory
})(self)