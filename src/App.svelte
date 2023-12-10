<script>
	import Header from "./components/Header/Header.svelte";
	import CardContainer from "./components/Card/CardContainer.svelte";
	import AdditionalDomainsList from "./components/AdditionalDomainsList/AdditionalDomainsList.svelte";
	import Filters from "./components/Header/components/Filters.svelte";
	import { pxToEm, css } from './utils'
	import { suggestionsTypeStore } from './store/store.js'
	import { onDestroy } from "svelte";

	let title = 'art'
	export let searchType = ''

	const unsubscribeSuggestionsTypeStore = suggestionsTypeStore.subscribe(items => {
		searchType = items
	});


	onDestroy(() => {
		unsubscribeSuggestionsTypeStore()
	})
</script>

<main >
	<div class="block">
		<h1 use:css={{fontSize: `${pxToEm(60)}em`}}>
			{title.toUpperCase()}
		</h1>

		<Header />

		{#if searchType === 'premium'}
			<Filters />
		{/if}

		<CardContainer />
		<AdditionalDomainsList />
	</div>
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
		font-size: calc(100% / 10);
	}

	h1 {
		color: #1064e3;
		font-weight: 700;
		font-family: sans-serif;
	}

	.block {
		font-family: sans-serif;
		font-weight: bold;
		text-align: center;
		vertical-align: center;
	}

	@media only screen and (max-width: 375px) {
		.block {
			padding-top: 0.4em;
		}
	}
</style>