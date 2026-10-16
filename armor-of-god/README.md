# ARMOR OF GOD — Phase 1: Town Vertical Slice (playable)

3D open-world Christian spiritual-warfare action-adventure. No guns, no magic —
only Scripture, faith, prayer, and obedience (Eph 6:10-18, 2 Cor 10:3-5).
All verses KJV/WEB (public domain), toggle in HUD. Power language is always
"in the name of Jesus" / "it is written".

## Run

```bash
cd armor-of-god
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/
```

## What's playable (Phase 1)

- Free-roam stylized town: church/Safe House, market, school, clinic, homes,
  well, Old Mill teaser, forest, river, lamps, day/night cycle (4-min day,
  denser oppression at night), fog/ambient react.
- Third-person movement (WASD + drag-orbit camera), mobile stick + buttons.
- 5 NPCs with Burden states + auras: Mara (grief), Joren (fear), Elder Tomas
  (oppression — scripted deliverance), Sella (anger), Doran (doubt).
- Discernment lens (hold Q): reveals auras + burden labels + hints.
- Word Arsenal verse wheel (Tab): 9 starter verses (+scrolls), type
  Rebuke/Shield/Heal/Bind/Comfort/Truth, tag-match engine (type+themes+
  situation × Faith scaling). Wrong verse escalates; right verse settles.
- Deliverance combat: shadow-form tormentor unmasked, 3 strong Rebuke/Bind
  verses to bind "in the name of Jesus"; light-shaft VFX, no gore.
- Night whisperers (Tier 1 ambient): free-speak Shield/Truth verses to scatter.
- Temptation event (Matt 4 model): whisper UI, timed choice, "It is written"
  Scripture counter, lasting Faith consequences + 1 John 1:9 repentance path.
- Faith meter (fear/sin/unforgiveness drain; prayer/worship/fellowship
  restore), 6-piece Armor of God panel, allies, quest log, journal with
  memorize mini-game (fill-in-the-blank), minimap with corruption tint,
  localStorage save/continue, procedural adaptive audio (peace/tension/worship).

## Controls

WASD/arrows move · mouse-drag orbit · E talk · Q hold discern · Tab verse
wheel · P pray (hold at church) · J journal · Esc close · touch supported.

## Next-step checklist (Phase 2 → 4)

- [ ] Phase 2: Safe House hub interior + rescue/escort missions (homes, market,
      prison, collapsed church), Tier-2 stronghold at Old Mill, full save slots.
- [ ] Phase 2: jobs/giving/witnessing economy, fellowship buff zones.
- [ ] Phase 3: city district streaming (downtown/slums/nightlife/corporate/
      courthouse/stadium), first Principality boss (5-verse puzzle sequence),
      district liberation map, endings scaffolding.
- [ ] Phase 3: glTF asset swap (keep primitives fallback), chunked streaming,
      LOD, 60fps profiling on mid-range devices.
- [ ] Phase 4: voice-input "speak" option, full OST layers, VFX polish,
      mobile performance pass, settings + accessibility.
- [ ] Content: grow verse library to 60+ (keep KJV/WEB accuracy review),
      20+ NPCs, 8 temptations, 5 principalities.
