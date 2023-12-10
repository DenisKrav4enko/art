<script>
    export let selectedDomain;
</script>

<div class="domain-card">
    <div>
        {#if selectedDomain.premium}
            <p class="premium tag">Premium Domain</p>
        {/if}
        {#if selectedDomain.reserved}
            <p class="reserved tag">Reserved</p>
        {/if}
        {#if selectedDomain.bought}
            <p class="bought tag">Bought</p>
        {/if}
    </div>

    <h2 class="card-title">{selectedDomain.name}</h2>
    <p class="{selectedDomain.premium ? 'price__premium' : 'price__standard'} price">${selectedDomain.price}</p>
    <p class="{selectedDomain.available ? 'available' : 'unavailable'}">{selectedDomain.available ? 'Available' : 'Unavailable'}</p>
</div>

<style>
    .domain-card {
        width: 100%;
        border: 0.01em solid #ddd;
        border-radius: 0.15em;
        padding: 0.5em 0.5em 0.5em 1em;
        margin: 0.5em 1em;
        box-shadow: 0 0.04em 0.15em rgba(0, 0, 0, 0.1);
        background-color: #fff;
        text-align: left;
    }

    .card-title {
        font-size: 1.5rem;
        color: #333;
    }

    p {
        display: inline-block;
        margin: 0.5em 0;
        font-size: 1rem;
        color: #666;
    }

    .tag {
        color: #333;
        padding: 0.25em 0.5em;
        border-radius: 0.25em;
        font-weight: bold;
        display: inline-block;
        margin-right: 0.5em;
    }

    .premium {
        background-color: #f0e68c;
    }

    .reserved {
        background-color: #ffb6c1;
    }

    .bought {
        background-color: #90ee90;
    }

    .available {
        color: #008000;
        font-weight: bold;
    }

    .unavailable {
        color: #ff0000;
        font-weight: bold;
    }

    .price {
        color: #333;
        font-weight: bold;
        padding: 0.5em;
        border-radius: 0.25em;
    }

    .price__premium {
        background-color: #f0e68c;
    }

    .price__standard {
        background-color: #fff;
    }
</style>
