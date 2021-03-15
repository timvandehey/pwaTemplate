<script>
    import { server } from "./server.js";
    import { log } from "./utils.js";
    import Icon from "./Icon.svelte";
    import { user } from "./store";
    let open = false;
    let data = [];
    let retrieving = false;
    let request = {};
    $: tests = [
        ["testData", "read"],
        ["testDataXXX", "read"],
        ["testData", "read", [1022]],
        [
            "testData",
            "create",
            [
                {
                    string: "2||4||pat",
                    number: 123,
                    boolean: true,
                    array: [2, 5, "tim"],
                    object: {},
                    text: "multi\nline",
                    datetime: new Date(),
                    date: new Date("2019-12-28"),
                    time: new Date(0, 0, 0, 10, 0, 0),
                },
            ],
        ],
        [, "a"],
        ["", "login"],
        [, "initializeMetaData"],
        ["", "invalidFunctionName"],
    ];

    async function getDataFromExpress() {
        retrieving = true;
        open = false;
        // const { fn, params } = value;
        const auth = `Bearer ${$user.jwt}`;
        // log({ cookie });
        // document.cookie = cookie;
        const result = await fetch("/json?x=6&y=8&y=10", {
            method: "GET",
            headers: {
                Authorization: auth,
            },
        }).then((res) => res.json());
        data = {
            ...result,
            extra: {
                logs: [],
                request: { postData: { contents: '["Express"]' } },
            },
        };
        log({ data });
        retrieving = false;
        open = true;
        return data;
    }

    async function getData() {
        retrieving = true;
        open = false;
        // const { fn, params } = value;
        data = await server(...request);
        //     .catch((e) => {
        //     log(123, e);
        //     return e;
        // });
        retrieving = false;
        open = true;
    }

    function theParameters(params) {
        if (typeof params == "object") return JSON.stringify(params);
        return params;
    }
</script>

<select bind:value={request} onchange={getData}>
    <option value={{}} selected>Select a test...</option>
    {#each tests as test}
        <option value={test}>{JSON.stringify(test)}</option>
    {/each}
</select>
<button on:click={getData}>Go</button>
{#if retrieving}
    <pre>getting data ...</pre>
{/if}
{#if open}
    <pre><Icon
            i="input" /> {JSON.stringify(JSON.parse(data.extra.request.postData.contents), null, 2)}</pre>

    <pre><Icon i="output" /> {JSON.stringify(data, null, 2)}</pre>
    <pre><Icon i="log" />
{data.extra.logs}</pre>
{/if}
