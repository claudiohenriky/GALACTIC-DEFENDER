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


// Mobile touch controls reuse the same input keys as the keyboard controls.
const touchButtons = document.querySelectorAll('.touch-button[data-key]');
const releaseTouchButton = (button) => {
  game.keys.delete(button.dataset.key);
  button.classList.remove('is-pressed');
};

touchButtons.forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (game.status !== 'running') return;
    game.keys.add(button.dataset.key);
    button.classList.add('is-pressed');
    button.setPointerCapture?.(event.pointerId);
  });
  const release = () => releaseTouchButton(button);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', (event) => event.preventDefault());
});
window.addEventListener('pointerup', () => {
  touchButtons.forEach(releaseTouchButton);
});
