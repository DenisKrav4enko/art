<script>
    import { domainsStore } from "../../store/store.js";
    import { onDestroy } from "svelte";
    import Card from "./Card.svelte";
    import { pxToEm, css } from "../../utils";

    export let itemsArray = [];

    const unsubscribeDomainsStore = domainsStore.subscribe(items => {
        itemsArray = items
    });


    onDestroy(() => {
        unsubscribeDomainsStore()
    })
</script>

<div
        use:css={{margin: `0 ${pxToEm(30)}em`}}
        class="card-container"
>
    {#each itemsArray as item (item.id + item.name)}
        <Card class="card" item={item} />
    {/each}
</div>

<style>
    .card-container {
        grid-template-columns: repeat(auto-fit, minmax(6em, 1fr));
        display: grid;
    }

    @media (max-width: 767px) {
        .card-container {
            grid-template-columns: 1fr!important;
        }
    }
</style>
