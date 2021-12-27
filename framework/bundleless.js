self.bundleless = self.bundleless || ((self) => {
	const version = 'v0.0.0-dev.17'

	self.addEventListener('install', () => {
		console.log(`--- bundleless ${version} INSTALLED ---`)
	})

	self.addEventListener('activate', (e) => {
		e.waitUntil(self.clients.matchAll({includeUncontrolled: true})
		.then((clients) => {
			for (let client of clients) {
				client.postMessage({scope: 'bundleless', channel: 'broadcast', message: 'actived'})
			}
		}))
	})

	const dummyHandler = req => fetch(req)
	const dummyAccept = (req, resp) => {
		if (resp) return true
		return false
	}

	const bundleless = ({
		plugins = [],
		addXPoweredBy = true
	} = {}) => {
		plugins = plugins.filter(i => i)

		if (!plugins.length) return dummyHandler

		const beforeHooks = []
		const handlers = []
		const afterHooks = []
		const catchHooks = []

		for (let {before, accept, handle, after, catchErr} of plugins) {
			if (before) beforeHooks.push(before)
			if (handle) handlers.push({accept: accept || dummyAccept, handle})
			if (after) afterHooks.push(after)
			if (catchErr) catchHooks.push(catchErr)
		}

		const handleResponse = (request, response) => {
			let responseToSend = null

			const send = (resp) => {
				responseToSend = resp.clone()
			}

			const runBeforeHook = (cursor) => {
				const hook = beforeHooks[cursor]
				if (!hook) return
				return Promise.resolve(hook(request, send))
				.then((resp) => {
					if (responseToSend) return responseToSend
					return resp || runBeforeHook(cursor + 1)
				})
			}

			const runHandler = (cursor, resp) => {
				const handler = handlers[cursor]
				if (!handler) return resp
				return Promise.resolve(handler.accept(request, resp.clone()))
				.then((accepted) => {
					if (accepted) return handler.handle(request, resp, {send, accepted})
					return resp
				})
				.then((resp) => {
					if (responseToSend) return responseToSend
					return runHandler(cursor + 1, resp)
				})
			}

			const runAfterHook = (cursor, resp) => {
				const hook = afterHooks[cursor]
				if (!hook) return resp
				return Promise.resolve(hook(request, resp))
				.then(resp => runAfterHook(cursor + 1, resp))
			}

			response = Promise.resolve(response || runBeforeHook(0))
			.then((resp) => {
				if (responseToSend) return responseToSend
				return Promise.resolve(resp || fetch(request))
				.then(resp => runHandler(0, resp)
				.then((resp) => {
					if (responseToSend) return responseToSend
					return Promise.resolve(runAfterHook(0, resp))
				}))
			})

			response = catchHooks
			.reduce((prev, cur) => prev
			.catch(err => cur(err, request)), response)

			if (addXPoweredBy) {
				response = response.then((resp) => {
					if (resp.status === 0) return resp

					const modifiedResponse = new Response(resp.body, resp)
					modifiedResponse.headers.append('X-Powered-By', 'bundleless')
					return modifiedResponse
				})
			}

			return response
		}

		for (let {init} of plugins) {
			if (init) init({
				beforeHooks,
				handlers,
				afterHooks,
				catchHooks,
				handleResponse
			})
		}

		return handleResponse
	}

	return bundleless
})(self)