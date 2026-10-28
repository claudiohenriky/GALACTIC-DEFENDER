import { Game } from './src/core/game.js';

// Entry point: connect the game engine to the page UI.
const canvas = document.querySelector('#game-canvas');
const game = new Game(canvas);

document.querySelector('#start-button').addEventListener('click', () => game.start());
document.querySelector('#resume-button').addEventListener('click', () => game.resume());
document.querySelector('#restart-button').addEventListener('click', () => game.restart());
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  game.handleKeyDown(event);
});
window.addEventListener('keyup', (event) => game.handleKeyUp(event));
window.addEventListener('blur', () => game.clearInput());
window.addEventListener('resize', () => game.resize());
game.resize();
game.renderIntro();
