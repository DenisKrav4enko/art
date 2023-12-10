<script lang="js">
    import { checkDomains } from '../../functions/actions/checkDomains.js';
    import { pxToEm, css } from '../../utils'
    import {setSearchNamesStore, setSuggestionsType} from '../../store/store.js'

    let searchValue = '123, test art, love';
    let searchType = 'default';

    const handleSubmit = () => {
        searchValue.length && checkDomains(searchValue, searchType)
    }

    $: setSuggestionsType(searchType);
    $: setSearchNamesStore(searchValue);
</script>

<main
        use:css={{
            padding: `${pxToEm(30)}em`,
            border: `${pxToEm(1)}em solid #dddddd`,
            'border-radius': `${pxToEm(8)}em`,
            'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`,
            margin: `${pxToEm(60)}em`
        }}
        class="search-form-container"
>
    <form class="search-form" on:submit|preventDefault={handleSubmit}>
        <input
                use:css={{
                    padding: `${pxToEm(60)}em`,
                    border: `${pxToEm(1)}em solid #dddddd`,
                    'border-radius': `${pxToEm(30)}em 0 0 ${pxToEm(30)}em`,
                    'font-size': `${pxToEm(16)}em`
                }}
                class="search-input"
                type="text"
                bind:value={searchValue}
                placeholder="Find your domain"
        >
        <button
                use:css={{
                    padding: `${pxToEm(60)}em`,
                    border: `${pxToEm(1)}em solid #1e90ff`,
                    'border-radius': `0 ${pxToEm(30)}em ${pxToEm(30)}em 0`,
                    'font-size': `${pxToEm(16)}em`,
                }}
                class="search-button"
                type="submit"
        >
            Search Domains
        </button>
    </form>
    <div
            use:css={{
                left: `${pxToEm(30)}em`,
                bottom: `${pxToEm(-38)}em`
            }}
            class="tab-container"
    >
        <label
                for="default"
                class:active={searchType === 'default'}
        >
            <input type="radio" id="default" bind:group={searchType} value="default">
            🌐 Default
        </label>
        <label
                for="ai"
                class:active={searchType === 'ai'}
        >
            <input type="radio" id="ai" bind:group={searchType} value="ai">
            🧠 AI help
        </label>
        <label
                for="premium"
                class:active={searchType === 'premium'}
        >
            <input type="radio" id="premium" bind:group={searchType} value="premium">
            💎 onlyPrems
        </label>
    </div>
</main>

<style>
    .search-form-container {
        position: relative;
        background-color: #fff;
    }

    .search-form {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .search-input {
        flex: 1;
        margin: 0;
    }

    .search-button {
        display: block;
        background-color: #1e90ff;
        color: #fff;
        margin: 0;
        cursor: pointer;
        white-space: nowrap;
    }

    .tab-container {
        position: absolute;
        display: flex;
        justify-content: center;
    }

    .tab-container label {
        padding: 0.5em;
        cursor: pointer;
        border: 0.016em solid #ddd;
        border-radius: 0 0 0.4em 0.4em;
        background-color: #f9f9f9;
        font-size: 0.26em;
        box-shadow: inset 0 0.25em 0.5em 0 rgba(0, 0, 0, 0.1);
    }

    .tab-container label.active {
        background-color: #fff;
        border-top: none;
        box-shadow: none;
    }

    .tab-container input {
        display: none;
    }
</style>