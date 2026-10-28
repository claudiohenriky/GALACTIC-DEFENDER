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

export function updateHud(game) {
  setText('#score-value', String(game.score).padStart(6, '0'));
  setText('#enemy-value', String(game.destroyed).padStart(2, '0'));
  setText('#level-value', String(game.progression.level).padStart(2, '0'));
  const healthValue = document.querySelector('#health-value');
  const healthText = String(game.player.health);
  if (healthValue.firstChild?.textContent !== healthText) healthValue.firstChild.textContent = healthText;
  setWidth('#health-bar', game.player.health);
  setText('#arena-health-value', `${game.player.health}%`);
  setWidth('#arena-health-bar', game.player.health);
  const arenaHealthBlock = document.querySelector('.hud-health');
  arenaHealthBlock.classList.toggle('is-critical', game.player.health <= 30);
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
}
