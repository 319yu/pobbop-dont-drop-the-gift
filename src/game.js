import Matter from 'matter-js';
import { BOX_TYPES, COLORS, GAME, STAGES, chooseBoxType, windSpeedMultiplier } from './config.js';

const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export class GiftGame {
  constructor(canvas, callbacks, sound) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.cb = callbacks; this.sound = sound;
    this.boxImages = Object.fromEntries(['classic','mirror','bouncy'].map(type => { const image=new Image();image.decoding='async';image.src=`${import.meta.env.BASE_URL}assets/boxes/${type}.png`;return [type,image]; }));
    this.engine = Engine.create({ enableSleeping: true }); this.engine.gravity.y = 1.05;
    this.boxes = []; this.particles = []; this.rings = []; this.score = 0; this.stageScore = 0; this.lives = 3;
    this.active = null; this.state = 'idle'; this.cameraY = 0; this.targetCameraY = 0; this.slowBoxes = 0;
    this.perfectStreak = 0; this.butterfly = null; this.butterflyShown = false; this.stage = STAGES[0]; this.stageBaseScore = 0; this.endless = false; this.wind = 0; this.windClock = 0; this.dpr = 1; this.lastTime = performance.now();
    // Physics and drawing intentionally share one animation clock. A separate
    // Matter Runner can be throttled independently by browsers and leave a
    // released box visually frozen while the canvas keeps rendering.
    this.resize(); this.buildWorld(); this.bindPhysics(); this.loop();
  }
  buildWorld() {
    this.platformY = GAME.worldHeight - 155;
    this.platformWidth = this.stage.platformWidth;
    this.platform = Bodies.rectangle(GAME.worldWidth / 2, this.platformY, this.platformWidth, 28, { isStatic: true, label: 'platform', friction: .9, chamfer: { radius: 14 } });
    Composite.add(this.engine.world, this.platform);
  }
  bindPhysics() {
    this.onCollision = e => e.pairs.forEach(({ bodyA, bodyB, collision }) => {
      const speed = Math.abs(collision.depth || 0) + Math.abs(bodyA.speed || 0) + Math.abs(bodyB.speed || 0);
      const impactUntil = performance.now() + Math.min(150, 65 + speed * 6);
      if (bodyA.plugin?.pobbop) bodyA.plugin.pobbop.impactUntil = impactUntil;
      if (bodyB.plugin?.pobbop) bodyB.plugin.pobbop.impactUntil = impactUntil;
      if (speed > 2 && performance.now() - (this.lastHit || 0) > 90) { this.sound.hit(speed); this.lastHit = performance.now(); }
    });
    Events.on(this.engine, 'collisionStart', this.onCollision);
  }
  start() {
    // A restart can happen while paused. Always restore the physics clock before
    // rebuilding the world, otherwise the UI resumes while Matter stays frozen.
    this.engine.timing.timeScale = 1;
    this.state = 'playing';
    this.reset();
    this.state = 'playing';
    this.lastTime = performance.now();
    this.spawn();
  }
  reset() {
    this.engine.timing.timeScale = 1;
    Composite.clear(this.engine.world, false); Engine.clear(this.engine); this.boxes = []; this.particles = []; this.rings = [];
    this.score = 0; this.stageScore = 0; this.lives = 3; this.perfectStreak = 0; this.slowBoxes = 0; this.cameraY = 0; this.targetCameraY = 0; this.butterfly = null; this.butterflyShown = false; this.active = null;
    this.stage = STAGES[0]; this.stageBaseScore = 0; this.endless = false; this.wind = 0; this.windClock = 0;
    this.buildWorld(); this.cb.stats(this.score, this.lives, this.stageScore); this.cb.stage(this.stage, 0, 0);
  }
  spawn() {
    if (this.state !== 'playing' || this.active) return;
    const type = chooseBoxType(this.score), cfg = BOX_TYPES[type];
    const variance = this.score >= 15 ? .9 + Math.random() * .22 : 1;
    const speedScale = (1 + Math.min(this.score, 30) * .026) * variance * (this.slowBoxes > 0 ? .75 : 1);
    if (this.slowBoxes > 0) this.slowBoxes--;
    const topY = Math.min(this.platformY - 320, this.getTowerTop() - 280);
    const w = GAME.boxWidth + (Math.random() * 16 - 8), h = w / cfg.aspect;
    // Keep gifts dynamic for their entire lifetime. Before release we drive the
    // body kinematically along the rail; after release we simply stop driving
    // it and gravity takes over. This avoids unreliable static/dynamic toggles.
    const body = Bodies.rectangle(120, topY, w, h, { label: 'gift', friction: cfg.friction, frictionStatic: cfg.frictionStatic, frictionAir: cfg.frictionAir, restitution: cfg.restitution, density: cfg.density, chamfer: { radius: cfg.chamfer } });
    body.plugin.pobbop = { type, cfg, w, h, scored: false, failed: false, released: false, stableSince: 0, direction: 1, speed: GAME.baseSpeed * speedScale, windMultiplier: 1 };
    Composite.add(this.engine.world, body); this.active = body;
  }
  drop() {
    if (this.state !== 'playing' || !this.active || this.active.plugin.pobbop.released) return false;
    const p = this.active.plugin.pobbop;
    const releaseX = this.active.position.x;
    const releaseY = this.active.position.y;
    p.released = true;
    Sleeping.set(this.active, false);
    // Reset every motion accumulator so Space always means an immediate,
    // truly vertical drop from the exact current rail position.
    Body.setPosition(this.active, { x: releaseX, y: releaseY });
    Body.setVelocity(this.active, { x: 0, y: 0 });
    Body.setAngularVelocity(this.active, 0);
    this.active.positionPrev.x = releaseX;
    this.active.positionPrev.y = releaseY;
    this.active.anglePrev = this.active.angle;
    this.active.force.x = 0;
    this.active.force.y = 0;
    this.active.torque = 0;
    this.sound.drop();
    return true;
  }
  pause(force) {
    if (!['playing', 'paused'].includes(this.state)) return;
    const paused = force ?? this.state === 'playing'; this.state = paused ? 'paused' : 'playing'; this.engine.timing.timeScale = paused ? 0 : 1; this.cb.pause(paused);
  }
  update(dt) {
    if (this.state !== 'playing') return;
    this.updateWind(dt);
    const b = this.active;
    if (b) {
      const p = b.plugin.pobbop;
      if (!p.released) {
        Sleeping.set(b, false);
        const edge = GAME.worldWidth - p.w / 2 - 34;
        const railZone = this.getWindZones().find(z => b.position.x > z.x && b.position.x < z.x + z.w && b.position.y > z.top && b.position.y < z.bottom);
        const targetWindMultiplier = railZone ? windSpeedMultiplier(p.direction, railZone.dir) : 1;
        p.windMultiplier += (targetWindMultiplier - p.windMultiplier) * Math.min(1, dt * 8);
        let x = b.position.x + p.direction * p.speed * p.windMultiplier * dt;
        if (x > edge || x < p.w / 2 + 34) { p.direction *= -1; x = clamp(x, p.w / 2 + 34, edge); }
        Body.setPosition(b, { x, y: b.position.y });
        // Engine.update runs before this kinematic rail update. Remove gravity
        // and inferred movement every frame until the player releases the box.
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
        b.positionPrev.x = b.position.x;
        b.positionPrev.y = b.position.y;
        b.force.x = 0; b.force.y = 0; b.torque = 0;
      } else { this.applyWind(b); this.checkActive(b); }
    }
    if (this.stage.number >= 2) this.boxes.forEach(box => this.applyWind(box, .18));
    const top = this.getTowerTop(); this.targetCameraY = Math.min(0, top - 320); this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 3.5);
    this.updateParticles(dt);
  }
  checkActive(b) {
    const p = b.plugin.pobbop, now = performance.now();
    if (b.position.y > this.platformY + 250 || b.position.x < -100 || b.position.x > GAME.worldWidth + 100) return this.failActive();
    const touching = Matter.Query.collides(b, [this.platform, ...this.boxes.filter(x => x !== b)]).length > 0;
    const stable = touching && b.speed < .34 && Math.abs(b.angularSpeed) < .012;
    if (stable) p.stableSince ||= now; else p.stableSince = 0;
    if (p.stableSince && now - p.stableSince >= GAME.stableMs) this.scoreActive();
  }
  scoreActive() {
    const b = this.active, p = b.plugin.pobbop; if (!b || p.scored) return;
    p.scored = true; this.boxes.push(b); this.active = null; this.score++; this.stageScore++;
    const support = this.findSupport(b), perfect = support && Math.abs(b.position.x - support.position.x) < p.w * GAME.perfectRatio;
    if (perfect) { this.perfectStreak++; this.sound.perfect(); this.cb.flash('PERFECT!'); this.burst(b.position.x, b.position.y, COLORS.lemon); this.rings.push({x:b.position.x,y:b.position.y,life:1}); }
    else this.perfectStreak = 0;
    if (this.perfectStreak >= 3) { this.perfectStreak = 0; this.score++; this.stageScore++; this.cb.flash('3× PERFECT · BONUS +1'); this.sound.reward(); }
    if (p.type === 'bouncy') this.applySpecial();
    if (this.score >= 10 && !this.butterflyShown) { this.butterflyShown = true; this.butterfly = { start: performance.now(), x: b.position.x, y: b.position.y }; }
    this.cb.stats(this.score, this.lives, this.stageScore); this.cb.stage(this.stage, Math.min(10, this.stageScore), this.wind);
    if (this.stageScore === 10) this.cb.flash('QUALIFIED · SURVIVE UNTIL LIVES END');
    setTimeout(() => this.spawn(), 320);
  }
  findSupport(b) {
    const candidates = [this.platform, ...this.boxes.filter(x => x !== b)].filter(x => x.position.y > b.position.y && Math.abs(x.position.x - b.position.x) < (x.bounds.max.x - x.bounds.min.x));
    return candidates.sort((a, z) => a.position.y - z.position.y)[0];
  }
  applySpecial() {
    let text;
    if (this.lives < GAME.maxLives) { this.lives++; text = 'SPECIAL · LIFE RESTORED'; }
    else { this.score++; this.stageScore++; text = 'SPECIAL · BONUS +1'; }
    this.sound.reward(); this.cb.flash(text);
  }
  nextLevel() {
    if (this.state !== 'levelChoice') return;
    if (this.stage.number < 3) this.stage = STAGES[this.stage.number];
    else { this.endless = true; this.stage = { ...STAGES[2], name: 'INFINITE AIR', platformWidth: 160, wind: .00004 }; }
    Composite.clear(this.engine.world, false); Engine.clear(this.engine); this.boxes = []; this.particles = []; this.rings = []; this.active = null;
    this.lives = 3; this.stageScore = 0; this.stageBaseScore = this.score; this.perfectStreak = 0; this.cameraY = 0; this.targetCameraY = 0; this.windClock = 0; this.wind = 0;
    this.buildWorld(); this.state = 'playing'; this.engine.timing.timeScale = 1; this.lastTime = performance.now();
    this.cb.stats(this.score, this.lives, this.stageScore); this.cb.stage(this.stage, 0, 0); this.cb.stageClear(this.stage); this.spawn();
  }
  endRun() { if (this.state === 'levelChoice') { this.state = 'over'; this.cb.gameOver(this.score); } }
  updateWind(dt) {
    this.windClock += dt;
    if (this.stage.number === 1) this.wind = 0;
    else if (this.stage.number === 2) this.wind = this.stage.wind * Math.sin(this.windClock * .55);
    else this.wind = this.stage.wind * (Math.sin(this.windClock * 1.05) + .35 * Math.sin(this.windClock * 2.3));
    this.cb.stage(this.stage, Math.min(10, this.stageScore), this.wind);
  }
  applyWind(body, strength = 1) {
    if (!this.wind || body.isSleeping) return;
    const zone = this.getWindZones().find(z => body.position.x > z.x && body.position.x < z.x + z.w && body.position.y > z.top && body.position.y < z.bottom);
    if (!zone) return;
    Body.applyForce(body, body.position, { x: Math.abs(this.wind) * zone.dir * body.mass * strength * 2.4, y: 0 });
  }
  getWindZones() {
    if (this.stage.number === 1) return [];
    const top = this.cameraY + 130, bottom = this.platformY - 35;
    if (this.stage.number === 2) return [{ x: 245, w: 230, top, bottom, dir: this.wind >= 0 ? 1 : -1 }];
    const drift = Math.sin(this.windClock * .42) * 62;
    return [{ x: 92 + drift, w: 150, top, bottom, dir: 1 }, { x: 475 - drift, w: 150, top, bottom, dir: -1 }];
  }
  failActive() {
    const b = this.active; if (!b || b.plugin.pobbop.failed) return; b.plugin.pobbop.failed = true; this.active = null; this.lives--; this.cb.stats(this.score, this.lives, this.stageScore); this.cb.flash('MISSED · ' + this.lives + ' LIVES');
    setTimeout(() => Composite.remove(this.engine.world, b), 150);
    if (this.lives <= 0) {
      if (this.stageScore >= 10) { this.state = 'levelChoice'; this.sound.levelUp(); this.cb.levelChoice(this.stage, this.score, this.stage.number < 3); }
      else this.bigFall();
    } else setTimeout(() => this.spawn(), 500);
  }
  bigFall() {
    this.state = 'ending'; this.sound.fall(); this.engine.timing.timeScale = .28;
    this.boxes.forEach((b, i) => Body.applyForce(b, b.position, { x: (Math.random() - .5) * .018, y: -.005 - i * .0001 }));
    this.cb.shake(); setTimeout(() => { this.engine.timing.timeScale = 1; this.state = 'over'; this.cb.gameOver(this.score); }, 1500);
  }
  getTowerTop() { return this.boxes.length ? Math.min(...this.boxes.map(b => b.bounds.min.y)) : this.platformY; }
  burst(x, y, color) { for (let i=0;i<18;i++) this.particles.push({ x, y, vx:(Math.random()-.5)*160, vy:(Math.random()-.8)*150, life:1, color }); }
  updateParticles(dt) { this.particles.forEach(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=190*dt; p.life-=dt*1.3; }); this.particles=this.particles.filter(p=>p.life>0); this.rings.forEach(r=>r.life-=dt*1.7);this.rings=this.rings.filter(r=>r.life>0); }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.dpr = Math.min(2, devicePixelRatio || 1); this.canvas.width = rect.width*this.dpr; this.canvas.height=rect.height*this.dpr;
    this.viewW=rect.width; this.viewH=rect.height; this.scale=Math.min(rect.width/GAME.worldWidth, rect.height/GAME.worldHeight); this.offsetX=(rect.width-GAME.worldWidth*this.scale)/2; this.offsetY=(rect.height-GAME.worldHeight*this.scale)/2;
  }
  loop = (time=performance.now()) => {
    const dt=Math.min(1/60,(time-this.lastTime)/1000); this.lastTime=time;
    if (this.state === 'playing' || this.state === 'ending') Engine.update(this.engine, dt * 1000);
    this.update(dt); this.render(time); this.raf=requestAnimationFrame(this.loop);
  };
  render(time) {
    if (this.active) {
      const debug = this.active.plugin.pobbop;
      this.canvas.dataset.gameState = this.state;
      this.canvas.dataset.activeY = this.active.position.y.toFixed(2);
      this.canvas.dataset.activeStatic = String(this.active.isStatic);
      this.canvas.dataset.activeReleased = String(debug.released);
      this.canvas.dataset.activeMass = String(this.active.mass);
      this.canvas.dataset.engineTime = this.engine.timing.timestamp.toFixed(1);
    }
    const c=this.ctx; c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,this.viewW,this.viewH); c.save(); c.translate(this.offsetX,this.offsetY); c.scale(this.scale,this.scale); c.translate(0,-this.cameraY);
    this.drawWindZones(c,time);
    c.fillStyle='#121212'; c.shadowColor='rgba(0,0,0,.18)'; c.shadowBlur=24; this.roundRect(c,this.platform.position.x-this.platformWidth/2,this.platformY-14,this.platformWidth,28,14); c.fill(); c.shadowBlur=0;
    [...this.boxes, ...(this.active?[this.active]:[])].forEach(b=>this.drawBox(c,b));
    this.particles.forEach(p=>{c.globalAlpha=p.life;c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();}); c.globalAlpha=1;
    this.rings.forEach(r=>{c.globalAlpha=r.life;c.strokeStyle=COLORS.lemon;c.lineWidth=3;c.beginPath();c.ellipse(r.x,r.y,35+(1-r.life)*90,18+(1-r.life)*35,0,0,Math.PI*2);c.stroke();});c.globalAlpha=1;
    if(this.butterfly) this.drawButterfly(c,time); c.restore();
  }
  drawBox(c,b) {
    const p=b.plugin.pobbop,w=p.w,h=p.h,impact=Math.max(0,(p.impactUntil||0)-performance.now()),pulse=Math.min(1,impact/150);c.save();c.translate(b.position.x,b.position.y);c.rotate(b.angle);if(impact)c.scale(1+(p.type==='bouncy'?.04:.012)*pulse,1-(p.type==='bouncy'?.05:.015)*pulse);c.shadowColor='rgba(0,0,0,.24)';c.shadowBlur=20;c.shadowOffsetY=13;
    const productImage=this.boxImages[p.type==='mystery'?'classic':p.type];if(productImage?.complete&&productImage.naturalWidth){c.drawImage(productImage,-w/2,-h/2,w,h);c.shadowBlur=0;c.shadowOffsetY=0;if(p.type==='mystery'){c.fillStyle='rgba(232,241,57,.9)';c.fillRect(-w*.08,-h/2,w*.16,h);c.fillRect(-w/2,-h*.1,w,h*.2);c.strokeStyle='rgba(25,25,25,.5)';c.lineWidth=1;c.strokeRect(-w/2+1,-h/2+1,w-2,h-2);}c.restore();return;}
    c.fillStyle=p.cfg.fill;this.roundRect(c,-w/2,-h/2,w,h,p.cfg.chamfer);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
    c.fillStyle=p.type==='mirror'?'rgba(112,117,122,.35)':p.type==='bouncy'?'rgba(174,184,33,.45)':p.type==='mystery'?'rgba(183,154,66,.34)':'rgba(255,255,255,.055)';c.beginPath();c.moveTo(w/2-9,-h/2+5);c.lineTo(w/2,-h/2);c.lineTo(w/2,h/2);c.lineTo(w/2-9,h/2-5);c.closePath();c.fill();
    c.fillStyle=p.type==='bouncy'?'#cbd526':p.type==='mirror'?'#94999e':p.type==='mystery'?'#b79a42':'#050505';c.beginPath();c.moveTo(-w/2,-h/2);c.lineTo(-w/2+10,-h/2-8);c.lineTo(w/2+10,-h/2-8);c.lineTo(w/2,-h/2);c.closePath();c.fill();
    c.fillStyle=p.type==='mirror'?'rgba(255,255,255,.22)':'rgba(255,255,255,.07)';c.fillRect(-w/2+4,-h/2+4,w-8,2);
    if(p.type==='classic'){c.strokeStyle='rgba(255,255,255,.055)';c.lineWidth=1;for(let y=-h/2+13;y<h/2-8;y+=8){c.beginPath();c.moveTo(-w/2+10,y);c.bezierCurveTo(-w/6,y-3,w/6,y+3,w/2-10,y);c.stroke();}}
    if(p.type==='mirror'){const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#868b90');g.addColorStop(.35,'#f6f7f7');g.addColorStop(.52,'#b5b9bd');g.addColorStop(1,'#e4e5e6');c.fillStyle=g;this.roundRect(c,-w/2,-h/2,w,h,3);c.fill();}
    if(p.type==='mystery'){c.strokeStyle='#c7a94b';c.lineWidth=3;c.strokeRect(-w/2+2,-h/2+2,w-4,h-4);c.shadowColor='#E8F139';c.shadowBlur=12;c.stroke();}
    c.fillStyle=p.type==='bouncy'?'#1A1A1A':p.type==='mirror'?'#1A1A1A':'#EAE7DF';c.font='700 12px Arial';c.textAlign='center';c.textBaseline='middle';c.letterSpacing='2px';c.fillText('POBBOP',0,0);c.restore();
  }
  drawWindZones(c,time) {
    this.getWindZones().forEach((z,zi) => {
      const g=c.createLinearGradient(z.x,0,z.x+z.w,0);g.addColorStop(0,'rgba(232,241,57,0)');g.addColorStop(.5,'rgba(232,241,57,.16)');g.addColorStop(1,'rgba(232,241,57,0)');c.fillStyle=g;c.fillRect(z.x,z.top,z.w,z.bottom-z.top);
      c.save();c.beginPath();c.rect(z.x,z.top,z.w,z.bottom-z.top);c.clip();c.strokeStyle='rgba(26,26,26,.25)';c.lineWidth=2;c.setLineDash([18,14]);c.lineDashOffset=-time*.035*z.dir;
      for(let y=z.top+42;y<z.bottom;y+=72){c.beginPath();c.moveTo(z.x-30,y);c.bezierCurveTo(z.x+z.w*.3,y-12,z.x+z.w*.7,y+12,z.x+z.w+30,y);c.stroke();}
      c.setLineDash([]);c.fillStyle='rgba(26,26,26,.65)';c.font='700 18px Arial';c.textAlign='center';c.fillText(z.dir>0?'→ → →':'← ← ←',z.x+z.w/2,z.top+30+zi*8);c.restore();
    });
  }
  drawButterfly(c,time){const t=(time-this.butterfly.start)/2000;if(t>1){this.butterfly=null;return;}const a=t*Math.PI*4,x=this.butterfly.x+Math.cos(a)*110,y=this.butterfly.y-80-Math.sin(a)*38-t*60;c.save();c.translate(x,y);c.rotate(Math.sin(a)*.3);c.fillStyle='#c7a94b';const flap=Math.sin(time*.025)*10;c.beginPath();c.ellipse(-8,0,10+flap/3,16, -.5,0,Math.PI*2);c.ellipse(8,0,10-flap/3,16,.5,0,Math.PI*2);c.fill();c.restore();}
  roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  destroy(){cancelAnimationFrame(this.raf);Events.off(this.engine,'collisionStart',this.onCollision);Composite.clear(this.engine.world,false);Engine.clear(this.engine);}
}
