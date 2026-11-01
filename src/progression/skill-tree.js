export const SKILL_TREE_BRANCHES = [
  { id: 'integrity', name: 'Integridade', icon: '⬡', subtitle: 'Blindagem e sobrevivência', nodes: [
    { id: 'integrity-1', title: 'Liga reforçada I', description: '+5% de integridade máxima', cost: 1, effect: { maxHealth: 0.05 } },
    { id: 'integrity-2', title: 'Liga reforçada II', description: '+5% de integridade máxima', cost: 2, requires: 'integrity-1', effect: { maxHealth: 0.05 } },
    { id: 'integrity-3', title: 'Estrutura de contenção', description: '+1 capacidade dos escudos', cost: 3, requires: 'integrity-2', effect: { shieldCapacity: 1 } }
  ]},
  { id: 'mobility', name: 'Mobilidade', icon: '➤', subtitle: 'Propulsão e controle vetorial', nodes: [
    { id: 'mobility-1', title: 'Propulsores calibrados I', description: '+3% de velocidade', cost: 1, effect: { speed: 0.03 } },
    { id: 'mobility-2', title: 'Propulsores calibrados II', description: '+3% de velocidade', cost: 2, requires: 'mobility-1', effect: { speed: 0.03 } },
    { id: 'mobility-3', title: 'Controle vetorial', description: '+8% de aceleração', cost: 3, requires: 'mobility-2', effect: { acceleration: 0.08 } }
  ]},
  { id: 'arsenal', name: 'Arsenal', icon: '✦', subtitle: 'Potência e cadência de tiro', nodes: [
    { id: 'arsenal-1', title: 'Núcleo balístico I', description: '+4% de dano', cost: 1, effect: { damage: 0.04 } },
    { id: 'arsenal-2', title: 'Núcleo balístico II', description: '+4% de dano', cost: 2, requires: 'arsenal-1', effect: { damage: 0.04 } },
    { id: 'arsenal-3', title: 'Controle de disparo', description: '+5% de cadência', cost: 3, requires: 'arsenal-2', effect: { fireRate: 0.05 } }
  ]},
  { id: 'energy', name: 'Energia', icon: '◈', subtitle: 'Escudos e sistemas especiais', nodes: [
    { id: 'energy-1', title: 'Célula de barreira', description: '+1 capacidade dos escudos', cost: 1, effect: { shieldCapacity: 1 } },
    { id: 'energy-2', title: 'Recarga otimizada', description: '-10% no tempo de recarga do escudo', cost: 2, requires: 'energy-1', effect: { shieldRecharge: 0.10 } },
    { id: 'energy-3', title: 'Regulador de sobrecarga', description: '-5% na recarga das habilidades', cost: 3, requires: 'energy-2', effect: { abilityCooldown: 0.05 } }
  ]},
  { id: 'technology', name: 'Tecnologia', icon: '⌘', subtitle: 'Análise e pesquisa avançada', nodes: [
    { id: 'technology-1', title: 'Análise de combate I', description: '+5% de XP recebido', cost: 1, effect: { xp: 0.05 } },
    { id: 'technology-2', title: 'Análise de combate II', description: '+5% de XP recebido', cost: 2, requires: 'technology-1', effect: { xp: 0.05 } },
    { id: 'technology-3', title: 'Logística de pesquisa', description: '+1 ponto por missão concluída', cost: 3, requires: 'technology-2', effect: { missionResearch: 1 } }
  ]}
];
const NODES = SKILL_TREE_BRANCHES.flatMap(branch => branch.nodes);
const integer = value => Math.max(0, Math.floor(Number(value) || 0));


export class SkillTree {
  constructor() {
    this.researchPoints = 1;
    this.purchased = new Set();
    this.missionsCompleted = 0;
  }
  getNodeStatus(id) {
    const node = NODES.find(item => item.id === id);
    if (!node) return { exists: false, purchased: false, unlocked: false, affordable: false, canPurchase: false };
    const purchased = this.purchased.has(id);
    const unlocked = !node.requires || this.purchased.has(node.requires);
    const affordable = this.researchPoints >= node.cost;
    return { exists: true, purchased, unlocked, affordable, canPurchase: !purchased && unlocked && affordable };
  }
  purchaseNode(id) {
    const node = NODES.find(item => item.id === id);
    if (!node || !this.getNodeStatus(id).canPurchase) return false;
    this.researchPoints -= node.cost;
    this.purchased.add(id);
    return true;
  }
  awardMissionCompletion() {
    this.missionsCompleted += 1;
    const bonus = this.purchased.has('technology-3') ? 1 : 0;
    const milestone = this.missionsCompleted % 3 === 0 ? 1 : 0;
    const earned = 1 + bonus + milestone;
    this.researchPoints += earned;
    return earned;
  }
  getBonuses() {
    const result = { maxHealth: 0, speed: 0, acceleration: 0, damage: 0, fireRate: 0, shieldCapacity: 0, shieldRecharge: 0, abilityCooldown: 0, xp: 0, missionResearch: 0 };
    for (const node of NODES) if (this.purchased.has(node.id)) {
      for (const [key, value] of Object.entries(node.effect)) result[key] += value;
    }
    return result;
  }
  applyToPlayer(player) {
    if (!player) return;
    const b = this.getBonuses();
    player.maxHealth = player.baseMaxHealth * (1 + b.maxHealth);
    player.health = player.maxHealth;
    player.speed = player.baseSpeed * (1 + b.speed);
    player.movementAcceleration = (player.baseMovementAcceleration || 2400) * (1 + b.acceleration);
    player.weaponDamage = 1 * (1 + b.damage);
    player.permanentFireRateBonus = b.fireRate;
    player.permanentShieldBonus = b.shieldCapacity;
    player.shieldRechargeMultiplier = 1 - b.shieldRecharge;
    player.shieldRechargeDuration = 7 * player.shieldRechargeMultiplier;
    player.abilityCooldownMultiplier = 1 - b.abilityCooldown;
    player.xpMultiplier = 1 + b.xp;
    player.missionResearchBonus = b.missionResearch;
    if (player.shieldLevel > 0) {
      player.shieldMaxHealth = 2 + player.shieldLevel + player.permanentShieldBonus + (player.upgradeSpecializations?.shieldCapacity || 0);
      player.shieldHealth = Math.min(player.shieldMaxHealth, player.shieldHealth || player.shieldMaxHealth);
    }
  }
  getBranches() {
    return SKILL_TREE_BRANCHES.map(branch => ({
      ...branch, nodes: branch.nodes.map(node => ({ ...node, status: this.getNodeStatus(node.id) }))
    }));
  }
}
