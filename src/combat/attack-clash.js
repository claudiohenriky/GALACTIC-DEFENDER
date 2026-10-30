import { circlesOverlap } from './collision.js?v=0.44.0';

 /**
  * Resolve one direct Attack Clash between a player shot and an enemy projectile.
  * Light ammunition is neutralized immediately; heavier rounds consume resistance
  * over multiple hits instead of being removed by a single weak shot.
  */
export function resolveAttackClash(playerShot, enemyShot) {
  if (!playerShot?.active || !enemyShot?.active || !circlesOverlap(playerShot, enemyShot)) return false;
  const playerPower = Math.max(1, Math.floor((playerShot.damage ?? 1) / 4));
  playerShot.active = false;
  const resistance = Math.max(1, enemyShot.clashResistance ?? 1);
  if (playerPower >= resistance) enemyShot.active = false;
  else enemyShot.clashResistance = resistance - playerPower;
  return true;
}
