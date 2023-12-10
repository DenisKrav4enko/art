<script>
    import {suggestionsDomain} from '../../../functions/actions/suggestionsDomain.js'
    import {searchNamesStore, setFiltersStore} from "../../../store/store.js";
    import {onDestroy} from "svelte";

    let nameMatch = 'partial';
    let available = false;
    let reserved = false;
    let referral = false;
    let limitRange = 20;
    let offsetRange = 0;

    export let domain = ''

    const unsubscribeSearchNamesStore = searchNamesStore.subscribe(items => {
        domain = items
    });

    onDestroy(() => {
        unsubscribeSearchNamesStore()
    });

    const handleSubmit = async () => {
        const filters = {
            nameMatch,
            available,
            reserved,
            referral,
            limitRange,
            offsetRange,
        };
        await suggestionsDomain(domain, searchType, filters);
        setFiltersStore({filters });
    };
</script>

<div class="main">
    <div class="flex">
        <div class="filter-name">
            Name Match:
        </div>

        <div class="filter-choice">
            <label>
                <input type="radio" bind:group={nameMatch} value="partial" />
                Partial
            </label>
            <label>
                <input type="radio" bind:group={nameMatch} value="start" />
                Start
            </label>
            <label>
                <input type="radio" bind:group={nameMatch} value="end" />
                End
            </label>
        </div>
    </div>

    <div class="flex">
        <label for="available"  class="filter-name">
            Available
        </label>
        <div  class="filter-choice">
            <input id="available" type="checkbox" bind:checked={available} />
        </div>
    </div>

    <div class="flex">
        <label class="filter-name" for="reserved">
            Reserved
        </label>
        <div  class="filter-choice">
            <input type="checkbox" id="reserved" bind:checked={reserved} />
        </div>
    </div>

    <div class="flex">
        <label for="referral" class="filter-name">
            Referral
        </label>
        <div  class="filter-choice">
            <input type="checkbox" id="referral" bind:checked={referral} />
        </div>
    </div>

    <div >
        <label for="limitRange">
            Limit: {limitRange}
        </label>
            <input
                    type="range"
                    id="limitRange"
                    bind:value={limitRange}
                    min={0}
                    max={20}
            />
    </div>
    <div  class="daisy-ui">
        <label for="offsetRange">
            Limit: {offsetRange}
        </label>
        <input
                type="range"
                id="offsetRange"
                bind:value={offsetRange}
                min={0}
                max={20}
        />
    </div>
    <div class="flex">
        <button on:click={handleSubmit}>Apply Filters</button>
    </div>
</div>

<style>
    .main {
        margin: 4em;
        background-color: #fff;
        font-size: 0.25em;
        width: fit-content;
        border-radius: 0.5em;
        padding: 4em;
        border: 0.013em solid #dddddd;
        box-shadow: 0 0.25em 1em rgba(0, 0, 0, 0.1);
    }

    .flex {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 1em;
        margin: 1em 0;
    }

    .filter-name {
        text-align: right;
        width: 7em;
    }

    .filter-choice {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 6em;
    }

    button {
        display: block;
        padding: 0.5em 1em;
        background-color: #1e90ff;
        color: #fff;
        border: none;
        border-radius: 0.25em;
        cursor: pointer;
    }
</style>

