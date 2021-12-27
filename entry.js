if ('serviceWorker' in navigator) {
	const loadingScreen = document.querySelector('#loading-screen')

	let appStarted = false

	const loadMainScript = () => {
		if (!appStarted) {
			import('./src/index.js')
			.then(() => {
				appStarted = true
				loadingScreen.remove()
			})
		} else {
			location.reload()
		}
	}

	if (navigator.serviceWorker.controller) {
		loadMainScript()
	} else {
		loadingScreen.innerHTML = `
<svg id="spinner" style="position: fixed; left: 50%; top: 50%; transform: translateX(-50%) translateY(-50%);" width="60" height="60" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="#2263fe">
	<g fill="none" fill-rule="evenodd" stroke-width="2">
		<circle cx="22" cy="22" r="1">
			<animate attributeName="r"
				begin="0s" dur="1.8s"
				values="1; 20"
				calcMode="spline"
				keyTimes="0; 1"
				keySplines="0.165, 0.84, 0.44, 1"
				repeatCount="indefinite" />
			<animate attributeName="stroke-opacity"
				begin="0s" dur="1.8s"
				values="1; 0"
				calcMode="spline"
				keyTimes="0; 1"
				keySplines="0.3, 0.61, 0.355, 1"
				repeatCount="indefinite" />
		</circle>
		<circle cx="22" cy="22" r="1">
			<animate attributeName="r"
				begin="-0.9s" dur="1.8s"
				values="1; 20"
				calcMode="spline"
				keyTimes="0; 1"
				keySplines="0.165, 0.84, 0.44, 1"
				repeatCount="indefinite" />
			<animate attributeName="stroke-opacity"
				begin="-0.9s" dur="1.8s"
				values="1; 0"
				calcMode="spline"
				keyTimes="0; 1"
				keySplines="0.3, 0.61, 0.355, 1"
				repeatCount="indefinite" />
		</circle>
	</g>
</svg>

	`
	}

	navigator.serviceWorker.register('/sw.js', {scope: '/'}).then((reg) => {
		navigator.serviceWorker.addEventListener('message', (e) => {
			if (e.data && e.data.scope === 'bundleless' && e.data.message === 'actived') {
				navigator.serviceWorker.ready
				.then(() => {
					loadMainScript()
				})
			}
		})
	})

	const getResourceMapHandler = (e) => {
		if (e.data && e.data.scope === 'sw-resource-manager' && e.data.channel === 'get-resource-map') {
			navigator.serviceWorker.removeEventListener('message', getResourceMapHandler)

			const {source} = e.data.message

			const sourceBlob = new Blob([source], {type: 'application/javascript'})
			const sourceURL = URL.createObjectURL(sourceBlob)

			const downloadFileElement = document.createElement('a')
			downloadFileElement.download = 'resource.js'
			downloadFileElement.href = sourceURL
			downloadFileElement.click()
		}
	}

	window.getServiceWorkerResourceMap = () => {
		navigator.serviceWorker.addEventListener('message', getResourceMapHandler)
		navigator.serviceWorker.controller.postMessage('GenerateUsedResourceMap')
	}
} else {
	const warn = document.createElement('h1')
	warn.textContent = 'Your browser doesn\'t seem to support service worker. Upgrade your browser or turn off Private Mode if you are using FireFox.'

	document.body.querySelector('#app').appendChild(warn)
}