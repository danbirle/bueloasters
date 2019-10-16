import Player from './Player.svelte';
import app from 'main';

const player = new Player({
	target: app,
	props: {
		name,
		health = 5,
		id
	}
});

export default player;