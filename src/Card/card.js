import Card from './Card.svelte';
import player from 'player';

const card = new Card({
	target: player,
    props: {
        role = 'deck',
        setRole,
        manaCost,
        setManaCost,
        manaValue = 1,
        damage,
        setDamage,
        element,
        race,
        tapped = false,
        name,
        id,
        selected,
        setSelected,
        abilities: {
            blocker,
            unBlockable,
            unDying,
            doubleBreaker,
            tripleBreaker,
            evolution,
            shieldTrigger,
            charge,
        }
    }
});

export default card;