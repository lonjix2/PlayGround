// Faith meter + Armor of God (Eph 6) + save/load via localStorage.
export const SAVE_KEY = 'armor-of-god-save-v1';
export function defaultState() {
  return {
    faith: 80, translation: 'kjv',
    settled: {}, armor: { truth:false, righteousness:false, peace:false, faith:false, salvation:false, word:false },
    versesUnlocked: ['v_2tim1_7','v_isa41_10','v_ps23_4','v_jas4_7','v_eph6_11','v_eph6_16','v_prov3_5','v_1john1_9','v_ps34_18'],
    memorized: [], questsDone: [], allies: [],
    playerPos: [0, 0, 20], temptationDone: false, deliveranceDone: false
  };
}
export function loadState() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return { ...defaultState(), ...JSON.parse(raw) }; } catch {}
  return defaultState();
}
export function saveState(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {} }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
export function addFaith(s, n) { s.faith = Math.max(0, Math.min(100, s.faith + n)); }
