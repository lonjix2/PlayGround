// KJV verses (public domain). Categories drive combat + deliverance matching.
export const CATEGORIES = {
  deliverance: { name: 'Deliverance', icon: '✝', color: 0xffd76a, strongVs: 'fear' },
  peace: { name: 'Peace', icon: '🕊', color: 0x7fd4ff, strongVs: 'anger' },
  strength: { name: 'Strength', icon: '💪', color: 0xff9d5c, strongVs: 'despair' },
  faith: { name: 'Faith', icon: '🔥', color: 0xc99aff, strongVs: 'doubt' },
  healing: { name: 'Healing', icon: '💧', color: 0x8dffb0, strongVs: 'despair' },
  word: { name: 'Word', icon: '📖', color: 0xfff2b0, strongVs: null }
};

export const VERSES = [
  { id: 'psalm23-4', ref: 'Psalm 23:4', cat: 'deliverance', text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.', power: 26 },
  { id: 'isa41-10', ref: 'Isaiah 41:10', cat: 'deliverance', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God.', power: 24 },
  { id: 'psalm91-2', ref: 'Psalm 91:2', cat: 'deliverance', text: 'I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.', power: 22 },
  { id: 'luke10-19', ref: 'Luke 10:19', cat: 'deliverance', text: 'Behold, I give unto you power… over all the power of the enemy: and nothing shall by any means hurt you.', power: 30 },
  { id: 'john14-27', ref: 'John 14:27', cat: 'peace', text: 'Peace I leave with you, my peace I give unto you… Let not your heart be troubled, neither let it be afraid.', power: 24 },
  { id: 'phil4-7', ref: 'Philippians 4:7', cat: 'peace', text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds.', power: 22 },
  { id: 'eph4-32', ref: 'Ephesians 4:32', cat: 'peace', text: 'And be ye kind one to another, tenderhearted, forgiving one another.', power: 20 },
  { id: 'prov15-1', ref: 'Proverbs 15:1', cat: 'peace', text: 'A soft answer turneth away wrath: but grievous words stir up anger.', power: 21 },
  { id: 'phil4-13', ref: 'Philippians 4:13', cat: 'strength', text: 'I can do all things through Christ which strengtheneth me.', power: 24 },
  { id: 'isa40-31', ref: 'Isaiah 40:31', cat: 'strength', text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.', power: 26 },
  { id: 'neh8-10', ref: 'Nehemiah 8:10', cat: 'strength', text: 'The joy of the LORD is your strength.', power: 20 },
  { id: 'psalm46-1', ref: 'Psalm 46:1', cat: 'strength', text: 'God is our refuge and strength, a very present help in trouble.', power: 22 },
  { id: 'heb11-1', ref: 'Hebrews 11:1', cat: 'faith', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', power: 24 },
  { id: 'mark11-24', ref: 'Mark 11:24', cat: 'faith', text: 'What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.', power: 22 },
  { id: 'rom10-17', ref: 'Romans 10:17', cat: 'faith', text: 'So then faith cometh by hearing, and hearing by the word of God.', power: 20 },
  { id: 'james1-6', ref: 'James 1:6', cat: 'faith', text: 'But let him ask in faith, nothing wavering.', power: 21 },
  { id: 'jer30-17', ref: 'Jeremiah 30:17', cat: 'healing', text: 'For I will restore health unto thee, and I will heal thee of thy wounds, saith the LORD.', power: 24 },
  { id: 'psalm147-3', ref: 'Psalm 147:3', cat: 'healing', text: 'He healeth the broken in heart, and bindeth up their wounds.', power: 22 },
  { id: 'james5-16', ref: 'James 5:16', cat: 'healing', text: 'Pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.', power: 26 },
  { id: 'psalm119-105', ref: 'Psalm 119:105', cat: 'word', text: 'Thy word is a lamp unto my feet, and a light unto my path.', power: 22 },
  { id: 'eph6-17', ref: 'Ephesians 6:17', cat: 'word', text: 'Take the helmet of salvation, and the sword of the Spirit, which is the word of God.', power: 28 },
  { id: 'cor10-13', ref: '1 Cor. 10:13', cat: 'word', text: 'God… will with the temptation also make a way to escape, that ye may be able to bear it.', power: 26 },
  { id: 'matt4-4', ref: 'Matthew 4:4', cat: 'word', text: 'Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.', power: 24 },
  { id: 'josh1-9', ref: 'Joshua 1:9', cat: 'strength', text: 'Be strong and of a good courage; be not afraid… for the LORD thy God is with thee whithersoever thou goest.', power: 25 }
];

export const verseById = (id) => VERSES.find(v => v.id === id);

// NPC afflictions: which category delivers them
export const AFFLICTIONS = {
  fear: { name: 'tormented by Fear', spirit: 'Spirit of Fear', needCat: 'deliverance', line: 'I… I can hardly sleep. Shadows whisper that I am alone. Will God truly protect me?' },
  anger: { name: 'bound by Anger', spirit: 'Spirit of Anger', needCat: 'peace', line: 'Everyone has wronged me! My heart burns. I want to lash out at them all!' },
  despair: { name: 'sunk in Despair', spirit: 'Spirit of Heaviness', needCat: 'strength', line: 'What is the use? I have no strength left. My hope has dried up like a summer brook…' },
  doubt: { name: 'plagued by Doubt', spirit: 'Spirit of Doubt', needCat: 'faith', line: 'Does prayer even work? Maybe the promises are not for someone like me…' },
  sickness: { name: 'bowed by Sickness', spirit: 'Spirit of Infirmity', needCat: 'healing', line: 'My body aches and my heart is heavy. Is there any healing left for me?' }
};

// Temptation events: prompt + correct category (any verse of that cat works; word also accepted for some)
export const TEMPTATIONS = [
  { id: 'bread', title: 'Whisper of Appetite', text: '“You have fasted long enough. Take what you want — no one will know. Your hunger matters more than obedience.”', answerCat: 'word', hint: 'Jesus answered appetite with Scripture (Matt 4:4).' },
  { id: 'shortcut', title: 'Whisper of the Shortcut', text: '“Why wait on God? Lie just a little, and the promotion, the gold, the praise will be yours tonight.”', answerCat: 'word', hint: 'God makes a way of escape (1 Cor 10:13).' },
  { id: 'fear-night', title: 'Whisper of Fear', text: '“The shadows are stronger than your God. Run. Hide. You will never be safe.”', answerCat: 'deliverance', hint: 'Fear flees before “Fear thou not” (Isaiah 41:10).' },
  { id: 'revenge', title: 'Whisper of Revenge', text: '“They hurt you. Strike back! Forgiveness is weakness — wrath will satisfy you.”', answerCat: 'peace', hint: 'A soft answer turns away wrath (Prov 15:1).' },
  { id: 'giveup', title: 'Whisper of Despair', text: '“Give up. You have failed too many times. There is no strength left for you.”', answerCat: 'strength', hint: '“I can do all things through Christ” (Phil 4:13).' },
  { id: 'doubt-god', title: 'Whisper of Doubt', text: '“Did God really say? Perhaps His promises fail. Stop believing.”', answerCat: 'faith', hint: 'Faith comes by hearing the Word (Rom 10:17).' }
];

export const ENEMY_TYPES = {
  fear: { name: 'Shadow of Fear', hp: 50, speed: 4.2, dmg: 8, color: 0x5b2a86, verseCat: 'deliverance' },
  anger: { name: 'Shadow of Anger', hp: 60, speed: 3.6, dmg: 11, color: 0xb03030, verseCat: 'peace' },
  despair: { name: 'Shadow of Despair', hp: 70, speed: 3.0, dmg: 9, color: 0x2a4a5b, verseCat: 'strength' },
  doubt: { name: 'Shadow of Doubt', hp: 55, speed: 4.6, dmg: 7, color: 0x6b6b8f, verseCat: 'faith' }
};

export const RANKS = ['Witness', 'Servant', 'Comforter', 'Deliverer', 'Lightbearer', 'Ambassador of Christ'];
