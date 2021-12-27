import { browser, setGlobalCtx } from 'https://cdn.skypack.dev/singui'
import { setup } from 'https://cdn.skypack.dev/twind'
import colors from 'https://cdn.skypack.dev/tailwindcss/colors'

const ctx = browser()

setGlobalCtx(ctx)

setup({
	theme: {
		extend: {
			colors: {
				sky: colors.sky,
				cyan: colors.cyan,
				neutral: colors.neutral,
				fuchsia: colors.fuchsia,
				emerald: colors.emerald,
				indigo: colors.indigo
			},
			fontFamily: {
				'fugaz-one': ['Fugaz One', 'cursive'],
				'pattaya': ['Pattaya', 'cursive']
			}
		}
	}
})
