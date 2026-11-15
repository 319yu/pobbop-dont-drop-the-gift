export class SoundStudio {
  constructor() { this.muted = localStorage.getItem('pobbop-muted') === 'true'; this.ctx = null; this.musicTimer = null; this.step = 0; }
  toggle() { this.muted = !this.muted; localStorage.setItem('pobbop-muted', this.muted); if(this.muted)this.stopMusic();else this.startMusic(); return this.muted; }
  tone(freq, duration = .08, type = 'sine', volume = .05, slide = 0) {
    if (this.muted) return;
    this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + duration);
  }
  drop() { this.tone(180, .09, 'triangle', .035, -70); }
  hit(speed = 1) { this.tone(90 + speed * 8, .05, 'sine', Math.min(.04, speed / 300)); }
  perfect() { this.tone(740, .14, 'sine', .045, 220); setTimeout(() => this.tone(1110, .12, 'sine', .035), 70); }
  reward() { [520, 720, 980].forEach((f, i) => setTimeout(() => this.tone(f, .18, 'triangle', .035), i * 70)); }
  levelUp() { [330, 440, 660, 880].forEach((f, i) => setTimeout(() => this.tone(f, .22, 'triangle', .045), i * 90)); }
  fall() { this.tone(120, .55, 'sawtooth', .045, -85); }
  startMusic() {
    if(this.muted||this.musicTimer)return;
    this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    this.ctx.resume?.();
    const notes=[110,110,146.83,98,110,164.81,146.83,98];
    const tick=()=>{if(this.muted)return;const n=notes[this.step%notes.length];this.tone(n,.32,'sine',.012,-8);if(this.step%2===0)this.tone(55,.09,'triangle',.018,-18);if(this.step%4===2)this.tone(n*4,.12,'sine',.008,20);this.step++;};
    tick(); this.musicTimer=setInterval(tick,420);
  }
  stopMusic(){if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}}
}
