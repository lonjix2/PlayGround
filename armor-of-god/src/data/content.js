// NPCs, enemies, quests, temptations — data-driven content (Phase 1: town slice)
export const NPCS = [
{ id:"mara", name:"Mara", role:"Widow · market stall", pos:[14,0,6], burden:{kind:"grief",intensity:3,aura:"#4a6fa5"},
  discernHint:"A heavy blue-grey veil. Grief unspoken since her husband passed. She needs comfort, not correction.",
  dialogue:{ first:"Oh… hello, dear. Don't mind me. The stall stays open, even when the heart doesn't.", wrongApproach:"Rebuke?? I haven't sinned by missing him… (she withdraws; grief deepens)", settled:"…Thank you. For the first time in months, I can breathe. The Lord is near, isn't He? My stall is yours — take what you need." },
  need:{type:"Comfort",themes:["grief","despair"]}, allyReward:"Shopkeeper ally: free bread restores +10 Faith", questId:"q_comfort_mara" },
{ id:"joren", name:"Joren", role:"Farmer's boy · by the well", pos:[-10,0,14], burden:{kind:"fear",intensity:3,aura:"#5b5bd6"},
  discernHint:"A trembling indigo shroud. Nightmares; afraid of the dark fields and the whispering at night.",
  dialogue:{ first:"D-don't go past the treeline at night. It… it talks. It knows my name.", wrongApproach:"Mocking his fear only tightens its grip. He backs away.", settled:"You… you're not afraid of it? 'God hath not given us the spirit of fear…' I'll remember. I'll pray tonight instead of hiding!" },
  need:{type:"Shield",themes:["fear"]}, allyReward:"Intercessor-to-be: +5 Faith aura near him", questId:"q_shield_joren" },
{ id:"elder", name:"Elder Tomas", role:"Retired teacher · clinic porch", pos:[-14,0,-6], burden:{kind:"oppression",intensity:4,aura:"#7a1f3d", possessed:true},
  discernHint:"A coiling dark-red chain around his chest. This is not mere sadness — a tormentor has a foothold. Discern, then REBUKE/BIND deliverance.",
  dialogue:{ first:"Leave me. Forty years I taught… and now my own mind turns on me. Prayers bounce off the ceiling.", wrongApproach:"Soft words alone slide off the chains. The shadow laughs. Something must be BOUND in Jesus' name.", settled:"Light…! It's gone — the weight is gone. 'Resist the devil, and he will flee.' You pulled me out of the pit, friend." },
  need:{type:"Rebuke",themes:["oppression","temptation"]}, allyReward:"Rescue-team member; unlocks Safe House prayer buff", questId:"q_deliver_elder" },
{ id:"sella", name:"Sella", role:"Merchant · market", pos:[6,0,16], burden:{kind:"anger",intensity:3,aura:"#b3541e"},
  discernHint:"A flickering ember-orange flare. Cheated by a partner; unforgiveness is poisoning her sleep.",
  dialogue:{ first:"Fair prices, honest scales! …Unlike some I could name. He stole half my dowry and smiles in the synagogue!", wrongApproach:"Quoting law at her feeds the fire. She needs binding of wrath + release.", settled:"'Let not the sun go down upon your wrath…' You're right. I release him. I'll sleep tonight. Come — I'll show you what I found in the storeroom (a verse scroll!)." },
  need:{type:"Bind",themes:["anger","oppression"]}, allyReward:"Gives verse scroll: John 8:32", questId:"q_bind_sella" },
{ id:"doran", name:"Doran", role:"Doubting scribe · school steps", pos:[2,0,-14], burden:{kind:"doubt",intensity:3,aura:"#6b7280"},
  discernHint:"A grey static haze around his head. Learned arguments that ate his faith. He needs TRUTH, spoken gently.",
  dialogue:{ first:"Words, words. The scrolls contradict, the wicked prosper. Prove to me anything is true.", wrongApproach:"Sentimentality bounces off. He wants evasions? No — he needs Truth itself.", settled:"'Ye shall know the truth, and the truth shall make you free.' …I wrote that verse a hundred times and never heard it. Until now." },
  need:{type:"Truth",themes:["doubt","deception"]}, allyReward:"Scribe ally: reveals memorization mini-game", questId:"q_truth_doran" }
];
export const ENEMIES = [
{ id:"whisperer_night", tier:1, name:"Whisperer", kind:"tormentor:fear", hp:3, weakness:{types:["Shield","Truth"],themes:["fear"]}, banishLine:"The shadow shrieks without sound — and light breaks through like dawn.", spawnsAt:"night" },
{ id:"tormentor_elder", tier:1, name:"Tormentor of Tomas", kind:"tormentor:doubt", hp:3, weakness:{types:["Rebuke","Bind"],themes:["oppression","temptation"]}, banishLine:"Chains shatter into light. The oppressed mind is still and free.", spawnsAt:"deliverance" },
{ id:"stronghold_mill", tier:2, name:"Stronghold of the Old Mill (greed)", kind:"stronghold:addiction", hp:5, weakness:{types:["Rebuke","Bind"],themes:["temptation","addiction"]}, banishLine:"The mill's cold grip loosens; the air tastes clean again.", spawnsAt:"phase2" }
];
export const QUESTS = [
{ id:"q_discern_all", title:"Discern the town (hold Q near 5 residents)", giver:"auto", steps:["Use the discernment lens on all 5 burdened residents"], requires:{}, rewards:{faith:10,armor:"truth"} },
{ id:"q_comfort_mara", title:"Comfort Mara's grief", giver:"mara", steps:["Discern Mara","Speak a Comfort verse for grief"], requires:{}, rewards:{faith:15,armor:"righteousness",ally:"mara"} },
{ id:"q_shield_joren", title:"Shield Joren's fear", giver:"joren", steps:["Discern Joren","Speak a Shield verse for fear"], requires:{}, rewards:{faith:15,armor:"faith",ally:"joren"} },
{ id:"q_deliver_elder", title:"Deliver Elder Tomas", giver:"elder", steps:["Discern the oppression","Confront + speak Rebuke/Bind verses 3×"], requires:{}, rewards:{faith:25,armor:"salvation",ally:"elder"} },
{ id:"q_bind_sella", title:"Loose Sella's anger", giver:"sella", steps:["Discern Sella","Speak a Bind verse on anger"], requires:{}, rewards:{faith:15,armor:"peace",ally:"sella"} },
{ id:"q_truth_doran", title:"Answer Doran's doubt", giver:"doran", steps:["Discern Doran","Speak a Truth verse"], requires:{}, rewards:{faith:15,armor:"truth",ally:"doran"} },
{ id:"q_temptation", title:"Stand the night whisper (temptation)", giver:"auto", steps:["Survive the temptation event using 'It is written'"], requires:{}, rewards:{faith:10,armor:"righteousness"} }
];
export const TEMPTATIONS = [
{ id:"t_greed", title:"The Merchant's Shortcut", desc:"A voice like oil: 'Skim a little from the offering box. No one counts. God wants you blessed, doesn't He?' Your hand hovers over coins meant for the widows.",
  choices:[{label:"Skim the coins (greed)", effect:{faith:-20,note:"Guilt settles like smoke. (1 John 1:9 — repentance is open.)"}},{label:"Refuse outright", effect:{faith:+5,note:"You step back. The whisper screams — then thins."}},{label:"Counter with Scripture — 'It is written…'", scripture:true}],
  counterNeed:{type:"Rebuke",themes:["temptation","addiction"]}, rightNote:"'Man shall not live by bread alone…' (Matt 4:4). The whisper recoils. Heaven is silent — then warm." },
{ id:"t_pride", title:"The Crowd's Praise", desc:"After the deliverance, admirers gather: 'It was YOUR power! Take the credit — build your name!' Pride tastes sweeter than honey.",
  choices:[{label:"Take the glory (pride)", effect:{faith:-20,note:"The light dims a little. Compromise has a price."}},{label:"Give God the glory", effect:{faith:+8,note:"'Not unto us, O LORD…' The armor gleams brighter."}},{label:"Counter with Scripture — 'It is written…'", scripture:true}],
  counterNeed:{type:"Truth",themes:["pride","doubt"]}, rightNote:"'God resisteth the proud, but giveth grace unto the humble.' The crowd's spell breaks." }
];
export const ARMOR = [
{ id:"truth", name:"Belt of Truth", icon:"🪢", desc:"Discernment lens range +; unlocks burden labels.", how:"Discern residents & settle Doran." },
{ id:"righteousness", name:"Breastplate of Righteousness", icon:"🛡️", desc:"Wrong verses hurt less; repentance restores more.", how:"Stand temptation; comfort Mara." },
{ id:"peace", name:"Shoes of the Gospel of Peace", icon:"🥾", desc:"Move 15% faster; prayer zones wider.", how:"Loose Sella's anger." },
{ id:"faith", name:"Shield of Faith", icon:"🔥", desc:"Verse power +20%; fear zones drain less.", how:"Shield Joren; pray at church." },
{ id:"salvation", name:"Helmet of Salvation", icon:"👑", desc:"Faith drains 30% slower at night.", how:"Deliver Elder Tomas." },
{ id:"word", name:"Sword of the Spirit", icon:"⚔️", desc:"Starts unsealed; Rebuke/Bind verses +25%.", how:"Memorize 3 verses (journal mini-game)." }
];
