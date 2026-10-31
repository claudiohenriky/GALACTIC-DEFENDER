const setText = (selector, value) => {
  const element = document.querySelector(selector);
  const text = String(value);
  if (element && element.textContent !== text) element.textContent = text;
};

const setWidth = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element) return;
  const width = `${value}%`;
  if (element.style.width !== width) element.style.width = width;
};

const setMeterValue = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element) return;
  const nextValue = String(Math.round(Math.max(0, Math.min(100, value))));
  if (element.getAttribute('aria-valuenow') !== nextValue) {
    element.setAttribute('aria-valuenow', nextValue);
  }
};

const setState = (element, state) => {
  if (element && element.dataset.state !== state) element.dataset.state = state;
};

const bossHudSnapshots = new WeakMap();

const applyFeedback = (element, feedback) => {
  if (!element) return;
  if (feedback) element.dataset.feedback = feedback;
  else if (element.dataset.feedback) delete element.dataset.feedback;
};

const STATE_LABELS = {
  operational: 'OPERACIONAL',
  damaged: 'DANIFICADO',
  disabled: 'INOPERANTE',
  destroyed: 'DESTRUÍDO'
};

function updateBossHud(boss) {
  const bossHud = document.querySelector('#boss-hud');
  if (!bossHud) return;
  bossHud.classList.toggle('hidden', !boss);
  if (!boss) return;

  const healthPercent = Math.max(0, Math.min(100, boss.health / Math.max(1, boss.maxHealth) * 100));
  const healthTrack = bossHud.querySelector('.boss-health-track');
  setWidth('#boss-health-fill', healthPercent);
  if (healthTrack) {
    const nextValue = String(Math.round(healthPercent));
    if (healthTrack.getAttribute('aria-valuenow') !== nextValue) healthTrack.setAttribute('aria-valuenow', nextValue);
  }
  setText('#boss-health-value', `${Math.ceil(healthPercent)}%`);

  const systems = boss.bossSystems;
  const previous = bossHudSnapshots.get(boss);
  const rebuildDuration = 4.5;
  const rebuildTrack = bossHud.querySelector('#boss-rebuild-track');
  const rebuildFill = bossHud.querySelector('#boss-rebuild-fill');
  const rebuildValue = bossHud.querySelector('#boss-rebuild-value');
  const rebuilding = Boolean(systems?.rebuildTimer > 0);
  bossHud.classList.toggle('is-rebuilding', rebuilding);
  if (rebuildTrack) rebuildTrack.classList.toggle('hidden', !rebuilding);
  if (rebuildValue) rebuildValue.textContent = rebuilding ? 'RECONSTRUINDO SISTEMAS' : '';
  if (rebuildFill) {
    const progress = Math.max(0, Math.min(100, (1 - systems.rebuildTimer / rebuildDuration) * 100));
    const width = rebuilding ? `${progress}%` : '0%';
    if (rebuildFill.style.width !== width) rebuildFill.style.width = width;
    const ariaValue = String(Math.round(rebuilding ? progress : 0));
    if (rebuildTrack?.getAttribute('aria-valuenow') !== ariaValue) rebuildTrack?.setAttribute('aria-valuenow', ariaValue);
  }
  const phaseLabel = boss.bossDying
    ? 'DESTRUINDO'
    : boss.bossPhase === 3
      ? systems?.rebuildTimer > 0 ? 'FASE III · RECONSTRUÇÃO' : 'FASE III · SOBRECARGA'
      : boss.bossPhase === 2 ? 'FASE II' : 'FASE I';
  setText('#boss-phase-label', phaseLabel);
  setState(bossHud, boss.bossDying ? 'dying' : boss.bossPhase === 3 ? 'overload' : 'stable');

  const cannon = systems?.getModule('main-energy-cannon');
  const cannonPanel = bossHud.querySelector('#boss-cannon-panel');
  const cannonTrack = bossHud.querySelector('#boss-cannon-track');
  const cannonFill = bossHud.querySelector('#boss-cannon-fill');
  const cannonStatus = bossHud.querySelector('#boss-cannon-status');
  const cannonActive = !boss.bossDying && (cannon?.energyState === 'charging' || cannon?.energyState === 'warning');
  if (cannonPanel) {
    cannonPanel.classList.toggle('hidden', !cannonActive);
    if (cannonActive) {
      const warning = cannon.energyState === 'warning';
      cannonPanel.dataset.state = warning ? 'warning' : 'charging';
      const progress = warning ? 100 : Math.max(0, Math.min(100,
        (1 - cannon.energyChargeTimer / Math.max(0.1, cannon.energyChargeDuration)) * 100));
      if (cannonStatus) cannonStatus.textContent = warning
        ? 'ALERTA · ENERGIA CRÍTICA'
        : 'CANHÃO PRINCIPAL · CARREGANDO';
      const width = `${progress}%`;
      if (cannonFill && cannonFill.style.width !== width) cannonFill.style.width = width;
      const ariaValue = String(Math.round(progress));
      if (cannonTrack?.getAttribute('aria-valuenow') !== ariaValue) cannonTrack.setAttribute('aria-valuenow', ariaValue);
      if (cannonTrack) cannonTrack.setAttribute('aria-label', warning
        ? 'Aviso visual do canhão principal; nenhum disparo será realizado nesta versão'
        : 'Carga visual do canhão principal; nenhum disparo será realizado nesta versão');
    }
  }

  if (!systems) return;

  let activeShields = 0;
  for (const shield of systems.shields) {
    const cell = bossHud.querySelector(`[data-boss-shield="${shield.id}"]`);
    if (!cell) continue;
    const percent = Math.max(0, Math.min(100, shield.health / Math.max(1, shield.maxHealth) * 100));
    const state = shield.health <= 0 || shield.disabled ? 'disabled' : percent <= 35 ? 'damaged' : 'operational';
    if (shield.health > 0 && !shield.disabled) activeShields++;
    setState(cell, state);
    const oldShield = previous?.shields[shield.id];
    const feedback = oldShield === undefined ? '' : shield.health < oldShield ? 'hit' : shield.health > oldShield ? 'restoring' : '';
    applyFeedback(cell, feedback);
    const fill = cell.querySelector('.boss-shield-track > div');
    const value = cell.querySelector('small');
    if (fill) {
      const width = `${percent}%`;
      if (fill.style.width !== width) fill.style.width = width;
    }
    if (value) {
      const label = state === 'disabled' ? 'INOP.' : `${Math.ceil(percent)}%`;
      if (value.textContent !== label) value.textContent = label;
    }
    const accessibleLabel = `${shield.id}: ${STATE_LABELS[state]}, ${Math.ceil(percent)} por cento`;
    if (cell.getAttribute('aria-label') !== accessibleLabel) cell.setAttribute('aria-label', accessibleLabel);
  }
  setText('#boss-shield-summary', `${activeShields}/4 ATIVOS`);

  let availableModules = 0;
  let damagedModules = 0;
  let disabledModules = 0;
  let destroyedModules = 0;
  for (const module of systems.modules) {
    const pip = bossHud.querySelector(`[data-boss-module="${module.id}"]`);
    const state = STATE_LABELS[module.state] ? module.state : 'operational';
    if (state === 'operational' || state === 'damaged') availableModules++;
    if (state === 'damaged') damagedModules++;
    if (state === 'disabled') disabledModules++;
    if (state === 'destroyed') destroyedModules++;
    if (!pip) continue;
    setState(pip, state);
    const oldModule = previous?.modules[module.id];
    const feedback = oldModule === undefined ? '' : module.health < oldModule ? 'hit' : module.health > oldModule ? 'restoring' : '';
    applyFeedback(pip, feedback);
    const accessibleLabel = `${module.id}: ${STATE_LABELS[state]}`;
    if (pip.getAttribute('aria-label') !== accessibleLabel) pip.setAttribute('aria-label', accessibleLabel);
    if (pip.title !== accessibleLabel) pip.title = accessibleLabel;
  }
  const moduleDetails = [];
  if (damagedModules) moduleDetails.push(`${damagedModules} DAN.`);
  if (disabledModules) moduleDetails.push(`${disabledModules} INOP.`);
  if (destroyedModules) moduleDetails.push(`${destroyedModules} DESTR.`);
  setText('#boss-module-summary', `${availableModules}/10 ATIVOS${moduleDetails.length ? ` · ${moduleDetails.join(' · ')}` : ''}`);

  const snapshot = previous || { shields: Object.create(null), modules: Object.create(null) };
  for (const shield of systems.shields) snapshot.shields[shield.id] = shield.health;
  for (const module of systems.modules) snapshot.modules[module.id] = module.health;
  if (!previous) bossHudSnapshots.set(boss, snapshot);
}

export function updateHud(game) {
  setText('#score-value', String(game.score).padStart(6, '0'));
  setText('#enemy-value', String(game.destroyed).padStart(2, '0'));
  setText('#level-value', String(game.progression.level).padStart(2, '0'));
  const healthValue = document.querySelector('#health-value');
  const healthText = String(game.player.health);
  if (healthValue?.firstChild && healthValue.firstChild.textContent !== healthText) healthValue.firstChild.textContent = healthText;
  const healthPercent = Math.max(0, Math.min(100, game.player.health / Math.max(1, game.player.maxHealth) * 100));
  setWidth('#health-bar', healthPercent);
  setMeterValue('.health-meter', healthPercent);
  setMeterValue('.xp-meter', game.progression.xp / Math.max(1, game.progression.nextLevelXp) * 100);
  setText('#arena-health-value', `${Math.round(healthPercent)}%`);
  setWidth('#arena-health-bar', healthPercent);
  const arenaHealthBlock = document.querySelector('.hud-health');
  arenaHealthBlock?.classList.toggle('is-critical', healthPercent <= 30);
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

  // The boss panel shares the existing throttled HUD cadence; no per-frame DOM work is added.
  const boss = game.enemies.find((enemy) => enemy.active && enemy.type === 'boss');
  updateBossHud(boss);
}
