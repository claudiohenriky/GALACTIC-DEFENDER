import { Game } from './src/core/game.js?v=0.7.0';

// Entry point: connect the game engine to the page UI.
const canvas = document.querySelector('#game-canvas');
const game = new Game(canvas);

// Mouse position controls aim only; keyboard and touch inputs still control movement and firing.
canvas.addEventListener('pointermove', (event) => game.setAimFromPointer(event));

document.querySelector('#start-button').addEventListener('click', () => game.start());
document.querySelector('#resume-button').addEventListener('click', () => game.resume());
document.querySelector('#restart-button').addEventListener('click', () => game.restart());
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  game.handleKeyDown(event);
});
window.addEventListener('keyup', (event) => game.handleKeyUp(event));
window.addEventListener('blur', () => {
  game.clearInput();
  document.querySelectorAll('.touch-button.is-pressed').forEach((button) => button.classList.remove('is-pressed'));
});
window.addEventListener('resize', () => game.resize());
game.resize();
game.renderIntro();

const canvasFrame = document.querySelector('.canvas-frame');
const fullscreenButton = document.querySelector('#fullscreen-button');

fullscreenButton.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await canvasFrame.requestFullscreen();
      try {
        await screen.orientation?.lock?.('landscape');
      } catch {
        // Orientation locking is optional; the player can rotate the device manually.
      }
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // Fullscreen may be blocked by browser or device settings.
  }
});

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = isFullscreen ? '×' : '⛶';
  fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Sair da tela cheia' : 'Ativar tela cheia');
  fullscreenButton.title = isFullscreen ? 'Sair da tela cheia' : 'Tela cheia';
  game.resize();
});


// The fire button continues to use the same input key as Space on the keyboard.
const fireButton = document.querySelector('.touch-fire');
const releaseFireButton = () => {
  game.keys.delete('space');
  fireButton.classList.remove('is-pressed');
};
fireButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (game.status !== 'running') return;
  game.keys.add('space');
  fireButton.classList.add('is-pressed');
  fireButton.setPointerCapture?.(event.pointerId);
});
fireButton.addEventListener('pointerup', releaseFireButton);
fireButton.addEventListener('pointercancel', releaseFireButton);
fireButton.addEventListener('lostpointercapture', releaseFireButton);
fireButton.addEventListener('contextmenu', (event) => event.preventDefault());

// Analog joystick: the thumb follows the finger inside a circular movement boundary.
const joystick = document.querySelector('#virtual-joystick');
const joystickRing = joystick.querySelector('.joystick-ring');
const joystickThumb = document.querySelector('#joystick-thumb');
let joystickPointerId = null;
function updateJoystick(event) {
  const rect = joystickRing.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxRadius = Math.max(1, rect.width * 0.31);
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance > maxRadius) {
    dx = dx / distance * maxRadius;
    dy = dy / distance * maxRadius;
  }
  game.joystick.x = dx / maxRadius;
  game.joystick.y = dy / maxRadius;
  joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
}
function releaseJoystick(event) {
  if (joystickPointerId !== event.pointerId) return;
  joystickPointerId = null;
  game.joystick.x = 0;
  game.joystick.y = 0;
  joystickThumb.style.transform = 'translate(0, 0)';
  joystick.classList.remove('is-active');
}
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (game.status !== 'running' || joystickPointerId !== null) return;
  joystickPointerId = event.pointerId;
  joystick.classList.add('is-active');
  joystick.setPointerCapture?.(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (joystickPointerId === event.pointerId) {
    event.preventDefault();
    updateJoystick(event);
  }
});
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);
joystick.addEventListener('lostpointercapture', releaseJoystick);
joystick.addEventListener('contextmenu', (event) => event.preventDefault());
