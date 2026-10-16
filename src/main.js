import * as THREE from 'three';
import { VERSES, verseById, CATEGORIES, AFFLICTIONS, TEMPTATIONS, ENEMY_TYPES, RANKS } from './data.js';
import { buildWorld, collideWorld } from './world.js';
import { audio } from './audio.js';

// ============================================================ state
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9db8d8, 55, 220);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 900);

const W = buildWorld(scene);

const S = {
  started: false,
  faith: 100, maxFaith: 100,
  peace: 100, maxPeace: 100,
  light: 100, maxLight: 100,
  xp: 0, level: 1,
  souls: 0, cleansed: 0, resisted: 0,
  points: 0, streak: 0, bestStreak: 0,
  ptsDeliver: 0, ptsCombat: 0, ptsResist: 0, ptsBless: 0, ptsScroll: 0,
  correctCount: 0, wrongCount: 0,
  unlocked: new Set(['psalm23-4', 'john14-27', 'phil4-13', 'heb11-1']),
  hotbar: ['psalm23-4', 'john14-27', 'phil4-13', 'heb11-1'],
  activeSlot: 0,
  quest: 0,
  victory: false,
  dead: false,
  praying: false,
  modalOpen: false,
  bibleOpen: false,
  time: 0.32, // day cycle 0..1 (0.32 = morning)
  temptationTimer: 45,
  enemyTimer: 6,
  inHoly: false
};

// ============================================================ player
const player = new THREE.Group();
const robeMat = new THREE.MeshStandardMaterial({ color: 0xe8ddc0, roughness: 0.8 });
const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.9, 6, 12), robeMat);
robe.position.y = 1.05; robe.castShadow = true;
player.add(robe);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xc89878, roughness: 0.7 }));
head.position.y = 2.05; head.castShadow = true;
player.add(head);
// glowing sash (lightbearer mark)
const sash = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 20),
  new THREE.MeshStandardMaterial({ color: 0xf5c542, emissive: 0xaa7711, emissiveIntensity: 1 }));
sash.position.y = 1.3; sash.rotation.x = Math.PI / 2;
player.add(sash);
// sword of light
const sword = new THREE.Group();
const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.5, 0.09),
  new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xf5c542, emissiveIntensity: 2 }));
blade.position.y = 0.75;
const guard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.12),
  new THREE.MeshStandardMaterial({ color: 0x8a6a2a }));
sword.add(blade, guard);
sword.position.set(0.55, 1.1, 0.2);
sword.rotation.z = -0.25;
player.add(sword);
// halo light
const haloLight = new THREE.PointLight(0xffe6a0, 6, 14, 1.8);
haloLight.position.y = 2.4;
player.add(haloLight);
// prayer ring
const prayRing = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.35, 32),
  new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0, side: THREE.DoubleSide }));
prayRing.rotation.x = -Math.PI / 2; prayRing.position.y = 0.06;
player.add(prayRing);
player.position.set(0, 0, 16);
scene.add(player);

const P = {
  vel: new THREE.Vector3(),
  yaw: 0, // camera south of player, facing north to the church
  pitch: -0.32,
  camDist: 8.5,
  speed: 7,
  vy: 0, grounded: true,
  walkPhase: 0,
  attackCd: 0
};

// ============================================================ NPCs
const npcNames = ['Mara', 'Elder Tomas', 'Widow Ruth', 'Young Joram', 'Merchant Lydia', 'Shepherd Amos', 'Child Hosanna', 'Guard Caleb', 'Pastor Silas'];
const affKeys = ['fear', 'anger', 'despair', 'doubt', 'sickness', 'fear', 'despair', 'anger', 'doubt'];
const npcSpots = [[-8, 2], [8, -2], [-14, 12], [14, 14], [-4, -14], [10, 22], [-22, -4], [22, 12], [3, -22]];
const skinTones = [0xc89878, 0x8a5a3a, 0xe8b898, 0x6e4530, 0xd8a080];
const robeColors = [0x7a8ab5, 0x9a7a5a, 0x6a9a7a, 0xb58aa0, 0x8ab5b0, 0xc0a060, 0x90a0c8, 0xa08090, 0xd8d0b0];

const npcs = npcNames.map((name, i) => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 4, 10),
    new THREE.MeshStandardMaterial({ color: robeColors[i], roughness: 0.9 }));
  body.position.y = 0.95; body.castShadow = true;
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14),
    new THREE.MeshStandardMaterial({ color: skinTones[i % skinTones.length] }));
  hd.position.y = 1.9; hd.castShadow = true;
  g.add(body, hd);
  let mark = null;
  if (i < 8) {
    // dark chain = needs deliverance; golden = delivered
    mark = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0x3a2a5a, emissive: 0x6a3a9a, emissiveIntensity: 1.2 }));
    mark.position.y = 1.1; mark.rotation.x = Math.PI / 2;
    g.add(mark);
  } else {
    mark = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xcc9922, emissiveIntensity: 1.5 }));
    mark.position.y = 2.45;
    g.add(mark);
  }
  // name sprite
  const label = makeLabel(name);
  label.position.y = 2.7;
  g.add(label);
  g.position.set(npcSpots[i][0], 0, npcSpots[i][1]);
  scene.add(g);
  return {
    i, name, group: g, body, mark, label,
    aff: affKeys[i], home: new THREE.Vector3(npcSpots[i][0], 0, npcSpots[i][1]),
    wanderT: Math.random() * 4, wanderDir: Math.random() * Math.PI * 2,
    delivered: i === 8, // pastor starts delivered (quest giver)
    isPastor: i === 8
  };
});

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = 'bold 30px Georgia';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, 8, 256, 44);
  g.fillStyle = '#ffe9a8';
  g.fillText(text, 128, 40);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(3.4, 0.85, 1);
  return sp;
}

// ============================================================ enemies
const enemies = [];
function spawnEnemy(forceType = null) {
  const keys = Object.keys(ENEMY_TYPES);
  const type = forceType || keys[Math.floor(Math.random() * keys.length)];
  const def = ENEMY_TYPES[type];
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.9, transparent: true, opacity: 0.92 }));
  core.position.y = 1.4; core.castShadow = true;
  const eyes = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  eyes.position.set(0, 1.7, 0.55);
  const eye2 = eyes.clone(); eye2.position.x = 0.28; eyes.position.x = -0.28;
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.25 }));
  smoke.position.y = 1.2;
  const label = makeLabel(def.name);
  label.position.y = 3.0;
  g.add(core, eyes, eye2, smoke, label);
  // spawn at edge
  const a = Math.random() * Math.PI * 2;
  const r = 45 + Math.random() * 15;
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  scene.add(g);
  enemies.push({ type, def, group: g, core, smoke, hp: def.hp, maxHp: def.hp, hitT: 0, atkT: 1 + Math.random() });
  toast(`${def.name} approaches… Speak the Word!`);
}

// ============================================================ projectiles + effects
const shots = [];
const effects = [];
function speakVerse(verseId) {
  const v = verseById(verseId);
  if (!v || S.dead || S.modalOpen) return;
  if (P.attackCd > 0) return;
  const cost = 10;
  if (S.light < cost) { toast('✨ Not enough Light — pray (hold Q) to be renewed.'); audio.fail(); return; }
  S.light = Math.max(0, S.light - cost);
  P.attackCd = 0.45;
  audio.speak();
  flashVerse(v);
  // direction: away from camera (player facing = -(sin yaw, cos yaw))
  const dir = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
  const color = CATEGORIES[v.cat].color;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshBasicMaterial({ color }));
  m.position.copy(player.position).add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(dir, 0.8);
  const glow = new THREE.PointLight(color, 8, 10, 1.8);
  m.add(glow);
  scene.add(m);
  shots.push({ mesh: m, vel: dir.clone().multiplyScalar(26), verse: v, life: 2.2 });
  // sword swing
  sword.rotation.x = -1.2;
  setTimeout(() => sword.rotation.x = 0, 180);
  // small recoil of light motes
  burst(player.position.clone().add(new THREE.Vector3(0, 1.6, 0)), color, 8);
  updateHUD();
}

function burst(pos, color, n = 12, speed = 6) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
    m.position.copy(pos);
    scene.add(m);
    effects.push({
      mesh: m, life: 0.7 + Math.random() * 0.4, age: 0,
      vel: new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.8, (Math.random() - 0.5) * speed)
    });
  }
}

// ============================================================ input
const keys = {};
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys[e.code] = true;
  if (!S.started) return;
  if (e.code === 'Digit1') { S.activeSlot = 0; audio.click(); updateHotbar(); }
  if (e.code === 'Digit2') { S.activeSlot = 1; audio.click(); updateHotbar(); }
  if (e.code === 'Digit3') { S.activeSlot = 2; audio.click(); updateHotbar(); }
  if (e.code === 'Digit4') { S.activeSlot = 3; audio.click(); updateHotbar(); }
  if (e.code === 'KeyJ') speakVerse(S.hotbar[S.activeSlot]);
  if (e.code === 'KeyE') tryInteract();
  if (e.code === 'KeyB') toggleBible();
  if (e.code === 'Escape') { closeModal(); toggleBible(false); }
  if (e.code === 'KeyQ') S.praying = true;
  if (e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'KeyQ') S.praying = false;
});

// mouse look (pointer lock on canvas click)
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('click', () => {
  audio.unlock();
  if (S.started && !S.modalOpen && canvas.requestPointerLock && document.pointerLockElement !== canvas) {
    try { canvas.requestPointerLock(); } catch {}
  }
});
document.addEventListener('pointerlockchange', () => { dragging = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', (e) => {
  if (!S.started || S.modalOpen) return;
  if (document.pointerLockElement === canvas) {
    P.yaw -= e.movementX * 0.0028;
    P.pitch -= e.movementY * 0.0022;
  } else if (dragging) {
    P.yaw -= (e.clientX - lastX) * 0.005;
    P.pitch -= (e.clientY - lastY) * 0.004;
  }
  lastX = e.clientX; lastY = e.clientY;
  P.pitch = Math.max(-1.1, Math.min(0.25, P.pitch));
});
canvas.addEventListener('mousedown', () => { dragging = true; });
window.addEventListener('mouseup', () => { if (document.pointerLockElement !== canvas) dragging = false; });
// wheel zoom
window.addEventListener('wheel', (e) => {
  if (!S.started) return;
  P.camDist = Math.max(4.5, Math.min(14, P.camDist + e.deltaY * 0.005));
}, { passive: true });

// touch joystick
const stick = document.getElementById('stick');
const knob = document.getElementById('stick-knob');
let stickVec = { x: 0, y: 0 }, stickId = null;
if (stick) {
  stick.addEventListener('touchstart', (e) => { stickId = e.changedTouches[0].identifier; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        const r = stick.getBoundingClientRect();
        let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
        const m = Math.hypot(dx, dy) || 1, max = 40;
        if (m > max) { dx *= max / m; dy *= max / m; }
        stickVec = { x: dx / max, y: dy / max };
        knob.style.transform = `translate(${dx}px,${dy}px)`;
      }
    }
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; stickVec = { x: 0, y: 0 }; knob.style.transform = ''; }
  });
  // touch look: drag on canvas
  let lookId = null, lx = 0, ly = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (t.clientX > window.innerWidth * 0.4) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookId) {
      P.yaw -= (t.clientX - lx) * 0.007;
      P.pitch = Math.max(-1.1, Math.min(0.25, P.pitch - (t.clientY - ly) * 0.005));
      lx = t.clientX; ly = t.clientY;
    }
  }, { passive: true });
  document.querySelectorAll('#touch-btns button').forEach(b => {
    b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'speak') speakVerse(S.hotbar[S.activeSlot]);
      if (a === 'talk') tryInteract();
      if (a === 'pray') { S.praying = true; setTimeout(() => S.praying = false, 1500); }
      if (a === 'bible') toggleBible();
    });
  });
}

// ============================================================ UI helpers
const $ = (id) => document.getElementById(id);
function toast(msg) {
  const w = $('toast-wrap');
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  w.appendChild(d);
  while (w.children.length > 4) w.firstChild.remove();
  setTimeout(() => d.remove(), 3100);
}
function flashVerse(v, pointsText = '') {
  const f = $('verse-flash');
  $('verse-flash-ref').textContent = `${CATEGORIES[v.cat].icon} ${v.ref}`;
  $('verse-flash-text').textContent = `“${v.text}”`;
  const vp = $('verse-points');
  if (vp) vp.textContent = pointsText;
  f.classList.remove('hidden');
  clearTimeout(flashVerse._t);
  flashVerse._t = setTimeout(() => f.classList.add('hidden'), 1600);
}
function updateHUD() {
  $('bar-faith').style.width = `${(S.faith / S.maxFaith) * 100}%`;
  $('bar-peace').style.width = `${(S.peace / S.maxPeace) * 100}%`;
  $('bar-light').style.width = `${(S.light / S.maxLight) * 100}%`;
  $('txt-faith').textContent = Math.ceil(S.faith);
  $('txt-peace').textContent = Math.ceil(S.peace);
  $('txt-light').textContent = Math.ceil(S.light);
  $('txt-level').textContent = `Lv ${S.level} ${RANKS[Math.min(S.level - 1, RANKS.length - 1)]}`;
  $('txt-xp').textContent = `${S.xp} XP`;
  $('txt-souls').textContent = `${S.souls} delivered · ${S.cleansed} cleansed`;
  const tp = $('txt-points');
  if (tp) tp.textContent = S.points;
  const ts = $('txt-streak');
  if (ts) ts.textContent = S.streak >= 2 ? `🔥 x${S.streak} streak!` : '';
  updateQuest();
}

// ---------- Grace Points scoring ----------
// Right Scripture, right need = points. Consecutive correct answers build a streak bonus.
function showScorePop(text, cls = '') {
  const wrap = $('score-pop-wrap');
  if (!wrap) return;
  const d = document.createElement('div');
  d.className = 'score-pop' + (cls ? ' ' + cls : '');
  d.textContent = text;
  wrap.appendChild(d);
  while (wrap.children.length > 3) wrap.firstChild.remove();
  setTimeout(() => d.remove(), 1700);
}
function streakBonus() {
  return Math.min(S.streak * 5, 50);
}
function addPoints(base, label, bucket = null) {
  const bonus = streakBonus();
  const total = base + bonus;
  S.points += total;
  if (bucket === 'deliver') S.ptsDeliver += total;
  else if (bucket === 'combat') S.ptsCombat += total;
  else if (bucket === 'resist') S.ptsResist += total;
  else if (bucket === 'bless') S.ptsBless += total;
  else if (bucket === 'scroll') S.ptsScroll += total;
  S.correctCount++;
  S.streak++;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
  showScorePop(`+${total} ${label}${bonus > 0 ? ` (incl. +${bonus} streak)` : ''}`);
  try {
    const best = Number(localStorage.getItem('lightbearer_best') || 0);
    if (S.points > best) localStorage.setItem('lightbearer_best', String(S.points));
  } catch {}
  updateHUD();
  return total;
}
function noPointsMiss(label) {
  S.wrongCount++;
  if (S.streak >= 2) showScorePop(`Streak lost — ${label}`, 'miss');
  else showScorePop(label, 'miss');
  S.streak = 0;
  updateHUD();
}
function scoreSummaryHTML() {
  let best = 0;
  try { best = Number(localStorage.getItem('lightbearer_best') || 0); } catch {}
  return `⭐ <b>${S.points} Grace Points</b> (best this device: ${Math.max(best, S.points)})<br>` +
    `🙏 Deliverance: <b>${S.ptsDeliver}</b> · 🌑 Combat: <b>${S.ptsCombat}</b> · 🛡️ Resisted: <b>${S.ptsResist}</b><br>` +
    `✨ Blessings: <b>${S.ptsBless}</b> · 📜 Scrolls: <b>${S.ptsScroll}</b><br>` +
    `✅ ${S.correctCount} right Scriptures · 🔥 best streak x${S.bestStreak} · souls ${S.souls} · cleansed ${S.cleansed} · resisted ${S.resisted}`;
}
function updateQuest() {
  const stages = [
    `🙏 Go and greet <b>Pastor Silas</b> by the church (E to talk).`,
    `💬 Deliver <b>${Math.min(S.souls, 3)}/3 townsfolk</b> — discern their affliction, answer with the right Scripture (E near a chained soul).`,
    `🌑 Cleanse <b>${Math.min(S.cleansed, 5)}/5 shadows</b> — speak the Word (1–4 / J). Match colors: ✝ breaks Fear · 🕊 calms Anger · 💪 lifts Despair · 🔥 answers Doubt.`,
    `🛡️ Resist <b>${Math.min(S.resisted, 2)}/2 temptations</b> — when the whisper comes, answer with the true Word before time runs out.`,
    `🔔 The city is watching. <b>Ring the church bell</b> (walk to the golden glow, press E) to proclaim liberty!`
  ];
  $('quest-text').innerHTML = stages[Math.min(S.quest, stages.length - 1)];
}
function advanceQuest() {
  if (S.quest === 1 && S.souls >= 3) { S.quest = 2; toast('📜 Quest: shadows gather — cleanse 5 with the Word!'); }
  if (S.quest === 2 && S.cleansed >= 5) { S.quest = 3; toast('📜 Quest: stand firm — resist 2 temptations!'); }
  if (S.quest === 3 && S.resisted >= 2) { S.quest = 4; toast('📜 Quest: ring the church bell! 🔔'); }
}
function gainXP(n) {
  S.xp += n;
  const need = S.level * 60;
  if (S.xp >= need) {
    S.xp -= need; S.level++;
    S.maxFaith += 10; S.faith = S.maxFaith;
    S.maxLight += 8; S.light = S.maxLight;
    toast(`⬆️ You grow to Level ${S.level} — ${RANKS[Math.min(S.level - 1, RANKS.length - 1)]}! Faith & Light enlarged.`);
    audio.deliver();
    burst(player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xffe27a, 24);
  }
  updateHUD();
}

// hotbar
function updateHotbar() {
  const hb = $('hotbar');
  hb.innerHTML = '';
  S.hotbar.forEach((id, i) => {
    const v = verseById(id);
    const d = document.createElement('div');
    d.className = 'slot' + (i === S.activeSlot ? ' active' : '');
    d.innerHTML = `<span class="key">${i + 1}</span><div class="ref">${v ? CATEGORIES[v.cat].icon + ' ' + v.ref : '— empty —'}</div><div class="cat">${v ? CATEGORIES[v.cat].name + ' · ' + v.power : 'Find scrolls'}</div>`;
    d.onclick = () => {
      if (bibleSel) { // assigning from bible
        S.hotbar[i] = bibleSel; bibleSel = null; audio.pickup(); renderBible(); updateHotbar();
      } else { S.activeSlot = i; audio.click(); updateHotbar(); }
    };
    d.ondblclick = () => { if (v) speakVerse(v.id); };
    hb.appendChild(d);
  });
}

// ============================================================ modal (dialogue / temptation)
let modalTimer = null;
function openModal({ name, text, choices, onPick, timed = 0 }) {
  S.modalOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  $('modal').classList.remove('hidden');
  $('modal-name').textContent = name;
  $('modal-text').innerHTML = text;
  const box = $('modal-choices');
  box.innerHTML = '';
  clearInterval(modalTimer);
  choices.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = `<b>${c.ref}</b> <span style="opacity:.7">[${c.catName}]</span><br><i>${c.text}</i>`;
    b.onclick = () => { closeModal(); onPick(c); };
    box.appendChild(b);
  });
  if (timed > 0) {
    let t = timed;
    const orig = $('modal-name').textContent;
    $('modal-name').textContent = `${orig} — ⏳ ${t}s`;
    modalTimer = setInterval(() => {
      t--;
      if (t <= 0) { clearInterval(modalTimer); closeModal(); onPick(null); }
      else $('modal-name').textContent = `${orig} — ⏳ ${t}s`;
    }, 1000);
  }
}
function closeModal() {
  if (!$('modal').classList.contains('hidden')) $('modal').classList.add('hidden');
  clearInterval(modalTimer);
  if (!S.bibleOpen) S.modalOpen = false;
}
$('modal-close').onclick = () => { audio.click(); closeModal(); };

function verseChoices(correctCat, n = 4) {
  const pool = [...VERSES];
  const correct = pool.filter(v => v.cat === correctCat);
  const others = pool.filter(v => v.cat !== correctCat);
  const pick = [correct[Math.floor(Math.random() * correct.length)]];
  while (pick.length < n && others.length) {
    const i = Math.floor(Math.random() * others.length);
    pick.push(others.splice(i, 1)[0]);
  }
  // shuffle
  for (let i = pick.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pick[i], pick[j]] = [pick[j], pick[i]];
  }
  return pick.map(v => ({ ...v, catName: CATEGORIES[v.cat].name }));
}

// ---- deliverance dialogue ----
function talkTo(npc) {
  audio.click();
  if (npc.isPastor) {
    if (S.quest === 0) {
      openModal({
        name: `Pastor Silas — shepherd of Refuge`,
        text: `“Welcome, lightbearer! Our town groans — <b>fear, anger, despair and doubt</b> chain precious souls, and shadows prowl the streets.<br><br>Take up the <b>Sword of the Spirit, which is the word of God</b> (Eph 6:17). Discern each soul's affliction, speak the fitting Scripture, and set them free. The church glow renews your Light. Go — I will pray for you!”`,
        choices: [{ ref: 'Amen — I receive the call', text: 'Deliver 3 souls to begin. The Lord is with you.', catName: '✝', cat: 'word', id: 'amen' }],
        onPick: () => { S.quest = 1; gainXP(10); addPoints(10, 'for answering the call', 'bless'); toast('📜 Quest: deliver 3 townsfolk (E near chained souls)'); updateHUD(); }
      });
    } else {
      const left = Math.max(0, 3 - S.souls);
      openModal({
        name: 'Pastor Silas',
        text: left > 0
          ? `“Well done so far — <b>${S.souls} delivered</b>. ${left} more soul(s) wait in chains. Remember: <b>Fear→Deliverance ✝ · Anger→Peace 🕊 · Despair→Strength 💪 · Doubt→Faith 🔥 · Wounds→Healing 💧</b>.”`
          : `“The captives go free! Now cleanse the shadows with the spoken Word, and stand firm when temptation whispers.”`,
        choices: [{ ref: '“Pray for me, pastor.”', text: '“I can do all things through Christ which strengtheneth me.” — Phil 4:13', catName: '🙏', cat: 'word', id: 'bless' }],
        onPick: () => { S.light = S.maxLight; S.peace = Math.min(S.maxPeace, S.peace + 20); addPoints(10, 'pastoral blessing', 'bless'); toast('🙏 Pastor prays — Light & Peace renewed!'); audio.pray(); updateHUD(); }
      });
    }
    return;
  }
  if (npc.delivered) {
    openModal({
      name: `${npc.name} — delivered ✨`,
      text: `“Thank you! I feel light as morning. <b>“He hath sent me… to proclaim liberty to the captives”</b> (Luke 4:18). I will tell others what the Lord has done!”`,
      choices: [{ ref: '“Go in peace.” (Luke 8:48)', text: 'Your faith hath made you whole.', catName: '🕊', cat: 'peace', id: 'go' }],
      onPick: () => { S.peace = Math.min(S.maxPeace, S.peace + 8); gainXP(4); addPoints(10, `for blessing ${npc.name}`, 'bless'); updateHUD(); }
    });
    return;
  }
  const aff = AFFLICTIONS[npc.aff];
  openModal({
    name: `${npc.name} — ${aff.name} ⛓ (${aff.spirit})`,
    text: `“${aff.line}”<br><br><span style="opacity:.75">Discern their bondage. Which Scripture sets them free?</span>`,
    choices: verseChoices(aff.needCat),
    onPick: (c) => {
      if (!c) { toast('The soul withdraws… speak quickly next time.'); return; }
      // word-category verses count as half-correct only for sickness? No: require exact or healing/word grace
      const ok = c.cat === aff.needCat || (aff.needCat === 'strength' && c.cat === 'healing') || (aff.needCat === 'healing' && (c.cat === 'healing' || c.cat === 'strength'));
      if (ok) deliverNPC(npc, c);
      else {
        audio.fail();
        S.peace = Math.max(0, S.peace - 6);
        noPointsMiss('wrong Scripture — no points');
        toast(`😞 That Word was true, but not the key for ${aff.name}. Hint: they need ${CATEGORIES[aff.needCat].icon} ${CATEGORIES[aff.needCat].name}. Right Scripture = points!`);
        burst(npc.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x553355, 8);
        updateHUD();
      }
    }
  });
}

function deliverNPC(npc, verse) {
  npc.delivered = true;
  npc.mark.material = new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xcc9922, emissiveIntensity: 1.6 });
  npc.mark.geometry = new THREE.TorusGeometry(0.55, 0.05, 8, 18);
  audio.deliver();
  const base = 100 + Math.round((verse.power || 20) / 2);
  const earned = addPoints(base, `for delivering ${npc.name} with ${verse.ref}`, 'deliver');
  flashVerse(verseById(verse.id) || verse, `⭐ +${earned} Grace Points — right Scripture!`);
  burst(npc.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xffe27a, 26);
  S.souls++;
  gainXP(25);
  S.peace = Math.min(S.maxPeace, S.peace + 12);
  toast(`✨ ${npc.name} is delivered by ${verse.ref}! +${earned} points! “${verse.text.slice(0, 60)}…”`);
  // unlock a new scroll sometimes
  const locked = VERSES.filter(v => !S.unlocked.has(v.id));
  if (locked.length && S.souls % 2 === 1) {
    const nv = locked[Math.floor(Math.random() * locked.length)];
    S.unlocked.add(nv.id);
    toast(`📜 New scroll learned: ${nv.ref}! Open Bible (B) to equip.`);
    audio.pickup();
  }
  advanceQuest();
  updateHUD();
}

// ---- temptation ----
function triggerTemptation() {
  const t = TEMPTATIONS[Math.floor(Math.random() * TEMPTATIONS.length)];
  audio.tempt();
  // redden vignette via flash
  toast(`🌑 Temptation: ${t.title}`);
  openModal({
    name: `${t.title} 🌑`,
    text: `<i>${t.text}</i><br><br>Stand firm! Answer with the true Word before the moment passes. <span style="opacity:.7">Hint: ${t.hint}</span>`,
    choices: verseChoices(t.answerCat),
    timed: 20,
    onPick: (c) => {
      if (c && (c.cat === t.answerCat || (t.answerCat === 'word' && ['word', 'faith'].includes(c.cat)))) {
        S.resisted++;
        gainXP(20);
        const earned = addPoints(100, `for resisting with ${c.ref}`, 'resist');
        S.peace = Math.min(S.maxPeace, S.peace + 10);
        audio.deliver();
        flashVerse(verseById(c.id), `⭐ +${earned} — temptation overcome!`);
        burst(player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xfff2b0, 20);
        toast(`🛡️ Resisted by ${c.ref}! +${earned} points! “Resist the devil, and he will flee.” (James 4:7)`);
        advanceQuest();
      } else if (!c) {
        S.peace = Math.max(0, S.peace - 18);
        S.faith = Math.max(0, S.faith - 8);
        audio.fail();
        noPointsMiss('hesitated — no points');
        toast('💔 You hesitated… temptation left a wound. Pray and return to the Word!');
      } else {
        S.peace = Math.max(0, S.peace - 12);
        audio.fail();
        noPointsMiss('wrong Scripture — no points');
        toast(`😖 “${c.ref}” is precious, but the true shield here is ${CATEGORIES[t.answerCat].icon} ${CATEGORIES[t.answerCat].name}. Peace shaken.`);
      }
      updateHUD();
    }
  });
}

// ---- interaction ----
let nearNPC = null, nearBell = false;
function tryInteract() {
  if (!S.started || S.modalOpen || S.bibleOpen || S.dead) return;
  if (nearNPC) { talkTo(nearNPC); return; }
  if (nearBell) { ringBell(); return; }
  // otherwise: speak active verse (melee encouragement)
  speakVerse(S.hotbar[S.activeSlot]);
}

function ringBell() {
  if (S.quest < 4) {
    audio.bell();
    toast(`🔔 The bell echoes… but the city is not yet free. (${S.souls}/3 delivered · ${S.cleansed}/5 cleansed · ${S.resisted}/2 resisted)`);
    return;
  }
  audio.bell();
  burst(W.bellPos.clone().add(new THREE.Vector3(0, 6, 0)), 0xffe27a, 40, 10);
  if (!S.victory) {
    S.victory = true;
    gainXP(100);
    S.points += 200; S.ptsBless += 200; S.correctCount++;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    showScorePop('+200 City set free! 🔔');
    $('victory').classList.remove('hidden');
    S.modalOpen = true;
    $('victory-text').textContent = `You delivered ${S.souls} souls, cleansed ${S.cleansed} shadows and resisted ${S.resisted} temptations. “And ye shall know the truth, and the truth shall make you free.” — John 8:32. The city glows with dawn.`;
    const vs = $('victory-score');
    if (vs) vs.innerHTML = scoreSummaryHTML();
    if (document.pointerLockElement) document.exitPointerLock();
    updateHUD();
  } else {
    S.points += 20; S.ptsBless += 20;
    showScorePop('+20 Alleluia! 🔔');
    toast('🔔 Freedom rings over Refuge! Alleluia! +20 points!');
    updateHUD();
  }
}
$('btn-continue').onclick = () => { $('victory').classList.add('hidden'); S.modalOpen = false; audio.click(); };

// ============================================================ bible panel
let bibleSel = null;
function toggleBible(force) {
  const el = $('bible');
  const show = force !== undefined ? force : el.classList.contains('hidden');
  if (show) {
    el.classList.remove('hidden');
    S.bibleOpen = true; S.modalOpen = true;
    if (document.pointerLockElement) document.exitPointerLock();
    renderBible();
    audio.click();
  } else {
    el.classList.add('hidden');
    S.bibleOpen = false; S.modalOpen = false; bibleSel = null;
  }
}
$('bible-close').onclick = () => toggleBible(false);
function renderBible() {
  $('bible-count').textContent = `(${S.unlocked.size}/${VERSES.length})`;
  const slots = $('bible-slots');
  slots.innerHTML = '';
  S.hotbar.forEach((id, i) => {
    const v = verseById(id);
    const d = document.createElement('div');
    d.className = 'slot' + (i === S.activeSlot ? ' active' : '');
    d.innerHTML = `<span class="key">${i + 1}</span><div class="ref">${v ? CATEGORIES[v.cat].icon + ' ' + v.ref : '— empty —'}</div><div class="cat">click, then a scroll below</div>`;
    d.onclick = () => {
      if (bibleSel) { S.hotbar[i] = bibleSel; bibleSel = null; audio.pickup(); renderBible(); updateHotbar(); }
      else { S.activeSlot = i; updateHotbar(); renderBible(); }
    };
    slots.appendChild(d);
  });
  const list = $('bible-list');
  list.innerHTML = '';
  VERSES.forEach(v => {
    const has = S.unlocked.has(v.id);
    const d = document.createElement('div');
    d.className = 'scroll-card' + (bibleSel === v.id ? ' selected' : '');
    d.style.opacity = has ? 1 : 0.45;
    d.innerHTML = `<h4>${CATEGORIES[v.cat].icon} ${v.ref} · ${CATEGORIES[v.cat].name} · ⚡${v.power}</h4><p>“${v.text}”</p>${has ? '' : '<div>🔒 Deliver souls & gather scrolls to learn</div>'}`;
    if (has) d.onclick = () => {
      bibleSel = bibleSel === v.id ? null : v.id;
      audio.click();
      renderBible();
      if (bibleSel) toast('Now click a hotbar slot above to equip 📖');
    };
    list.appendChild(d);
  });
}

// ============================================================ start / death
$('btn-start').onclick = () => {
  audio.unlock(); audio.click(); audio.startAmbient();
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  S.started = true;
  toast('🙏 “Thy word is a lamp unto my feet.” Find Pastor Silas by the church!');
  updateHUD(); updateHotbar();
  window.__gameReady = true;
};
$('btn-how').onclick = () => { $('how').classList.toggle('hidden'); audio.click(); };
$('btn-revive').onclick = () => {
  S.dead = false; S.faith = S.maxFaith; S.peace = S.maxPeace; S.light = S.maxLight;
  player.position.set(0, 0, -20);
  P.vy = 0;
  $('gameover').classList.add('hidden');
  S.modalOpen = false;
  audio.deliver();
  toast('🕊️ “He restoreth my soul.” You rise renewed!');
  updateHUD();
};
function die() {
  if (S.dead) return;
  S.dead = true;
  S.streak = 0;
  audio.fail();
  $('gameover').classList.remove('hidden');
  S.modalOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  updateHUD();
}

// ============================================================ minimap
const mm = $('minimap').getContext('2d');
function drawMinimap() {
  const s = 150, c = s / 2, k = c / 75;
  mm.clearRect(0, 0, s, s);
  mm.fillStyle = 'rgba(10,16,32,0.9)';
  mm.beginPath(); mm.arc(c, c, c - 2, 0, 7); mm.fill();
  const dot = (x, z, color, r = 3) => {
    mm.fillStyle = color;
    mm.beginPath(); mm.arc(c + x * k, c + z * k, r, 0, 7); mm.fill();
  };
  // roads
  mm.strokeStyle = '#4a4438'; mm.lineWidth = 4;
  mm.beginPath(); mm.moveTo(c, 4); mm.lineTo(c, s - 4); mm.stroke();
  mm.beginPath(); mm.moveTo(4, c); mm.lineTo(s - 4, c); mm.stroke();
  dot(W.churchPos.x, W.churchPos.z, '#f5c542', 5);
  W.scrollMeshes.forEach(sc => { if (!sc.taken) dot(sc.x, sc.z, '#fff2b0', 2); });
  npcs.forEach(n => dot(n.group.position.x, n.group.position.z, n.delivered ? '#8dffb0' : '#ff9d5c', n.isPastor ? 4 : 3));
  enemies.forEach(e => dot(e.group.position.x, e.group.position.z, '#ff4040', 3));
  // player arrow (up = north = -z)
  mm.save();
  mm.translate(c + player.position.x * k, c + player.position.z * k);
  mm.rotate(Math.atan2(-Math.sin(P.yaw), Math.cos(P.yaw)));
  mm.fillStyle = '#ffffff';
  mm.beginPath(); mm.moveTo(0, -6); mm.lineTo(4, 4); mm.lineTo(-4, 4); mm.closePath(); mm.fill();
  mm.restore();
}

// ============================================================ main loop
const clock = new THREE.Clock();
const fwd = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // ambient world motion even before start (title backdrop)
  W.doveAngle += dt * 0.35;
  {
    const pos = W.doves.geometry.attributes.position;
    for (let i = 0; i < 7; i++) {
      const a = W.doveAngle + (i / 7) * Math.PI * 2;
      pos.setXYZ(i, Math.cos(a) * 14, 9 + Math.sin(t * 2 + i) * 1.2, -38 + Math.sin(a) * 14);
    }
    pos.needsUpdate = true;
  }
  W.motes.rotation.y += dt * 0.02;
  W.fountainTop.position.y = 3.3 + Math.sin(t * 2) * 0.12;
  W.holyGlow.material.opacity = 0.18 + Math.sin(t * 2.4) * 0.07;
  W.scrollMeshes.forEach((sc, i) => {
    if (sc.taken) return;
    sc.mesh.rotation.x += dt * 1.2;
    sc.mesh.position.y = 1.1 + Math.sin(t * 2 + i) * 0.18;
    sc.halo.position.copy(sc.mesh.position);
    sc.halo.material.opacity = 0.14 + Math.sin(t * 3 + i) * 0.06;
  });
  // day-night cycle (slow, ~4 min loop)
  if (S.started && !S.dead) S.time = (S.time + dt * 0.004) % 1;
  const day = Math.sin(S.time * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0 night .. 1 noon
  const dusk = Math.pow(1 - Math.abs(day - 0.55) * 2.2, 2);
  W.sun.intensity = 0.25 + day * 1.5;
  W.sun.color.setHSL(0.1, 0.55, 0.45 + day * 0.3);
  W.sun.position.set(Math.cos(S.time * Math.PI * 2) * 60, 18 + day * 45, 25);
  W.hemi.intensity = 0.3 + day * 0.55;
  W.sky.material.color.setHSL(0.6, 0.5, 0.08 + day * 0.55 + Math.max(0, dusk) * 0.05);
  scene.fog.color.copy(W.sky.material.color).lerp(new THREE.Color(0x9db8d8), 0.4);
  W.stars.material.opacity = Math.max(0, 0.85 - day * 1.4);
  W.lamps.forEach(l => { l.light.intensity = 14 - day * 11; });

  if (!S.started) {
    // slow orbit behind title
    const a = t * 0.08;
    camera.position.set(Math.sin(a) * 34, 12, Math.cos(a) * 34);
    camera.lookAt(0, 3, -14);
    renderer.render(scene, camera);
    return;
  }
  if (S.dead) { renderer.render(scene, camera); return; }

  const frozen = S.modalOpen;
  // ---------- movement ----------
  let mx = 0, mz = 0;
  if (!frozen) {
    if (keys['KeyW'] || keys['ArrowUp']) mz += 1;
    if (keys['KeyS'] || keys['ArrowDown']) mz -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    mx += stickVec.x; mz -= stickVec.y;
  }
  const mLen = Math.hypot(mx, mz);
  const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
  const spd = (sprint ? 11 : P.speed) * (S.praying ? 0.25 : 1);
  if (mLen > 0.01 && !frozen) {
    const nx = mx / Math.max(1, mLen), nz = mz / Math.max(1, mLen);
    // camera-relative
    const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
    const wx = (nx * cos - nz * sin), wz = (-nx * sin - nz * cos) * -1;
    // NOTE: standard third-person: forward = -yaw dir; remap:
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const rx = -fz, rz = fx;
    let vx = (fx * nz + rx * nx), vz = (fz * nz + rz * nx);
    const vl = Math.hypot(vx, vz) || 1;
    vx = vx / vl * spd * Math.min(1, mLen); vz = vz / vl * spd * Math.min(1, mLen);
    let nx2 = player.position.x + vx * dt, nz2 = player.position.z + vz * dt;
    const res = collideWorld(W, nx2, nz2);
    player.position.x = res.x; player.position.z = res.z;
    // face movement
    const targetYaw = Math.atan2(vx, vz) + Math.PI;
    let d = targetYaw - P.yaw;
    // keep camera yaw; rotate body instead via robe? simpler: leave camera, tilt player mesh
    player.rotation.y = Math.atan2(vx, vz);
    P.walkPhase += dt * (sprint ? 13 : 9);
    robe.position.y = 1.05 + Math.abs(Math.sin(P.walkPhase)) * 0.07;
    void d; void wx; void wz;
  } else {
    robe.position.y = 1.05 + Math.sin(t * 2) * 0.02;
  }
  // jump / gravity
  if (!frozen && keys['Space'] && P.grounded) { P.vy = 7; P.grounded = false; audio.click(); }
  P.vy -= 22 * dt;
  player.position.y += P.vy * dt;
  if (player.position.y <= 0) { player.position.y = 0; P.vy = 0; P.grounded = true; }

  if (P.attackCd > 0) P.attackCd -= dt;

  // ---------- prayer ----------
  S.inHoly = player.position.distanceTo(new THREE.Vector3(0, 0, -27)) < 8;
  if (!frozen && S.praying) {
    const rate = S.inHoly ? 26 : 14;
    S.light = Math.min(S.maxLight, S.light + rate * dt);
    S.faith = Math.min(S.maxFaith, S.faith + (S.inHoly ? 8 : 3) * dt);
    S.peace = Math.min(S.maxPeace, S.peace + 6 * dt);
    prayRing.material.opacity = 0.55 + Math.sin(t * 6) * 0.2;
    prayRing.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    if (Math.random() < dt * 6) {
      burst(player.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xfff2b0, 2, 3);
      audio.pray();
    }
    updateHUD();
  } else {
    prayRing.material.opacity = Math.max(0, prayRing.material.opacity - dt * 2);
  }
  // passive regen near church
  if (S.inHoly && !S.praying) S.light = Math.min(S.maxLight, S.light + 4 * dt);

  // ---------- camera ----------
  const cx = player.position.x + Math.sin(P.yaw) * P.camDist * Math.cos(P.pitch);
  const cz = player.position.z + Math.cos(P.yaw) * P.camDist * Math.cos(P.pitch);
  const cy = player.position.y + 2.2 - Math.sin(P.pitch) * P.camDist;
  camera.position.lerp(new THREE.Vector3(cx, Math.max(1.2, cy), cz), 1 - Math.pow(0.0001, dt));
  camera.lookAt(player.position.x, player.position.y + 1.8, player.position.z);

  // ---------- scroll pickups ----------
  W.scrollMeshes.forEach(sc => {
    if (sc.taken) return;
    if (Math.hypot(player.position.x - sc.x, player.position.z - sc.z) < 1.6) {
      sc.taken = true;
      scene.remove(sc.mesh, sc.halo);
      const locked = VERSES.filter(v => !S.unlocked.has(v.id));
      audio.pickup();
      if (locked.length) {
        const nv = locked[Math.floor(Math.random() * locked.length)];
        S.unlocked.add(nv.id);
        const earned = addPoints(15, `scroll: ${nv.ref}`, 'scroll');
        toast(`📜 Scroll found: ${nv.ref} — ${CATEGORIES[nv.cat].name}! +${earned} points! (B to equip)`);
        flashVerse(nv, `⭐ +${earned} — new Scripture learned!`);
      } else {
        S.light = S.maxLight; S.peace = Math.min(S.maxPeace, S.peace + 10);
        const earned = addPoints(15, 'ancient scroll', 'scroll');
        toast(`📜 Ancient scroll — Light & Peace renewed! +${earned} points!`);
      }
      gainXP(8);
    }
  });

  // ---------- NPC wander + proximity ----------
  nearNPC = null;
  let bestD = 3.2;
  npcs.forEach(n => {
    if (!frozen && !n.delivered) {
      n.wanderT -= dt;
      if (n.wanderT <= 0) { n.wanderT = 2 + Math.random() * 4; n.wanderDir = Math.random() * Math.PI * 2; }
      if (Math.random() < 0.6) {
        const nx = n.group.position.x + Math.sin(n.wanderDir) * dt * 0.9;
        const nz = n.group.position.z + Math.cos(n.wanderDir) * dt * 0.9;
        if (Math.hypot(nx - n.home.x, nz - n.home.z) < 9) {
          const r = collideWorld(W, nx, nz);
          n.group.position.x = r.x; n.group.position.z = r.z;
        } else n.wanderDir += Math.PI;
      }
      n.group.rotation.y = n.wanderDir;
      // bound souls shiver
      n.group.position.y = Math.sin(t * 5 + n.i) * 0.03;
    } else if (n.delivered) {
      // joyful bob
      n.group.position.y = Math.abs(Math.sin(t * 2 + n.i)) * 0.08;
    }
    n.label.lookAt(camera.position);
    const d = n.group.position.distanceTo(player.position);
    if (d < bestD) { bestD = d; nearNPC = n; }
  });
  // bell proximity
  nearBell = player.position.distanceTo(W.bellPos) < 4;
  // prompt
  const pr = $('prompt');
  if (!frozen) {
    if (nearNPC) {
      pr.classList.remove('hidden');
      pr.textContent = nearNPC.isPastor ? `E — Talk to Pastor Silas` : nearNPC.delivered ? `E — Bless ${nearNPC.name}` : `E — Minister to ${nearNPC.name} (${AFFLICTIONS[nearNPC.aff].name})`;
    } else if (nearBell) {
      pr.classList.remove('hidden');
      pr.textContent = S.quest >= 4 ? 'E — 🔔 Ring the bell of liberty!' : 'E — 🔔 Church bell (finish quests first)';
    } else pr.classList.add('hidden');
  } else pr.classList.add('hidden');

  // ---------- enemies AI ----------
  if (!frozen) {
    S.enemyTimer -= dt;
    const cap = 2 + Math.floor(S.time * 0) + Math.min(4, Math.floor((S.souls + S.cleansed) / 2));
    if (S.enemyTimer <= 0 && enemies.length < Math.max(2, cap)) {
      spawnEnemy();
      S.enemyTimer = 14 + Math.random() * 10 - Math.min(8, S.cleansed * 0.5);
    }
    // night spawns more
    if (day < 0.25 && Math.random() < dt * 0.1 && enemies.length < 6) spawnEnemy();
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const toP = player.position.clone().sub(e.group.position); toP.y = 0;
    const dist = toP.length();
    if (!frozen && !S.dead) {
      toP.normalize();
      const sp = e.def.speed * (day < 0.3 ? 1.25 : 1);
      const nx = e.group.position.x + toP.x * sp * dt;
      const nz = e.group.position.z + toP.z * sp * dt;
      const r = collideWorld(W, nx, nz);
      e.group.position.x = r.x; e.group.position.z = r.z;
      e.group.rotation.y = Math.atan2(toP.x, toP.z);
      e.group.position.y = 0.25 + Math.sin(t * 4 + i) * 0.15;
      e.core.rotation.y += dt * 3;
      // attack
      e.atkT -= dt;
      if (dist < 2.4 && e.atkT <= 0) {
        e.atkT = 1.6;
        S.faith = Math.max(0, S.faith - e.def.dmg);
        S.peace = Math.max(0, S.peace - e.def.dmg * 0.5);
        audio.hurt();
        burst(player.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xff4040, 10);
        toast(`💔 ${e.def.name} strikes! Speak ${CATEGORIES[e.def.verseCat].icon} ${CATEGORIES[e.def.verseCat].name} Scripture!`);
        updateHUD();
        if (S.faith <= 0) die();
      }
    }
    if (e.hitT > 0) { e.hitT -= dt; e.core.material.emissiveIntensity = 2.2; }
    else e.core.material.emissiveIntensity = 0.9;
    // label faces camera
    e.group.children.forEach(ch => { if (ch.isSprite) ch.lookAt(camera.position); });
  }

  // ---------- projectiles ----------
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.mesh.rotation.y += dt * 8;
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (s.mesh.position.distanceTo(e.group.position.clone().add(new THREE.Vector3(0, 1.4, 0))) < 1.5) {
        hit = true;
        const matched = s.verse.cat === e.def.verseCat || s.verse.cat === 'word';
        const perfect = s.verse.cat === e.def.verseCat;
        let dmg = s.verse.power * (perfect ? 2 : matched ? 1.2 : 0.7);
        e.hp -= dmg;
        e.hitT = 0.15;
        audio.hit();
        burst(e.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)), CATEGORIES[s.verse.cat].color, perfect ? 18 : 10);
        if (perfect) {
          const earned = addPoints(25, `Perfect Word! ${s.verse.ref}`, 'combat');
          toast(`✝ Perfect Word! ${s.verse.ref} shatters ${e.def.name}! +${earned} points!`);
        } else if (matched) {
          S.points += 10; S.ptsCombat += 10; S.correctCount++;
          showScorePop(`+10 Good Word ${s.verse.ref}`);
          updateHUD();
        } else {
          S.points += 2; S.ptsCombat += 2;
          showScorePop(`+2 ${s.verse.ref} hits`);
          updateHUD();
        }
        if (e.hp <= 0) {
          audio.enemyDie();
          burst(e.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xffe27a, 26, 8);
          scene.remove(e.group);
          enemies.splice(j, 1);
          S.cleansed++;
          gainXP(18);
          const earned = addPoints(80, `cleansed ${e.def.name}`, 'combat');
          S.light = Math.min(S.maxLight, S.light + 6);
          toast(`🌅 ${e.def.name} is cleansed! +${earned} points! (${S.cleansed} total)`);
          advanceQuest();
          updateHUD();
        }
        break;
      }
    }
    if (hit || s.life <= 0 || Math.hypot(s.mesh.position.x, s.mesh.position.z) > 80) {
      if (!hit && s.life <= 0) burst(s.mesh.position, 0x888899, 4, 2);
      scene.remove(s.mesh);
      shots.splice(i, 1);
    }
  }

  // ---------- effects ----------
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age += dt;
    e.mesh.position.addScaledVector(e.vel, dt);
    e.vel.y -= 4 * dt;
    e.mesh.material.opacity = Math.max(0, 1 - e.age / e.life);
    e.mesh.scale.setScalar(1 + e.age * 2);
    if (e.age >= e.life) { scene.remove(e.mesh); effects.splice(i, 1); }
  }

  // ---------- temptation clock ----------
  if (!frozen && !S.dead) {
    S.temptationTimer -= dt;
    if (S.temptationTimer <= 0) {
      S.temptationTimer = 55 + Math.random() * 40;
      triggerTemptation();
    }
    // peace drains at low faith; faith regens slowly in day
    if (S.faith < 30) S.peace = Math.max(0, S.peace - 1.5 * dt);
    if (day > 0.6) S.peace = Math.min(S.maxPeace, S.peace + 0.6 * dt);
    if (S.peace <= 0) { S.faith = Math.max(0, S.faith - 3 * dt); if (S.faith <= 0) die(); }
  }

  drawMinimap();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHUD();
updateHotbar();
animate();
window.__gameReady = false; // flips true on Start (used by screenshots)
