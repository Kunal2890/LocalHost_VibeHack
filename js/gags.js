/* ==========================================================================
   gags.js  -  the big full-screen jokes:
   fake "website closed", blue screen, fake loading, flashlight, bees,
   and the bouncing logo.
   ========================================================================== */

/* ---------- Clicking the logo "closes" the website (then reopens it) ---------- */
function fakeCloseWebsite() {
  if (state.siteIsClosed) return;
  state.siteIsClosed = true;
  state.fakeCloseCount++;
  unlockAchievement('leave');

  const screen = document.createElement('div');
  screen.id = 'bye';
  screen.className = 'full';
  document.body.appendChild(screen);
  document.title = '(Closed)';

  const messages = chooseCloseMessages(state.fakeCloseCount); // [text, delay in ms]
  const lines = document.createElement('div');
  lines.style.cssText = 'max-width:520px;line-height:1.7';
  screen.appendChild(lines);

  messages.forEach(([text, delay]) => {
    runLater(() => {
      const line = document.createElement('div');
      line.textContent = '> ' + text;
      lines.appendChild(line);
      sounds.sad();
    }, delay);
  });

  const lastDelay = messages[messages.length - 1][1];
  runLater(() => {
    screen.remove();
    state.siteIsClosed = false;
    document.title = 'Chaos Click';
    toast('We are back. You cannot escape.');
    sounds.levelUp();
  }, lastDelay + 900);
}

/* The more times you try to leave, the more dramatic it gets. */
function chooseCloseMessages(timesClosed) {
  if (timesClosed === 1) {
    return [['Closing website…', 0], ['Saving your clicks…', 1100], ['Deleting your clicks…', 2200], ['…just kidding. Reopening.', 3300]];
  }
  if (timesClosed === 2) {
    return [['Closing again? Really?', 0], ['We already told you. It is not that easy.', 1200], ['Reopening.', 2600]];
  }
  return [['This website is now closed.', 0], ['Please enjoy the darkness.', 1500], ['(It was never closed.)', 3000], ['Reopening.', 4200]];
}

/* ---------- Fake blue screen of death ---------- */
function showBlueScreen() {
  if ($('#bsod')) return;

  const screen = document.createElement('div');
  screen.id = 'bsod';
  screen.className = 'full';
  screen.innerHTML = `<div><h4>:(</h4>
    <p>Your website ran into a problem and needs to restart. We are just collecting some error info.</p>
    <p><b id="bsodPercent">0%</b> complete</p>
    <p style="opacity:.8">Stop code: CHAOS_OVERFLOW<br>What failed: too_many_clicks.sys</p></div>`;
  document.body.appendChild(screen);
  sounds.sad();

  let percent = 0;
  const interval = setInterval(() => {
    percent = Math.min(100, percent + randomInt(7, 19));
    const label = $('#bsodPercent');
    if (label) label.textContent = percent + '%';
    if (percent >= 100) {
      clearInterval(interval);
      runLater(() => { screen.remove(); toast('Restarted. Somehow worse.'); }, 500);
    }
  }, 350);
}

/* ---------- A loading bar that gets stuck at 99% ---------- */
function showFakeLoading() {
  const popup = createPopup('Loading chaos…',
    '<div class="bar"><i></i></div><p class="msg" style="text-align:center">Loading…</p>', [], { center: true, noHydra: true });
  const fill = $('.bar > i', popup);
  const message = $('.msg', popup);

  fill.style.transition = 'width 2s';
  fill.style.width = '99%';
  runLater(() => { if (message) message.textContent = 'Stuck at 99%. As is tradition.'; }, 2400);
  runLater(() => { if (message) message.textContent = '100% of nothing loaded.'; fill.style.width = '100%'; }, 3800);
  runLater(() => closePopup(popup), 5000);
}

/* ---------- Lights out: only a circle around your mouse is visible ---------- */
function startFlashlight(milliseconds = 6000) {
  if ($('#dark')) return;
  const darkness = document.createElement('div');
  darkness.id = 'dark';
  document.body.appendChild(darkness);
  toast('🔦 The lights went out. Use your mouse.');

  const followMouse = () => {
    darkness.style.setProperty('--mx', mouse.x + 'px');
    darkness.style.setProperty('--my', mouse.y + 'px');
  };
  followMouse();
  const interval = setInterval(followMouse, 30);
  runLater(() => { clearInterval(interval); darkness.remove(); }, milliseconds);
}

/* ---------- Bees that chase your cursor ---------- */
function startBeeSwarm(milliseconds = 7000) {
  if (prefersReducedMotion) return;
  toast('🐝 Bees are following you.');

  const bees = [];
  for (let i = 0; i < 8; i++) {
    const element = document.createElement('span');
    element.className = 'fl';
    element.textContent = '🐝';
    element.style.fontSize = '26px';
    document.body.appendChild(element);
    bees.push({
      element,
      x: randomBetween(0, innerWidth),
      y: randomBetween(0, innerHeight),
      speed: randomBetween(0.04, 0.12),
      phase: randomBetween(0, 6),
    });
  }

  const startedAt = Date.now();
  let running = true;
  (function animate() {
    if (!running) return;
    const time = (Date.now() - startedAt) / 300;
    bees.forEach((bee) => {
      // Move a fraction of the way toward the mouse, plus a little circling.
      bee.x += (mouse.x + Math.cos(time + bee.phase) * 50 - bee.x) * bee.speed;
      bee.y += (mouse.y + Math.sin(time * 1.3 + bee.phase) * 40 - bee.y) * bee.speed;
      bee.element.style.transform = `translate(${bee.x}px, ${bee.y}px)`;
    });
    requestAnimationFrame(animate);
  })();

  runLater(() => { running = false; bees.forEach((bee) => bee.element.remove()); }, milliseconds);
}

/* ---------- Bouncing logo (like the old DVD screensaver). Hit a corner = confetti ---------- */
const bouncingLogo = { running: false, x: 40, y: 100, vx: 2.4, vy: 2 };

function startBouncingLogo() {
  if (bouncingLogo.running || prefersReducedMotion) return;
  bouncingLogo.running = true;

  const element = $('#dvd');
  element.style.display = 'block';

  (function animate() {
    if (!bouncingLogo.running) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    let wallsHit = 0;

    bouncingLogo.x += bouncingLogo.vx;
    bouncingLogo.y += bouncingLogo.vy;

    if (bouncingLogo.x <= 0 || bouncingLogo.x + width >= innerWidth) {
      bouncingLogo.vx *= -1;
      bouncingLogo.x = Math.max(0, Math.min(innerWidth - width, bouncingLogo.x));
      wallsHit++;
    }
    if (bouncingLogo.y <= 0 || bouncingLogo.y + height >= innerHeight) {
      bouncingLogo.vy *= -1;
      bouncingLogo.y = Math.max(0, Math.min(innerHeight - height, bouncingLogo.y));
      wallsHit++;
    }
    if (wallsHit === 2) { // two walls at once = a corner
      confetti(80);
      toast('🎯 PERFECT CORNER!', true);
      addPoints(3);
    }

    element.style.transform = `translate(${bouncingLogo.x}px, ${bouncingLogo.y}px)`;
    requestAnimationFrame(animate);
  })();
}

function stopBouncingLogo() {
  bouncingLogo.running = false;
  $('#dvd').style.display = 'none';
}
