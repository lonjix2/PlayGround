# JSON Schemas — ARMOR OF GOD (data-driven design)

All game content lives in `src/data/*.json` (embedded as JS modules for the
Phase-1 build so Vite needs no extra loader). Validators: keep these invariants.

## 1. Verse — `verses.json`
```json
{
  "id": "eph6_11",
  "ref": "Ephesians 6:11",
  "type": "Shield | Rebuke | Heal | Bind | Comfort | Truth",
  "themes": ["fear", "oppression", "doubt", "grief", "anger", "addiction", "deception", "pride", "despair", "temptation", "guilt"],
  "situations": ["torment", "temptation", "counsel", "deliverance", "grief", "fear"],
  "enemyWeakness": ["tormentor:fear", "tormentor:doubt", "stronghold:addiction", "principality:pride", "principality:mammon", "principality:deception", "principality:division", "principality:death"],
  "kjv": "Full King James text, verbatim, public domain.",
  "web": "Full World English Bible text, public domain.",
  "unlock": "start | found | quest | memorize",
  "power": 10
}
```
Rules: `type` ∈ the 6 listed. `themes`/`situations` lowercase. Every verse needs
both `kjv` and `web`, plus `ref` and full text shown on every use (tone guardrail).

## 2. NPC — `npcs.json`
```json
{
  "id": "mara",
  "name": "Mara",
  "role": "Widow at the market",
  "pos": [12, 0, 8],
  "burden": { "kind": "grief", "intensity": 3, "aura": "#4a6fa5" },
  "discernHint": "What the lens reveals…",
  "dialogue": { "first": "…", "wrongApproach": "…", "settled": "…" },
  "need": { "type": "Comfort", "themes": ["grief", "comfort"] },
  "allyReward": "shopkeeper: 10% supplies + intercessor buff",
  "questId": "q_settle_mara"
}
```
`burden.kind` ∈ fear|grief|addiction|anger|deception|oppression|doubt|despair.
`need.type` must be a Verse type — the matching engine compares verse.type.

## 3. Enemy — `enemies.json`
```json
{
  "id": "whisperer_01",
  "tier": 1,
  "name": "Whisperer",
  "kind": "tormentor:fear",
  "hp": 3,
  "weakness": { "types": ["Shield", "Truth"], "themes": ["fear"] },
  "banishLine": "…light breaks through…",
  "spawnsAt": "night | oppression-site | boss-arena"
}
```
Tier 1 = Tormentors (fear/doubt/whisperers), Tier 2 = Strongholds
(addiction/lust/greed/witchcraft-site — shown via atmosphere, never explicit),
Tier 3 = Principalities (Pride, Mammon, Deception, Division, Death) — defeated
by Scripture puzzle-combat (ordered verse sequence), not DPS.

## 4. Quest — `quests.json`
```json
{
  "id": "q_deliver_elder",
  "title": "…",
  "giver": "npcId | auto",
  "steps": ["discern …", "speak the right Word …", "…"],
  "requires": { "settled": ["npcId"], "verses": ["ref"] },
  "rewards": { "faith": 15, "armor": "truth", "ally": "npcId" }
}
```

## 5. Matching-engine scoring (`src/scripture/engine.js`)
```
score = 20 (base)
  + 40 if verse.type == need.type (or ∈ weakness.types)
  + 15 per overlapping theme (cap 30)
  + 10 if situation matches
  × (0.5 + faith/100)   // Faith-meter scaling
  + 10 if memorized
thresholds: ≥70 strong (deliver/settle), 40–69 partial, <40 weak (escalates)
```
Wrong verse (<40) escalates burden intensity +1 and drains Faith −8.
Right verse (≥70) settles a burden pip or removes one enemy resolve pip.
