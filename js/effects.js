/* ==========================================================================
   effects.js  -  small visual effects: toasts, emoji bursts, confetti, ducks,
   and the "whole page" tricks (invert, zoom, gravity, shuffled labels...).
   ========================================================================== */

/* ---------- Toast: a short message at the top of the screen ---------- */
function toast(message, isGold = false) {
  const container = $('#toasts');
  while (container.children.length >= 3) container.removeChild(container.firstChild); // max 3 at once

  const element = document.createElement('div');
  element.className = 'toast' + (isGold ? ' gold' : '');
  element.textContent = message;
  container.appendChild(element);

  const visibleFor = isGold ? 3600 : 2800;
  setTimeout(() => {
    element.style.transition = '.4s';
    element.style.opacity = 0;
    element.style.transform = 'translateY(-20px)';
    setTimeout(() => element.remove(), 420);
  }, visibleFor);
}

/* ---------- One emoji (or text) that flies away and fades ---------- */
function flyEmoji(text, x, y, options = {}) {
  const element = document.createElement('span');
  element.className = 'fl' + (options.className ? ' ' + options.className : '');
  element.textContent = text;
  element.style.left = x + 'px';
  element.style.top = y + 'px';
  element.style.fontSize = (options.size || 24) + 'px';
  document.body.appendChild(element);

  const moveX = options.dx !== undefined ? options.dx : randomBetween(-90, 90);
  const moveY = options.dy !== undefined ? options.dy : randomBetween(-120, -30);
  const animation = element.animate([
    { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
    { transform: `translate(${moveX}px, ${moveY}px) rotate(${randomBetween(-300, 300)}deg) scale(${options.endScale || 0.5})`, opacity: 0 },
  ], {
    duration: options.duration || randomBetween(700, 1200),
    easing: options.easing || 'cubic-bezier(.2,.7,.4,1)',
  });
  animation.onfinish = () => element.remove();
}

/* Several flying emojis from one point (used on every click). */
function burst(x, y, count) {
  for (let i = 0; i < count; i++) {
    flyEmoji(pickRandom(BURST_EMOJIS), x, y, { size: randomInt(18, 34) });
  }
}

/* ---------- Confetti: coloured rectangles falling from the top ---------- */
function confetti(count = 70) {
  if (prefersReducedMotion) return;
  const colours = ['#ff5a3c', '#ffd23f', '#1f8a7e', '#4fd1c0', '#a96bff', '#ff77c8'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'fl';
    piece.style.left = randomBetween(0, innerWidth) + 'px';
    piece.style.top = '-20px';
    piece.style.width = randomInt(6, 12) + 'px';
    piece.style.height = randomInt(8, 16) + 'px';
    piece.style.background = pickRandom(colours);
    document.body.appendChild(piece);

    const animation = piece.animate([
      { transform: 'translateY(0) rotate(0)' },
      { transform: `translate(${randomBetween(-120, 120)}px, ${innerHeight + 40}px) rotate(${randomBetween(200, 900)}deg)` },
    ], { duration: randomBetween(1600, 3200), delay: randomBetween(0, 500), easing: 'ease-in', fill: 'backwards' });
    animation.onfinish = () => piece.remove();
  }
}

/* ---------- Falling ducks. Each duck is a button you can click for +1 chaos ---------- */
function duckRain(count = 14) {
  if (prefersReducedMotion) return;

  for (let i = 0; i < count; i++) {
    const duck = document.createElement('button');
    duck.className = 'duck';
    duck.type = 'button';
    duck.setAttribute('aria-label', 'duck');
    duck.textContent = pickRandom(['🦆', '🦆', '🦆', '🐥']);
    duck.style.left = randomBetween(0, innerWidth - 40) + 'px';
    duck.style.top = '-50px';
    document.body.appendChild(duck);

    const animation = duck.animate([
      { transform: 'translateY(0) rotate(0)' },
      { transform: `translateY(${innerHeight + 80}px) rotate(${randomBetween(-360, 360)}deg)` },
    ], { duration: randomBetween(2200, 4200), delay: randomBetween(0, 1200), easing: 'cubic-bezier(.4,0,.9,.6)', fill: 'backwards' });
    animation.onfinish = () => duck.remove();

    duck.addEventListener('click', (event) => {
      event.stopPropagation();
      sounds.honk();
      toast('QUACK! +1 chaos');
      addPoints(1);
      unlockAchievement('duck');
      burst(event.clientX, event.clientY, 6);
      duck.remove();
    });
  }
}

/* ---------- Shake the whole page for a moment ---------- */
function shakeScreen(milliseconds, strength) {
  if (prefersReducedMotion) return;
  const frames = [];
  for (let i = 0; i < 9; i++) {
    frames.push({ translate: `${randomBetween(-strength, strength)}px ${randomBetween(-strength, strength)}px` });
  }
  frames.push({ translate: '0 0' });
  try { $('#stage').animate(frames, { duration: milliseconds || 400, easing: 'linear' }); } catch (error) { /* old browser */ }
}

/* ======================= WHOLE-PAGE TRICKS ======================= */

/* The page text has three versions: calm (default), level 4+, level 8+.
   Elements store them in data-calm / data-c4 / data-c8 attributes in index.html. */
function applyPageCopy() {
  $$('[data-calm]').forEach((element) => {
    let text = element.dataset.calm;
    if (state.level >= 8 && element.dataset.c8) text = element.dataset.c8;
    else if (state.level >= 4 && element.dataset.c4) text = element.dataset.c4;
    if (element.textContent !== text) element.textContent = text;
  });
}

function invertColours(milliseconds = 1800) {
  $('#stage').classList.add('inv');
  runLater(() => $('#stage').classList.remove('inv'), milliseconds);
}

function zoomPage() {
  const stage = $('#stage');
  stage.style.transition = 'transform 1.2s';
  stage.style.transformOrigin = '50% 20%';
  stage.style.transform = 'scale(1.25)';
  runLater(() => { stage.style.transform = 'scale(.85)'; }, 1300);
  runLater(() => { stage.style.transform = ''; }, 2800);
}

function rainbowHeadings() {
  $$('#site h1, #site h2').forEach((heading) => heading.classList.add('rain'));
  runLater(() => $$('.rain').forEach((heading) => heading.classList.remove('rain')), 6000);
}

/* Scrolling goes backwards for a while. The wheel listener below does the flipping. */
function flipScroll(milliseconds = 9000) {
  state.scrollFlipped = true;
  toast('↕️ Scrolling is now backwards.');
  runLater(() => {
    state.scrollFlipped = false;
    toast('Scrolling restored. You are welcome.');
  }, milliseconds);
}
window.addEventListener('wheel', (event) => {
  if (!state.scrollFlipped) return;
  event.preventDefault();
  window.scrollBy(0, -event.deltaY);
}, { passive: false });

/* Cards fall to the bottom of the screen, then spring back. */
function dropCardsWithGravity() {
  toast('Gravity turned on.');
  const cards = $$('#site .card');

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const dropDistance = innerHeight - rect.bottom - 10;
    if (dropDistance < 20 || rect.top > innerHeight) return; // already at the bottom or off screen
    card.style.transition = 'translate 1s cubic-bezier(.5,0,1,.6)';
    card.style.translate = `${randomBetween(-30, 30)}px ${dropDistance}px`;
  });

  runLater(() => {
    cards.forEach((card) => {
      card.style.transition = 'translate .8s cubic-bezier(.3,1.5,.5,1)';
      card.style.translate = '0 0';
    });
  }, 3200);
}

/* Button labels swap places with each other for a few seconds. */
function shuffleButtonLabels(milliseconds = 6000) {
  const buttons = $$('#site button[data-calm], #site .btn[data-calm]');
  const labels = shuffled(buttons.map((button) => button.textContent));
  buttons.forEach((button, index) => { button.textContent = labels[index]; });
  toast('Buttons swapped places. Good luck.');
  runLater(applyPageCopy, milliseconds);
}

/* Menu links get silly names. */
function shuffleNavLabels() {
  $$('nav a').forEach((link) => { link.textContent = pickRandom(FAKE_NAV_LABELS); });
  runLater(applyPageCopy, 7000);
}

/* Headings, paragraphs and so on get translated into nonsense languages. */
function translatePage(language, milliseconds = 7000) {
  toast(`🌐 Translating to ${language}…`);

  $$('#site h1, #site h2, #site .lede').forEach((element) => {
    const words = element.textContent.split(' ');
    const translated = words.map((word) => {
      if (language === 'duck') return Math.random() < 0.8 ? 'quack' : word;
      if (language === 'emoji') return pickRandom(['🦆', '🔥', '🫠', '🍕', '✨', '🌈', '👀']);
      if (language === 'shout') return word.toUpperCase() + '!';
      return Math.random() < 0.35 ? 'arr' : word; // pirate
    });
    element.textContent = translated.join(' ') + (language === 'pirate' ? ' ☠️' : '');
  });

  runLater(() => { applyPageCopy(); toast('Translation expired.'); }, milliseconds);
}

/* Every few clicks, make several buttons panic (see flee.js). */
function makeAllButtonsPanic() {
  toast('😱 All the buttons are scared of you.');
  $$('#site .btn:not([data-flee]):not(.runaway)').forEach((button) => {
    registerFleeingElement(button, 'shy', 0, 3, true);
  });
  runLater(() => removeTemporaryFleeingElements(), 7000);
}
