self.bundlelessPluginEft = self.bundlelessPluginEft || ((self) => {
	const factory = ({scriptURL = 'https://unpkg.com/eft-parser@0.13.5/dist/eft-parser.min.js'} = {}) => {
		/* global parseEft */
		const init = () => {
			self.importScripts(scriptURL)
		}

		const accept = (req, resp) => {
			if (!resp) return
			if (!resp.ok) return
			if (!req.__forceHandle && req.destination !== 'script') return
			const requestURL = new URL(req.url)
			const extName = requestURL.pathname.split('.').pop()
			return extName === 'eft' || extName === 'efml'
		}

		const handle = (req, resp) => resp.text()
		.then((text) => {
			const transformed = `/* Transformed with bundleless-plugin-eft */
import {create} from 'ef-core'
export default create(JSON.parse(${JSON.stringify(JSON.stringify(parseEft(text)))}))
	`
			const response = new Response(transformed, resp)
			response.headers.set('content-type', 'application/javascript')
			response.headers.set('Content-Length', transformed.length)
			return response
		})

		return {init, accept, handle}
	}

	return factory
})(self)