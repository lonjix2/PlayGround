/* Lightbearer: Town of Grace — Christian Scripture Adventure (vanilla canvas) */
(() => {
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 960, H = 600;
const WORLD = { w: 2400, h: 1600 };

// ---------- SCRIPTURE ARSENAL (KJV) ----------
const VERSES = [
 { id:'peace', name:'PEACE', icon:'🕊️', color:'#4fc3f7',
   verses:[{ref:'Philippians 4:6-7', text:'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God... shall keep your hearts and minds.'},
           {ref:'John 14:27', text:'Peace I leave with you, my peace I give unto you... Let not your heart be troubled, neither let it be afraid.'}],
   strongVs:['fear','anxiety','temptation'], desc:'Calms fear & anxiety' },
 { id:'healing', name:'HEALING', icon:'💚', color:'#2ecc71',
   verses:[{ref:'Jeremiah 30:17', text:'For I will restore health unto thee, and I will heal thee of thy wounds, saith the LORD.'},
           {ref:'Isaiah 53:5', text:'...with his stripes we are healed.'}],
   strongVs:['sickness','broken'], desc:'Restores the sick' },
 { id:'faith', name:'FAITH', icon:'✨', color:'#f5d76e',
   verses:[{ref:'Hebrews 11:1', text:'Now faith is the substance of things hoped for, the evidence of things not seen.'},
           {ref:'Mark 9:23', text:'...If thou canst believe, all things are possible to him that believeth.'}],
   strongVs:['doubt','despair'], desc:'Shatters doubt' },
 { id:'comfort', name:'COMFORT', icon:'🤍', color:'#ff9ff3',
   verses:[{ref:'Psalm 34:18', text:'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.'},
           {ref:'Matthew 5:4', text:'Blessed are they that mourn: for they shall be comforted.'}],
   strongVs:['grief','broken','despair'], desc:'Comforts mourners' },
 { id:'courage', name:'COURAGE', icon:'🛡️', color:'#ff9f43',
   verses:[{ref:'Joshua 1:9', text:'Be strong and of a good courage; be not afraid... for the LORD thy God is with thee whithersoever thou goest.'},
           {ref:'Isaiah 41:10', text:'Fear thou not; for I am with thee... I will strengthen thee; yea, I will help thee.'}],
   strongVs:['fear','foe','temptation'], desc:'Strength vs foes' },
 { id:'light', name:'LIGHT / TRUTH', icon:'🕯️', color:'#fff176',
   verses:[{ref:'John 8:12', text:'I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.'},
           {ref:'Psalm 119:105', text:'Thy word is a lamp unto my feet, and a light unto my path.'}],
   strongVs:['darkness','lie','doubt','foe'], desc:'Burns darkness & lies' },
];
const verseById = id => VERSES.find(v=>v.id===id);

// ---------- NPCS ----------
const NPC_DEFS = [
 { name:'Mara the Merchant', avatar:'🧕', need:'fear', x:620, y:760, color:'#e67e22',
   lines:["Lightbearer... bandits on the road! My heart pounds — I cannot sleep, I fear ruin.","Anxiety chokes my shop. Is there any word from God for the fearful?"],
   thanks:"Your Peace verse settled me! I will lie down in peace and sleep. (Psalm 4:8) Thank you!" },
 { name:'Little Eli (sick)', avatar:'🧒', need:'sickness', x:420, y:950, color:'#3498db',
   lines:["*cough*... I have been sick many days. Mother weeps. Will God heal a small boy?","Please... pray a healing scripture over me?"],
   thanks:"I feel strength! Like the sun after rain! Thank you, Lightbearer! (Jeremiah 30:17)" },
 { name:'Scribe Tomas (doubter)', avatar:'🧑‍🏫', need:'doubt', x:1780, y:520, color:'#9b59b6',
   lines:["They say the Scriptures are fables. My faith wavers — prove to me why I should believe?","Give me a word of FAITH, if you can."],
   thanks:"Faith is substance... evidence! My doubt breaks! I will copy Hebrews 11 tonight!" },
 { name:'Widow Naomi', avatar:'👵', need:'grief', x:350, y:560, color:'#7f8c8d',
   lines:["My husband is gone to glory, and my house is empty. Grief sits with me at every meal.","Is God near to the brokenhearted?"],
   thanks:"He IS nigh! You have comforted me as with a warm cloak. Blessed are they that mourn..." },
 { name:'Guard Caleb', avatar:'💂', need:'fear', x:1380, y:640, color:'#c0392b',
   lines:["I stand watch at the gate, but at night the shadows move... I am ashamed — a guard who fears.","Speak courage over me, bearer."],
   thanks:"Be strong and of a good courage! I will not fear! My spear stands steady now!" },
 { name:'Farmer Boaz', avatar:'🧑‍🌾', need:'despair', x:780, y:1150, color:'#27ae60',
   lines:["Locusts took half my crop. I despair — shall we hunger this winter?","Have you comfort or faith for a ruined field?"],
   thanks:"You settled my heart. Weeping may endure for a night, but joy cometh! I will sow again." },
 { name:'Beggar Ruth', avatar:'🧎‍♀️', need:'broken', x:1770, y:1010, color:'#d35400',
   lines:["They pass me by... bruised, forgotten. Am I seen by any? Am I loved?","Tell me God heals the broken?"],
   thanks:"He healeth the broken in heart and bindeth up their wounds! I am SEEN. I am settled!" },
 { name:'Youth Javan (tempted)', avatar:'🧑', need:'temptation', x:1900, y:760, color:'#16a085',
   lines:["My friends mock purity — they urge me to steal, to lie, to taste what God forbids. I am torn.","What Word shall I use when temptation comes?"],
   thanks:"I will hide Thy word in my heart that I might not sin! You delivered me from the snare!" },
];
// need -> effective verse ids
const NEED_CURE = { fear:['peace','courage'], anxiety:['peace','courage'], sickness:['healing'], doubt:['faith','light'], grief:['comfort'], despair:['comfort','faith'], broken:['healing','comfort'], temptation:['courage','peace','light'], darkness:['light'], lie:['light'], foe:['courage','light'] };

// ---------- ENEMIES ----------
const FOE_DEFS = [
 { kind:'Shadow of Fear', icon:'🌑', type:'fear', hp:60, speed:70, dmg:9, color:'#2c3e50' },
 { kind:'Spirit of Doubt', icon:'🌫️', type:'doubt', hp:70, speed:55, dmg:11, color:'#8e44ad' },
 { kind:'Tempter', icon:'🐍', type:'temptation', hp:80, speed:80, dmg:12, color:'#c0392b' },
 { kind:'Prince of Darkness', icon:'👹', type:'darkness', hp:130, speed:48, dmg:16, color:'#000000' },
];

// ---------- TEMPTATIONS ----------
const TEMPTS = [
 { title:'The Bread That Is Not Yours', desc:'Hunger gnaws. A merchant turns away — his warm loaf sits unguarded. “Take it,” whispers a voice. “No one sees.” What do you do?',
   q:'What is written? (Matthew 4:4)',
   choices:[{t:'Steal the loaf — survival first.', ok:false},{t:'Walk away, pray: “Man shall not live by bread alone, but by every word of God” + work honestly.', ok:true, verse:'courage'},{t:'Take it and leave a lie that another took it.', ok:false}] },
 { title:'The Easy Lie', desc:'The city guard asks where your friend hides after wrongdoing. A smooth lie would protect you both. The Tempter urges: “Lie — it is kindness.”',
   q:'What is written? (John 8:32 / Ephesians 4:25)',
   choices:[{t:'Lie smoothly to stay safe.', ok:false},{t:'Speak truth in love: “I cannot lie — the truth shall make you free” and seek mercy honestly.', ok:true, verse:'light'},{t:'Stay silent and let another be blamed.', ok:false}] },
 { title:'Revenge at Midnight', desc:'One who mocked you sleeps. Your fist tightens. “Repay evil for evil,” hisses darkness. Your Light flickers.',
   q:'What is written? (Romans 12:19)',
   choices:[{t:'Strike back — they deserve it.', ok:false},{t:'Forgive and bless: “Vengeance is mine, saith the Lord” — release it in prayer.', ok:true, verse:'peace'},{t:'Curse them secretly.', ok:false}] },
 { title:'Wine of Escape', desc:'Grief and pressure mount. A cup is offered: “Drink deep, forget.” Old chains rattle. One sip, says the voice, and pain ends.',
   q:'What is written? (1 Cor 10:13 / Eph 5:18)',
   choices:[{t:'Drink until numb.', ok:false},{t:'Refuse, pray and flee: “God will make a way to escape” — be filled with the Spirit instead.', ok:true, verse:'courage'},{t:'Drink just a little in secret.', ok:false}] },
 { title:'Gold of Compromise', desc:'A rich trader offers gold if you will falsify the scales and praise his idol. “None will know. Think of what gold can do!”',
   q:'What is written? (Matthew 16:26)',
   choices:[{t:'Take the gold — God understands.', ok:false},{t:'Refuse: “What shall it profit a man to gain the world and lose his soul?” Walk in integrity.', ok:true, verse:'faith'},{t:'Bargain for more gold first.', ok:false}] },
 { title:'Despair in the Dark', desc:'Night falls. Prayers seem unanswered. A cold voice breathes: “God has left thee. Curse Him and despair.”',
   q:'What is written? (Psalm 34:18 / Deut 31:6)',
   choices:[{t:'Believe the voice and abandon faith.', ok:false},{t:'Hold fast: “The LORD is nigh... I will never leave thee” — worship though tears fall.', ok:true, verse:'comfort'},{t:'Hide and stop praying forever.', ok:false}] },
];

// ---------- STATE ----------
let S;
function freshState(){ return { px:480, py:640, fx:1, fy:0, hp:100, maxHp:100, light:100, faith:0, level:1, souls:0, foes:0, tempts:0, selVerse:0, prayCD:0, verseCD:0, day:1, dayT:0.3, won:false, settled:{}, muted:false }; }
function load(){ try{ const j=JSON.parse(localStorage.getItem('lightbearer-save')); if(j&&typeof j==='object'){ S=Object.assign(freshState(),j); return; } }catch(e){} S=freshState(); }
load();
function save(){ try{ localStorage.setItem('lightbearer-save', JSON.stringify({px:S.px,py:S.py,hp:S.hp,light:S.light,faith:S.faith,level:S.level,souls:S.souls,foes:S.foes,tempts:S.tempts,day:S.day,settled:S.settled,won:S.won,muted:S.muted})); }catch(e){} }

// ---------- WORLD GEOMETRY ----------
const solids=[]; // {x,y,w,h,label}
function solid(x,y,w,h,label){ solids.push({x,y,w,h,label}); }
// Church (walls with south door gap x480-540 so player can walk in to pray)
solid(380,380,240,20,'Church'); solid(380,380,20,160,'Church'); solid(600,380,20,160,'Church');
solid(380,520,100,20,'Church'); solid(540,520,80,20,'Church');
// Town cottages
solid(140,420,130,110,'Cottage'); solid(140,700,130,110,'Cottage'); solid(180,1020,150,110,'Farmhouse');
solid(640,380,140,110,'Cottage'); solid(830,700,150,120,'Shop'); solid(700,940,160,120,'Barn');
// City wall with gate at y ~600-720
for(let x=1300;x<2300;x+=120){ if(x>1540&&x<1740) continue; solid(x,300,110,40,'Wall'); solid(x,1060,110,40,'Wall'); }
solid(1300,300,40,260,'Wall'); solid(1300,760,40,340,'Wall'); solid(2280,300,40,800,'Wall');
// City buildings
solid(1560,420,180,140,'Market'); solid(1820,420,180,140,'Inn'); solid(1560,860,180,140,'House'); solid(1820,860,200,140,'Tavern'); solid(1920,560,170,120,'Lamp Tower base');
// Trees / decor solids
const trees=[]; let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
for(let i=0;i<70;i++){ const x=40+rnd()*2300, y=40+rnd()*1500; if(x>340&&x<660&&y>340&&y<580) continue; if(x>1250&&x<2350&&y>280&&y<1120) continue; trees.push({x,y,s:14+rnd()*14}); }

function collide(nx,ny){ const r=14; for(const s of solids){ if(nx+r>s.x&&nx-r<s.x+s.w&&ny+r>s.y&&ny-r<s.y+s.h) return s; } if(nx<20||ny<20||nx>WORLD.w-20||ny>WORLD.h-20) return {label:'Edge of the valley'}; return null; }

// ---------- ENTITIES ----------
let npcs = NPC_DEFS.map((d,i)=>({...d, id:i, settled:!!S.settled[i], bob:Math.random()*6, thanksT:0}));
let foes=[], bolts=[], parts=[], floaters=[];
let temptTimer=45, nightSpawn=0, shake=0, gameOpen=false;

function spawnFoe(force){
  const night = isNight();
  const def = force || FOE_DEFS[Math.floor(Math.random()*(night?4:3))];
  const ang=Math.random()*Math.PI*2, R=380+Math.random()*220;
  let x=S.px+Math.cos(ang)*R, y=S.py+Math.sin(ang)*R;
  x=Math.max(40,Math.min(WORLD.w-40,x)); y=Math.max(40,Math.min(WORLD.h-40,y));
  foes.push({ ...def, maxHp:def.hp, hp:def.hp, x, y, hitT:0, wander:Math.random()*6 });
  if(foes.length>14) foes.shift();
}
function isNight(){ return S.dayT>0.62||S.dayT<0.08; }

// ---------- INPUT ----------
const keys={};
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()]=true;
  if(!gameOpen) return;
  if(e.key>='1'&&e.key<='6'){ S.selVerse=+e.key-1; renderVerseBar(); blip(500+S.selVerse*80); fireBolt(); }
  if(e.key===' '){ fireBolt(); }
  const k=e.key.toLowerCase();
  if(k==='e') tryInteract();
  if(k==='b') togglePanel('biblePanel');
  if(k==='q') togglePanel('questPanel');
  if(k==='p') pray();
  if(k==='escape') closeAll();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

// joystick
const joy={x:0,y:0,active:false}; const joyEl=document.getElementById('joystick'), stick=document.getElementById('stick');
function joyPos(e){ const r=joyEl.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const t=e.touches?e.touches[0]:e; let dx=(t.clientX-cx)/45, dy=(t.clientY-cy)/45; const m=Math.hypot(dx,dy); if(m>1){dx/=m;dy/=m;} joy.x=dx; joy.y=dy; stick.style.left=(31+dx*30)+'px'; stick.style.top=(31+dy*30)+'px'; }
joyEl.addEventListener('touchstart',e=>{joy.active=true;joyPos(e)},{passive:true});
joyEl.addEventListener('touchmove',e=>{joyPos(e)},{passive:true});
joyEl.addEventListener('touchend',()=>{joy.active=false;joy.x=joy.y=0;stick.style.left='31px';stick.style.top='31px';});
document.querySelectorAll('#touchBtns button').forEach(b=>b.addEventListener('click',()=>{ const a=b.dataset.act; if(a==='interact')tryInteract(); if(a==='pray')pray(); if(a==='attack')fireBolt(); }));

// ---------- AUDIO (tiny) ----------
let AC=null; function blip(f=600,d=0.08,type='sine',g=0.08){ if(S.muted) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const o=AC.createOscillator(), gn=AC.createGain(); o.type=type; o.frequency.value=f; gn.gain.value=g; o.connect(gn); gn.connect(AC.destination); o.start(); gn.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+d); o.stop(AC.currentTime+d);}catch(e){} }
function chord(){ blip(523,.25); setTimeout(()=>blip(659,.25),120); setTimeout(()=>blip(784,.4),240); }

// ---------- UI ----------
const $=id=>document.getElementById(id);
function toast(msg,ms=2600){ const d=document.createElement('div'); d.className='toast'; d.textContent=msg; $('toastWrap').appendChild(d); setTimeout(()=>{d.style.opacity='0'; setTimeout(()=>d.remove(),400);},ms); }
function togglePanel(id){ const el=$(id); const open=el.classList.contains('hidden'); closeAll(); if(open) el.classList.remove('hidden'); if(id==='biblePanel')buildBible(); if(id==='questPanel')buildQuest(); }
function closeAll(){ $('dialog').classList.add('hidden'); $('biblePanel').classList.add('hidden'); $('questPanel').classList.add('hidden'); }
$('bibleClose').onclick=closeAll; $('questClose').onclick=closeAll; $('dlgClose').onclick=closeAll;
$('btnBible').onclick=()=>togglePanel('biblePanel'); $('btnQuest').onclick=()=>togglePanel('questPanel');
$('btnMute').onclick=()=>{ S.muted=!S.muted; $('btnMute').textContent=S.muted?'🔇':'🔊'; save(); };
if(S.muted) $('btnMute').textContent='🔇';

function renderVerseBar(){
  const bar=$('verseBar'); bar.innerHTML='';
  VERSES.forEach((v,i)=>{ const b=document.createElement('button'); b.className='vbtn'+(i===S.selVerse?' sel':''); b.innerHTML=`<b><span class="key">${i+1}</span>${v.icon} ${v.name}</b><small>${v.desc}</small>`;
    b.onclick=()=>{ S.selVerse=i; renderVerseBar(); blip(500+i*80); fireBolt(); }; bar.appendChild(b); });
}
function buildBible(){
  $('bibleList').innerHTML=VERSES.map(v=>`<div class="verseCard" style="border-left-color:${v.color}"><h4>${v.icon} ${v.name} — <small>${v.desc}</small></h4>${v.verses.map(s=>`<p>“${s.text}”<br><small>— ${s.ref} (KJV) • strong vs ${v.strongVs.join(', ')}</small></p>`).join('')}</div>`).join('');
}
function buildQuest(){
  const needS=Math.max(0,5-S.souls), needF=Math.max(0,8-S.foes), needT=Math.max(0,3-S.tempts);
  $('questBody').innerHTML=`<p>You are a <b>Lightbearer</b> dwelling freely in <b>Town of Grace</b> (west farms & church) and <b>City of Refuge</b> (east walls & market). Live, walk, pray, work — and when suffering or darkness appears, answer with the Word.</p>
  <ul><li>🕊️ Souls delivered & settled: <b>${S.souls}</b> ${needS?`— <b>${needS}</b> more to shine`:'— <b>done ✓</b>'}</li>
  <li>⚔️ Forces of darkness defeated: <b>${S.foes}</b> ${needF?`— <b>${needF}</b> more`:'— <b>done ✓</b>'}</li>
  <li>🛡️ Temptations overcome: <b>${S.tempts}</b> ${needT?`— <b>${needT}</b> more`:'— <b>done ✓</b>'}</li></ul>
  <p><b>How to play:</b> approach glowing NPC → <b>E</b> → discern need → speak fitting Scripture. At night shadows hunt — <b>Space / 1–6</b> to strike. Enter the <b>Church ⛪</b> (walk into doors) or press <b>P</b> to pray & heal. Temptations will come — stand firm!</p>
  <p><i>“Put on the whole armour of God... and the sword of the Spirit, which is the word of God.” — Eph 6:11,17</i></p>
  <button class="hbtn" id="btnReset" style="color:#ffb3b3">↺ Restart journey (wipe save)</button>`;
  $('btnReset').onclick=()=>{ if(confirm('Wipe saved progress and restart?')){ localStorage.removeItem('lightbearer-save'); location.reload(); } };
}
function updateHUD(){
  $('hpFill').style.width=(100*S.hp/S.maxHp)+'%'; $('hpText').textContent=Math.ceil(S.hp);
  const xpNeed=S.level*100; $('faithFill').style.width=Math.min(100,100*S.faith/xpNeed)+'%'; $('faithText').textContent='Lv '+S.level;
  $('lightText').textContent=Math.round(S.light); $('soulsText').textContent=S.souls; $('foesText').textContent=S.foes; $('temptText').textContent=S.tempts;
  $('dayText').textContent=(isNight()?'Night ':'Day ')+S.day; $('dayIco').textContent=isNight()?'🌙':'☀️';
}

// ---------- MINISTRY (dialog) ----------
let activeNPC=null, dlgStep=0;
function nearestNPC(){ let best=null,bd=70; for(const n of npcs){ const d=Math.hypot(n.x-S.px,n.y-S.py); if(d<bd){bd=d;best=n;} } return best; }
function tryInteract(){
  if(!$('dialog').classList.contains('hidden')) return;
  // church door heal auto handled in update; lamp kindle check
  const lamp={x:2005,y:620}; if(Math.hypot(lamp.x-S.px,lamp.y-S.py)<90){ tryKindle(); return; }
  const n=nearestNPC(); if(!n){ toast('Walk to a glowing person and press E to minister. ⛪ Church heals.'); return; }
  activeNPC=n; dlgStep=0; showDialog();
}
function showDialog(){
  const n=activeNPC; $('dialog').classList.remove('hidden');
  $('dlgAvatar').textContent=n.settled?'😇':n.avatar; $('dlgName').textContent=n.name+(n.settled?' — settled ✓':'');
  const needLabel={fear:'oppressed by Fear',sickness:'afflicted in body',doubt:'troubled by Doubt',grief:'bowed in Grief',despair:'in Despair',broken:'brokenhearted',temptation:'facing Temptation'}[n.need]||n.need;
  $('dlgNeed').textContent=n.settled?'resting in peace':('Need: '+needLabel);
  if(n.settled){ $('dlgText').textContent='“'+n.thanks+'” The light lingers on their face. (You settled this soul.)'; $('dlgVerses').innerHTML=''; $('dlgActions').innerHTML='<button id="btnBless">✦ Bless them (+5 Light)</button>';
    $('btnBless').onclick=()=>{ S.light=Math.min(120,S.light+5); floater(S.px,S.py-30,'+5 Light 🕯️','#ffe9a8'); blip(880); closeAll(); }; return; }
  $('dlgText').textContent='“'+n.lines[dlgStep]+'”';
  if(dlgStep<n.lines.length-1){ $('dlgVerses').innerHTML=''; $('dlgActions').innerHTML='<button id="btnNext">➤ Listen carefully…</button>'; $('btnNext').onclick=()=>{dlgStep++; blip(440); showDialog();}; return; }
  // verse choice
  $('dlgActions').innerHTML='<div style="font-size:13px;color:#7a5f1e"> discern their need, then speak the fitting Scripture:</div>';
  const dv=$('dlgVerses'); dv.innerHTML='';
  VERSES.forEach(v=>{ const b=document.createElement('button'); b.innerHTML=`<b>${v.icon} ${v.name}</b><br>${v.verses[0].ref}`; b.onclick=()=>minister(v.id); dv.appendChild(b); });
}
function minister(verseId){
  const n=activeNPC; const cures=NEED_CURE[n.need]||[];
  if(cures.includes(verseId)){
    const v=verseById(verseId); const quote=v.verses[Math.floor(Math.random()*v.verses.length)];
    n.settled=true; S.settled[n.id]=1; S.souls++; S.faith+=40; S.light=Math.min(120,S.light+15); S.hp=Math.min(S.maxHp,S.hp+12);
    floater(n.x,n.y-40,'DELIVERED! 🕊️','#fff176'); burst(n.x,n.y,v.color,26);
    $('dlgText').innerHTML=`You lay a hand and declare:<br><b>“${quote.text}”</b><br><small>— ${quote.ref} (KJV)</small><br><br><i>${n.thanks}</i>`;
    $('dlgVerses').innerHTML=''; $('dlgActions').innerHTML='<button id="btnAmen">✦ Amen! (+40 faith)</button>';
    $('btnAmen').onclick=()=>{ closeAll(); levelCheck(); checkWin(); save(); toast(`🕊️ ${n.name} settled & delivered! (${S.souls} souls)`); };
    chord();
  } else {
    S.faith=Math.max(0,S.faith-5);
    $('dlgText').innerHTML=`You speak... but their eyes stay heavy. <i>That word is true, yet not the sword for this battle.</i><br><small>Hint: ${hintFor(n.need)}</small><br><br>“${n.lines[1]}”`;
    blip(180,.2,'sawtooth',.06); shake=6;
  }
  updateHUD();
}
function hintFor(need){ return {fear:'Fear flees from PEACE or COURAGE (Phil 4, Josh 1).',sickness:'Sickness yields to HEALING (Jer 30).',doubt:'Doubt breaks before FAITH or LIGHT (Heb 11, John 8).',grief:'Grief melts in COMFORT (Ps 34).',despair:'Despair lifts by COMFORT or FAITH.',broken:'The brokenhearted need HEALING or COMFORT.',temptation:'Temptation is resisted by COURAGE, PEACE, LIGHT (Josh 1, James 4:7).'}[need]||'Pray and try another Scripture.'; }
function levelCheck(){ const need=S.level*100; if(S.faith>=need){ S.faith-=need; S.level++; S.maxHp+=15; S.hp=S.maxHp; toast(`✨ Faith Level ${S.level}! Health restored. “Faith cometh by hearing...” Rom 10:17`); chord(); } }

// ---------- COMBAT ----------
function fireBolt(){
  if(S.verseCD>0||!gameOpen) return; S.verseCD=0.28;
  const v=VERSES[S.selVerse];
  bolts.push({x:S.px+S.fx*20,y:S.py+S.fy*20,dx:S.fx,dy:S.fy,verse:v.id,color:v.color,life:1.6});
  blip(700+S.selVerse*60,.07,'square',.05);
}
function hurtFoe(f,dmg,verseId,crit){
  f.hp-=dmg; f.hitT=0.15; burst(f.x,f.y,verseById(verseId).color,crit?14:7);
  floater(f.x,f.y-24,(crit?'IT IS WRITTEN! -':'-')+dmg,'#ffe9a8');
  if(f.hp<=0){ f.dead=true; S.foes++; S.faith+=25; S.light=Math.min(120,S.light+8); floater(f.x,f.y,'Defeated! +25 faith','#7CFC98'); burst(f.x,f.y,'#ffffff',22); blip(300,.2,'sawtooth'); levelCheck(); checkWin(); save(); }
  else blip(crit?990:520,.06,'square');
}
function pray(){
  if(S.prayCD>0){ toast(`Prayer rekindling... ${Math.ceil(S.prayCD)}s`); return; }
  S.prayCD=10; S.hp=Math.min(S.maxHp,S.hp+30); S.light=Math.min(120,S.light+20);
  burst(S.px,S.py,'#ffe9a8',30); floater(S.px,S.py-30,'🙏 “...pray without ceasing.” +30 ❤','#ffe9a8'); chord(); toast('🙏 You prayed. “Draw nigh to God, and he will draw nigh to you.” — James 4:8');
}

// ---------- TEMPTATION ----------
function triggerTempt(){
  if(!$('temptModal').classList.contains('hidden')) return;
  const t=TEMPTS[Math.floor(Math.random()*TEMPTS.length)];
  $('temptModal').classList.remove('hidden');
  $('temptTitle').textContent=t.title; $('temptDesc').textContent=t.desc; $('temptVerseQ').innerHTML=`<i>${t.q}</i><br>Choose rightly — the Word + righteousness:`;
  const box=$('temptChoices'); box.innerHTML='';
  const opts=[...t.choices].sort(()=>Math.random()-.5);
  opts.forEach(c=>{ const b=document.createElement('button'); b.textContent=(c.ok?'✦ ':'')+c.t; b.onclick=()=>{
    if(c.ok){ $('temptModal').classList.add('hidden'); S.tempts++; S.faith+=35; S.light=Math.min(120,S.light+12); const v=verseById(c.verse); const q=v.verses[0];
      toast(`🛡️ Temptation overcome! “${q.ref}” (+35 faith)`); burst(S.px,S.py,v.color,30); chord(); levelCheck(); checkWin(); save(); temptTimer=70+Math.random()*40; }
    else { $('temptModal').classList.add('hidden'); S.hp-=22; S.light=Math.max(10,S.light-15); shake=12; burst(S.px,S.py,'#e74c3c',18);
      toast('💔 You stumbled... “Watch and pray, lest ye enter into temptation.” (Matt 26:41) -22 ❤ — pray (P) and rise again!'); blip(140,.4,'sawtooth'); save(); temptTimer=55+Math.random()*30; if(S.hp<=0) respawn(); }
    updateHUD();
  }; box.appendChild(b); });
  blip(220,.3,'sawtooth',.09);
}
function respawn(){ S.hp=S.maxHp; S.px=500; S.py=620; S.light=Math.max(40,S.light-10); toast('🕊️ Grace lifts you at the Church. “My grace is sufficient for thee.” — 2 Cor 12:9'); }

// ---------- WIN ----------
function tryKindle(){
  if(S.won){ toast('🕯️ The Great Lamp burns bright over the city. “Ye are the light of the world.” — Matt 5:14'); return; }
  const ns=Math.max(0,5-S.souls), nf=Math.max(0,8-S.foes), nt=Math.max(0,3-S.tempts);
  if(!ns&&!nf&&!nt){ S.won=true; $('winBanner').classList.remove('hidden'); $('winText').textContent=`${S.souls} souls settled • ${S.foes} forces routed • ${S.tempts} temptations overcome. The valley glows — well done, good and faithful servant! (Matt 25:21)`; chord(); setTimeout(()=>chord(),500); save(); }
  else toast(`🕯️ The Lamp waits: ${ns} souls • ${nf} foes • ${nt} temptations still needed.`);
}
function checkWin(){ if(!S.won&&S.souls>=5&&S.foes>=8&&S.tempts>=3){ S.won=true; $('winBanner').classList.remove('hidden'); $('winText').textContent=`${S.souls} souls settled • ${S.foes} forces routed • ${S.tempts} temptations overcome. Kindle it at the Lamp Tower!`; chord(); save(); } }
$('btnContinue').onclick=()=>$('winBanner').classList.add('hidden');

// ---------- PARTICLES / FLOATERS ----------
function burst(x,y,color,n=12){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=40+Math.random()*140; parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.6+Math.random()*.5,color,r:2+Math.random()*3}); } }
function floater(x,y,text,color){ floaters.push({x,y,text,color,life:1.8}); }

// ---------- UPDATE ----------
let last=0, camX=0, camY=0;
function update(dt){
  // movement
  let mx=0,my=0;
  if(keys['w']||keys['arrowup'])my-=1; if(keys['s']||keys['arrowdown'])my+=1; if(keys['a']||keys['arrowleft'])mx-=1; if(keys['d']||keys['arrowright'])mx+=1;
  mx+=joy.x; my+=joy.y;
  const m=Math.hypot(mx,my); if(m>0.1){ mx/=Math.max(1,m); my/=Math.max(1,m); S.fx=mx/(Math.hypot(mx,my)||1); S.fy=my/(Math.hypot(mx,my)||1);
    const sp=200*dt; const nx=S.px+mx*sp, ny=S.py+my*sp;
    if(!collide(nx,S.py)) S.px=nx; if(!collide(S.px,ny)) S.py=ny;
    S.walk=(S.walk||0)+dt*10;
  }
  // day cycle (~4 min day)
  S.dayT+=dt/240; if(S.dayT>=1){S.dayT=0;S.day++; toast(`☀️ Day ${S.day} dawns. “...weeping may endure for a night, but joy cometh in the morning.”`);}
  // church heal zone (interior + doorstep)
  if(S.px>390&&S.px<610&&S.py>390&&S.py<620){ if(S.hp<S.maxHp){S.hp=Math.min(S.maxHp,S.hp+12*dt);} }
  // tavern temptation zone
  if(S.px>1820&&S.px<2020&&S.py>860&&S.py<1000){ temptTimer-=dt*3; }
  // cooldowns
  S.verseCD=Math.max(0,S.verseCD-dt); S.prayCD=Math.max(0,S.prayCD-dt);
  // light drains at night, regen in day near lamp/church
  S.light+= (isNight()?-1.2:1.5)*dt; S.light=Math.max(5,Math.min(120,S.light));
  if(S.light<=6){ S.hp-=4*dt; }
  // foes AI
  nightSpawn-=dt; if(nightSpawn<=0){ nightSpawn=isNight()?4:9; if(foes.length<(isNight()?9:4)) spawnFoe(); }
  for(const f of foes){ f.wander+=dt; f.hitT=Math.max(0,(f.hitT||0)-dt);
    const dx=S.px-f.x, dy=S.py-f.y, d=Math.hypot(dx,dy)||1;
    const chase=d<520?1:0.3; const sp=f.speed*chase*dt;
    const nx=f.x+dx/d*sp+Math.cos(f.wander*2)*10*dt, ny=f.y+dy/d*sp+Math.sin(f.wander*2)*10*dt;
    if(!collide(nx,ny)) {f.x=nx;f.y=ny;}
    if(d<30){ S.hp-=f.dmg*dt; shake=Math.max(shake,3); if(Math.random()<dt*2) floater(S.px,S.py-24,'-'+Math.round(f.dmg/2),'#ff8a8a'); if(S.hp<=0) respawn(); }
  }
  foes=foes.filter(f=>!f.dead);
  // bolts
  for(const b of bolts){ b.x+=b.dx*460*dt; b.y+=b.dy*460*dt; b.life-=dt;
    for(const f of foes){ if(!f.dead&&Math.hypot(f.x-b.x,f.y-b.y)<26){ const isCrit=verseById(b.verse).strongVs.includes(f.type); hurtFoe(f,isCrit?50:24,b.verse,isCrit); b.life=0; break; } }
    if(collide(b.x,b.y)) b.life=0;
  }
  bolts=bolts.filter(b=>b.life>0);
  // parts
  for(const p of parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.96; p.vy*=0.96; p.life-=dt; }
  parts=parts.filter(p=>p.life>0);
  for(const f of floaters){ f.y-=30*dt; f.life-=dt; } floaters=floaters.filter(f=>f.life>0);
  // temptations
  if(gameOpen&&$('temptModal').classList.contains('hidden')){ temptTimer-=dt; if(temptTimer<=0) triggerTempt(); }
  // npc bob
  for(const n of npcs) n.bob+=dt*2;
  // camera
  camX+=((S.px-W/2)-camX)*Math.min(1,dt*5); camY+=((S.py-H/2)-camY)*Math.min(1,dt*5);
  camX=Math.max(0,Math.min(WORLD.w-W,camX)); camY=Math.max(0,Math.min(WORLD.h-H,camY));
  shake=Math.max(0,shake-dt*20);
  updateHUD();
}

// ---------- RENDER ----------
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h); ctx.fill(); }
function draw(){
  ctx.save();
  if(shake>0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  // ground
  const g=ctx.createLinearGradient(0,-camY,0,WORLD.h-camY); g.addColorStop(0,'#2d4a2d'); g.addColorStop(.5,'#3a5a34'); g.addColorStop(1,'#2a4028');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(-camX,-camY);
  // fields
  ctx.fillStyle='#4a6b3a'; for(let i=0;i<6;i++) ctx.fillRect(90+i*46,1080,36,180);
  ctx.fillStyle='#c2b280'; ctx.fillRect(60,300,WORLD.w-120,40); // north path
  // road town->city
  ctx.fillStyle='#8a7a55'; ctx.fillRect(0,620,WORLD.w,70);
  ctx.fillStyle='#a08c60'; for(let x=0;x<WORLD.w;x+=60) ctx.fillRect(x,651,30,8);
  // town cobble
  ctx.fillStyle='#5a5a4a55'; ctx.fillRect(100,380,900,760);
  // city stone
  ctx.fillStyle='#6a6a7a55'; ctx.fillRect(1340,340,980,720);
  // river? small pond
  ctx.fillStyle='#3a7ca5'; ctx.beginPath(); ctx.ellipse(1050,1250,120,70,0,0,7); ctx.fill();
  ctx.fillStyle='#ffffff33'; ctx.beginPath(); ctx.ellipse(1020,1235,50,20,-.3,0,7); ctx.fill();

  // trees
  for(const t of trees){ ctx.fillStyle='#3a2a1a'; ctx.fillRect(t.x-3,t.y,6,t.s); ctx.fillStyle='#2d6a2d'; ctx.beginPath(); ctx.arc(t.x,t.y-6,t.s*.7,0,7); ctx.fill(); ctx.fillStyle='#3f8f3f'; ctx.beginPath(); ctx.arc(t.x-4,t.y-10,t.s*.4,0,7); ctx.fill(); }

  // buildings
  const house=(x,y,w,h,c1,c2,label)=>{ ctx.fillStyle='#00000044'; ctx.fillRect(x+6,y+8,w,h); ctx.fillStyle=c1; ctx.fillRect(x,y,w,h); ctx.fillStyle=c2; ctx.beginPath(); ctx.moveTo(x-10,y); ctx.lineTo(x+w/2,y-44); ctx.lineTo(x+w+10,y); ctx.closePath(); ctx.fill(); ctx.fillStyle='#3a2a1a'; ctx.fillRect(x+w/2-14,y+h-44,28,44); ctx.fillStyle='#ffe9a8'; ctx.fillRect(x+12,y+16,26,22); ctx.fillRect(x+w-38,y+16,26,22); if(label){ctx.fillStyle='#fff';ctx.font='12px Georgia';ctx.fillText(label,x+6,y+h+14);} };
  house(140,420,130,110,'#d9c9a0','#8a5a2b','Cottage'); house(140,700,130,110,'#d9c9a0','#8a5a2b','Cottage');
  house(180,1020,150,110,'#c9a86a','#6b4a1f','Farmhouse'); house(640,380,140,110,'#e0d0a8','#7a5a2b','Cottage');
  house(830,700,150,120,'#c9b07a','#5a4a2b','Market Shop'); house(700,940,160,120,'#a85a3a','#5a2a1a','Barn');
  house(1560,420,180,140,'#b0b0c0','#4a4a5a','City Market'); house(1820,420,180,140,'#c0b090','#5a4a3a','Inn');
  house(1560,860,180,140,'#b8a888','#4a3a2a','House'); house(1820,860,200,140,'#8a4a3a','#3a1a1a','Tavern ⚠️');
  // walls
  ctx.fillStyle='#7a7a8a'; for(const s of solids.filter(s=>s.label==='Wall')) ctx.fillRect(s.x,s.y,s.w,s.h);
  ctx.fillStyle='#9a9aaa'; for(const s of solids.filter(s=>s.label==='Wall')) ctx.fillRect(s.x,s.y,s.w,8);
  // gate
  ctx.fillStyle='#e8b64c'; ctx.fillRect(1545,300,190,14); ctx.fillStyle='#fff'; ctx.font='bold 13px Georgia'; ctx.fillText('✦ CITY OF REFUGE GATE ✦',1545,295);
  ctx.fillStyle='#e8b64c'; ctx.fillRect(200,560,90,14); ctx.fillText('TOWN OF GRACE',120,370);
  // church
  { const x=380,y=380,w=240,h=160; ctx.fillStyle='#00000044'; ctx.fillRect(x+8,y+10,w,h);
    ctx.fillStyle='#fffdf0'; ctx.fillRect(x,y,w,h); ctx.fillStyle='#7a2a2a'; ctx.beginPath(); ctx.moveTo(x-14,y); ctx.lineTo(x+w/2,y-70); ctx.lineTo(x+w+14,y); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e8b64c'; ctx.fillRect(x+w/2-6,y-108,12,44); ctx.fillRect(x+w/2-18,y-96,36,12);
    ctx.fillStyle='#5a4a2a'; ctx.fillRect(x+w/2-20,y+h-60,40,60); ctx.fillStyle='#ffe9a8'; for(let i=0;i<4;i++) ctx.fillRect(x+20+i*56,y+30,34,44);
    ctx.fillStyle='#2d2545'; ctx.font='bold 15px Georgia'; ctx.fillText('⛪ CHURCH — pray & heal (walk in)',x+8,y+h+20); }
  // lamp tower
  { const x=1920,y=560,w=170,h=120; const lit=S.won; ctx.fillStyle='#3a3a4a'; ctx.fillRect(x+60,y-140,50,140);
    ctx.fillStyle=lit?'#ffe9a8':'#5a5a6a'; ctx.beginPath(); ctx.arc(x+85,y-150,34,0,7); ctx.fill();
    if(lit){ const gr=ctx.createRadialGradient(x+85,y-150,10,x+85,y-150,160); gr.addColorStop(0,'#ffe9a855'); gr.addColorStop(1,'transparent'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x+85,y-150,160,0,7); ctx.fill(); }
    ctx.fillStyle='#fff'; ctx.font='bold 13px Georgia'; ctx.fillText(lit?'🕯️ GREAT LAMP — LIT!':'🕯️ GREAT LAMP (press E near)',x-10,y+h+20); }

  // NPCs
  for(const n of npcs){ const bobY=Math.sin(n.bob)*4;
    if(!n.settled){ const pl=ctx.createRadialGradient(n.x,n.y+bobY,4,n.x,n.y+bobY,34); pl.addColorStop(0,'#ffe9a844'); pl.addColorStop(1,'transparent'); ctx.fillStyle=pl; ctx.beginPath(); ctx.arc(n.x,n.y+bobY,34,0,7); ctx.fill(); }
    ctx.font='30px serif'; ctx.textAlign='center'; ctx.fillText(n.settled?'😇':n.avatar,n.x,n.y+bobY);
    ctx.fillStyle=n.settled?'#ffffff88':'#ffe9a8'; ctx.beginPath(); ctx.arc(n.x,n.y+bobY+18,4+Math.sin(n.bob*2)*1.5,0,7); ctx.fill();
    ctx.fillStyle='#000000aa'; const tw=ctx.measureText(n.name).width; rr(n.x-tw/2-16,n.y+bobY+24,tw+32,18,9); ctx.fillStyle='#ffe9a8'; ctx.font='11px Georgia'; ctx.fillText((n.settled?'✓ ':'! ')+n.name,n.x,n.y+bobY+37);
    if(Math.hypot(n.x-S.px,n.y-S.py)<70&&!n.settled){ ctx.fillStyle='#fff'; ctx.font='bold 12px Georgia'; ctx.fillText('Press E ✦',n.x,n.y+bobY-28); }
  }
  // foes
  for(const f of foes){ const wob=Math.sin(f.wander*5)*3;
    ctx.fillStyle='#00000088'; ctx.beginPath(); ctx.ellipse(f.x,f.y+16,20,8,0,0,7); ctx.fill();
    const gr=ctx.createRadialGradient(f.x,f.y+wob,4,f.x,f.y+wob,30); gr.addColorStop(0,f.color); gr.addColorStop(1,'#00000000'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(f.x,f.y+wob,30,0,7); ctx.fill();
    ctx.font='26px serif'; ctx.textAlign='center'; ctx.fillText(f.icon,f.x,f.y+wob+8);
    // hp bar
    ctx.fillStyle='#000'; ctx.fillRect(f.x-24,f.y-26,48,7); ctx.fillStyle='#e74c3c'; ctx.fillRect(f.x-24,f.y-26,48*(f.hp/f.maxHp),7);
    ctx.fillStyle='#ffb3b3'; ctx.font='10px Georgia'; ctx.fillText(f.kind,f.x,f.y-30);
  }
  // bolts
  for(const b of bolts){ ctx.fillStyle=b.color; ctx.shadowColor=b.color; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(b.x,b.y,7,0,7); ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,3,0,7); ctx.fill(); }
  // player
  { const wob=S.walk?Math.sin(S.walk)*2:0;
    const gl=ctx.createRadialGradient(S.px,S.py,6,S.px,S.py,54); gl.addColorStop(0,'#ffe9a866'); gl.addColorStop(1,'transparent'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(S.px,S.py,54,0,7); ctx.fill();
    ctx.fillStyle='#00000055'; ctx.beginPath(); ctx.ellipse(S.px,S.py+18,16,6,0,0,7); ctx.fill();
    ctx.font='32px serif'; ctx.textAlign='center'; ctx.fillText('🧔‍♂️',S.px,S.py+wob);
    ctx.font='16px serif'; ctx.fillText('✝',S.px+S.fx*18,S.py+S.fy*18-6+wob);
    ctx.fillStyle='#000000aa'; rr(S.px-44,S.py+24,88,16,8); ctx.fillStyle='#ffe9a8'; ctx.font='11px Georgia'; ctx.fillText('Lightbearer Lv'+S.level,S.px,S.py+36);
  }
  // particles
  for(const p of parts){ ctx.globalAlpha=Math.max(0,p.life*1.5); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); } ctx.globalAlpha=1;
  ctx.restore();
  // floaters (screen space)
  ctx.textAlign='center';
  for(const f of floaters){ const sx=f.x-camX, sy=f.y-camY; if(sx<0||sy<0||sx>W||sy>H) continue; ctx.globalAlpha=Math.min(1,f.life); ctx.font='bold 15px Georgia'; ctx.fillStyle='#000'; ctx.fillText(f.text,sx+1,sy+1); ctx.fillStyle=f.color; ctx.fillText(f.text,sx,sy); } ctx.globalAlpha=1;
  // night overlay
  if(isNight()){ ctx.fillStyle='#0a0a2a55'; ctx.fillRect(0,0,W,H);
    const gx=S.px-camX, gy=S.py-camY; const rg=ctx.createRadialGradient(gx,gy,40,gx,gy,260); rg.addColorStop(0,'transparent'); rg.addColorStop(1,'#000022cc'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H); }
  else if(S.dayT>0.5){ ctx.fillStyle='#ff9f4322'; ctx.fillRect(0,0,W,H); }
  // vignette + interact prompt zone labels
  ctx.fillStyle='#ffffffcc'; ctx.font='13px Georgia'; ctx.textAlign='left';
  const zone = S.px<1300?'🌾 Town of Grace — free living':'🏰 City of Refuge — free living';
  ctx.fillStyle='#00000066'; rr(10,H-30,330,22,11); ctx.fillStyle='#ffe9a8'; ctx.fillText(zone+`  •  📖 ${VERSES[S.selVerse].name} ready`,18,H-14);
  ctx.restore();
}

// ---------- LOOP ----------
function loop(t){ const dt=Math.min(0.05,(t-last)/1000||0.016); last=t; if(gameOpen){ update(dt); } draw(); requestAnimationFrame(loop); }

// ---------- START ----------
$('btnStart').onclick=()=>{ $('intro').classList.add('hidden'); gameOpen=true; renderVerseBar(); buildBible(); updateHUD(); toast('🕊️ Welcome, Lightbearer! Find the glowing (!) souls. Press E to minister.'); blip(523); setTimeout(()=>blip(784),200); setTimeout(spawnFoe,3000); setTimeout(spawnFoe,6000); };
renderVerseBar(); updateHUD();
requestAnimationFrame(loop);
setInterval(()=>{ if(gameOpen) save(); },8000);
})();
