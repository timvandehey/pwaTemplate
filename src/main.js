import { log } from "./utils.js"
import App from "./App.svelte"


const app = new App({
	target: document.body,
	props: {
	}
})

log(isProduction ? 'in Production' : 'In Development')

document.title = `${isProduction ? '' : 'Dev - '}${document.title}`

export default app;