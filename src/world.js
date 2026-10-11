import * as THREE from 'three';

// Builds a small free-roam town: plaza + church, houses, lamps, trees, walls, scroll pickups, bell.
export function buildWorld(scene) {
  const W = {
    colliders: [], // {x,z,r} circles + {minX,maxX,minZ,maxZ} boxes
    scrollSpawns: [],
    churchPos: new THREE.Vector3(0, 0, -38),
    bellPos: new THREE.Vector3(0, 0, -38),
    bounds: 68,
    lamps: [],
    doves: null
  };

  // --- Light rig ---
  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a3226, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.6);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
  scene.add(sun);
  W.sun = sun; W.hemi = hemi;

  // --- Sky ---
  const skyGeo = new THREE.SphereGeometry(400, 16, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x87b5e8, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  W.sky = sky;

  // stars (visible at night via opacity)
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 600; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.48 + 0.05;
    starPos.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0, fog: false, sizeAttenuation: false }));
  scene.add(stars);
  W.stars = stars;

  // --- Ground ---
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x5d8a4e, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // plaza disc
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(16, 40),
    new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.9 })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // roads (cross)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x6e6250, roughness: 1 });
  const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(8, 150), roadMat);
  roadNS.rotation.x = -Math.PI / 2; roadNS.position.y = 0.015; roadNS.receiveShadow = true;
  scene.add(roadNS);
  const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(150, 8), roadMat);
  roadEW.rotation.x = -Math.PI / 2; roadEW.position.y = 0.015; roadEW.receiveShadow = true;
  scene.add(roadEW);

  const addBox = (x, z, w, d) => W.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  const addCircle = (x, z, r) => W.colliders.push({ x, z, r });

  // --- Church (north) ---
  const church = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2e, roughness: 0.9 });
  const nave = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 16), wallMat);
  nave.position.y = 3; nave.castShadow = nave.receiveShadow = true;
  church.add(nave);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8.6, 4.5, 4), roofMat);
  roof.position.y = 8.2; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
  church.add(roof);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), wallMat);
  tower.position.set(0, 6, -9); tower.castShadow = true;
  church.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3, 5, 4), roofMat);
  spire.position.set(0, 14.5, -9); spire.rotation.y = Math.PI / 4; spire.castShadow = true;
  church.add(spire);
  // cross
  const crossMat = new THREE.MeshStandardMaterial({ color: 0xf5c542, emissive: 0x664400, emissiveIntensity: 0.6 });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, 0.35), new THREE.MeshStandardMaterial({ color: 0xf5c542, emissive: 0x664400, emissiveIntensity: 0.6 }));
  crossV.position.set(0, 18, -9);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.35), crossV.material);
  crossH.position.set(0, 17.8, -9);
  church.add(crossV, crossH);
  W.cross = crossV;
  // door glow
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.4), new THREE.MeshStandardMaterial({ color: 0x4a2c12, emissive: 0xffc86a, emissiveIntensity: 0.55 }));
  door.position.set(0, 2.2, 8.02);
  church.add(door);
  // windows
  for (let i = -1; i <= 1; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshStandardMaterial({ color: 0x88bbff, emissive: 0x3355aa, emissiveIntensity: 0.7 }));
    win.position.set(i * 3.6, 3.4, 8.02);
    church.add(win);
  }
  church.position.copy(W.churchPos);
  scene.add(church);
  addBox(W.churchPos.x, W.churchPos.z, 13, 17);
  // bell interact point in front of church
  W.bellPos = new THREE.Vector3(0, 0, -28);

  // holy glow circle at church steps (prayer zone)
  const glow = new THREE.Mesh(new THREE.CircleGeometry(6, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.22 }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.04, -27);
  scene.add(glow);
  W.holyGlow = glow;

  // --- Houses around town ---
  const houseColors = [0xe8d8b8, 0xd8e4f0, 0xf0d0c0, 0xd8ecd0, 0xece0f0, 0xf5e8c8];
  const houseSpots = [
    [-22, -18], [22, -18], [-30, 6], [30, 6], [-20, 26], [20, 26],
    [-38, -6], [38, -8], [-12, -34], [14, -34], [-34, 30], [36, 30]
  ];
  houseSpots.forEach(([x, z], i) => {
    const g = new THREE.Group();
    const c = houseColors[i % houseColors.length];
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, 6),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    base.position.y = 2.25; base.castShadow = base.receiveShadow = true;
    g.add(base);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.8, 4),
      new THREE.MeshStandardMaterial({ color: [0x8a3b2e, 0x3e5a8a, 0x5a6e3a][i % 3], roughness: 0.9 }));
    rf.position.y = 5.9; rf.rotation.y = Math.PI / 4; rf.castShadow = true;
    g.add(rf);
    const winMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xaa7722, emissiveIntensity: 0.8 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), winMat);
    win.position.set(0, 2.4, 3.03);
    g.add(win);
    const doorM = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x4a2c12 }));
    doorM.position.set(-1.8, 1.2, 3.03);
    g.add(doorM);
    g.position.set(x, 0, z);
    g.rotation.y = (Math.random() - 0.5) * 0.4 + (x > 0 ? -0.15 : 0.15);
    scene.add(g);
    addBox(x, z, 7.4, 6.4);
  });

  // --- City wall ring (bounds) ---
  const cityWallMat = new THREE.MeshStandardMaterial({ color: 0x9a8f7a, roughness: 1 });
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2;
    const x = Math.cos(ang) * 72, z = Math.sin(ang) * 72;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(19, 5, 2), cityWallMat);
    seg.position.set(x, 2.5, z);
    seg.lookAt(0, 2.5, 0);
    seg.castShadow = seg.receiveShadow = true;
    scene.add(seg);
  }

  // --- Trees ---
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3e7a34, roughness: 1 });
  const treeSpots = [];
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 24 + Math.random() * 40;
    treeSpots.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  treeSpots.forEach(([x, z]) => {
    if (Math.abs(x) < 10 || Math.abs(z) < 8) return; // keep roads clear
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.4, 7), trunkMat);
    trunk.position.y = 1.2; trunk.castShadow = true;
    t.add(trunk);
    for (let k = 0; k < 3; k++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(1.8 - k * 0.4, 1.8, 8), leafMat);
      s.position.y = 2.8 + k * 1.1; s.castShadow = true;
      t.add(s);
    }
    t.position.set(x, 0, z);
    const sc = 0.8 + Math.random() * 0.7;
    t.scale.setScalar(sc);
    scene.add(t);
    addCircle(x, z, 0.7 * sc);
  });

  // --- Lamp posts ---
  const lampSpots = [[-6, -10], [6, -10], [-6, 12], [6, 12], [-14, -24], [14, -24], [0, 0]];
  lampSpots.forEach(([x, z]) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0x222630 }));
    pole.position.y = 2.5; pole.castShadow = true;
    g.add(pole);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe6a0, emissive: 0xffb84a, emissiveIntensity: 1.6 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), bulbMat);
    bulb.position.y = 5.1;
    g.add(bulb);
    const light = new THREE.PointLight(0xffc86a, 12, 22, 1.8);
    light.position.y = 5.1;
    g.add(light);
    g.position.set(x, 0, z);
    scene.add(g);
    W.lamps.push({ light, bulbMat });
    addCircle(x, z, 0.35);
  });

  // --- Fountain (plaza center) ---
  const fountain = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 1, 18),
    new THREE.MeshStandardMaterial({ color: 0x9aa4b5, roughness: 0.6 }));
  basin.position.y = 0.5; basin.castShadow = basin.receiveShadow = true;
  fountain.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.3, 18),
    new THREE.MeshStandardMaterial({ color: 0x66c8ff, transparent: true, opacity: 0.8, emissive: 0x2266aa, emissiveIntensity: 0.4 }));
  water.position.y = 1.0;
  fountain.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x9aa4b5 }));
  pillar.position.y = 2.0; pillar.castShadow = true;
  fountain.add(pillar);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5c542, emissive: 0xaa7711, emissiveIntensity: 0.8 }));
  top.position.y = 3.3;
  fountain.add(top);
  fountain.position.set(0, 0, 4);
  scene.add(fountain);
  W.fountainTop = top;
  addCircle(0, 4, 3.6);

  // --- Scroll pickups (glowing) ---
  const scrollGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.9, 8);
  const scrollSpots = [
    [-10, -20], [12, 8], [-26, 18], [28, -2], [6, 30], [-6, -32], [34, 20], [-36, -14]
  ];
  W.scrollMeshes = [];
  scrollSpots.forEach(([x, z], i) => {
    const m = new THREE.Mesh(scrollGeo, new THREE.MeshStandardMaterial({
      color: 0xfff2c8, emissive: 0xf5c542, emissiveIntensity: 0.9
    }));
    m.position.set(x, 1.1, z);
    m.rotation.z = Math.PI / 2;
    m.castShadow = true;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf5c542, transparent: true, opacity: 0.18 }));
    halo.position.copy(m.position);
    scene.add(m, halo);
    W.scrollMeshes.push({ mesh: m, halo, x, z, taken: false, idx: i });
  });

  // --- Floating light motes ---
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    motePos[i * 3] = (Math.random() - 0.5) * 130;
    motePos[i * 3 + 1] = 0.5 + Math.random() * 9;
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xffe9a8, size: 0.28, transparent: true, opacity: 0.75
  }));
  scene.add(motes);
  W.motes = motes;

  // --- Doves (simple flapping quads circling church) ---
  const doveGeo = new THREE.BufferGeometry();
  const dovePos = new Float32Array(7 * 3);
  doveGeo.setAttribute('position', new THREE.BufferAttribute(dovePos, 3));
  const doves = new THREE.Points(doveGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 }));
  scene.add(doves);
  W.doves = doves;
  W.doveAngle = 0;

  return W;
}

export function collideWorld(W, x, z) {
  // bounds
  const r = Math.hypot(x, z);
  if (r > W.bounds) {
    const s = W.bounds / r;
    x *= s; z *= s;
  }
  // colliders
  for (const c of W.colliders) {
    if (c.r !== undefined) {
      const dx = x - c.x, dz = z - c.z;
      const d = Math.hypot(dx, dz);
      if (d < c.r + 0.6 && d > 0.0001) {
        const push = (c.r + 0.6 - d);
        x += (dx / d) * push; z += (dz / d) * push;
      }
    } else {
      const nx = Math.max(c.minX, Math.min(c.maxX, x));
      const nz = Math.max(c.minZ, Math.min(c.maxZ, z));
      const dx = x - nx, dz = z - nz;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) {
        if (d > 0.0001) { x = nx + (dx / d) * 0.6; z = nz + (dz / d) * 0.6; }
        else {
          // inside: push out along smallest penetration
          const pl = x - c.minX, pr = c.maxX - x, pt = z - c.minZ, pb = c.maxZ - z;
          const m = Math.min(pl, pr, pt, pb);
          if (m === pl) x = c.minX - 0.6; else if (m === pr) x = c.maxX + 0.6;
          else if (m === pt) z = c.minZ - 0.6; else z = c.maxZ + 0.6;
        }
      }
    }
  }
  return { x, z };
}
