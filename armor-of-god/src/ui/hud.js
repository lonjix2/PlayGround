// DOM UI helpers: toast, banner, dialog, wheel, journal, minimap, temptation.
import { VERSE_BY_ID } from '../data/verses.js';
export function toast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), ms);
}
export function showBanner(verse, translation, resultText, ok) {
  const b = document.getElementById('verse-banner');
  document.getElementById('vb-ref').textContent = verse.ref + (ok === 'strong' ? ' — IT IS WRITTEN ✦' : ' — spoken…');
  document.getElementById('vb-text').textContent = '\u201C' + verse[translation] + '\u201D';
  const r = document.getElementById('vb-result');
  r.textContent = resultText;
  r.style.color = ok === 'strong' ? '#7ee2a8' : ok === 'partial' ? '#ffd98a' : '#f87171';
  b.classList.remove('hidden');
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.add('hidden'), 4200);
}
export function updateFaithUI(faith) {
  document.getElementById('faith-num').textContent = Math.round(faith);
  const f = document.getElementById('faith-fill');
  f.style.width = faith + '%'; f.classList.toggle('low', faith < 30);
}
export function updateArmorMini(state) {
  const icons = { truth: '🪢', righteousness: '🛡', peace: '🥾', faith: '🔥', salvation: '👑', word: '⚔' };
  document.getElementById('armor-mini').innerHTML = Object.entries(icons)
    .map(([k, ic]) => `<span style="opacity:${state.armor[k] ? 1 : 0.22}" title="${k}">${ic}</span>`).join('');
}
export function verseText(v, tr) { return v[tr] || v.kjv; }
export function verseById(id) { return VERSE_BY_ID[id]; }
export function drawMinimap(player, npcs, churchPos, night) {
  const c = document.getElementById('minimap'); const g = c.getContext('2d');
  const S = 160, world = 110;
  const px = x => S / 2 + (x / world) * S, pz = z => S / 2 + (z / world) * S;
  g.clearRect(0, 0, S, S);
  g.fillStyle = night ? '#0a0d22' : '#12233a'; g.beginPath(); g.arc(80, 80, 78, 0, 9); g.fill();
  // corruption overlay: red tint bottom = night activity
  g.fillStyle = night ? 'rgba(150,20,40,0.25)' : 'rgba(150,20,40,0.08)';
  g.beginPath(); g.arc(80, 80, 78, 0, 9); g.fill();
  g.fillStyle = '#ffd98a'; g.fillRect(px(churchPos.x) - 3, pz(churchPos.z) - 3, 6, 6); // church
  g.fillStyle = '#7ee2a8';
  g.fillRect(px(52) - 8, 10, 8, 140); // river
  for (const n of npcs) {
    const settled = n.settled;
    g.fillStyle = settled ? '#7ee2a8' : n.def.burden.aura;
    g.beginPath(); g.arc(px(n.def.pos[0]), pz(n.def.pos[2]), settled ? 3 : 5, 0, 9); g.fill();
  }
  // player arrow
  g.save(); g.translate(px(player.x), pz(player.z)); g.rotate(-player.yaw);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.restore();
}
