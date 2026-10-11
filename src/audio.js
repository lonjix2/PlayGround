// Procedural WebAudio: ambient pad, chimes, combat + UI sfx. No external assets.
let ctx = null;
let ambientNodes = [];
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.4, type = 'sine', vol = 0.15, when = 0, slideTo = null) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const audio = {
  unlock() { ensure(); },
  toggleMute() { muted = !muted; if (muted) this.stopAmbient(); else this.startAmbient(); return muted; },
  startAmbient() {
    const c = ensure();
    if (!c || ambientNodes.length) return;
    // soft pad: two detuned sines + slow LFO
    const g = c.createGain();
    g.gain.value = 0.035;
    g.connect(c.destination);
    const freqs = [110, 164.81, 220, 277.18];
    freqs.forEach((f, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const og = c.createGain();
      og.gain.value = 0.25;
      o.connect(og).connect(g);
      o.start();
      ambientNodes.push(o);
    });
    ambientNodes.push(g);
  },
  stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch {} });
    ambientNodes = [];
  },
  click() { tone(660, 0.12, 'triangle', 0.08); },
  speak() {
    // radiant rising arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.35, 'sine', 0.12, i * 0.06));
    tone(1568, 0.5, 'sine', 0.05, 0.2);
  },
  hit() { tone(220, 0.2, 'sawtooth', 0.08, 0, 90); tone(880, 0.25, 'sine', 0.1, 0.02); },
  enemyDie() { [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, i * 0.09)); },
  hurt() { tone(160, 0.3, 'sawtooth', 0.12, 0, 70); },
  deliver() {
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.6, 'sine', 0.1, i * 0.1));
  },
  fail() { tone(300, 0.4, 'triangle', 0.1, 0, 180); },
  bell() {
    [523.25, 659.25, 783.99].forEach(f => { tone(f, 2.2, 'sine', 0.14); tone(f * 2.01, 1.2, 'sine', 0.04); });
  },
  pray() { tone(432, 1.2, 'sine', 0.06); tone(648, 1.2, 'sine', 0.04, 0.15); },
  pickup() { tone(880, 0.2, 'sine', 0.1); tone(1174.66, 0.3, 'sine', 0.1, 0.08); },
  tempt() { tone(110, 1.0, 'sawtooth', 0.07, 0, 55); tone(116.5, 1.0, 'sawtooth', 0.05, 0.1, 58); }
};
