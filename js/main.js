/* ==========================================================================
   main.js  -  wires everything together: click counting, buttons, keyboard.
   This file loads last, after every other file.

   The flow of every click:
     click  ->  count it, sound, emoji burst, maybe crack the glass
            ->  add chaos points (may trigger a level-up)
            ->  maybe trigger a random event
   ========================================================================== */

/* ======================= COMBO (fast clicking) ======================= */

let recentClickTimes = [];

function trackCombo(event) {
  const now = Date.now();
  recentClickTimes = recentClickTimes.filter((time) => now - time < 1400);
  recentClickTimes.push(now);

  const combo = recentClickTimes.length;
  if (combo < 4) return;
  flyEmoji('COMBO x' + combo, event.clientX - 30, event.clientY - 30, {
    className: 'cb', size: Math.min(60, 20 + combo * 3), dy: -90, dx: randomBetween(-30, 30), duration: 900, endScale: 1,
  });
  if (combo % 4 === 0) addPoints(1);   // a bonus point every 4th click in a row
}
function resetComboTracking() { recentClickTimes = []; }

/* ======================= EVERY CLICK ANYWHERE ======================= */
/* "true" = capture phase: we see the click before any button handles it. */

document.addEventListener('click', (event) => {
  if (state.siteIsClosed) return;

  state.clicks++;
  state.idleSeconds = 0;
  if (!state.firstClickAt) state.firstClickAt = Date.now();
  if (state.clicks === 1) unlockAchievement('first');

  sounds.pop();
  if (!prefersReducedMotion) burst(event.clientX, event.clientY, Math.min(2 + state.level, 10));
  trackCombo(event);

  const crackChance = Math.min(0.65, 0.18 + state.level * 0.05);
  if (state.level >= 3 && Math.random() < crackChance) addCrackAt(event.clientX, event.clientY);

  addPoints(1);
  maybeTriggerRandomEvent();
}, true);

/* ======================= WHAT EACH BUTTON DOES ======================= */
/* Buttons in index.html have data-act="name"; the functions are looked up here. */

const ACTIONS = {
  logo() { fakeCloseWebsite(); },                      // the logo closes the site instead of going home

  register() {                                         // "Verify my documents"
    const popup = createPopup('Document verification',
      '<div class="big" id="relaxText">Verifying documents…</div><div class="bar"><i></i></div>', [], { center: true, noHydra: true });
    const text = $('#relaxText', popup);
    runLater(() => { if (text) text.textContent = 'Verifying harder…'; }, 2000);
    runLater(() => { if (text) { text.textContent = 'Verification failed. Now scream. 😱'; sounds.honk(); addPoints(3); } }, 4000);
    runLater(() => closePopup(popup), 5600);
    runProgress(popup, 4000);
  },

  donot() {                                            // "Do Not Click" gives bonus chaos
    addPoints(3);
    sounds.honk();
    toast('Registration cannot be skipped. You skipped it.');
    say('I literally labelled it.', 3000);
    showClicky();
  },

  orb() {                                              // the stress-relief circle
    state.orbPops++;
    const orb = $('#orb');
    orb.classList.remove('popped');
    void orb.offsetWidth;                              // restart the CSS animation
    orb.classList.add('popped');
    sounds.boing();
    if (state.orbPops === 5) { unlockAchievement('bubble'); confetti(70); toast('Deep breather. Respect.'); }
    else toast(pickRandom(BREATHING_TOASTS));
  },

  feat(button) { toast(pickRandom(FEATURE_CARD_TOASTS[Number(button.dataset.i)])); },

  buy() {
    createPopup('Application status', '<div class="big">📄</div><p>Application rejected: your form was eaten by a duck. Please apply again.</p>', [
      { label: 'Apply again', onClick: (popup) => { toast('Form eaten again.'); closePopup(popup); } },
      { label: 'Cry', ghost: true, onClick: (popup) => { sounds.sad(); closePopup(popup); } },
    ]);
  },

  privacy() { toast('We have no privacy policy. We have vibes.'); },
  terms() { showTermsPopup(); },
  help() { showHowItWorksPopup(); },
};

/* Menu links (Home / Features / Pricing / Contact) misbehave too. */
function handleNavClick(link, event) {
  event.preventDefault();
  const target = link.dataset.nav;

  if (target === 'home') {
    if (state.level >= 3) {
      const popup = createPopup('Redirecting…', '<p>Home is a state of mind. Redirecting your mind…</p><div class="bar"><i></i></div>', [], { noHydra: true });
      $('.bar > i', popup).style.width = '88%';
    } else {
      toast('You are already home. You were always home.');
    }
    return;
  }
  if (target === 'contact') {
    createPopup('Contact us', '<p>Our team is on a break. <b>Forever.</b></p><p>Call: 1800-NOT-HERE<br>Email: nobody@nowhere.invalid</p>', [{ label: 'Understood' }]);
    return;
  }

  let sectionId = target; // 'features' or 'pricing'
  if (state.level >= 5 && Math.random() < 0.5) {   // sometimes the menu takes you somewhere else
    sectionId = pickRandom(['top', 'contact', 'features', 'pricing'].filter((id) => id !== sectionId));
    toast('Taking the scenic route.');
  }
  const section = document.getElementById(sectionId);
  if (section) section.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
}

document.addEventListener('click', (event) => {
  if (state.siteIsClosed || !event.target.closest) return;
  const element = event.target.closest('[data-act], [data-nav]');
  if (!element) return;

  if (element.dataset.nav) handleNavClick(element, event);
  else if (ACTIONS[element.dataset.act]) ACTIONS[element.dataset.act](element);
});

/* ======================= HUD BUTTONS ======================= */

/* "Calm Down" lies twice, then really resets (after a breathing animation). */
$('#calmBtn').addEventListener('click', (event) => {
  event.stopPropagation();
  state.calmPresses++;
  unlockAchievement('calm');
  const button = event.currentTarget;

  if (state.calmPresses === 1) {
    addPoints(2);
    sounds.honk();
    toast('Telling a chaotic site to calm down: ❌ rejected. Chaos +2.');
    button.textContent = 'Calm Down (louder)';
  } else if (state.calmPresses === 2) {
    addPoints(2);
    sounds.honk();
    toast('It heard you. It did the opposite.');
    button.textContent = 'CALM DOWN!!!';
    createPopup('Calm Down™', '<p>Calm Down is currently experiencing high anxiety. Please press it once more.</p>', [{ label: 'Fine' }]);
  } else {
    const overlay = document.createElement('div');
    overlay.className = 'full';
    overlay.style.cssText = 'background:#0e2a2e;color:#e6f3f1;font-family:var(--display);font-size:2rem;z-index:99995';
    overlay.textContent = 'Inhale…';
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.textContent = 'Exhale…'; }, 900);
    setTimeout(() => { overlay.remove(); resetEverything(); }, 1900);
  }
});

$('#achBtn').addEventListener('click', (event) => { event.stopPropagation(); showAchievementsPopup(); });

$('#muteBtn').addEventListener('click', (event) => {
  event.stopPropagation();
  state.muted = !state.muted;
  event.currentTarget.textContent = state.muted ? '🔇' : '🔊';
  if (state.muted) toast('Muted. The silence is deafening.');
  else sounds.honk();
});

/* ======================= RIGHT-CLICK, KEYBOARD, IDLE, TAB SWITCH ======================= */

document.addEventListener('contextmenu', (event) => {
  if (event.shiftKey) return;            // Shift + right-click still opens the normal menu (handy for developers)
  event.preventDefault();
  unlockAchievement('rclick');
  addPoints(2);
  state.clicks++;
  sounds.boing();
  toast('💐 ' + pickRandom(COMPLIMENTS));
  updateHud();
});

let konamiProgress = 0;

document.addEventListener('keydown', (event) => {
  // Konami code: +10 chaos.
  if (event.keyCode === KONAMI_KEYCODES[konamiProgress]) {
    konamiProgress++;
    if (konamiProgress === KONAMI_KEYCODES.length) {
      konamiProgress = 0;
      unlockAchievement('konami');
      toast('⬆️⬆️⬇️⬇️ Cheat code accepted. +10 chaos.', true);
      addPoints(10);
    }
  } else {
    konamiProgress = event.keyCode === KONAMI_KEYCODES[0] ? 1 : 0;
  }

  state.idleSeconds = 0;

  if (event.key === 'Escape') {
    clearAllPopups();
    $$('#bsod').forEach((screen) => screen.remove());
    return;
  }

  const isTyping = /input|textarea/i.test(event.target.tagName || '');
  if (isTyping) return;

  // Presenter keys.
  if (event.key === 'R' && event.shiftKey) { resetEverything(); return; }
  if (event.key === '?') { showHowItWorksPopup(); return; }
  if (event.key === ']') { goToLevel(state.level + 1); return; }
  if (event.key === '[') { goToLevel(state.level - 1); return; }

  // From level 2, typing adds a little chaos too.
  if (state.level >= 2 && event.key.length === 1 && Math.random() < 0.12) {
    addPoints(0.5);
    maybeTriggerRandomEvent();
  }
});

/* Idle watcher (a plain setInterval, so "Calm Down" does not cancel it). */
setInterval(() => {
  state.idleSeconds++;

  if (state.idleSeconds === 8 && state.level === 0) {
    unlockAchievement('idle');
    createPopup('Nothing is happening', '<p>You have been very calm for 8 seconds. This is a chaos website. Please click something.</p>', [
      { label: 'Okay okay', onClick: (popup) => { closePopup(popup); addPoints(1); } },
    ], { noHydra: true });
  }

  const idleTooLong = state.idleSeconds >= 10 && state.idleSeconds % 10 === 0;
  if (idleTooLong && state.level >= 1) {
    say('Are you okay? You stopped.');
    showClicky();
    if (!state.siteIsClosed && !state.finaleShown) triggerRandomEvent();
  }
}, 1000);

/* Leaving the tab changes the title. */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.title = '😭 come back';
  else document.title = state.siteIsClosed ? '(Closed)' : 'Chaos Click';
});

$('[data-act="donot"]').addEventListener('pointerover', () => {
  if (state.level >= 1 && Math.random() < 0.3) toast('Don’t.');
});

/* ======================= START ======================= */

if (TEAM_NAME) $('#made').textContent = 'Built at VibeHack ’26 by ' + TEAM_NAME;
initHud();

/* Handy for testing in the browser console: __chaos.goToLevel(7) */
window.__chaos = { goToLevel, setLevel: goToLevel, reset: resetEverything, state };
