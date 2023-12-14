<script>
    import {suggestionsDomain} from '../../functions/actions/suggestionsDomain.js'
    import {searchNamesStore, setFiltersStore, suggestionsTypeStore} from "../../store/store.js";
    import {onDestroy} from "svelte";

    let initialValues = {
        nameMatch: 'partial',
        available: true,
        reserved: false,
        referral: false,
        limitRange: 20,
        offsetRange: 0,
    }

    export let domain = ''
    export let suggestionsType = ''


    const unsubscribeSearchNamesStore = searchNamesStore.subscribe(items => {
        domain = items
    });

    const unsubscribeSuggestionsTypeStore = suggestionsTypeStore.subscribe(items => {
        suggestionsType = items
    });

    onDestroy(() => {
        unsubscribeSearchNamesStore()
    });
    onDestroy(() => {
        unsubscribeSuggestionsTypeStore()
    });

    const handleSubmit = async () => {
        setFiltersStore({...initialValues});
        await suggestionsDomain(domain, suggestionsType, {...initialValues});
    };
</script>

<div class="main">
    <div class="flex">
        <div class="filter-name">
            Name Match:
        </div>

        <div class="filter-choice">
            <label>
                <input
                        type="radio"
                        value="partial"
                        bind:group={initialValues.nameMatch}
                />
                Partial
            </label>
            <label>
                <input
                        type="radio"
                        value="start"
                        bind:group={initialValues.nameMatch}
                />
                Start
            </label>
            <label>
                <input
                        type="radio"
                        value="end"
                        bind:group={initialValues.nameMatch}
                />
                End
            </label>
        </div>
    </div>

    <div class="flex">
        <label
                for="available"
                class="filter-name"
        >
            Available
        </label>
        <div  class="filter-choice">
            <input
                    id="available"
                    type="checkbox"
                    bind:checked={initialValues.available}
            />
        </div>
    </div>

    <div class="flex">
        <label
                for="reserved"
                class="filter-name"
        >
            Reserved
        </label>
        <div  class="filter-choice">
            <input
                    id="reserved"
                    type="checkbox"
                    bind:checked={initialValues.reserved}
            />
        </div>
    </div>

    <div class="flex">
        <label
                for="referral"
                class="filter-name">
            Referral
        </label>
        <div  class="filter-choice">
            <input
                    id="referral"
                    type="checkbox"
                    bind:checked={initialValues.referral}
            />
        </div>
    </div>

    <div >
        <label for="limitRange">
            Limit: {initialValues.limitRange}
        </label>
            <input
                    id="limitRange"
                    min={0}
                    max={20}
                    type="range"
                    bind:value={initialValues.limitRange}
            />
    </div>
    <div  class="daisy-ui">
        <label for="offsetRange">
            Limit: {initialValues.offsetRange}
        </label>
        <input
                id="offsetRange"
                min={0}
                max={20}
                type="range"
                bind:value={initialValues.offsetRange}
        />
    </div>
    <div class="flex">
        <button on:click={handleSubmit}>
            Apply Filters
        </button>
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

