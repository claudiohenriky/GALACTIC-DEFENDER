import { Game } from './src/core/game.js?v=0.29.1';
import { gameAudio } from './src/audio/game-audio.js?v=0.29.1';

// Entry point: connect the game engine to the page UI.
const canvas = document.querySelector('#game-canvas');
const game = new Game(canvas);
const guidedMissileButton = document.querySelector('#guided-missile-button');
function activateMissileFromControl(event) {
  event.preventDefault();
  event.stopPropagation();
  if (event.type === 'pointerdown' && event.pointerType === 'mouse' && event.button !== 0) return;
  game.activateGuidedMissile();
}
// Fire on pointerdown for immediate touch response; do not wait for a synthetic click.
guidedMissileButton?.addEventListener('pointerdown', activateMissileFromControl, { passive: false });
guidedMissileButton?.addEventListener('click', (event) => {
  if (event.detail === 0) activateMissileFromControl(event);
  else { event.preventDefault(); event.stopPropagation(); }
});

const shieldPulseButton = document.querySelector('#shield-pulse-button');
function activateShieldPulseFromControl(event) {
  event.preventDefault();
  event.stopPropagation();
  if (event.type === 'pointerdown' && event.pointerType === 'mouse' && event.button !== 0) return;
  game.activateShieldPulse();
}
shieldPulseButton?.addEventListener('pointerdown', activateShieldPulseFromControl, { passive: false });
shieldPulseButton?.addEventListener('click', (event) => {
  if (event.detail === 0) activateShieldPulseFromControl(event);
  else { event.preventDefault(); event.stopPropagation(); }
});

const mainMenu = document.querySelector('#main-menu');
const gameLayout = document.querySelector('.game-layout');
const missionPrep = document.querySelector('#mission-prep');
const hangarScreen = document.querySelector('#hangar-screen');
const shipChoiceButtons = [...document.querySelectorAll('[data-ship-choice]')];
const shipSelectionNote = document.querySelector('#hangar-selection-note');
const validShipClasses = ['vanguard', 'phantom', 'aegis'];
let selectedShip = localStorage.getItem('gd-ship-class');
if (!validShipClasses.includes(selectedShip)) selectedShip = 'vanguard';
game.selectedShip = selectedShip;
game.player.shipClass = selectedShip;
function selectShip(shipClass) {
  if (!validShipClasses.includes(shipClass)) return;
  selectedShip = shipClass; game.selectedShip = shipClass; game.player.shipClass = shipClass;
  localStorage.setItem('gd-ship-class', shipClass);
  shipChoiceButtons.forEach((button) => { const selected = button.dataset.shipChoice === shipClass; button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  shipSelectionNote.textContent = `${shipClass.charAt(0).toUpperCase() + shipClass.slice(1)} selecionada. A escolha é salva neste navegador.`;
}
shipChoiceButtons.forEach((button) => button.addEventListener('click', () => selectShip(button.dataset.shipChoice)));
selectShip(selectedShip);
const platformButtons = [...document.querySelectorAll('[data-platform-choice]')];
const platformNote = document.querySelector('#platform-detection-note');
const settingsPanel = document.querySelector('#settings-panel');
const aboutPanel = document.querySelector('#about-panel');
const versionHistoryPanel = document.querySelector('#version-history-panel');
const achievementsPanel = document.querySelector('#achievements-panel');
const achievementsList = document.querySelector('#achievements-list');
const achievementSummary = document.querySelector('#achievement-summary');
document.querySelectorAll('[data-upgrade]').forEach((button) => button.addEventListener('click', () => game.chooseUpgrade(button.dataset.upgrade)));
document.querySelector('#dismiss-title-toast').addEventListener('click', () => document.querySelector('#title-unlock-toast').classList.add('hidden'));

function detectPlatform() {
  const saved = localStorage.getItem('gd-platform');
  if (saved === 'pc' || saved === 'mobile') return saved;
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 ? 'mobile' : 'pc';
}
function setPlatform(platform, persist = true) {
  document.documentElement.dataset.platform = platform;
  platformButtons.forEach((button) => {
    const selected = button.dataset.platformChoice === platform;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  platformNote.textContent = platform === 'mobile'
    ? 'Modo mobile selecionado. Use o joystick para mover; a nave mira automaticamente no inimigo mais próximo e dispara pelo botão DISPARAR.'
    : 'Modo PC selecionado. Mouse para mirar; W/S avançam e recuam em relação à nave, A/D fazem strafe; botão direito ou Espaço para disparar.';
  if (persist) localStorage.setItem('gd-platform', platform);
}
function closeMenuPanels() {
  settingsPanel.classList.add('hidden');
  aboutPanel.classList.add('hidden');
  versionHistoryPanel.classList.add('hidden');
  achievementsPanel.classList.add('hidden');
}
setPlatform(detectPlatform(), false);
platformButtons.forEach((button) => button.addEventListener('click', () => setPlatform(button.dataset.platformChoice)));
// JOGAR opens the hangar; gameplay remains stopped until mission confirmation.
document.querySelector('#menu-play-button').addEventListener('click', () => {
  closeMenuPanels(); mainMenu.classList.add('is-hidden'); hangarScreen.classList.remove('is-hidden');
});
document.querySelector('#hangar-back-button').addEventListener('click', () => { hangarScreen.classList.add('is-hidden'); mainMenu.classList.remove('is-hidden'); });
document.querySelector('#hangar-continue-button').addEventListener('click', () => {
  hangarScreen.classList.add('is-hidden'); missionPrep.classList.remove('is-hidden');
  game.selectedShip = selectedShip; game.player.shipClass = selectedShip;
  document.querySelector('#prep-controls-note').textContent =
    document.documentElement.dataset.platform === 'mobile'
      ? 'Joystick para mover a nave; botão DISPARAR para atirar.'
      : 'WASD/setas para mover; mouse para mirar; botão direito ou Espaço para disparar.';
});
document.querySelector('#prep-back-button').addEventListener('click', () => { missionPrep.classList.add('is-hidden'); hangarScreen.classList.remove('is-hidden'); });
document.querySelector('#prep-start-button').addEventListener('click', () => {
  gameAudio.start();
  missionPrep.classList.add('is-hidden');
  mainMenu.classList.add('is-hidden');
  gameLayout.classList.remove('is-hidden');
  // Wait for layout before sizing the hidden canvas and starting its animation loop.
  requestAnimationFrame(() => {
    game.resize();
    game.start();
  });
});
document.querySelector('#menu-achievements-button').addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  aboutPanel.classList.add('hidden');
  versionHistoryPanel.classList.add('hidden');
  achievementsPanel.classList.remove('hidden');
  renderAchievements();
});
function renderAchievements() {
  const tracker = game.achievements;
  const items = tracker.getAchievements();
  const unlocked = items.filter((item) => item.unlocked).length;
  achievementSummary.textContent = `${unlocked} de ${items.length} conquistas · ${tracker.stats.kills} eliminações · ${tracker.stats.bosses} chefes derrotados · ${tracker.stats.missions} missões concluídas · recorde ${tracker.stats.bestScore} pontos · maior onda ${tracker.stats.bestWave}`;
  achievementsList.replaceChildren();
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = `achievement-entry${item.unlocked ? ' is-unlocked' : ''}`;
    const heading = document.createElement('div');
    heading.className = 'achievement-entry-heading';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const status = document.createElement('span');
    status.textContent = item.unlocked ? 'DESBLOQUEADA' : 'BLOQUEADA';
    heading.append(name, status);
    const description = document.createElement('p');
    description.textContent = item.description;
    card.append(heading, description);
    achievementsList.append(card);
  });
}
document.querySelector('#menu-settings-button').addEventListener('click', () => {
  aboutPanel.classList.add('hidden');
  versionHistoryPanel.classList.add('hidden');
  achievementsPanel.classList.add('hidden');
  settingsPanel.classList.remove('hidden');
});
document.querySelector('#menu-about-button').addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  versionHistoryPanel.classList.add('hidden');
  achievementsPanel.classList.add('hidden');
  aboutPanel.classList.remove('hidden');
});
document.querySelector('#menu-history-button').addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  aboutPanel.classList.add('hidden');
  achievementsPanel.classList.add('hidden');
  versionHistoryPanel.classList.remove('hidden');
});
document.querySelectorAll('[data-close-panel]').forEach((button) => button.addEventListener('click', closeMenuPanels));
function returnToMainMenu() {
  game.reset();
  gameLayout.classList.add('is-hidden');
  mainMenu.classList.remove('is-hidden');
  closeMenuPanels();
}
document.querySelector('#pause-menu-button').addEventListener('click', returnToMainMenu);
document.querySelector('#gameover-menu-button').addEventListener('click', returnToMainMenu);

const settingDefaults = { 'hud-scale-setting': '100', 'hud-opacity-setting': '100', 'effects-setting': 'full', 'sound-setting': 'on', 'sound-volume-setting': '75' };
function applySettings() {
  const scale = Number(document.querySelector('#hud-scale-setting').value) / 100;
  const opacity = Number(document.querySelector('#hud-opacity-setting').value) / 100;
  document.documentElement.style.setProperty('--hud-scale', String(scale));
  document.documentElement.style.setProperty('--hud-opacity', String(opacity));
  document.documentElement.dataset.effects = document.querySelector('#effects-setting').value;
  document.documentElement.dataset.sound = document.querySelector('#sound-setting').value;
  gameAudio.setVolume(Number(document.querySelector('#sound-volume-setting').value) / 100);
  gameAudio.setEnabled(document.querySelector('#sound-setting').value === 'on');
  Object.entries(settingDefaults).forEach(([id]) => localStorage.setItem('gd-setting-' + id, document.querySelector('#' + id).value));
}
Object.keys(settingDefaults).forEach((id) => {
  const element = document.querySelector('#' + id);
  element.value = localStorage.getItem('gd-setting-' + id) ?? settingDefaults[id];
  element.addEventListener('input', applySettings);
  element.addEventListener('change', applySettings);
});
document.querySelector('#settings-reset-button').addEventListener('click', () => {
  Object.entries(settingDefaults).forEach(([id, value]) => { document.querySelector('#' + id).value = value; });
  applySettings();
});
applySettings();


// Mouse controls aim on PC; touch dragging sets the mobile facing direction when no enemy is available.
canvas.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'mouse') game.setAimFromPointer(event);
  if (document.documentElement.dataset.platform === 'mobile' && event.pointerType === 'touch'
      && game.touchAim.pointerId === event.pointerId) {
    event.preventDefault();
    game.setAimFromTouch(event);
  }
});
canvas.addEventListener('pointerdown', (event) => {
  if (document.documentElement.dataset.platform !== 'mobile' || event.pointerType !== 'touch'
      || game.status !== 'running') return;
  event.preventDefault();
  game.touchAim.pointerId = event.pointerId;
  game.setAimFromTouch(event);
  try { canvas.setPointerCapture(event.pointerId); } catch {}
});
function releaseTouchAim(event) {
  if (game.touchAim.pointerId !== event.pointerId) return;
  game.touchAim.pointerId = null;
}
window.addEventListener('pointerup', releaseTouchAim);
window.addEventListener('pointercancel', releaseTouchAim);

const arenaFrame = document.querySelector('.canvas-frame');
arenaFrame.addEventListener('pointerdown', (event) => {
  if (event.button !== 2 || game.status !== 'running') return;
  event.preventDefault();
  game.keys.add('space');
});
window.addEventListener('pointerup', (event) => {
  if (event.button === 2) game.keys.delete('space');
});
window.addEventListener('pointercancel', () => game.keys.delete('space'));
arenaFrame.addEventListener('contextmenu', (event) => event.preventDefault());

document.querySelector('#start-button').addEventListener('click', () => { gameAudio.start(); game.start(); });
document.querySelector('#resume-button').addEventListener('click', () => { gameAudio.start(); game.resume(); });
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
const appShell = document.querySelector('.app-shell');
const prepFullscreenButton = document.querySelector('#prep-fullscreen-button');

prepFullscreenButton.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await appShell.requestFullscreen();
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
  prepFullscreenButton.textContent = isFullscreen ? '× SAIR DA TELA CHEIA' : '⛶ ATIVAR TELA CHEIA';
  prepFullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
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
