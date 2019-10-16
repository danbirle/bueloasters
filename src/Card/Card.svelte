<script>
    export let role;
    export let name;
    export let selected;
    export let setSelected;
    export let id;

    const isCardFacingUp = 
        role==='hand' || role==='battle' || role==='mana' ?
        'background-image: url(cards/' + name + '.jpg);' :
        '';
</script>

<style>
    .card {
        grid-area: gDeck;
        background: url(card_back.jpg) no-repeat;
        background-size: contain;
        height: 100%;
    }
    .shield {
        grid-row-start: gPlayer;
        grid-row-end: gPlayer;
        grid-column: auto;
        background: lightblue;
    }
    .hand {
        grid-row: gHand;
        grid-column: auto;
    }
    .graveyard {
        grid-area: gGraveyard;
    }
    .mana {
        grid-row: gMana;
        grid-column: auto;
    }
    .battle {
		grid-area: gBattle;
    }
    button {
        width: 100%;
        height: 100%;
        border: none;
        cursor: pointer;
        background: transparent;
        background-size: contain;
        background-repeat: no-repeat;
    }
    button:disabled {
        cursor: default;
    }
    button.selected {
        border: 2px solid red;
    }
</style>

<div class='card{
    role === 'shield' ? ' shield' : ''}{
    role === 'hand' ? ' hand' : ''}{
    role === 'graveyard' ? ' graveyard' : ''}{
    role === 'mana' ? ' mana' : ''}{
    role === 'battle' ? ' battle' : ''
}'>
    <button
        class={selected && selected === id ? 'selected' : ''}
        style={isCardFacingUp}
        on:click={(event) => {
            if (role === 'hand') {
                console.log('R hand ', id);
                setSelected(id);
            }
        }}>
    </button>
</div>