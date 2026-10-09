/* ==========================================================================
   utils.js  -  tiny helpers and the shared game state.
   Everything else reads/writes the `state` object defined here.
   ========================================================================== */

/* ---------- DOM shortcuts ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/* ---------- Random helpers ---------- */
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomBetween(min, max + 1));
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const shuffled = (list) => [...list].sort(() => Math.random() - 0.5);

/* ---------- Accessibility: people who asked for less motion get fewer animations ---------- */
const prefersReducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) document.body.classList.add('rm');

/* ---------- localStorage that never crashes (private windows can block it) ---------- */
function readStorage(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
}

/* ---------- Mouse position (used by shards, flashlight, bees, fleeing buttons) ---------- */
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
window.addEventListener('pointermove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  state.idleSeconds = 0;
}, { passive: true });

/* ---------- Timers we can cancel all at once when the user presses "Calm Down" ---------- */
const activeTimers = [];
function repeatEvery(callback, milliseconds) {
  const id = setInterval(callback, milliseconds);
  activeTimers.push(id);
  return id;
}
function runLater(callback, milliseconds) {
  const id = setTimeout(callback, milliseconds);
  activeTimers.push(id);
  return id;
}
function cancelAllTimers() {
  activeTimers.forEach((id) => { clearInterval(id); clearTimeout(id); });
  activeTimers.length = 0;
}

/* ---------- Shared game state ---------- */
const state = {
  points: 0,            // chaos points (clicks add 1, bonuses add more)
  clicks: 0,            // raw click count for the HUD
  level: 0,             // 0..10, derived from points
  popupCount: 0,        // popups currently on screen
  popupsClosed: 0,      // how many popups the user closed (for the Hydra secret)
  calmPresses: 0,       // times the "Calm Down" button was pressed
  fakeCloseCount: 0,    // times the logo "closed" the website
  orbPops: 0,           // times the breathing circle was clicked
  muted: false,
  endless: false,       // true after "Keep going" on the certificate
  idleSeconds: 0,       // seconds since the user last did anything
  firstClickAt: null,   // timestamp of the first click (for the certificate)
  siteIsClosed: false,  // true while the fake "website closed" screen is showing
  scrollFlipped: false, // true while scrolling is reversed
  finaleShown: false,   // true while the certificate is on screen
};

/* Reset the parts of the state that belong to one "run" of chaos. */
function resetRunState() {
  Object.assign(state, {
    points: 0, clicks: 0, level: 0, popupCount: 0, popupsClosed: 0, calmPresses: 0,
    orbPops: 0, endless: false, firstClickAt: null, siteIsClosed: false,
    scrollFlipped: false, finaleShown: false,
  });
}
