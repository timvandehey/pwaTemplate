
import { user } from './store'
import { log } from './utils'
import { get } from 'svelte/store'
import { API_URL } from './secrets'

const currentUser = () => get(user)

export async function server (dbName = '', fnName = 'echo', fnArgsArray = []) {
    const url = API_URL
    const request = {
        user: currentUser()
        , dbName
        , fnName
        , args: fnArgsArray
    }
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(request)
    })
        .then(res => res.json())
    log(1, response)
    if (response.hadError) {
        // if (response.error.type == 'userPwdError') user.set({ ...noAuth, ...response.error })
        log(response.error)
    }
    return response
}