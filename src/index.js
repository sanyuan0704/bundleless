import '../setup.js'
import { tw } from 'https://cdn.skypack.dev/twind'
import { build, tags, attr, text, useElement } from 'https://cdn.skypack.dev/singui'
import ReactDOM from 'https://cdn.skypack.dev/react-dom'

import HelloWorldEf from './hello-world.eft'
import HelloWorldReact from './hello-world.tsx'

const useTwind = (...args) => {
	attr.class = tw(...args)
}

const twinded = new Proxy(tags, {
	get(target, propName) {
		if (propName[0] === '$') {
			propName = propName.slice(1)
			const node = Reflect.get(target, propName)
			return (className, builder, append) =>
				node((...args) => {
					if (className) useTwind(className)
					if (builder) builder(...args)
				}, append)
		}
		return Reflect.get(target, propName)
	}
})

const mdIcon = (() => {
	const {span} = tags

	return (ligature, ...classNames) => {
		span(() => {
			attr.class = ['material-icons', ...classNames].join(' ')
			text(ligature)
		})
	}
})()

const linkBtn = (() => {
	const { $a } = twinded

	return (urlText, url) =>
		build(() => {

			let open = null

			$a(`text(lg white) font(bold) bg(gradient-to-br) from-sky-400 to-blue-500) rounded-lg p-3 m-3`, () => {
				const el = useElement()
				attr.href = url
				attr.target = '_blank'
				text(urlText)
				open = () => {
					el.click()
				}
			})

			return open
		})
})()

const codeBlock = (() => {
	const {$a, $div, $p} = twinded

	return (title, url, builder) => {
		$p('mb-6', () => {
			$div('font-bold font-fugaz-one', () => {
				text(title)
				$a('ml-3', () => {
					mdIcon('raw_on', tw`align-bottom mr-1`)
					attr.href = `${url}?uRaw=text/plain`
					attr.target = '_blank'
				})
				$a('ml-2', () => {
					mdIcon('raw_off', tw`align-bottom mr-1`)
					attr.href = `${url}?uMIME=text/plain`
					attr.target = '_blank'
				})
			})
			$div('container', builder)
		})
	}
})()

const app = target =>
	build(({ attach, detatch }) => {
		const { $div, $span, $p } = twinded

		$div('h-screen w-screen bg-gradient-to-br from-gray-900 to-neutral-700 fixed -z-[9999999]')

		$div('text-gray-300 min-h-screen flex flex-col items-center justify-center p-6', () => {
			$div('text-8xl font-pattaya font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-600 to-pink-600 relative mb-6', () => {
				text('bundleless')
				$span('text-2xl absolute right-0 -top-1 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600', () => {
					text('.js')
				})
			})
			$div('text-5xl text-center font-fugaz-one text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-10', () => {
				text('Bundleless Modern Frontend Pioneer')
			})
			$div('mb-10', () => {
				linkBtn('Learn more', '#')
				linkBtn('Get early access', 'https://github.com/TheNeuronProject/BACKERS/blob/main/README.md')
			})

			$div('', () => {
				$div('text-2xl font-fugaz-one mb-3', () => {
					text('Build web apps within your browser - production ready*')
				})

				codeBlock('From React', '/src/hello-world.tsx', () => {
					const el = useElement()
					ReactDOM.render(HelloWorldReact, el)
				})

				codeBlock('From ef.js', '/src/hello-world.eft', () => {
					const el = useElement()
					const myHelloWorld = new HelloWorldEf()
					myHelloWorld.$mount({target: el})
				})

				codeBlock('From SingUI', '/index.js', () => {
					text('The whole site is constructed with SingUI!')
				})

				$p('mb-6', () => {
					$div('font-bold font-fugaz-one', () => {
						text('More to ...')
					})
				})
			})
		})

		// Attach the component to target
		if (target) attach(target)

		return { attach, detatch }
	})

// Mount to body
app(document.querySelector('#app'))
