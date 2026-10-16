// ARMOR OF GOD — Phase 1 vertical slice. Entry point / game orchestrator.
import * as THREE from 'three';
import { Input } from './core/input.js';
import { loadState, saveState, addFaith, SAVE_KEY } from './core/state.js';
import { VERSES, VERSE_BY_ID } from './data/verses.js';
import { NPCS, QUESTS, TEMPTATIONS, ARMOR } from './data/content.js';
import { scoreVerse, grade } from './scripture/engine.js';
import { buildTown } from './world/town.js';
import { DayNight } from './world/daynight.js';
import { NPCManager } from './npc/npcs.js';
import { ShadowEnemy, lightShaft } from './combat/deliverance.js';
import { AudioMan } from './audio/audio.js';
import { toast, showBanner, updateFaithUI, updateArmorMini, drawMinimap } from './ui/hud.js';

const state = loadState();
const input = new Input();
const audio = new AudioMan();

// ---------- three setup ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87a5c8);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
scene.add(new THREE.HemisphereLight(0xcdd8ff, 0x3a4a2f, 0.7));

const { colliders, churchPos, millPos } = buildTown(scene);
const daynight = new DayNight(scene);
const npcs = new NPCManager(scene, state);

// player
const player = new THREE.Group();
const pBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 }));
pBody.position.y = 1.05; pBody.castShadow = true; player.add(pBody);
const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf0c8a0 }));
pHead.position.y = 2.1; player.add(pHead);
// believer's lamp (light around player grows with faith)
const lamp = new THREE.PointLight(0xffe2a0, 8, 14, 1.7); lamp.position.y = 2.5; player.add(lamp);
player.position.set(state.playerPos[0], 0, state.playerPos[2]);
scene.add(player);
// discernment lens cone
const lens = new THREE.Mesh(new THREE.ConeGeometry(6, 14, 20, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
lens.rotation.x = Math.PI / 2; scene.add(lens);

// enemies (deliverance + night whisperers)
let activeEnemy = null; // deliverance boss near elder
let nightMobs = [];
let temptationTimer = 75; // seconds until first temptation
let uiLock = 'title'; // title | play | dialog | wheel | temptation | journal
let pendingContext = null; // {npc, approach} awaiting verse choice
let prayHeld = false;

// ---------- UI wiring ----------
const $ = id => document.getElementById(id);
if (localStorage.getItem(SAVE_KEY)) $('btn-continue').classList.remove('hidden');
if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) $('touch-ui').classList.remove('hidden');
$('btn-kjv').onclick = () => setTr('kjv'); $('btn-web').onclick = () => setTr('web');
function setTr(t) { state.translation = t; $('btn-kjv').classList.toggle('active', t === 'kjv'); $('btn-web').classList.toggle('active', t === 'web'); saveState(state); }
setTr(state.translation || 'kjv');
$('btn-begin').onclick = () => startGame(true);
$('btn-continue').onclick = () => startGame(false);
function startGame(fresh) {
  if (fresh && localStorage.getItem(SAVE_KEY) && !confirm('Start fresh? This clears your saved walk.')) return startGame(false);
  if (fresh) { const d = (await0(), null); }
  audio.ensure(); $('title-screen').style.display = 'none'; uiLock = 'play';
  toast('Welcome, believer. Discern the town — hold Q near people. ☩');
  refreshQuests(); updateFaithUI(state.faith); updateArmorMini(state);
}
function await0() { try { localStorage.removeItem(SAVE_KEY); Object.assign(state, { faith: 80, settled: {}, armor: { truth: false, righteousness: false, peace: false, faith: false, salvation: false, word: false }, versesUnlocked: ['v_2tim1_7', 'v_isa41_10', 'v_ps23_4', 'v_jas4_7', 'v_eph6_11', 'v_eph6_16', 'v_prov3_5', 'v_1john1_9', 'v_ps34_18'], memorized: [], questsDone: [], allies: [], temptationDone: false, deliveranceDone: false }); } catch {} }

// quest log
function refreshQuests() {
  const el = $('quest-log');
  const done = new Set(state.questsDone);
  el.innerHTML = '<h4>QUEST LOG</h4>' + QUESTS.map(q => {
    if (q.id === 'q_temptation' && state.temptationDone) return `<div class="done">✓ Stood the whisper</div>`;
    if (done.has(q.id)) return `<div class="done">✓ ${q.title}</div>`;
    return `<div>○ ${q.title}</div>`;
  }).join('') + `<div style="margin-top:6px;color:#ffd98a">Allies at Safe House: ${state.allies.length}</div>`;
}
function completeQuest(id, armorPiece, ally) {
  if (state.questsDone.includes(id)) return;
  state.questsDone.push(id);
  if (armorPiece && ARMOR.find(a => a.id === armorPiece)) { state.armor[armorPiece] = true; toast(`Armor unlocked: ${ARMOR.find(a => a.id === armorPiece).name} ${ARMOR.find(a => a.id === armorPiece).icon}`); }
  if (ally && !state.allies.includes(ally)) state.allies.push(ally);
  saveState(state); refreshQuests(); updateArmorMini(state);
}

// ---------- dialogue ----------
function openDialog(n) {
  uiLock = 'dialog'; audio.ensure();
  const settled = !!state.settled[n.def.id];
  $('dlg-name').textContent = `${n.def.name} — ${n.def.role}`;
  const b = $('dlg-burden');
  b.textContent = settled ? '✦ SETTLED — at peace (ally of the Safe House)' : `Burden sensed: ${n.def.burden.kind.toUpperCase()} (intensity ${n.def.burden.intensity}) — hold Q to discern`;
  b.classList.toggle('settled', settled);
  $('dlg-text').textContent = settled ? n.def.dialogue.settled : n.def.dialogue.first;
  const acts = $('dlg-actions'); acts.innerHTML = '';
  const add = (label, fn) => { const btn = document.createElement('button'); btn.textContent = label; btn.onclick = fn; acts.appendChild(btn); };
  if (!settled) {
    add('🔍 Discern (reveal need)', () => { $('dlg-text').textContent = n.def.discernHint; audio.blip(880, 0.2); });
    add('💬 Counsel', () => beginVerseChoice(n, 'Counsel'));
    add('🤲 Comfort / Pray with them', () => beginVerseChoice(n, 'Comfort'));
    add('⚔️ Rebuke the spirit — in Jesus\u2019 name', () => beginVerseChoice(n, 'Rebuke'));
  } else {
    add('🙏 Receive blessing (+Faith)', () => { addFaith(state, 6); updateFaithUI(state.faith); saveState(state); toast(`${n.def.name} prays with you. Faith restored.`); closeDialog(); });
  }
  add('Leave', closeDialog);
  $('dialog').classList.remove('hidden');
}
function closeDialog() { $('dialog').classList.add('hidden'); if (uiLock === 'dialog') uiLock = 'play'; }

function beginVerseChoice(npc, approach) {
  pendingContext = { npc, approach };
  $('dialog').classList.add('hidden');
  openWheel();
}

// ---------- verse wheel ----------
function needFor(ctx) {
  if (!ctx) return { type: 'Truth', themes: [], situation: 'counsel' };
  const { npc, approach } = ctx;
  if (approach === 'Rebuke' || npc.def.burden.possessed) return { type: 'Rebuke', types: ['Rebuke', 'Bind'], themes: npc.def.need.themes.concat(['oppression', 'temptation']), situation: 'deliverance' };
  return { type: npc.def.need.type, themes: npc.def.need.themes, situation: approach === 'Comfort' ? 'grief' : 'counsel' };
}
function openWheel() {
  uiLock = 'wheel'; audio.ensure();
  const wrap = $('wheel-cards'); wrap.innerHTML = '';
  const need = needFor(pendingContext);
  for (const id of state.versesUnlocked) {
    const v = VERSE_BY_ID[id]; if (!v) continue;
    const s = scoreVerse(v, need, state.faith, state.memorized.includes(id));
    const card = document.createElement('div'); card.className = 'verse-card' + (s >= 70 ? ' matched' : '');
    card.innerHTML = `<div class="ref">${v.ref}</div><div class="type type-${v.type}">${v.type.toUpperCase()}</div><div class="txt">${v[state.translation]}</div><div style="font-size:11px;color:${s >= 70 ? '#7ee2a8' : '#999'}">${s >= 70 ? '✦ resonates' : 'score ' + s}</div>`;
    card.onclick = () => speakVerse(v, need);
    wrap.appendChild(card);
  }
  $('verse-wheel').classList.remove('hidden');
}
function closeWheel() { $('verse-wheel').classList.add('hidden'); if (uiLock === 'wheel') uiLock = pendingContext ? 'dialog' : 'play'; if (pendingContext) $('dialog').classList.remove('hidden'), uiLock = 'dialog'; }
window.addEventListener('keydown', e => { if (e.code === 'Escape') { if (!$('verse-wheel').classList.contains('hidden')) closeWheel(); else if (!$('journal').classList.contains('hidden')) closeJournal(); else if (!$('dialog').classList.contains('hidden')) closeDialog(); } });

function speakVerse(v, need) {
  need = need || needFor(pendingContext);
  const s = scoreVerse(v, need, state.faith, state.memorized.includes(v.id));
  const g = grade(s);
  $('verse-wheel').classList.add('hidden');
  audio.verseChime(g === 'strong');
  const ctx = pendingContext; pendingContext = null;
  if (!ctx || !ctx.npc) { // free speaking (worship / warfare)
    if (g === 'strong') { addFaith(state, 6); showBanner(v, state.translation, `The Word lands. Faith +6 (in the name of Jesus).`, g); lightShaft(scene, player.position); }
    else showBanner(v, state.translation, `Spoken faithfully. (No target — approach someone and choose counsel/comfort/rebuke.)`, g);
    uiLock = 'play'; updateFaithUI(state.faith); saveState(state); return;
  }
  const n = ctx.npc;
  lightShaft(scene, new THREE.Vector3(n.def.pos[0], 0, n.def.pos[2]), g === 'strong');
  if (ctx.approach === 'Rebuke' || n.def.burden.possessed) return deliveranceHit(n, v, s, g);
  // pastoral cases
  if (g === 'strong') {
    state.settled[n.def.id] = true; n.settled = true;
    addFaith(state, 15); completeQuest(n.def.questId, armorFor(n.def.id), n.def.id);
    if (n.def.id === 'sella' && !state.versesUnlocked.includes('v_john8_32')) { state.versesUnlocked.push('v_john8_32'); toast('📜 Verse scroll received: John 8:32!'); }
    showBanner(v, state.translation, `“${v.ref}” settles ${n.def.name}. They breathe free — glory to God. Faith +15.`, g);
    audio.setMode('worship'); setTimeout(() => audio.setMode(daynight.isNight ? 'tension' : 'peace'), 6000);
  } else if (g === 'partial') {
    addFaith(state, 3);
    showBanner(v, state.translation, `Partly lands. ${n.def.name} stirs — discern again and choose the fitting Word. Faith +3.`, g);
    $('dlg-text') && ($('dialog').classList.remove('hidden'), uiLock = 'dialog', document.getElementById('dlg-text').textContent = 'Something in that Word touched me… say more? (Try a ' + n.def.need.type + ' verse about ' + n.def.need.themes.join('/') + '.)');
  } else {
    addFaith(state, -8); n.def.burden.intensity = Math.min(5, n.def.burden.intensity + 1);
    showBanner(v, state.translation, `The words fall flat — wrong medicine. ${n.def.name} withdraws. Faith −8. Repent, discern, try again.`, g);
    document.getElementById('dlg-text').textContent = n.def.dialogue.wrongApproach;
    $('dialog').classList.remove('hidden'); uiLock = 'dialog';
  }
  updateFaithUI(state.faith); saveState(state);
  if (uiLock !== 'dialog') uiLock = 'play';
}
function armorFor(npcId) { return { mara: 'righteousness', joren: 'faith', elder: 'salvation', sella: 'peace', doran: 'truth' }[npcId]; }

// ---------- deliverance combat (Elder Tomas + night whisperers) ----------
function deliveranceHit(n, v, s, g) {
  if (!activeEnemy || !activeEnemy.alive) {
    activeEnemy = new ShadowEnemy(scene, new THREE.Vector3(n.def.pos[0] + 2.2, 0, n.def.pos[2] + 1), 'Tormentor of Tomas');
    toast('⚔ A tormentor unmasks! Speak fitting Scripture — Rebuke/Bind verses on oppression. (3 to bind it)');
    audio.setMode('tension'); audio.whisper();
  }
  if (g === 'strong') {
    activeEnemy.resolve -= 1; addFaith(state, 8);
    showBanner(v, state.translation, `IT IS WRITTEN — the shadow recoils! (${activeEnemy.resolve} bindings remain) Faith +8.`, g);
    lightShaft(scene, activeEnemy.group.position, true);
    if (activeEnemy.resolve <= 0) {
      const e = activeEnemy; activeEnemy = null;
      e.banish(scene, () => {
        state.settled[n.def.id] = true; n.settled = true; state.deliveranceDone = true;
        addFaith(state, 15); completeQuest(n.def.questId, 'salvation', n.def.id);
        completeQuest('q_discern_all', 'truth');
        toast('✦ Delivered! Light breaks through — no gore, only dawn. Elder Tomas is free.');
        showBanner(v, state.translation, '“Resist the devil, and he will flee.” (James 4:7) — BOUND in the name of Jesus.', 'strong');
        audio.banish(); audio.setMode('worship'); setTimeout(() => audio.setMode(daynight.isNight ? 'tension' : 'peace'), 8000);
        updateFaithUI(state.faith); saveState(state); uiLock = 'play';
      });
      uiLock = 'play'; return;
    }
  } else if (g === 'partial') {
    showBanner(v, state.translation, 'It flinches — but holds. A sharper Word is needed (Rebuke/Bind on oppression).', g);
  } else {
    addFaith(state, -8);
    showBanner(v, state.translation, 'Weak effect — the shadow laughs. Discern: it needs REBUKE/BIND verses. Faith −8.', g);
  }
  updateFaithUI(state.faith); saveState(state); uiLock = 'play';
}

// ---------- temptation event (Matthew 4 model) ----------
function openTemptation(t) {
  uiLock = 'temptation'; audio.ensure(); audio.whisper(); audio.setMode('tension');
  $('temp-title').textContent = t.title; $('temp-desc').textContent = t.desc;
  $('temp-counter').classList.add('hidden');
  const ch = $('temp-choices'); ch.innerHTML = '';
  t._time = 22; $('temptation').classList.remove('hidden');
  for (const c of t.choices) {
    const b = document.createElement('button'); b.textContent = c.label;
    b.onclick = () => {
      if (c.scripture) {
        $('temp-counter').classList.remove('hidden'); ch.innerHTML = '';
        const tv = $('temp-verses'); tv.innerHTML = '';
        const cands = state.versesUnlocked.map(id => VERSE_BY_ID[id]).filter(Boolean).slice(0, 6);
        // ensure at least one right answer present
        if (!cands.some(v => scoreVerse(v, t.counterNeed, state.faith) >= 70)) {
          const right = VERSES.find(v => scoreVerse(v, t.counterNeed, 80) >= 70);
          if (right && !state.versesUnlocked.includes(right.id)) { state.versesUnlocked.push(right.id); cands.push(right); }
        }
        for (const v of cands) {
          const vb = document.createElement('button'); vb.textContent = `${v.ref} (${v.type})`;
          vb.onclick = () => {
            const s = scoreVerse(v, t.counterNeed, state.faith, state.memorized.includes(v.id));
            if (s >= 70) { addFaith(state, 12); completeQuest('q_temptation', 'righteousness'); closeTemptation(); toast('✦ ' + t.rightNote); showBanner(v, state.translation, 'Temptation broken. “It is written.” Faith +12.', 'strong'); audio.verseChime(true); }
            else { addFaith(state, -6); updateFaithUI(state.faith); toast('That Word is true but not the sword for this moment. Try again — hurry.'); }
          };
          tv.appendChild(vb);
        }
      } else {
        addFaith(state, c.effect.faith); updateFaithUI(state.faith);
        closeTemptation(true);
        toast(c.effect.note);
        if (c.effect.faith < 0) openRepent();
      }
    };
    ch.appendChild(b);
  }
}
function openRepent() {
  // 1 John 1:9 — repentance is always open
  if (!confirm('You fell. The whisper lingers…\n\n“If we confess our sins, He is faithful and just to forgive us.” (1 John 1:9)\n\nRepent now? (OK = confess & be restored)')) return;
  addFaith(state, 14); updateFaithUI(state.faith); saveState(state);
  toast('✦ “If we confess… He cleanses us.” Restored. Go and stand.');
}
function closeTemptation(failed) {
  $('temptation').classList.add('hidden'); uiLock = 'play';
  state.temptationDone = true; saveState(state); refreshQuests();
  audio.setMode(daynight.isNight ? 'tension' : 'peace');
}

// ---------- journal + memorize mini-game ----------
function openJournal() {
  uiLock = 'journal';
  const jl = $('journal-list'); jl.innerHTML = '';
  for (const id of state.versesUnlocked) {
    const v = VERSE_BY_ID[id]; if (!v) continue;
    const mem = state.memorized.includes(id);
    const d = document.createElement('div'); d.className = 'j-entry';
    d.innerHTML = `<b>${v.ref}</b> <span class="type type-${v.type}" style="font-size:10px;padding:1px 6px;border-radius:6px">${v.type}</span> ${mem ? '✦ memorized (+10 power)' : ''}<br/><i>${v[state.translation]}</i><br/>`;
    if (!mem) { const b = document.createElement('button'); b.textContent = 'Memorize (fill-in-the-blank)'; b.onclick = () => memorizeGame(v); d.appendChild(b); }
    jl.appendChild(d);
  }
  $('armor-panel').innerHTML = ARMOR.map(a => `<div class="armor-piece ${state.armor[a.id] ? 'unlocked' : ''}"><div class="nm">${a.icon} ${a.name} ${state.armor[a.id] ? '✦' : '🔒'}</div><div>${a.desc}</div><div style="color:#999">How: ${a.how}</div></div>`).join('');
  $('journal').classList.remove('hidden');
}
function closeJournal() { $('journal').classList.add('hidden'); if (uiLock === 'journal') uiLock = 'play'; }
$('journal-close').onclick = closeJournal;
function memorizeGame(v) {
  const words = v[state.translation].split(' ');
  if (words.length < 6) { toast('Short verse — marked memorized by grace.'); state.memorized.push(v.id); saveState(state); openJournal(); return; }
  const idx = 3 + Math.floor(Math.random() * (words.length - 5));
  const answer = words[idx].replace(/[^A-Za-z']/g, '');
  const masked = words.map((w, i) => i === idx ? '_____' : w).join(' ');
  const guess = prompt(`MEMORIZE — ${v.ref}\n\n${masked}\n\nType the missing word:`);
  if (guess && guess.trim().toLowerCase().replace(/[^a-z']/g, '') === answer.toLowerCase()) {
    if (!state.memorized.includes(v.id)) state.memorized.push(v.id);
    if (state.memorized.length >= 3 && !state.armor.word) { state.armor.word = true; toast('⚔ Sword of the Spirit unsealed! Rebuke/Bind +25%.'); }
    else toast(`✦ Hidden in your heart. (${v.ref} memorized)`);
    addFaith(state, 5); updateFaithUI(state.faith); saveState(state);
  } else toast(`Not quite — the word was “${answer}”. Read it again; grace for the trying.`);
  openJournal();
}

// ---------- prayer / worship ----------
function nearChurch() { return Math.hypot(player.position.x - churchPos.x, player.position.z - churchPos.z) < 8; }

// ---------- main loop ----------
const clock = new THREE.Clock();
let elapsed = 0, mmTick = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
  const playing = uiLock === 'play' || uiLock === 'dialog';
  if (playing) {
    // movement (camera-relative)
    const mv = input.moveVec();
    const speed = (state.armor.peace ? 6.4 : 5.6) * (input.discern ? 0.5 : 1);
    const sin = Math.sin(input.yaw), cos = Math.cos(input.yaw);
    const dx = (mv.x * cos - mv.z * sin) * speed * dt;
    const dz = (mv.x * -sin - mv.z * cos) * -1 * speed * dt;
    let nx = player.position.x - dx, nz = player.position.z + dz * -1;
    // simple collision vs boxes + world bounds
    for (const c of colliders) { const d = Math.hypot(nx - c.x, nz - c.z); if (d < c.r + 0.6) { nx = player.position.x; nz = player.position.z; break; } }
    nx = Math.max(-55, Math.min(50, nx)); nz = Math.max(-42, Math.min(42, nz));
    player.position.x = nx; player.position.z = nz;
    state.playerPos = [nx, 0, nz];
    if (mv.x || mv.z) player.rotation.y = Math.atan2(-dx, -dz);
    // animate walk bob
    pBody.position.y = 1.05 + (mv.x || mv.z ? Math.abs(Math.sin(elapsed * 10)) * 0.06 : 0);
    // camera follow orbit
    const dist = 8, cx = player.position.x + Math.sin(input.yaw) * Math.cos(input.pitch) * dist;
    const cz = player.position.z + Math.cos(input.yaw) * Math.cos(input.pitch) * dist;
    camera.position.set(cx, player.position.y + 2 + Math.sin(input.pitch) * dist, cz);
    camera.lookAt(player.position.x, 1.6, player.position.z);
    lamp.intensity = 4 + state.faith / 100 * 8;
    // lens cone
    lens.position.copy(player.position); lens.position.y = 1.4;
    lens.rotation.z = -input.yaw + Math.PI;
    lens.material.opacity += ((input.discern ? 0.10 : 0) - lens.material.opacity) * Math.min(1, dt * 6);
    // prayer at church (hold P)
    prayHeld = !!input.keys['KeyP'];
    if (prayHeld && nearChurch()) {
      addFaith(state, dt * 9); updateFaithUI(state.faith);
      if (Math.random() < dt * 2) lightShaft(scene, player.position);
      if (Math.random() < dt * 0.2) saveState(state);
    }
    // night drain + mill oppression field
    const night = daynight.isNight;
    let drain = night ? (state.armor.salvation ? 0.35 : 0.5) : 0;
    const millD = Math.hypot(nx - millPos.x, nz - millPos.z);
    if (millD < 12) drain += 1.2;
    if (drain) { addFaith(state, -drain * dt); updateFaithUI(state.faith); }
    // night whisperer spawn (Tier 1 ambient combat)
    if (night && nightMobs.length < 1 && Math.random() < dt * 0.05 && !activeEnemy) {
      const m = new ShadowEnemy(scene, new THREE.Vector3(nx + 8 + Math.random() * 6, 0, nz + (Math.random() - 0.5) * 10), 'Whisperer');
      m.resolve = 2; nightMobs.push(m); toast('🌑 A whisperer stalks the dark. Speak a Shield/Truth verse! (Tab)'); audio.setMode('tension');
    }
    // temptation timer
    if (!state.temptationDone) {
      temptationTimer -= dt;
      if (temptationTimer <= 0) { openTemptation(TEMPTATIONS[Math.floor(Math.random() * TEMPTATIONS.length)]); }
    }
    // interact prompt
    const near = npcs.nearest(player.position);
    const pr = $('interact-prompt');
    if (near && uiLock === 'play') { pr.textContent = `E — Speak with ${near.def.name}`; pr.classList.remove('hidden'); }
    else if (nearChurch() && uiLock === 'play') { pr.textContent = 'Hold P — Pray at the Safe House (restores Faith)'; pr.classList.remove('hidden'); }
    else if (activeEnemy && activeEnemy.alive && uiLock === 'play') { pr.textContent = 'Tab — Open the Word Arsenal against the shadow'; pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
    // edge-triggered keys
    if (input.consume('KeyE') && near && uiLock === 'play') openDialog(near);
    if (input.consume('Tab') && uiLock === 'play') { pendingContext = activeEnemy ? { npc: npcs.list.find(n => n.def.id === 'elder'), approach: 'Rebuke' } : (near ? { npc: near, approach: 'Counsel' } : null); openWheel(); }
    if (input.consume('KeyP') && !nearChurch() && uiLock === 'play') toast('Kneel anywhere to pray briefly (+3) — but the church is a stronger refuge. Hold P there.'), addFaith(state, 3), updateFaithUI(state.faith);
    if (input.consume('KeyJ') && (uiLock === 'play')) openJournal();
    // night-mob verse hits via free-speaking when close: check banner flow — handled by speakVerse free path; plus auto-chip:
    for (const m of nightMobs) {
      if (Math.hypot(player.position.x - m.group.position.x, player.position.z - m.group.position.z) < 3 && m.alive) {
        addFaith(state, -2 * dt); updateFaithUI(state.faith);
      }
    }
    input.endFrame();
  } else {
    if (input.consume('KeyJ') && uiLock === 'journal') closeJournal();
    if (input.consume('Tab') && uiLock === 'play') {}
    input.endFrame();
  }
  // global keys available in any non-title state
  if (uiLock !== 'title') {
    if (input.keys['Tab'] && uiLock === 'play' && !document.getElementById('verse-wheel').classList.contains('hidden')) {}
  }
  // world updates always (background alive behind modals)
  const env = daynight.update(dt, 0.1);
  npcs.update(dt, elapsed, input.discern, player.position);
  if (activeEnemy) activeEnemy.update(dt);
  nightMobs = nightMobs.filter(m => m.alive);
  for (const m of nightMobs) m.update(dt);
  audio.setMode(uiLock === 'temptation' || activeEnemy || nightMobs.length ? 'tension' : (state.faith > 60 && nearChurch() ? 'worship' : (env.nightF > 0.6 ? 'tension' : 'peace')));
  // temptation countdown bar
  if (uiLock === 'temptation') {
    const t = document.querySelector('#temptation');
    // find current temptation time via stored value
    const fill = $('temp-timer-fill');
    // shrink bar with real time
    const cur = parseFloat(fill.dataset.v || '1');
    const nv = Math.max(0, cur - dt / 22); fill.dataset.v = nv; fill.style.width = (nv * 100) + '%';
    if (nv <= 0) { addFaith(state, -15); updateFaithUI(state.faith); closeTemptation(true); toast('You froze — the whisper took ground. Faith −15. Repentance is open (1 John 1:9).'); openRepent(); fill.dataset.v = '1'; }
  } else { const fill = $('temp-timer-fill'); if (fill) { fill.dataset.v = '1'; fill.style.width = '100%'; } }
  // minimap ~10fps
  mmTick += dt; if (mmTick > 0.12) { mmTick = 0; if (uiLock !== 'title') drawMinimap({ x: player.position.x, z: player.position.z, yaw: input.yaw }, npcs.list.map(n => ({ def: n.def, settled: !!state.settled[n.def.id] })), churchPos, env.nightF > 0.6); }
  // autosave
  if (Math.floor(elapsed) % 20 === 0 && Math.random() < dt) saveState(state);
  renderer.render(scene, camera);
}
// extra: night-mob banish hook — free-spoken strong Shield/Truth near a whisperer binds it
const _speak = speakVerse;
speakVerse = function (v, need) {
  const nearMob = nightMobs.find(m => m.alive && Math.hypot(player.position.x - m.group.position.x, player.position.z - m.group.position.z) < 12);
  if (nearMob && (!pendingContext || !pendingContext.npc)) {
    const s = scoreVerse(v, { types: ['Shield', 'Truth'], themes: ['fear', 'doubt'], situation: 'torment' }, state.faith, state.memorized.includes(v.id));
    if (s >= 60) {
      nearMob.resolve -= 1; audio.verseChime(true); lightShaft(scene, nearMob.group.position, true);
      showBanner(v, state.translation, `IT IS WRITTEN — the whisperer staggers! (${nearMob.resolve} left)`, 'strong');
      $('verse-wheel').classList.add('hidden'); pendingContext = null; uiLock = 'play';
      if (nearMob.resolve <= 0) { const m = nearMob; nightMobs = nightMobs.filter(x => x !== m); m.banish(scene, () => { addFaith(state, 10); updateFaithUI(state.faith); toast('✦ Whisperer scattered by the Word. Faith +10.'); }); }
      updateFaithUI(state.faith); saveState(state); return;
    } else { addFaith(state, -5); updateFaithUI(state.faith); showBanner(v, state.translation, 'Weak against this shadow — try Shield/Truth on fear.', 'weak'); $('verse-wheel').classList.add('hidden'); pendingContext = null; uiLock = 'play'; return; }
  }
  return _speak(v, need);
};
animate();
