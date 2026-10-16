// Deliverance combat: shadow-form enemies unmasked by Truth, bound in Jesus' name.
// Light-shaft VFX on landed verses. No gore — defeat = light breaking through.
import * as THREE from 'three';
export class ShadowEnemy {
  constructor(scene, pos, name = 'Tormentor') {
    this.scene = scene; this.name = name; this.resolve = 3; this.alive = true; this.phase = 0;
    this.group = new THREE.Group(); this.group.position.copy(pos);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 1, transparent: true, opacity: 0.92, emissive: 0x5b21b6, emissiveIntensity: 0.35 });
    this.body = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 7, 3), mat);
    this.body.position.y = 1.8; this.body.castShadow = true; this.group.add(this.body);
    this.eyes = [];
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
      e.position.set(0.28 * s, 2.4, 0.85); this.group.add(e); this.eyes.push(e);
    }
    this.smoke = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.28, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0x3b0764, transparent: true, opacity: 0.6 }));
    this.smoke.rotation.x = Math.PI / 2; this.smoke.position.y = 0.25; this.group.add(this.smoke);
    scene.add(this.group);
  }
  update(dt) {
    if (!this.alive) return;
    this.phase += dt * 3;
    this.body.scale.set(1 + Math.sin(this.phase) * 0.08, 1 + Math.cos(this.phase * 0.7) * 0.06, 1);
    this.body.rotation.y += dt * 0.8;
    this.smoke.rotation.z += dt * 1.4;
    this.group.position.y = Math.sin(this.phase * 0.8) * 0.15;
  }
  banish(scene, onDone) {
    this.alive = false;
    // light-shaft burst: expanding golden pillar + rising particles
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 12, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    shaft.position.copy(this.group.position); shaft.position.y = 6; scene.add(shaft);
    const flash = new THREE.PointLight(0xffe9a8, 60, 30, 1.6);
    flash.position.copy(this.group.position); flash.position.y = 3; scene.add(flash);
    scene.remove(this.group);
    let t = 0;
    const tick = () => {
      t += 0.05; shaft.scale.set(1 + t * 1.6, 1, 1 + t * 1.6); shaft.material.opacity = Math.max(0, 0.85 - t * 0.5);
      flash.intensity = Math.max(0, 60 - t * 45);
      if (t < 1.7) requestAnimationFrame(tick); else { scene.remove(shaft); scene.remove(flash); onDone && onDone(); }
    };
    tick();
  }
}
export function lightShaft(scene, pos, big = false) {
  const h = big ? 16 : 9;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.4, h, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(pos.x, h / 2, pos.z); scene.add(m);
  let t = 0;
  const tick = () => { t += 0.06; m.material.opacity = Math.max(0, 0.7 - t * 0.45); m.scale.x = m.scale.z = 1 + t; if (t < 1.6) requestAnimationFrame(tick); else scene.remove(m); };
  tick();
}
