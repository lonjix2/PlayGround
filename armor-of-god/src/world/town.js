// Town vertical slice: church (Safe House), market, school, clinic, homes, well, mill, forest, river. Placeholder primitives.
import * as THREE from 'three';
export function buildTown(scene) {
  const colliders = []; // {x,z,r}
  const addBox = (x, z, w, h, d, color, opts = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    m.position.set(x, h / 2 + (opts.y || 0), z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    if (opts.collide !== false) colliders.push({ x, z, r: Math.max(w, d) / 2 });
    if (opts.label) addLabel(scene, opts.label, x, h + 1.6 + (opts.y || 0), z);
    return m;
  };
  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ color: 0x3d5a3a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // plaza + paths
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshStandardMaterial({ color: 0x8a7a5c }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; scene.add(plaza);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x9c8a66 });
  [[0, 20, 4, 26], [0, -20, 4, 26], [18, 0, 26, 4], [-18, 0, 26, 4]].forEach(([x, z, w, d]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.015, z); scene.add(p);
  });
  // church / Safe House (north)
  addBox(0, -26, 10, 6, 12, 0xe8dcc0, { label: '⛪ Church — Safe House (hold P to pray)', collide: true });
  const steeple = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 4), new THREE.MeshStandardMaterial({ color: 0xc9a227 }));
  steeple.position.set(0, 8.5, -26); steeple.castShadow = true; scene.add(steeple);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffd98a, emissiveIntensity: 0.7 }));
  crossV.position.set(0, 12, -26); scene.add(crossV);
  const crossH = crossV.clone(); crossH.scale.set(3, 0.25, 1); crossH.position.y = 11.7; scene.add(crossH);
  // prayer zone ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(6, 7.2, 40), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.05, -20); scene.add(ring);
  // market stalls (east)
  addBox(16, 4, 3, 2.2, 3, 0x9c4a2f, { label: "Mara's stall" });
  addBox(16, 10, 3, 2.2, 3, 0x7a5c2e, { label: "Sella's stall" });
  addBox(8, 18, 4, 3, 4, 0x6b4a2a, { label: 'Market' });
  // school (south-east), clinic (west), homes
  addBox(6, -16, 8, 3.4, 5, 0x5c6e8a, { label: 'School — Doran' });
  addBox(-16, -8, 7, 3.4, 5, 0xdde3ea, { label: 'Clinic — Elder Tomas' });
  addBox(-8, 16, 4, 3, 4, 0x8a6a4a, { label: 'Farmhouse' });
  addBox([-20][0], 8, 4, 3, 4, 0x7a5a3a, { label: 'Home' });
  // well (center-west)
  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x777777 }));
  well.position.set(-10, 0.6, 12); well.castShadow = true; scene.add(well); colliders.push({ x: -10, z: 12, r: 1.8 });
  // old mill (far west — Phase-2 stronghold teaser, dark aura)
  addBox(-38, -2, 6, 8, 6, 0x2a2a33, { label: 'Old Mill — sealed (Phase 2)' });
  // trees (forest edge north-west + river east)
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4028 });
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, r = 48 + Math.random() * 40;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 44 && Math.abs(z) < 40) continue;
    const t = new THREE.Mesh(new THREE.ConeGeometry(1.6 + Math.random(), 4 + Math.random() * 2, 7), treeMat);
    t.position.set(x, 3, z); scene.add(t);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6), trunkMat);
    tr.position.set(x, 0.75, z); scene.add(tr);
  }
  // lamps (warm pools of light)
  const lampLights = [];
  [[0, 8], [10, 0], [-10, 0], [0, -12], [14, 14]].forEach(([x, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 4, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    pole.position.set(x, 2, z); scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffd98a, emissiveIntensity: 2 }));
    bulb.position.set(x, 4.2, z); scene.add(bulb);
    const l = new THREE.PointLight(0xffc46b, 12, 16, 1.8); l.position.set(x, 4.2, z); scene.add(l); lampLights.push(l);
  });
  // river (east edge, animated in Game loop via userData)
  const river = new THREE.Mesh(new THREE.PlaneGeometry(10, 220), new THREE.MeshStandardMaterial({ color: 0x2e5f8a, transparent: true, opacity: 0.85 }));
  river.rotation.x = -Math.PI / 2; river.position.set(52, 0.03, 0); river.userData.isRiver = true; scene.add(river);
  return { colliders, churchPos: new THREE.Vector3(0, 0, -20), millPos: new THREE.Vector3(-38, 0, -2) };
}
function addLabel(scene, text, x, y, z) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 512, 64);
  g.fillStyle = '#ffd98a'; g.font = '28px Georgia'; g.textAlign = 'center'; g.fillText(text.slice(0, 40), 256, 42);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sp.scale.set(9, 1.1, 1); sp.position.set(x, y, z); scene.add(sp);
}
