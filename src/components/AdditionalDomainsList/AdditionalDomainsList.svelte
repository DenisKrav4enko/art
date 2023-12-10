<script>
    import { suggestionsStore } from "../../store/store.js";
    import {onDestroy} from "svelte";
    import DomainCardDetails from "../DomainCardDetails/DomainCardDetails.svelte";
    import { pxToEm, css } from "../../utils";

    export let domainsList = [];
    let selectedDomainIndex = null;

    const unsubscribeSuggestionsStore = suggestionsStore.subscribe(items => {
        domainsList = items
    });

    onDestroy(() => {
        unsubscribeSuggestionsStore()
    })

    function handleOnMoreClick(index) {
        selectedDomainIndex = index;
    }
</script>




<div class="domain-list">
    {#if domainsList.length > 0}
        {#each domainsList as domain, index (domain.name)}
            {#if domain.price !== null && domain.available}
                {#if selectedDomainIndex === index}
                    <DomainCardDetails selectedDomain={domain} />
                {:else}
                    <div
                            use:css={{
                                border: `${pxToEm(1)}em solid #dddddd`,
                                'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`
                            }}
                            class="domain-item"
                            on:click={() => handleOnMoreClick(index)}
                    >
                            {#if domain.premium}
                                <p class="premium tag">Premium</p>
                            {/if}
                            {#if domain.reserved}
                                <p class="reserved tag">Reserved</p>
                            {/if}
                            {#if domain.bought}
                                <p class="bought tag">Bought</p>
                            {/if}

                        <div class="domain-info">
                            <h2 class="domain-title">{domain.name}</h2>
                            <h2 class="domain-price">${domain.price}</h2>
                        </div>
                    </div>
                {/if}
            {/if}
        {/each}
    {:else}
        <p>No domains to display</p>
    {/if}
</div>

<style>
    .domain-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }

    .domain-item {
        padding: 0 0 0 1em;
        margin: 0 1em;
        background-color: #fff;
        text-align: left;
        width: 100%;
    }

    .domain-item:first-child {
        border-radius: 0.13em 0.13em 0 0;
    }

    .domain-item:last-child {
        border-radius: 0 0 0.13em 0.13em;
    }

    .domain-info {
        display: flex;
        justify-content: space-between;
        padding-right: 2em;
    }

    .domain-title {
        font-size: 0.43em;
        color: #333;
    }

    .domain-price {
        font-size: 0.43em;
        color: #333;
        font-weight: bold;
    }

    .tag {
        padding: 0.25em 0.5em;
        border-radius: 0.06em;
        font-weight: bold;
        display: inline-block;
        margin-right: 0.5em;
        text-transform: uppercase;
    }

    .premium {
        background-color: #1e90ff;
        color: #fff;
    }

    .reserved {
        background-color: #ffb6c1;
        color: #333;
    }

    .bought {
        background-color: #90ee90;
        color: #333;
    }

    p {
        display: inline-block;
        /*margin: 0.5em 0;*/
        margin: 0;
        font-size: 0.25em;
        color: #666;
    }
</style>