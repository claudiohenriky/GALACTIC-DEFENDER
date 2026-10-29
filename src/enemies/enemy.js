export class Enemy {
  constructor(x, y, level = 1, type = 'chaser') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.radius = type === 'boss' ? 23 : type === 'sentinel' ? 12 : type === 'interceptor' ? 8 : 10 + Math.random() * 3;
    this.maxHealth = type === 'boss' ? 34 + level * 4 : type === 'sentinel' ? 5 : type === 'interceptor' ? 1 : 2;
    this.health = this.maxHealth;
    this.speed = (type === 'boss' ? 34 : type === 'sentinel' ? 42 : type === 'interceptor' ? 88 + Math.random() * 18 : 48 + Math.random() * 24) + Math.min(level, 8) * 2;
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = type === 'boss'
      ? 1.8
      : type === 'sentinel'
        ? 1.1 + Math.random() * 0.8
        : 2.4 + Math.random() * 0.8;
    this.active = true;
    this.contactCooldown = 0;
    this.contactCooldown = 0;
  }

  update(dt, targetX, targetY, width, height) {
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.phase += dt * (this.type === 'sentinel' ? 1.4 : this.type === 'interceptor' ? 3.2 : 2);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 18 : this.type === 'interceptor' ? 5 : 9);

    if (this.type === 'boss') {
      // Bosses enter the arena, strafe horizontally and fire aimed heavy shots.
      const desiredY = Math.max(58, height * 0.16);
      this.x += Math.sin(this.phase * 0.75) * this.speed * 1.8 * dt;
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.4);
      this.x = Math.max(this.radius + 4, Math.min(width - this.radius - 4, this.x));
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = 1.65;
        return {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage: 8,
          speed: 165,
          radius: 5,
          color: '#d59bff',
          glowColor: '#a85cff'
        };
      }
    } else if (this.type === 'interceptor') {
      // Interceptors are fragile, fast enemies that pressure the pilot through movement.
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (dy / distance) * this.speed * dt;
    } else if (this.type === 'sentinel') {
      // Ranged enemies try to keep a firing lane above the ship instead of rushing it.
      const desiredY = Math.max(42, targetY - Math.min(175, height * 0.3));
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.5);
      this.fireCooldown -= dt;

      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = 2.2;
        return {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage: 10,
          speed: 190,
          radius: 4,
          color: '#ffe0a8',
          glowColor: '#ffad55'
        };
      }
    } else {
      // Chasers pursue the ship directly with a small lateral drift.
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (dy / distance) * this.speed * dt;

      // Chasers gain a weak ranged attack from wave 2 onward.
      this.fireCooldown -= dt;
      if (this.level >= 2 && distance > Math.max(185, width * 0.31) && this.fireCooldown <= 0) {
        this.fireCooldown = 3.2 + Math.random() * 1.0;
        const damage = this.radius >= 12 ? 5 : this.radius >= 11 ? 4 : 3;
        return {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage,
          speed: 135,
          radius: 3,
          color: '#ff9ab0',
          glowColor: '#ff718d'
        };
      }
    }

    // Keep enemies in the arena so reaching an edge never deals automatic damage.
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    return null;
  }

  draw(ctx) {
    const boss=this.type==='boss', ranged=this.type==='sentinel', interceptor=this.type==='interceptor';
    const color=boss?'#d59bff':ranged?'#ffbd69':interceptor?'#70e7ff':'#ff718d';
    const edge=boss?'#f1d7ff':ranged?'#fff0cf':interceptor?'#e3fbff':'#ffd5de';
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.PI);
    // Angular plating and dark insets distinguish the hostile faction from the player hull.
    ctx.fillStyle='#130d20';ctx.beginPath();ctx.ellipse(0,2,this.radius*1.05,this.radius*.82,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.strokeStyle=edge;ctx.lineWidth=boss?2:1.2;ctx.beginPath();
    if(boss){ctx.moveTo(0,-this.radius*1.35);ctx.lineTo(this.radius*.52,-this.radius*.72);ctx.lineTo(this.radius*1.35,-this.radius*.15);ctx.lineTo(this.radius*.88,this.radius*.72);ctx.lineTo(this.radius*.36,this.radius*.88);ctx.lineTo(0,this.radius*1.22);ctx.lineTo(-this.radius*.36,this.radius*.88);ctx.lineTo(-this.radius*.88,this.radius*.72);ctx.lineTo(-this.radius*1.35,-this.radius*.15);ctx.lineTo(-this.radius*.52,-this.radius*.72);}
    else if(interceptor){ctx.moveTo(0,-this.radius*1.45);ctx.lineTo(this.radius*.52,-this.radius*.15);ctx.lineTo(this.radius*1.05,this.radius*.55);ctx.lineTo(this.radius*.2,this.radius*.35);ctx.lineTo(0,this.radius*1.15);ctx.lineTo(-this.radius*.2,this.radius*.35);ctx.lineTo(-this.radius*1.05,this.radius*.55);ctx.lineTo(-this.radius*.52,-this.radius*.15);}
    else if(ranged){ctx.moveTo(0,-this.radius*1.15);ctx.lineTo(this.radius*1.15,-this.radius*.35);ctx.lineTo(this.radius*.72,this.radius*.8);ctx.lineTo(0,this.radius*.55);ctx.lineTo(-this.radius*.72,this.radius*.8);ctx.lineTo(-this.radius*1.15,-this.radius*.35);}
    else{ctx.moveTo(0,-this.radius*1.2);ctx.lineTo(this.radius*.95,-this.radius*.1);ctx.lineTo(this.radius*.72,this.radius*.82);ctx.lineTo(0,this.radius*.52);ctx.lineTo(-this.radius*.72,this.radius*.82);ctx.lineTo(-this.radius*.95,-this.radius*.1);}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#25152f';ctx.fillRect(-this.radius*.62,-this.radius*.1,this.radius*1.24,this.radius*.38);
    ctx.fillStyle=edge;ctx.fillRect(-this.radius*.2,-this.radius*.24,this.radius*.4,this.radius*.48);
    ctx.fillStyle=boss?'#fff2ff':color;ctx.fillRect(-this.radius*.08,this.radius*.3,this.radius*.16,this.radius*.32);
    if(boss){ctx.strokeStyle='#fff0ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-this.radius*1.25,-this.radius*.12);ctx.lineTo(-this.radius*.52,this.radius*.22);ctx.moveTo(this.radius*1.25,-this.radius*.12);ctx.lineTo(this.radius*.52,this.radius*.22);ctx.stroke();}
    const barWidth=this.radius*2.2,barY=this.radius+5;ctx.fillStyle='#182338';ctx.fillRect(-barWidth/2,barY,barWidth,3);
    ctx.fillStyle=this.health/this.maxHealth<=.35?'#ff526f':'#8cf5c7';ctx.fillRect(-barWidth/2,barY,barWidth*(this.health/this.maxHealth),3);ctx.restore();
  }
}
