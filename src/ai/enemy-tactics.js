// Gives one basic Chaser a brief lateral reposition opportunity.
// This is intentionally simpler than Elite rear-flanking: no prediction and no multi-unit coordination.
export class EnemyTacticalCoordinator {
  constructor() {
    this.decisionTimer = 0;
    this.activeRepositioner = null;
  }

  update(dt, enemies, player, worldWidth, worldHeight, eliteFlankActive = false) {
    this.decisionTimer = Math.max(0, this.decisionTimer - dt);
    if (this.decisionTimer > 0) return;
    this.decisionTimer = 0.9;

    if (this.activeRepositioner && this.activeRepositioner.active && this.activeRepositioner.repositionTimer > dt) return;
    this.activeRepositioner = null;
    if (eliteFlankActive) return;

    let activeCombatants = 0;
    let candidate = null;
    let candidateDistance = Infinity;
    for (const enemy of enemies) {
      if (!enemy.active || enemy.bossDying || enemy.type === 'boss') continue;
      activeCombatants += 1;
      if (enemy.type !== 'chaser' || enemy.isElite || enemy.repositionCooldown > 0) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = dx * dx + dy * dy;
      if (distance < candidateDistance) {
        candidate = enemy;
        candidateDistance = distance;
      }
    }
    if (activeCombatants < 4 || !candidate) return;

    const playerSpeed = Math.hypot(player.velocityX, player.velocityY);
    const headingX = playerSpeed > 40 ? player.velocityX / playerSpeed : Math.cos(player.rotation);
    const headingY = playerSpeed > 40 ? player.velocityY / playerSpeed : Math.sin(player.rotation);
    const sideX = -headingY;
    const sideY = headingX;
    const centerX = player.x + headingX * 70;
    const centerY = player.y + headingY * 70;
    const leftX = centerX + sideX * 155;
    const leftY = centerY + sideY * 155;
    const rightX = centerX - sideX * 155;
    const rightY = centerY - sideY * 155;

    let leftCrowding = 0;
    let rightCrowding = 0;
    for (const enemy of enemies) {
      if (!enemy.active || enemy === candidate || enemy.type === 'boss') continue;
      const leftDx = enemy.x - leftX;
      const leftDy = enemy.y - leftY;
      const rightDx = enemy.x - rightX;
      const rightDy = enemy.y - rightY;
      if (leftDx * leftDx + leftDy * leftDy < 155 * 155) leftCrowding += 1;
      if (rightDx * rightDx + rightDy * rightDy < 155 * 155) rightCrowding += 1;
    }

    const chooseLeft = leftCrowding <= rightCrowding;
    const margin = candidate.radius + 18;
    candidate.repositionTargetX = Math.max(margin, Math.min(worldWidth - margin, chooseLeft ? leftX : rightX));
    candidate.repositionTargetY = Math.max(margin, Math.min(worldHeight - margin, chooseLeft ? leftY : rightY));
    candidate.repositionTimer = 2.4;
    candidate.repositionCooldown = 9;
    this.activeRepositioner = candidate;
  }
}
