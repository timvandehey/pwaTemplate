<script>
	import Google from "./Google.svelte";
	import { user } from "./store";
	import { log } from "./utils";
	import Icon from "./Icon.svelte";
	import Apitest from "./Apitest.svelte";
	function gotUser(event) {
		const { detail: gUser } = event;
		gUser.auth = true;
		gUser.jwt = gUser.idToken;
		gUser.timezone = {
			simple: new Date().toTimeString().slice(9),
			city: Intl.DateTimeFormat().resolvedOptions().timeZone,
			offset: new Date().getTimezoneOffset() / -60,
		};
		user.set(gUser);
	}
</script>

<h1>Svelte PWA Template<Icon>circle</Icon><Icon /></h1>
<span style="color:red;"><Icon>open_in_new</Icon></span>
{#if !$user.auth}
	<h1>Checking Authentication...</h1>
{/if}
<!-- <button on:click={signout}>Signout</button> -->
<Apitest />
<Google on:gotUser={gotUser} />

<style>
	:global(:root) {
		--primary: #0373fc;
		--secondary: green;
		--lightsecondary: lightgreen;
		--warning: yellow;
		--danger: red;
		--white: white;
		--offwhite: lightgrey;
		--black: black;

		--border-radius: 0.4em;
	}

	/* :global(.icon) {
		display: inline-flex;
		align-self: center;
	}

	:global(svg) {
		fill: currentColor;
		top: 0.125em;
		position: relative;
	} */

	/* :global(.icon svg) {
		height: 1em;
		width: 1em;
		fill: currentColor;
	}

	:global(.icon.baseline svg) {
		top: 0.125em;
		position: relative;
	} */
</style>
