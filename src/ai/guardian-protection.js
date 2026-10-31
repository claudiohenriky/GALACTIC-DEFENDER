// Assign nearby allies to Guardians using class/rank priority, then distance.
export function getGuardianProtectionPriority(ally) {
  if (!ally || !ally.active || ally.type === 'guardian' || ally.type === 'boss') return Infinity;
  if (ally.isElite && (ally.type === 'sentinel' || ally.type === 'artillery')) return 0;
  if (ally.type === 'sentinel' || ally.type === 'artillery') return 1;
  if (ally.isElite) return 2;
  return 3;
}

export function selectGuardianProtectionTargets(guardian, allies, assignedAllies = new Set(), maxDistance = 360) {
  if (!guardian || !Array.isArray(allies) || !Number.isFinite(maxDistance) || maxDistance < 0) return [];
  const maxDistanceSquared = maxDistance * maxDistance;
  let first = null, second = null;
  let firstPriority = Infinity, secondPriority = Infinity;
  let firstDistance = Infinity, secondDistance = Infinity;

  for (const ally of allies) {
    if (ally === guardian || assignedAllies.has(ally)) continue;
    const priority = getGuardianProtectionPriority(ally);
    if (!Number.isFinite(priority)) continue;
    const dx = ally.x - guardian.x, dy = ally.y - guardian.y;
    const distance = dx * dx + dy * dy;
    if (distance > maxDistanceSquared) continue;

    if (priority < firstPriority || (priority === firstPriority && distance < firstDistance)) {
      second = first;
      secondPriority = firstPriority;
      secondDistance = firstDistance;
      first = ally;
      firstPriority = priority;
      firstDistance = distance;
    } else if (priority < secondPriority || (priority === secondPriority && distance < secondDistance)) {
      second = ally;
      secondPriority = priority;
      secondDistance = distance;
    }
  }

  const targets = [];
  if (first) targets.push(first);
  if (second) targets.push(second);
  return targets;
}
