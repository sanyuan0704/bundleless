/* global bundleless, bundlelessPluginEft, bundlelessPluginESMResolve, bundlelessPluginReplace, bundlelessPluginFallback,
 bundlelessPluginCacheFirst, bundlelessPluginLiveServer, bundlelessPluginESBuildTransform, bundlelessPluginResultFirst,
 bundlelessPluginRaw, bundlelessPluginSucraseTransform, bundlelessPluginMIME
 */

// version 1

let handleRequest = e => fetch(e)

self.addEventListener('fetch', (e) => {
	const requestURL = new URL(e.request.url)
	if (requestURL.protocol !== 'http:' && requestURL.protocol !== 'https:') return
	e.respondWith(handleRequest(e.request))
})

self.dev = ['127.0.0.1', 'localhost'].indexOf(self.location.host.split(':').shift()) >= 0

try {
	self.importScripts('/resource.js')
} catch (err) {
	console.warn('Could not load resources, falling back to naive mode')
	// console.error(err)
}

self.importScripts('/sw-resource-manager.js')

self.importScripts(
	'/framework/bundleless.js',
	'/framework/bundleless-plugin-raw.js',
	'/framework/bundleless-plugin-eft.js',
	'/framework/bundleless-plugin-replace.js',
	'/framework/bundleless-plugin-fallback.js',
	'/framework/bundleless-plugin-esm-resolve.js',
	'/framework/bundleless-plugin-cache-first.js',
	'/framework/bundleless-plugin-live-server.js',
	'/framework/bundleless-plugin-result-first.js',
	'/framework/bundleless-plugin-sucrase-transform.js'
	// '/bundleless-plugin-esbuild-transform.js'
)

self.addEventListener('install', () => {
	console.log('SERVICE WORKER INSTALLED!!!')
	self.skipWaiting()
})

self.addEventListener('activate', () => {
	console.log('New ServiceWorker Activated')
	self.clients.claim()
})

// self.bundlelessPluginPostCSS = self.bundlelessPluginPostCSS || ((self) => {
// 	const factory = ({scriptURL = 'https://bundle.run/postcss@8.4.4'}) => {
// 		const init = () => {
// 			self.importScripts(scriptURL)
// 		}

// 		const accept = (req, resp) => {

// 		}

// 		const handle = (req, resp) => {}

// 		return {init, accept, handle}
// 	}

// 	return factory
// })(self)

self.bundlelessPluginMIME = self.bundlelessPluginMIME || (() => {
	const factory = ({queryParam = 'uMIME', skipBypass = false} = {}) => {
		const before = (req) => {
			const requestURL = new URL(req.url)
			const requestedMIME = requestURL.searchParams.get(queryParam)

			if (requestedMIME !== null) {
				req.__forceHandle = true
			}
		}

		const after = (req, resp) => {
			const requestURL = new URL(req.url)
			const requestedMIME = requestURL.searchParams.get(queryParam)

			if (requestedMIME !== null) {
				resp = new Response(resp.body, resp)
				resp.headers.set('Content-Type', requestedMIME)
			}

			return resp
		}

		const init = ({beforeHooks}) => {
			if (skipBypass) beforeHooks.unshift(before)
		}

		return {init, after}
	}

	return factory
})(self)

handleRequest = bundleless({
	plugins: [
		self.dev && bundlelessPluginLiveServer(),
		bundlelessPluginRaw(),
		bundlelessPluginResultFirst(),
		// bundlelessPluginCacheFirst({}, [
		// 	'/',
		// 	'/entry.js',
		// 	'/index.js',
		// 	'/setup.js',
		// 	// '/hello-world.eft',
		// 	// '/src',
		// 	// '/src/',
		// 	// '/src/main.js',
		// 	// '/src/main.css'
		// ]),
		bundlelessPluginEft(),
		bundlelessPluginSucraseTransform(),
		// bundlelessPluginESBuildTransform(),
		bundlelessPluginESMResolve({
			// cdn: 'https://esm.sh/',
			// cdn: 'https://jspm.dev/',
			// versionLock: {
			// 	'ef-core': '0.14.2'
			// }
		}),
		bundlelessPluginReplace([
			[/process\.env\.NODE_ENV/g, JSON.stringify(self.dev && 'develop' || 'production')]
		]),
		bundlelessPluginMIME({skipBypass: true}),
		bundlelessPluginFallback()
	]
})