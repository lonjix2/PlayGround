// Keyboard + mouse orbit + touch stick input.
export class Input {
  constructor() {
    this.keys = {}; this.discern = false; this.stickVec = { x: 0, y: 0 };
    this.yaw = 0.6; this.pitch = 0.35; this.dragging = false;
    this.pressed = {}; // edge-triggered actions
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys[e.code] = true; this.pressed[e.code] = true;
      if (e.code === 'KeyQ') this.discern = true;
      if (e.code === 'Tab') e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; if (e.code === 'KeyQ') this.discern = false; });
    const cv = () => document.getElementById('game-canvas');
    window.addEventListener('mousedown', e => { if (e.target === cv()) this.dragging = true; });
    window.addEventListener('mouseup', () => this.dragging = false);
    window.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      this.yaw -= e.movementX * 0.005; this.pitch = Math.max(0.05, Math.min(1.2, this.pitch + e.movementY * 0.004));
    });
    // touch look: drag on right half of canvas
    let lastT = null;
    document.addEventListener('touchmove', e => {
      const t = [...e.touches].find(t => t.clientX > window.innerWidth * 0.4);
      if (t && lastT) { this.yaw -= (t.clientX - lastT.x) * 0.008; this.pitch = Math.max(0.05, Math.min(1.2, this.pitch + (t.clientY - lastT.y) * 0.006)); }
      if (t) lastT = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener('touchend', () => lastT = null);
    this.bindStick();
    this.bindTouchButtons();
  }
  bindStick() {
    const stick = document.getElementById('stick'); const knob = document.getElementById('stick-knob');
    if (!stick) return; let id = null, cx = 0, cy = 0;
    const set = (dx, dy) => { this.stickVec = { x: Math.max(-1, Math.min(1, dx / 45)), y: Math.max(-1, Math.min(1, dy / 45)) }; knob.style.transform = `translate(${Math.max(-35, Math.min(35, dx))}px,${Math.max(-35, Math.min(35, dy))}px)`; };
    stick.addEventListener('touchstart', e => { const t = e.changedTouches[0]; id = t.identifier; const r = stick.getBoundingClientRect(); cx = r.left + 60; cy = r.top + 60; }, { passive: true });
    stick.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === id) set(t.clientX - cx, t.clientY - cy); }, { passive: true });
    stick.addEventListener('touchend', () => { id = null; this.stickVec = { x: 0, y: 0 }; knob.style.transform = ''; });
  }
  bindTouchButtons() {
    document.querySelectorAll('#touch-btns button').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'interact') this.pressed['KeyE'] = true;
      if (a === 'discern') this.discern = !this.discern;
      if (a === 'wheel') this.pressed['Tab'] = true;
      if (a === 'pray') this.pressed['KeyP'] = true;
    }));
  }
  moveVec() {
    let x = 0, z = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    x += this.stickVec.x; z += this.stickVec.y;
    const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
    return { x, z };
  }
  consume(code) { const v = !!this.pressed[code]; this.pressed[code] = false; return v; }
  endFrame() { this.pressed['Tab'] = false; }
}
