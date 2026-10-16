// Day/night cycle: more spiritual activity at night; dawn/worship pushes darkness back.
import * as THREE from 'three';
export class DayNight {
  constructor(scene) {
    this.t = 0.35; // 0..1, start mid-morning
    this.sun = new THREE.DirectionalLight(0xfff2d0, 2.2); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.camera.left = -60; this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60; this.sun.shadow.camera.bottom = -60; scene.add(this.sun);
    this.amb = new THREE.AmbientLight(0x8899bb, 0.5); scene.add(this.amb);
    this.scene = scene;
  }
  get isNight() { return this.t < 0.22 || this.t > 0.78; }
  update(dt, darkness = 0) {
    this.t = (this.t + dt / 240) % 1; // 4-min day
    const ang = this.t * Math.PI * 2 - Math.PI / 2;
    this.sun.position.set(Math.cos(ang) * 80, Math.sin(ang) * 80 + 10, 20);
    const day = Math.max(0, Math.sin(ang));
    this.sun.intensity = 0.25 + day * 2.0;
    this.sun.color.setHSL(0.12, 0.5, 0.5 + day * 0.4);
    this.amb.intensity = 0.25 + day * 0.45;
    const nightF = 1 - day;
    this.scene.fog = new THREE.FogExp2(new THREE.Color().setHSL(0.65, 0.3, 0.06 + day * 0.1 - darkness * 0.02).getHex(), 0.008 + nightF * 0.006);
    this.scene.background = new THREE.Color().setHSL(0.62, 0.45, 0.04 + day * 0.42);
    return { day, nightF };
  }
}
