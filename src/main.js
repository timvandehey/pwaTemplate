import { log } from "./utils.js"
import App from "./App.svelte"


const app = new App({
	target: document.body,
	props: {
	}
})

log(dev ? 'in Development' : 'in Production')

document.title = `${dev ? 'Dev - ' : ''}${document.title}`

export default app;