self.bundlelessPluginESMResolve = self.bundlelessPluginESMResolve || ((self) => {
	/* global urljoin, esModuleLexer */

	const StringView = class {
		constructor(str) {
			this.value = str
		}
		toString() {
			return this.value
		}
	}

	const joinURL = (url, ...segments) => {
		url = new URL(url)
		url.pathname = urljoin(url.pathname, ...segments)
		return url.href
	}

	const isBareImport = importPath => !!importPath.match(/^(\/|\.|[\w+]+:\/\/)/)

	const splitImports = (source, imports) => {
		const splits = []
		const importStrViews = []

		let start = 0
		let end = 0

		for (let i of imports) {
			let importName = i.n
			if (importName) {
				const dynamic = i.d > -1

				end = i.s
				if (dynamic) end += 1

				splits.push(source.substring(start, end))
				const importNameView = new StringView(importName)
				splits.push(importNameView)
				importStrViews.push(importNameView)

				start = i.e
				if (dynamic) start -= 1
			}
		}

		end = source.length

		splits.push(source.substring(start, end))

		return [splits, importStrViews]
	}

	const factory = ({
		scriptURL: {
			urlJoin = 'https://unpkg.com/url-join@4.0.1/lib/url-join.js',
			esmLexer = 'https://bundle.run/es-module-lexer@0.9.3'
		} = {},
		cdn = 'https://cdn.skypack.dev/',
		defaultEntry = 'index.js',
		versionLock = {}
	} = {}) => {
		const init = () => {
			if (urlJoin !== null) self.importScripts(urlJoin)
			if (esmLexer !== null) self.importScripts(esmLexer)
		}

		const accept = (req, resp) => {
			if (!resp) return
			if (!resp.ok) return
			if (!req.__forceHandle && req.destination !== 'script') return
			const contentType = resp.headers.get('Content-Type')
			return contentType && contentType.indexOf('/javascript') > 0
		}

		const handle = (req, resp) => resp.text()
		.then(source => esModuleLexer.init
		.then(() => {
			const [imports] = esModuleLexer.parse(source)
			const [splitted, importNames] = splitImports(source, imports)
			for (let i of importNames) {
				if (isBareImport(i.value)) {
					if (i.value[i.value.length - 1] === '/') {
						i.value += defaultEntry
					}
				} else {
					const [org, ...pathArr] = i.value.split('/')
					let pkg = org
					if (org[0] === '@') {
						pkg = `${org}/${pathArr.shift()}`
					}
					const lockedVersion = versionLock[pkg]
					if (lockedVersion) pkg = `${pkg}@${lockedVersion}`
					i.value = joinURL(cdn, pkg, ...pathArr)
				}
			}

			const transformed = splitted.join('')

			const response = new Response(transformed, resp)
			response.headers.set('Content-Length', transformed.length)

			return response
		}))

		return {init, accept, handle}
	}

	return factory
})(self)