const setText = (selector, value) => {
  const element = document.querySelector(selector);
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
};

const setWidth = (selector, value) => {
  const element = document.querySelector(selector);
  const width = `${value}%`;
  if (element.style.width !== width) element.style.width = width;
};

const setMeterValue = (selector, value) => {
  const element = document.querySelector(selector);
  const nextValue = String(Math.round(Math.max(0, Math.min(100, value))));
  if (element.getAttribute('aria-valuenow') !== nextValue) {
    element.setAttribute('aria-valuenow', nextValue);
  }
};

export function updateHud(game) {
  setText('#score-value', String(game.score).padStart(6, '0'));
  setText('#enemy-value', String(game.destroyed).padStart(2, '0'));
  setText('#level-value', String(game.progression.level).padStart(2, '0'));
  const healthValue = document.querySelector('#health-value');
  const healthText = String(game.player.health);
  if (healthValue.firstChild?.textContent !== healthText) healthValue.firstChild.textContent = healthText;
  const healthPercent = Math.max(0, Math.min(100, game.player.health / Math.max(1, game.player.maxHealth) * 100));
  setWidth('#health-bar', healthPercent);
  setMeterValue('.health-meter', healthPercent);
  setMeterValue('.xp-meter', game.progression.xp / Math.max(1, game.progression.nextLevelXp) * 100);
  setText('#arena-health-value', `${Math.round(healthPercent)}%`);
  setWidth('#arena-health-bar', healthPercent);
  const arenaHealthBlock = document.querySelector('.hud-health');
  arenaHealthBlock.classList.toggle('is-critical', healthPercent <= 30);
  setText('#xp-label', `${game.progression.xp} / ${game.progression.nextLevelXp}`);
  const xpPercent = Math.min(100, game.progression.xp / game.progression.nextLevelXp * 100);
  setWidth('#xp-bar', xpPercent);
  setText('#arena-level-value', String(game.progression.level).padStart(2, '0'));
  setText('#arena-xp-label', `${game.progression.xp} / ${game.progression.nextLevelXp}`);
  setWidth('#arena-xp-bar', xpPercent);
  setText('#arena-wave-value', String(game.waveManager.wave).padStart(2, '0'));
  setText('#arena-score-value', String(game.score).padStart(6, '0'));
  setText('#rank-label', game.progression.getRank());
  setText('#mission-name', game.mission.current.name);
  setText('#mission-description', game.mission.current.description);
  setText('#mission-difficulty', game.mission.current.difficulty);
  setText('#mission-progress', game.mission.getDisplayProgress());
  setText('#mission-reward', `+${game.mission.current.xp} XP · +${game.mission.current.score} PTS`);
  setText('#pilot-title-label', game.progression.getTitle().name.toUpperCase());
  setText('#status-label', game.status === 'running' ? 'SISTEMA ONLINE' : game.status.toUpperCase());
  setText('#wave-label', game.waveManager.getLabel());

  // Update the dedicated boss bar on the existing throttled HUD cadence.
  const bossHud = document.querySelector('#boss-hud');
  const boss = game.enemies.find((enemy) => enemy.active && enemy.type === 'boss');
  bossHud.classList.toggle('hidden', !boss);
  if (boss) {
    const healthPercent = Math.max(0, Math.min(100, boss.health / Math.max(1, boss.maxHealth) * 100));
    setWidth('#boss-health-fill', healthPercent);
    setMeterValue('#boss-hud', healthPercent);
    setText('#boss-health-value', String(Math.ceil(healthPercent)) + '%');
    setText('#boss-phase-label', boss.bossPhase === 3 ? 'FASE III · SOBRECARGA' : boss.bossPhase === 2 ? 'FASE II' : 'FASE I');
    bossHud.setAttribute('aria-valuenow', String(Math.round(healthPercent)));
  }
}
