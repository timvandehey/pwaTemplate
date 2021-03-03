
import { user, noAuth } from './store'
import { log } from './utils'
import { get } from 'svelte/store'

const jwt = () => get(user).jwt

export async function server (request) {
    const url =
        `https://script.google.com/macros/s/AKfycbya4Lt5XG7upra-dUMX5BD50YKbCjhuWx_NvIT4nI2eeZh58H6G/exec?jwt=${jwt()}`
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(request)
    })
        .then(res => res.json())
    log(1, response)
    if (response.hadError) {
        if (response.error.type == 'userPwdError') user.set({ ...noAuth, ...response.error })
        log(response.error)
    }
    return response
}