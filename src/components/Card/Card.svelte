<script>
    import { pxToEm, css } from "../../utils/index.js";

    export  let item
</script>


<div
        use:css={{
            border: `${pxToEm(1)}em solid #dddddd`,
            'border-radius': `${pxToEm(8)}em`,
            padding: `${pxToEm(30)}em ${pxToEm(30)}em ${pxToEm(30)}em ${pxToEm(60)}em`,
            margin: `${pxToEm(30)}em`,
            'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`,
        }}
        class="domain-card"
>
    <div>
        {#if item.premium}
            <p class="premium tag">Premium Domain</p>
        {/if}
        {#if item.reserved}
            <p class="reserved tag">Reserved</p>
        {/if}
        {#if item.bought}
            <p class="bought tag">Bought</p>
        {/if}
    </div>

    <h2
            use:css={{
                'font-size': `${pxToEm(45)}em`
            }}
            class="card-title"
    >
        {item.name}
    </h2>
    <p class="{item.premium ? 'premium' : 'standard'}">${item.price}</p>
    <p class="{item.available ? 'available' : 'unavailable'}">{item.available ? 'Available' : 'Unavailable'}</p>
</div>


<style>
    .domain-card {
        background-color: #fff;
        text-align: left;
    }

    .card-title {
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

    .premium-tag {
        background-color: #f0e68c;
    }

    .reserved-tag {
        background-color: #ffb6c1;
    }

    .bought-tag {
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

    .premium {
        background-color: #f0e68c;
        color: #333;
        font-weight: bold;
        padding: 0.5em;
        border-radius: 0.25em;
    }

    .standard {
        background-color: #fff;
        color: #333;
        font-weight: bold;
        padding: 0.5em;
        border-radius: 0.25em;
    }
</style>