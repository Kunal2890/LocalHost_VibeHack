/* ==========================================================================
   levels.js  -  the chaos engine.
   Points -> level -> what changes. Also the random events, the HUD,
   the final certificate and the "Calm Down" reset.
   ========================================================================== */

/* ======================= HUD (the box in the corner) ======================= */

function initHud() {
  const meter = $('#meter');
  for (let i = 0; i < MAX_LEVEL; i++) meter.appendChild(document.createElement('i'));
  updateAchievementCounter();
  updateHud();
}

function updateHud() {
  $('#lvlNum').textContent = state.level;
  $('#rank').textContent = RANK_NAMES[state.level];
  $('#clk').textContent = state.clicks;

  $$('#meter i').forEach((segment, index) => {
    const isOn = index < state.level;
    segment.className = (isOn ? 'on' : '') + (isOn && index >= 6 ? ' hot' : '');   // last segments turn red
  });

  let bestLevel = Number(readStorage('cc_best')) || 0;
  if (state.level > bestLevel) { bestLevel = state.level; writeStorage('cc_best', bestLevel); }
  $('#bestTxt').textContent = bestLevel ? 'Best: level ' + bestLevel : '';
}

/* ======================= POINTS AND LEVELS ======================= */

function levelForPoints(points) {
  let level = 0;
  LEVEL_THRESHOLDS.forEach((needed, index) => { if (points >= needed) level = index; });
  return level;
}

function addPoints(amount) {
  state.points += amount;
  const newLevel = levelForPoints(state.points);
  while (state.level < newLevel) {       // a big jump runs every level in between
    state.level++;
    onLevelUp(state.level);
  }
  updateHud();
}

/* Jump straight to a level (presenter keys "[" and "]"). */
function goToLevel(level) {
  level = Math.max(0, Math.min(MAX_LEVEL, level));
  const clicks = state.clicks;
  resetEverything(true);
  state.clicks = clicks;
  addPoints(LEVEL_THRESHOLDS[level]);
}

/* The mouse cursor becomes an emoji that changes with each level. */
function setCursorEmoji(level) {
  const emoji = CURSOR_EMOJIS[Math.min(level, CURSOR_EMOJIS.length - 1)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="26" font-size="26">${emoji}</text></svg>`;
  document.documentElement.style.setProperty('--cur', `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 4, auto`);
}

/* Little emojis follow the mouse. */
let lastTrailX = 0;
let lastTrailY = 0;
function spawnTrailEmoji() {
  if (state.level < 1 || prefersReducedMotion || state.siteIsClosed) return;
  if (Math.hypot(mouse.x - lastTrailX, mouse.y - lastTrailY) < 12) return;   // only when the mouse moved
  lastTrailX = mouse.x;
  lastTrailY = mouse.y;
  flyEmoji(pickRandom(TRAIL_EMOJIS), mouse.x, mouse.y, { size: randomInt(12, 20), dx: randomBetween(-12, 12), dy: randomBetween(10, 30), duration: 700, endScale: 0.3 });
}

/* ======================= WHAT HAPPENS AT EACH LEVEL ======================= */

const randomTiltForCards = () => {
  $$('#site .card').forEach((card) => card.style.setProperty('--r', randomBetween(-3, 3) + 'deg'));
};

const LEVEL_UP_ACTIONS = {
  1: () => repeatEvery(spawnTrailEmoji, 60),

  2: () => repeatEvery(() => {
    if (state.level >= 2 && !state.siteIsClosed && Math.random() < 0.8) showRandomPopup();
  }, 9000),

  3: () => {
    randomTiltForCards();
    repeatEvery(() => { if (Math.random() < 0.5) shuffleNavLabels(); }, 12000);
  },

  4: () => runLater(showCookiePopup, 400),

  5: () => {
    startBouncingLogo();
    unlockAchievement('lvl5');
    duckRain(10);
  },

  6: () => {
    repeatEvery(flickerGrades, 1500);                    // result grades flicker (see portal.js)
    if (prefersReducedMotion) return;
    repeatEvery(() => {                                   // emojis rain down the screen
      if (document.querySelectorAll('.fl').length >= 26) return;
      flyEmoji(pickRandom(['🔥', '🍕', '💩', '🦆', '🌈', '👀']), randomBetween(0, innerWidth), -30, {
        dy: innerHeight + 60, dx: randomBetween(-60, 60), duration: randomBetween(2500, 4500),
        size: randomInt(22, 40), endScale: 1, easing: 'ease-in',
      });
    }, 1100);
  },

  7: () => {
    flipScroll(9000);
    repeatEvery(() => { if (Math.random() < 0.35) flipScroll(7000); }, 16000);
    runLater(() => startFlashlight(6000), 3000);
  },

  8: () => {
    runLater(() => { if (state.level <= 8) showBlueScreen(); }, 600);   // skipped if we jumped past level 8
    $$('#site .card').forEach((card) => card.style.setProperty('--r', randomBetween(-8, 8) + 'deg'));
  },

  9: () => {
    confetti(100);
    duckRain(24);
    spawnClickyClone();
    spawnClickyClone();
    repeatEvery(() => { if (Math.random() < 0.7) spawnClickyClone(); }, 5000);
  },

  10: () => {
    unlockAchievement('lvl10');
    breakTheScreen();
    runLater(showCertificate, 1700);
  },
};

function onLevelUp(level) {
  document.body.classList.add('l' + level);   // style.css has rules like body.l4 { ... }
  setCursorEmoji(level);
  applyPageCopy();
  updateHud();

  if (level > 0) {
    sounds.levelUp();
    toast(`LEVEL ${level} · ${RANK_NAMES[level]}`);
    showClicky();
    say(CLICKY_LEVEL_LINES[level] || '…', 4200);
  }
  if (LEVEL_UP_ACTIONS[level]) LEVEL_UP_ACTIONS[level]();
}

/* ======================= RANDOM EVENTS ======================= */
/* After some clicks a random event fires. Higher level = more events, wilder ones.
   weight = how likely it is compared with the others. */

const RANDOM_EVENTS = [
  { minLevel: 0, weight: 7, run: showRandomPopup },
  { minLevel: 1, weight: 3, run: () => confetti(50) },
  { minLevel: 1, weight: 3, run: () => duckRain(8) },
  { minLevel: 1, weight: 3, run: () => toast(pickRandom(RANDOM_TOASTS)) },
  { minLevel: 1, weight: 1, run: showUploadNag },
  { minLevel: 2, weight: 2, run: () => invertColours(1600) },
  { minLevel: 2, weight: 2, run: () => shakeScreen(600, 8) },
  { minLevel: 3, weight: 2, run: shuffleNavLabels },
  { minLevel: 3, weight: 2, run: dropCardsWithGravity },
  { minLevel: 3, weight: 2, run: () => shuffleButtonLabels(6000) },
  { minLevel: 3, weight: 2, run: crackFlurry },
  { minLevel: 4, weight: 2, run: rainbowHeadings },
  { minLevel: 4, weight: 2, run: zoomPage },
  { minLevel: 4, weight: 1, run: showFakeLoading },
  { minLevel: 4, weight: 1, run: () => translatePage(pickRandom(['duck', 'pirate', 'emoji', 'shout']), 7000) },
  { minLevel: 5, weight: 2, run: () => startFlashlight(5000) },
  { minLevel: 6, weight: 2, run: () => startBeeSwarm(7000) },
  { minLevel: 6, weight: 1, run: () => flipScroll(7000) },
  { minLevel: 6, weight: 2, run: makeAllButtonsPanic },
  { minLevel: 7, weight: 2, run: spawnClickyClone },
  { minLevel: 9, weight: 1, run: fakeCloseWebsite },
];

function triggerRandomEvent() {
  const choices = RANDOM_EVENTS.filter((event) => event.minLevel <= state.level);
  const totalWeight = choices.reduce((sum, event) => sum + event.weight, 0);

  let roll = Math.random() * totalWeight;
  for (const event of choices) {
    roll -= event.weight;
    if (roll <= 0) {
      try { event.run(); } catch (error) { /* one broken event must not stop the show */ }
      return;
    }
  }
}

let lastEventTime = 0;
const MIN_MILLISECONDS_BETWEEN_EVENTS = 900;

/* Called after every click. */
function maybeTriggerRandomEvent() {
  if (state.siteIsClosed || state.finaleShown) return;
  const now = Date.now();
  if (now - lastEventTime < MIN_MILLISECONDS_BETWEEN_EVENTS) return;

  const chance = state.clicks < 3 ? 0 : Math.min(0.8, 0.18 + state.level * 0.07);
  const isThirdClick = state.clicks === 3;     // the 3rd click always triggers the first popup
  if (isThirdClick || Math.random() < chance) {
    lastEventTime = now;
    triggerRandomEvent();
  }
}

/* ======================= FINALE: THE CERTIFICATE ======================= */

function showCertificate() {
  if (state.finaleShown) return;
  state.finaleShown = true;
  clearAllPopups();
  sounds.levelUp();

  const seconds = state.firstClickAt ? Math.round((Date.now() - state.firstClickAt) / 1000) : 0;
  const secretsFound = Object.keys(unlockedAchievements).length;

  const popup = createPopup('🏆 CERTIFICATE OF CHAOS',
    `<div class="cert"><p>This certifies that</p>
      <input type="text" id="certName" placeholder="type your name here" aria-label="Your name" maxlength="28">
      <p id="certTxt"></p><div class="big">👑</div><p><b>Rank: Chaos Deity</b></p>
      <p style="color:var(--muted);font-size:.85rem">Signed, Clicky — Head of Disorder</p></div>`, [
      { label: 'Copy my score', onClick: () => copyScore(seconds, secretsFound) },
      { label: 'Keep going', ghost: true, onClick: (popup) => {
          closePopup(popup);
          state.finaleShown = false;
          state.endless = true;
          toast('♾️ Endless mode. No rules now.');
          repeatEvery(() => { if (!state.siteIsClosed) triggerRandomEvent(); }, 1800);
      } },
      { label: 'Restore calm', ghost: true, onClick: (popup) => { closePopup(popup); resetEverything(); } },
    ], { center: true, noHydra: true });

  $('#certTxt', popup).innerHTML =
    `has clicked <b>${state.clicks}</b> times in <b>${seconds}</b> seconds and discovered <b>${secretsFound}/${ACHIEVEMENTS.length}</b> secrets.`;
  popup.style.zIndex = 99000;
}

function copyScore(seconds, secretsFound) {
  const text = `I reached Chaos Level 10 on Chaos Click with ${state.clicks} clicks in ${seconds}s and found ${secretsFound}/${ACHIEVEMENTS.length} secrets.`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Score copied!'), () => toast(text));
  } else {
    toast(text);
  }
}

/* ======================= CALM DOWN: reset everything ======================= */

function resetEverything(silent = false) {
  cancelAllTimers();

  // Remove every level class (l1 ... l10) from <body>.
  for (let level = 1; level <= MAX_LEVEL; level++) document.body.classList.remove('l' + level);

  stopBouncingLogo();
  $$('.pop, .fl, .duck, .clone, #dark, #bsod, #bye').forEach((element) => element.remove());
  $$('#site .card, #site .runaway').forEach((element) => {
    element.style.translate = '';
    element.style.removeProperty('--r');
    ['n', 'done', 'tx', 'ty'].forEach((key) => delete element.dataset[key]);
  });
  $$('#site h1, #site h2').forEach((heading) => heading.classList.remove('rain'));

  const stage = $('#stage');
  stage.className = '';
  stage.style.transform = '';

  resetRunState();
  clearAllShards();
  clearCracks();
  resetUpload();
  resetFleeingElements();
  resetPreferences();
  resetChat();
  resetComboTracking();
  resetRegistration();
  resetPortal();

  $('#clicky').classList.remove('show');
  $('#calmBtn').textContent = 'Calm Down';
  document.title = 'Chaos Click';
  document.documentElement.style.setProperty('--cur', 'auto');
  applyPageCopy();
  updateHud();

  if (!silent) toast('🧘 Calm restored. For now.');
}
