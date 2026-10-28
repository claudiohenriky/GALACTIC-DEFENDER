export function updateHud(game) {
  const score = document.querySelector('#score-value');
  score.textContent = String(game.score).padStart(6, '0');
  document.querySelector('#enemy-value').textContent = String(game.destroyed).padStart(2, '0');
  document.querySelector('#level-value').textContent = String(game.progression.level).padStart(2, '0');
  document.querySelector('#health-value').innerHTML = `${game.player.health}<span class="unit">%</span>`;
  document.querySelector('#health-bar').style.width = `${game.player.health}%`;
  document.querySelector('#xp-label').textContent = `${game.progression.xp} / ${game.progression.nextLevelXp}`;
  document.querySelector('#xp-bar').style.width = `${Math.min(100, game.progression.xp / game.progression.nextLevelXp * 100)}%`;
  document.querySelector('#rank-label').textContent = game.progression.getRank();
  document.querySelector('#mission-progress').textContent = `${game.mission.progress}/${game.mission.target}`;
  if (game.mission.completed) document.querySelector('#mission-progress').textContent = 'CONCLUÍDA';
  document.querySelector('#status-label').textContent = game.status === 'running' ? 'SISTEMA ONLINE' : game.status.toUpperCase();
  document.querySelector('#wave-label').textContent = game.waveManager.getLabel();
}
