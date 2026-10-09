/* ==========================================================================
   popups.js  -  the popup window system, the 20 funny popups,
   and "dodge" buttons that jump away when you hover them.
   ========================================================================== */

const MAX_POPUPS_ON_SCREEN = 7;
let topZIndex = 9500;     // each popup you touch comes to the front
let uniqueCounter = 0;
const uniqueId = (prefix) => `${prefix}${++uniqueCounter}`;

/* ---------- Basic popup functions ---------- */

function closePopup(popup) {
  if (popup && popup.parentNode) {
    popup.remove();
    state.popupCount = Math.max(0, state.popupCount - 1);
  }
}

function clearAllPopups() {
  $$('.pop').forEach((popup) => popup.remove());
  state.popupCount = 0;
}

/* Build a popup window.
   buttons: [{ label, onClick(popup, button), ghost, runsAway, giveUpLabel }]
   options: { className, center, noHydra }  (noHydra = closing it never spawns more popups) */
function createPopup(title, bodyHtml, buttons = [], options = {}) {
  // Too many popups? Remove the oldest one.
  const existing = $$('.pop');
  if (existing.length >= MAX_POPUPS_ON_SCREEN) closePopup(existing[0]);

  const popup = document.createElement('div');
  popup.className = 'pop' + (options.className ? ' ' + options.className : '');
  popup.setAttribute('role', 'dialog');
  popup.innerHTML = `
    <header style="display:flex;justify-content:space-between;align-items:center">
      <b></b><button class="x" type="button" aria-label="Close">×</button>
    </header>
    <div class="bd">${bodyHtml}</div>
    <div class="acts"></div>`;
  $('b', popup).textContent = title;

  addPopupButtons($('.acts', popup), buttons, popup);
  if (buttons.length === 0) $('.acts', popup).remove();

  placePopup(popup, options);
  popup.style.zIndex = ++topZIndex;
  document.body.appendChild(popup);
  state.popupCount++;

  setupCloseButton(popup, options);
  makePopupDraggable(popup);
  return popup;
}

function addPopupButtons(container, buttons, popup) {
  buttons.forEach((spec) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small' + (spec.ghost ? ' ghost' : '') + (spec.runsAway ? ' runaway' : '');
    button.textContent = spec.label;
    if (spec.runsAway) button.dataset.giveup = spec.giveUpLabel || 'Fine. You win.';
    button.addEventListener('click', () => {
      if (spec.onClick) spec.onClick(popup, button);
      else closePopup(popup);
    });
    container.appendChild(button);
  });
}

function placePopup(popup, options) {
  const width = Math.min(options.className === 'terms' ? 520 : 330, innerWidth - 24);
  let left = randomBetween(8, Math.max(9, innerWidth - width - 8));
  let top = randomBetween(64, Math.max(65, innerHeight - 360));
  if (options.center) {
    left = (innerWidth - width) / 2;
    top = Math.max(70, innerHeight / 2 - 190);
  }
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

/* The × button: sometimes closing a popup spawns two more ("hydra").
   From level 4 the × can also hop away when you hover it. */
function setupCloseButton(popup, options) {
  const closeButton = $('.x', popup);

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    state.popupsClosed++;
    if (state.popupsClosed >= 6) unlockAchievement('hydra');

    const hydraChance = Math.min(0.55, 0.15 + state.level * 0.06);
    const spawnsMore = !options.noHydra && state.level >= 2 && Math.random() < hydraChance && state.popupCount < 6;
    closePopup(popup);

    if (spawnsMore) {
      toast('You closed one. Two more heard about it.');
      runLater(showRandomPopup, 150);
      runLater(showRandomPopup, 450);
    }
  });

  if (state.level >= 4 && !options.noHydra) {
    closeButton.addEventListener('pointerover', () => {
      if (closeButton.dataset.moved || Math.random() >= 0.5) return;
      closeButton.dataset.moved = 1;
      closeButton.style.translate = pickRandom(['-290px 0', '0 120px', '-120px 60px']);
    });
  }
}

function makePopupDraggable(popup) {
  const header = $('header', popup);
  const closeButton = $('.x', popup);
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('pointerdown', (event) => {
    if (event.target === closeButton) return;
    isDragging = true;
    offsetX = event.clientX - popup.offsetLeft;
    offsetY = event.clientY - popup.offsetTop;
    popup.style.zIndex = ++topZIndex;
    header.setPointerCapture(event.pointerId);
  });
  header.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    popup.style.left = (event.clientX - offsetX) + 'px';
    popup.style.top = (event.clientY - offsetY) + 'px';
  });
  header.addEventListener('pointerup', () => { isDragging = false; });
  popup.addEventListener('pointerdown', () => { popup.style.zIndex = ++topZIndex; });
}

/* Replace what is inside a popup (used when a button click changes the popup). */
function setPopupBody(popup, bodyHtml, buttons = [{ label: 'OK' }]) {
  $('.bd', popup).innerHTML = bodyHtml;
  const actions = $('.acts', popup);
  if (!actions) return;
  actions.innerHTML = '';
  addPopupButtons(actions, buttons, popup);
}

/* Fill the progress bar inside a popup over `milliseconds`, then call onDone. */
function runProgress(popup, milliseconds, onDone) {
  const fill = $('.bar > i', popup);
  const startedAt = Date.now();
  const interval = setInterval(() => {
    if (!popup.parentNode) { clearInterval(interval); return; }
    const done = Math.min(1, (Date.now() - startedAt) / milliseconds);
    fill.style.width = (done * 100) + '%';
    if (done >= 1) { clearInterval(interval); if (onDone) onDone(); }
  }, 80);
}

/* ======================= THE 20 POPUPS ======================= */
/* Each entry: the lowest chaos level it can appear at, and a function that shows it. */

const POPUP_CATALOG = [
  { minLevel: 0, show: showWinnerPopup },
  { minLevel: 0, show: showCommitteePopup },
  { minLevel: 0, show: showCookiePopup },
  { minLevel: 0, show: showRobotCheckPopup },
  { minLevel: 0, show: showRamDownloadPopup },
  { minLevel: 1, show: showUpdatePopup },
  { minLevel: 0, show: showRatingPopup },
  { minLevel: 1, show: showSpeedWarningPopup },
  { minLevel: 0, show: showMomCallingPopup },
  { minLevel: 0, show: showWifiPopup },
  { minLevel: 1, show: showCoolThingPopup },
  { minLevel: 0, show: showJudgesPopup },
  { minLevel: 1, show: showTrialExpiredPopup },
  { minLevel: 1, show: showTechSupportPopup },
  { minLevel: 2, show: showVibesCaptchaPopup },
  { minLevel: 1, show: showSponsoredPopup },
  { minLevel: 1, show: showSurveyPopup },
  { minLevel: 2, show: showTypeToContinuePopup },
  { minLevel: 2, show: showBatteryPopup },
  { minLevel: 3, show: showApologyPopup },
];

function showRandomPopup() {
  if (state.popupCount >= 6) return;
  const options = POPUP_CATALOG.filter((entry) => entry.minLevel <= state.level);
  try { pickRandom(options).show(); } catch (error) { /* a broken popup must never break the page */ }
}

function showWinnerPopup() {
  createPopup('🎉 WINNER!', '<div class="big">🎊</div><p>You are our <b>1,000,000th</b> visitor! (We say this to everyone.)</p>', [
    { label: 'Claim prize', onClick: (popup) => setPopupBody(popup, '<div class="big">🖐️</div><p>Your prize: one (1) high five. Please hold your hand up and wait.</p>', [{ label: 'Okay…' }]) },
    { label: 'Decline', ghost: true, runsAway: true, giveUpLabel: 'Fine, decline.' },
  ]);
}

function showCommitteePopup() {
  createPopup('Click review', '<p>Your click has been reviewed by a committee of three ducks.</p><p><b>Verdict: Mid.</b></p>', [
    { label: 'Appeal', onClick: (popup) => { toast('Appeal denied. Ducks are final.'); closePopup(popup); } },
    { label: 'Accept', ghost: true },
  ]);
}

function showCookiePopup() {
  const acceptCookies = (popup) => { unlockAchievement('cookie'); toast('🍪 Thank you. We will be waiting.'); closePopup(popup); };
  createPopup('🍪 Cookies', '<p>We use cookies. Not the digital kind. Please mail real cookies to Room 404, Hostel 3.</p>', [
    { label: 'Accept', ghost: true, onClick: acceptCookies },
    { label: 'Accept', ghost: true, onClick: acceptCookies },
    { label: 'Accept all', onClick: acceptCookies },
  ]);
}

function showRobotCheckPopup() {
  const checkboxId = uniqueId('robot');
  const popup = createPopup('Human check',
    `<label style="display:flex;gap:10px;align-items:center;font-weight:700"><input type="checkbox" id="${checkboxId}" style="width:22px;height:22px"> I am not a robot</label>
     <p class="msg" style="color:var(--muted)">Beep boop. Totally legit.</p>`, [{ label: 'Verify' }]);
  $('input', popup).addEventListener('change', () => {
    $('.msg', popup).textContent = 'Suspicious. A human would have clicked slower.';
    sounds.sad();
  });
}

function showRamDownloadPopup() {
  createPopup('Download more RAM', '<p>Your RAM is looking a bit small.</p><div class="bar"><i></i></div>', [{
    label: 'Download RAM',
    onClick: (popup, button) => {
      button.disabled = true;
      button.textContent = 'Downloading…';
      runProgress(popup, 2400, () => setPopupBody(popup, '<div class="big">💾</div><p>Done! You now have <b>4 TB</b> of RAM. (Placebo.)</p>', [{ label: 'Wow' }]));
    },
  }]);
}

function showUpdatePopup() {
  createPopup('Update available', '<p><b>Chaos 2.0</b> is ready. It fixes 3 bugs and adds 40.</p>', [
    { label: 'Update later', onClick: (popup, button) => {
        button.textContent = 'Update now';
        button.onclick = () => { toast('Updating…'); closePopup(popup); };
    } },
    { label: 'Update never', ghost: true, onClick: (popup) => { toast('Updating anyway 😈'); closePopup(popup); } },
  ]);
}

function showRatingPopup() {
  const popup = createPopup('Rate this click', '<div class="stars"></div><p style="text-align:center;color:var(--muted)">Be honest.</p>');
  const stars = $('.stars', popup);
  for (let rating = 1; rating <= 5; rating++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.textContent = '⭐';
    star.setAttribute('aria-label', rating + ' stars');
    star.onclick = () => setPopupBody(popup, '<div class="big">⭐⭐⭐</div><p>We averaged your rating with our feelings. Final: <b>3 stars</b>.</p>', [{ label: 'Fair' }]);
    stars.appendChild(star);
  }
}

function showSpeedWarningPopup() {
  createPopup('⚠️ Speed warning', '<p>Your clicking speed is <b>3% above the legal limit</b>. A fine of ₹0.00 has been issued.</p>', [
    { label: 'Pay fine', onClick: (popup) => { toast('Payment received: 0 rupees. Thanks!'); closePopup(popup); } },
    { label: 'Dispute', ghost: true, runsAway: true, giveUpLabel: 'Dispute… accepted?' },
  ]);
}

function showMomCallingPopup() {
  createPopup('📞 Mom is calling', '<div class="big">👩</div><p>Incoming call…</p>', [
    { label: 'Answer', onClick: (popup) => setPopupBody(popup, '<p>Mom says: come home. Also, she saw your browser history.</p>', [{ label: 'Hang up' }]) },
    { label: 'Decline', ghost: true, onClick: (popup) => { toast('She will call again.'); closePopup(popup); } },
  ]);
}

function showWifiPopup() {
  createPopup('Wi-Fi password', '<p>The hostel Wi-Fi password is <b>hunter2</b>. Please do not tell anyone.</p>', [
    { label: 'Copied', onClick: (popup) => { toast('Copied nothing. Trust us.'); closePopup(popup); } },
  ]);
}

function showCoolThingPopup() {
  createPopup('Want to see something cool?', '<p>It is really cool. Probably.</p>', [
    { label: 'Yes', onClick: (popup) => {
        setPopupBody(popup, '<div class="big"><span class="spin">🐟</span></div><p style="text-align:center">Behold. A fish.</p>', [{ label: 'Amazing' }]);
        sounds.boing();
    } },
    { label: 'No', ghost: true, runsAway: true, giveUpLabel: '…fine, no.' },
  ]);
}

function showJudgesPopup() {
  createPopup('👀 Heads up', '<p>The judges are watching. <b>Act natural.</b></p>', [
    { label: 'Act natural', onClick: (popup) => { toast('That was not natural.'); closePopup(popup); } },
  ]);
}

function showTrialExpiredPopup() {
  createPopup('Trial expired', '<p>Your library card has expired. Upgrade to <b>Mild Panic™</b> for ₹0 (billed monthly).</p>', [
    { label: 'Upgrade', onClick: (popup) => { toast('Upgraded! Anxiety +40%'); closePopup(popup); } },
    { label: 'Cancel', ghost: true, onClick: (popup) => { toast('Cancelled. Re-subscribed automatically.'); closePopup(popup); } },
  ]);
}

function showTechSupportPopup() {
  createPopup('Tech support', '<p>Have you tried turning the website off and on again?</p>', [
    { label: 'Yes, let me', onClick: (popup) => { closePopup(popup); fakeCloseWebsite(); } },
    { label: 'No', ghost: true, onClick: (popup) => { toast('Respect.'); closePopup(popup); } },
  ]);
}

function showVibesCaptchaPopup() {
  const emojis = ['🌮', '🪴', '🧦', '🦆', '🪑', '🥔', '🧃', '🛴', '🍌'];
  const popup = createPopup('Prove you are human', '<p>Select all squares with <b>good vibes</b>.</p><div class="tiles"></div>', [{
    label: 'Verify',
    onClick: (popup) => {
      toast('Vibes not detected. Try again.');
      sounds.sad();
      $$('.tiles button', popup).forEach((tile) => { tile.classList.remove('sel'); tile.textContent = pickRandom(emojis); });
    },
  }]);
  const grid = $('.tiles', popup);
  emojis.forEach((emoji) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.textContent = emoji;
    tile.onclick = () => tile.classList.toggle('sel');
    grid.appendChild(tile);
  });
}

function showSponsoredPopup() {
  createPopup('Sponsored', '<p>This popup is sponsored by <b>your own decisions</b>.</p>', [{ label: 'Fair enough' }]);
}

function showSurveyPopup() {
  createPopup('Quick survey',
    `<p>How likely are you to recommend this popup to a friend?</p><input type="range" min="0" max="10" value="5" id="${uniqueId('survey')}">`, [{
      label: 'Submit',
      onClick: (popup) => setPopupBody(popup, '<p>Thanks! We are ignoring your answer.</p>', [{ label: 'Cool' }]),
    }]);
}

function showTypeToContinuePopup() {
  createPopup('Type to continue',
    `<p>Type "I am not a robot" in any language except English.</p>
     <input type="text" id="${uniqueId('type')}" style="padding:8px;border:2px solid var(--ink);border-radius:8px;background:var(--bg)">`, [{
      label: 'Submit',
      onClick: (popup) => { toast('Close enough.'); closePopup(popup); },
    }]);
}

function showBatteryPopup() {
  createPopup('🔋 Low chaos battery', '<p>Chaos battery at <b>1%</b>. Please click faster to recharge.</p>', [{
    label: 'Click faster',
    onClick: (popup) => { toast('Recharging… (not really)'); addPoints(1); closePopup(popup); },
  }]);
}

function showApologyPopup() {
  createPopup('We are sorry', '<p>We apologise for any inconvenience. Anyway.</p>', [{ label: 'Anyway' }]);
}

/* ======================= DODGE BUTTONS ======================= */
/* Buttons with class "runaway" jump to a random spot each time the mouse touches them.
   After 6 dodges they give up. (flee.js has the smooth, physics-based version.) */

const MAX_DODGES = 6;

document.addEventListener('pointerover', (event) => {
  const button = event.target.closest && event.target.closest('.runaway');
  if (!button || button.dataset.done) return;

  const dodges = Number(button.dataset.n) || 0;
  if (dodges >= MAX_DODGES) {
    button.dataset.done = 1;
    button.style.translate = '0 0';
    button.textContent = button.dataset.giveup || 'Fine. You win.';
    unlockAchievement('caught');
    toast('It got tired and gave up.');
    return;
  }

  button.dataset.n = dodges + 1;
  sounds.boing();
  jumpToRandomSpot(button);
});

function jumpToRandomSpot(button) {
  const rect = button.getBoundingClientRect();
  const currentX = Number(button.dataset.tx) || 0;
  const currentY = Number(button.dataset.ty) || 0;
  const homeX = rect.left - currentX;   // where the button sits without any offset
  const homeY = rect.top - currentY;

  const minX = 8 - homeX;
  const maxX = innerWidth - rect.width - 8 - homeX;
  const minY = 70 - homeY;
  const maxY = innerHeight - rect.height - 90 - homeY;

  let newX = Math.max(minX, Math.min(maxX, currentX + randomBetween(-170, 170)));
  const newY = Math.max(minY, Math.min(maxY, currentY + randomBetween(-90, 90)));
  if (Math.abs(newX - currentX) < 60) {   // moved too little? go the other way
    newX = Math.max(minX, Math.min(maxX, currentX + (currentX > 0 ? -140 : 140)));
  }

  button.dataset.tx = newX;
  button.dataset.ty = newY;
  button.style.transition = 'translate .25s cubic-bezier(.3,1.6,.5,1)';
  button.style.translate = `${newX}px ${newY}px`;
}
