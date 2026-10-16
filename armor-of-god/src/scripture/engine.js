// Verse matching engine: tags (theme, situation, enemy weakness) -> effectiveness score.
export function scoreVerse(verse, need, faith = 80, memorized = false) {
  let score = 20;
  const wantTypes = need.types || (need.type ? [need.type] : []);
  if (wantTypes.includes(verse.type)) score += 40;
  const needThemes = need.themes || [];
  const overlap = verse.themes.filter(t => needThemes.includes(t)).length;
  score += Math.min(30, overlap * 15);
  if (need.situation && verse.situations.includes(need.situation)) score += 10;
  score = score * (0.5 + faith / 100);
  if (memorized) score += 10;
  return Math.round(score);
}
export function grade(score) {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'partial';
  return 'weak';
}
