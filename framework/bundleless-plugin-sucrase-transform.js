self.bundlelessPluginSucraseTransform = self.bundlelessPluginSucraseTransform || ((self) => {
	/* global sucrase */
	const factory = ({
		scriptURL = '/sucrase.umd.js',
		transformOpts = {}
	} = {}) => {
		const init = () => {
			if (scriptURL !== null) self.importScripts(scriptURL)
		}

		const accept = (req, resp) => {
			if (!resp) return
			if (!resp.ok) return
			if (!req.__forceHandle && req.destination !== 'script') return
			const requestURL = new URL(req.url)
			if (requestURL.host !== self.location.host) return
			const extName = requestURL.pathname.split('.').pop()
			const transforms = []

			const options = {transforms}
			switch (extName) {
				case 'ts':
					transforms.push('typescript')
					break
				case 'tsx':
					transforms.push('typescript')
				// eslint-disable-next-line no-fallthrough
				case 'jsx':
					transforms.push('jsx')
					break
				default:
					return
			}

			return options
		}

		// eslint-disable-next-line max-params
		const handle = (req, resp, {accepted = {}}) => {
			const options = Object.assign({}, transformOpts, accepted)
			return resp.text()
			.then(source => sucrase.transform(source, options))
			.then((result) => {
				const response = new Response(result.code, resp)
				response.headers.set('Content-Length', result.code.length)
				response.headers.set('Content-Type', 'application/javascript')
				return response
			})
		}

		return {init, accept, handle}
	}

	return factory
})(self)