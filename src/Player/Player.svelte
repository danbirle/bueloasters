<script>
	export let name;
	export let id = 1;
	export let health;
	export let flipOpponent = 'transform: scale(-1)'
	
	import Card from './../Card/Card.svelte';

	function shuffle(cards) {
		for(let i = cards.length - 1; i > 0; i--){
			const j = Math.floor(Math.random() * i);
			const temp = cards[i];
			cards[i] = cards[j];
			cards[j] = temp;
		}

		return cards;
	}

	//mockCards
	let cards = shuffle([
		{
			id: 1,
			name: 'AquaRanger',
			element: 'water',
			damage: 3000,
			manaCost: 6,
			role: 'deck',
			abilities: {
				unBlockable: true,
				unDying: true,
			}
		},
		{
			id: 2,
			name: 'EmperorQuazla',
			element: 'water',
			damage: 5000,
			manaCost: 6,
			role: 'deck',
			abilities: {
				blocker: true,
				evolution: true,
			}
		},
		{
			id: 3,
			name: 'KachuaKeeperoftheIcegate',
			element: 'grass',
			damage: 3000,
			manaCost: 7,
			role: 'deck'
		},
		{
			id: 4,
			name: 'KuukaiFinderofKarma',
			element: 'light',
			damage: 10500,
			manaCost: 5,
			role: 'deck',
			abilities: {
				blocker: true,
				evolution: true,
			}
		},
		{
			id: 5,
			name: 'MagmadragonJagalzor',
			element: 'fire',
			damage: 6000,
			manaCost: 6,
			role: 'deck',
			abilities: {
				doubleBreaker: true,
				charge: true,
			}
		},
		{
			id: 6,
			name: 'MegariaEmpressofDread',
			element: 'darkness',
			damage: 5000,
			manaCost: 5,
			role: 'deck'
		},
		{
			id: 7,
			name: 'MigaloVizierofSpycraft',
			element: 'light',
			damage: 1500,
			manaCost: 2,
			role: 'deck',
		},
		{
			id: 8,
			name: 'SuperNecrodragonAbzoDolba',
			element: 'darkness',
			damage: 11000,
			manaCost: 6,
			role: 'deck',
			abilities: {
				tripleBreaker: true,
				evolution: true,
			}
		},
	]);

	function generateShields(givenHealth) {
		const shieldCards = cards.filter(card => cards.indexOf(card) < givenHealth - 1);
		cards = cards.filter(card => cards.indexOf(card) < givenHealth - 1);
		return shieldCards;
	};
	function generateHand() {
		const shieldCards = cards.filter(card => cards.indexOf(card) < 5);
		cards = cards.filter(card => cards.indexOf(card) < 5);
		return shieldCards;
	};

	let shieldCards = generateShields(health);
	let handCards = generateHand();
	let manaCards = [];
	let battleCards = [];
	let deckCards = cards;

	let selected = '';
	const setSelected = (value) => {
		selected = value;
	};
	const setRole = (source, target) => {
		console.log('!R', source);
		console.log('!R', target);
	};
	const moveSelectedToMana = (selectedCard) => {
		manaCards.push(selectedCard);
		handCards.filter((handCard) => handCards.indexOf(handCard) === -1);
	}
</script>

<style>
	.player {
		display: grid;
		height: 50%;
		grid-gap: 10px;
		grid-template-areas:
			"gBattle gBattle gBattle gBattle gBattle gBattle gBattle"
			"gGraveyard gPlayer gPlayer gPlayer gPlayer gPlayer gDeck"
			"gMana gMana gMana gMana gMana gMana gMana"
			"gHand gHand gHand gHand gHand gHand gHand";
	}
	section {
		display: grid;
		background: url(card_back.jpg) no-repeat;
		background-size: contain;
		grid-area: auto;
		color: greenyellow;
		text-shadow: 1px 1px 1px darkmagenta
	}
	section.gMana {
		grid-area: gMana;
	}
	section.gGraveyard {
		grid-area: gGraveyard;
	}
	section.gBattle {
		grid-area: gBattle;
	}
</style>

<main class='player' style={id === 2 ? flipOpponent : ''}>
	{#each handCards as handCard}
		 <Card
		 	role='hand'
			id={handCard.id}
		 	selected={selected}
			setSelected={setSelected}
			name={handCard.name} />
	{/each}
	<section class='gMana' on:click={() => {
		console.log('!R selected: ', selected);
		moveSelectedToMana(selected);
		setSelected('');
	}}></section>
	{#each manaCards as manaCard}
		<Card
			role='mana'
			id={manaCard.id}
			selected={selected}
			setSelected={setSelected}
			name={manaCard.name} />
	{/each}
	{#each shieldCards as shieldCard}
		 <Card role='shield' name={shieldCard.name} />
	{/each}
	<section class='gBattle'>Battle zone</section>
	<section class='gGraveyard'>Graveyard</section>
	{#each deckCards as deckCard}
		 <Card role='deck' name={deckCard.name} />
	{/each}
</main>