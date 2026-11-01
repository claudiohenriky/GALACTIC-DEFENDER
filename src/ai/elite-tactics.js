// Coordinates one Elite flanking maneuver at a time.
// This layer selects intent and a destination; Enemy owns movement and firing behavior.
export class EliteTacticalCoordinator {
  constructor() {
    this.decisionTimer = 0;
    this.activeFlanker = null;
  }

  update(dt, enemies, player, worldWidth, worldHeight) {
    this.decisionTimer = Math.max(0, this.decisionTimer - dt);
    if (this.decisionTimer > 0) return;
    this.decisionTimer = 0.6;

    if (this.activeFlanker && this.activeFlanker.active && this.activeFlanker.flankTimer > dt) return;
    this.activeFlanker = null;

    let activeCombatants = 0;
    let candidate = null;
    let candidatePriority = Infinity;
    let candidateDistance = Infinity;
    for (const enemy of enemies) {
      if (!enemy.active || enemy.bossDying || enemy.type === 'boss') continue;
      activeCombatants += 1;
      if (!enemy.isElite || enemy.eliteSpawnTimer > 0 || enemy.flankCooldown > 0) continue;
      if (enemy.type !== 'sentinel' && enemy.type !== 'artillery' && enemy.type !== 'guardian') continue;
      // A Guardian never abandons living allies assigned to its defensive screen.
      if (enemy.type === 'guardian' && (enemy.protectedAllies || []).some(ally => ally.active)) continue;

      const priority = enemy.type === 'sentinel' ? 0 : enemy.type === 'artillery' ? 1 : 2;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = dx * dx + dy * dy;
      if (priority < candidatePriority || (priority === candidatePriority && distance < candidateDistance)) {
        candidate = enemy;
        candidatePriority = priority;
        candidateDistance = distance;
      }
    }

    // Flanking is a coordinated Elite maneuver, not a routine action for every wave unit.
    if (activeCombatants < 4 || !candidate) return;

    const playerSpeed = Math.hypot(player.velocityX, player.velocityY);
    const headingX = playerSpeed > 40 ? player.velocityX / playerSpeed : Math.cos(player.rotation);
    const headingY = playerSpeed > 40 ? player.velocityY / playerSpeed : Math.sin(player.rotation);
    const rearX = -headingX;
    const rearY = -headingY;
    const sideX = -headingY;
    const sideY = headingX;
    const baseX = player.x + rearX * 165;
    const baseY = player.y + rearY * 165;
    const leftX = baseX + sideX * 105;
    const leftY = baseY + sideY * 105;
    const rightX = baseX - sideX * 105;
    const rightY = baseY - sideY * 105;

    let leftCrowding = 0;
    let rightCrowding = 0;
    for (const enemy of enemies) {
      if (!enemy.active || enemy === candidate || enemy.type === 'boss') continue;
      const leftDx = enemy.x - leftX;
      const leftDy = enemy.y - leftY;
      const rightDx = enemy.x - rightX;
      const rightDy = enemy.y - rightY;
      if (leftDx * leftDx + leftDy * leftDy < 180 * 180) leftCrowding += 1;
      if (rightDx * rightDx + rightDy * rightDy < 180 * 180) rightCrowding += 1;
    }

    const chooseLeft = leftCrowding <= rightCrowding;
    const margin = candidate.radius + 24;
    candidate.flankTargetX = Math.max(margin, Math.min(worldWidth - margin, chooseLeft ? leftX : rightX));
    candidate.flankTargetY = Math.max(margin, Math.min(worldHeight - margin, chooseLeft ? leftY : rightY));
    candidate.flankSide = chooseLeft ? -1 : 1;
    candidate.flankTimer = 3.2;
    candidate.flankCooldown = 11.5;
    this.activeFlanker = candidate;
  }
}
