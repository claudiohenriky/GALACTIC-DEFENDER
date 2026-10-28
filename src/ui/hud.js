export function updateHud(game) {
  const score = document.querySelector('#score-value');
  score.textContent = String(game.score).padStart(6, '0');
  document.querySelector('#enemy-value').textContent = String(game.destroyed).padStart(2, '0');
  document.querySelector('#level-value').textContent = String(game.progression.level).padStart(2, '0');
  document.querySelector('#health-value').innerHTML = `${game.player.health}<span class="unit">%</span>`;
  document.querySelector('#health-bar').style.width = `${game.player.health}%`;
  const arenaHealth = document.querySelector('#arena-health-value');
  const arenaHealthBar = document.querySelector('#arena-health-bar');
  const arenaHealthBlock = document.querySelector('.hud-health');
  arenaHealth.textContent = `${game.player.health}%`;
  arenaHealthBar.style.width = `${game.player.health}%`;
  arenaHealthBlock.classList.toggle('is-critical', game.player.health <= 30);
  document.querySelector('#xp-label').textContent = `${game.progression.xp} / ${game.progression.nextLevelXp}`;
  const xpPercent = Math.min(100, game.progression.xp / game.progression.nextLevelXp * 100);
  document.querySelector('#xp-bar').style.width = `${xpPercent}%`;
  document.querySelector('#arena-level-value').textContent = String(game.progression.level).padStart(2, '0');
  document.querySelector('#arena-xp-label').textContent = `${game.progression.xp} / ${game.progression.nextLevelXp}`;
  document.querySelector('#arena-xp-bar').style.width = `${xpPercent}%`;
  document.querySelector('#rank-label').textContent = game.progression.getRank();
  document.querySelector('#mission-progress').textContent = `${game.mission.progress}/${game.mission.target}`;
  if (game.mission.completed) document.querySelector('#mission-progress').textContent = 'CONCLUÍDA';
  document.querySelector('#status-label').textContent = game.status === 'running' ? 'SISTEMA ONLINE' : game.status.toUpperCase();
  document.querySelector('#wave-label').textContent = game.waveManager.getLabel();
}
