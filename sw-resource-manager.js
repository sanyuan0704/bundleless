((self) => {
	if (self.__importScripts) return

	self.__importScripts = self.importScripts
	if (!self.__resources) self.__resources = {}

	const importScriptsOriginal = self.__importScripts
	const srcMap = self.__resources

	const usedSrcs = new Set()

	const importScripts = (...srcs) => {
		for (let src of srcs) {
			if (self.dev) usedSrcs.add(src)
			// eslint-disable-next-line no-eval
			if (srcMap[src]) eval(srcMap[src])
			else importScriptsOriginal(src)
		}
	}

	if (self.dev) {
		self.addEventListener('message', (e) => {
			if (e.data === 'GenerateUsedResourceMap') {
				Promise.all(Array.from(usedSrcs)
				.map(requestedURL => fetch(requestedURL)
				.then(resp => resp.text())
				.then(source => [requestedURL, source])))
				.then(results => Object.fromEntries(results))
				.then(resultMap => `((self) => {
	if (!self.__resources) self.__resources = {}
	Object.assign(self.__resources, JSON.parse(${JSON.stringify(JSON.stringify(resultMap))}))
})(self)`)
				.then(source => e.source.postMessage({
					scope: 'sw-resource-manager',
					channel: 'get-resource-map',
					message: {
						source
					}
				}))
			}
		})
	}

	self.importScripts = importScripts
})(self)