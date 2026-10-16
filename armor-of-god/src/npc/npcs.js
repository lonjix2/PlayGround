// NPCs: capsule bodies + name labels + burden auras (discernment lens reveals).
import * as THREE from 'three';
import { NPCS } from '../data/content.js';
const AURA_COLORS = {};
export class NPCManager {
  constructor(scene, state) {
    this.scene = scene; this.state = state; this.list = [];
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.1, 6, 12);
    for (const def of NPCS) {
      const color = def.id === 'elder' ? 0x8a8a9a : [0xc98a5a, 0x7ab8c9, 0xd9c9a8, 0xb98a4a, 0x9ab87a][this.list.length % 5];
      const mesh = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
      mesh.position.set(def.pos[0], 1.05, def.pos[2]); mesh.castShadow = true; scene.add(mesh);
      // head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), new THREE.MeshStandardMaterial({ color: 0xe8c39a }));
      head.position.set(def.pos[0], 2.15, def.pos[2]); head.castShadow = true; scene.add(head);
      // aura shell (visible only with lens, or faintly if burdened)
      const aura = new THREE.Mesh(new THREE.SphereGeometry(1.4, 18, 18),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(def.burden.aura), transparent: true, opacity: 0.0, side: THREE.BackSide, depthWrite: false }));
      aura.position.set(def.pos[0], 1.4, def.pos[2]); scene.add(aura);
      // name sprite
      const label = makeLabel(def.name);
      label.position.set(def.pos[0], 2.9, def.pos[2]); scene.add(label);
      // settled halo
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      halo.rotation.x = -Math.PI / 2; halo.position.set(def.pos[0], 0.06, def.pos[2]); scene.add(halo);
      this.list.push({ def, mesh, head, aura, label, halo, phase: Math.random() * 9, settled: !!state.settled[def.id] });
      if (this.list[this.list.length - 1].settled) halo.material.opacity = 0.9;
    }
  }
  update(dt, time, lensOn, playerPos) {
    for (const n of this.list) {
      n.phase += dt * 2;
      const settled = !!this.state.settled[n.def.id];
      // idle bob; oppressed trembles
      n.mesh.position.y = 1.05 + Math.sin(n.phase) * 0.03;
      n.head.position.y = 2.15 + Math.sin(n.phase) * 0.03;
      if (!settled && n.def.burden.kind === 'oppression') n.mesh.position.x = n.def.pos[0] + Math.sin(n.phase * 6) * 0.05;
      const d = Math.hypot(playerPos.x - n.def.pos[0], playerPos.z - n.def.pos[2]);
      const near = d < 26;
      const target = settled ? (lensOn ? 0.25 : 0.0) : (lensOn ? 0.55 : (near ? 0.10 : 0.0));
      n.aura.material.opacity += (target - n.aura.material.opacity) * Math.min(1, dt * 5);
      n.aura.rotation.y += dt * (settled ? 0.2 : 0.9);
      if (settled) n.halo.material.opacity = Math.min(0.9, n.halo.material.opacity + dt);
    }
  }
  nearest(pos, maxD = 3.4) {
    let best = null, bd = maxD;
    for (const n of this.list) { const d = Math.hypot(pos.x - n.def.pos[0], pos.z - n.def.pos[2]); if (d < bd) { bd = d; best = n; } }
    return best;
  }
}
function makeLabel(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 8, 256, 48);
  g.fillStyle = '#fff'; g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.fillText(text, 128, 44);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sp.scale.set(3.4, 0.85, 1); return sp;
}
