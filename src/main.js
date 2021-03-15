import { prod, user } from './store'
import { log } from "./utils"
// import { getUser } from "./google"
// import { server } from './server'
import App from "./App.svelte"

// window.startApp = async () => {
// 	getGoogleUser().then(startApp)
// }
// async function getGoogleUser () {
// 	const gUser = await getUser().catch(() => (window.location = "/"));
// 	console.log(gUser)
// 	return gUser
// user.set({ ...$user, jwt: gUser.idToken });
// const response = await server({
// 	fn: "login",
// 	params: { idToken: gUser.idToken },
// });
// if (response.error) {
// 	window.location = '/';
// }
// user.set(response.value);
// updateActivePanel(homePanelId);
// }

// function startApp (gUser) {
// gUser.timezone = {
// 	simple: new Date().toTimeString().slice(9)
// 	, city: Intl.DateTimeFormat().resolvedOptions().timeZone
// 	, offset: new Date().getTimezoneOffset() / -60
// }
// user.set(gUser)
// document.body.innerHTML = ''
const app = new App({
	target: document.body,
	props: {
	}
})

log(prod ? 'in Production' : 'In Development')
document.title = `${prod ? '' : 'Dev - '}${document.title}`
// }
export default app;