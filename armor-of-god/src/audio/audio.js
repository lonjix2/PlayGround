// Procedural WebAudio: adaptive pad (peace/tension/worship), verse chime, banish swell. No assets.
export class AudioMan {
  constructor() { this.ctx = null; this.mode = 'peace'; this.nodes = []; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = 0.35; this.master.connect(this.ctx.destination);
    this.padGain = this.ctx.createGain(); this.padGain.gain.value = 0.0; this.padGain.connect(this.master);
    // 3 detuned triangle oscillators = warm pad; frequency updated per mode
    this.oscs = [0, 4, 7].map(semi => {
      const o = this.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = 110 * Math.pow(2, semi / 12);
      const g = this.ctx.createGain(); g.gain.value = 0.33;
      o.connect(g); g.connect(this.padGain); o.start(); return o;
    });
    this.padGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2);
    this.setMode('peace');
  }
  setMode(mode) {
    if (!this.ctx || this.mode === mode && this._tuned) return;
    this.mode = mode; this._tuned = true;
    const base = mode === 'tension' ? 98 : mode === 'worship' ? 130.8 : 110;
    const chord = mode === 'tension' ? [0, 3, 6, 10] : mode === 'worship' ? [0, 4, 7, 12] : [0, 7, 12];
    this.oscs.forEach((o, i) => { const s = chord[i % chord.length]; o.frequency.setTargetAtTime(base * Math.pow(2, s / 12), this.ctx.currentTime, 1.2); });
  }
  blip(freq = 660, dur = 0.25, type = 'sine', vol = 0.4) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur);
  }
  verseChime(strong) { this.blip(strong ? 523 : 440, 0.4); setTimeout(() => this.blip(strong ? 784 : 554, 0.5), 120); setTimeout(() => strong && this.blip(1046, 0.7), 260); }
  banish() { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.8, 'sine', 0.35), i * 140)); }
  whisper() { this.blip(196, 1.2, 'sawtooth', 0.12); }
}
