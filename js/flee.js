/* ==========================================================================
   flee.js  -  buttons that run away, teleport or fly in circles.

   Mark any element in index.html like this:
     data-flee="shy"       runs away from the mouse, comes back when you leave
     data-flee="teleport"  jumps to a random spot when the mouse gets close
     data-flee="orbit"     circles around its home spot (slows down near the mouse)
     data-flee-min="3"     only starts misbehaving at chaos level 3
     data-tired="6"        gives up after being approached 6 times
   ========================================================================== */

const fleeingElements = [];
const FLEE_RADIUS = 150;        // "shy" buttons notice the mouse inside this distance
const TELEPORT_RADIUS = 120;

function registerFleeingElement(element, mode, minLevel, tiredAfter, isTemporary = false) {
  if (fleeingElements.some((item) => item.element === element)) return;
  fleeingElements.push({
    element, mode, minLevel, tiredAfter, isTemporary,
    offsetX: 0, offsetY: 0,       // how far the button is from its normal spot (CSS translate)
    speedX: 0, speedY: 0,
    mouseIsNear: false,           // so we count each approach only once
    approaches: 0,
    givenUp: false,
    orbitAngle: randomBetween(0, 6),
  });
}

function unregisterFleeingElement(item) {
  item.element.style.translate = '';
  item.element.style.transition = '';
  fleeingElements.splice(fleeingElements.indexOf(item), 1);
}

function removeTemporaryFleeingElements() {
  fleeingElements.slice().forEach((item) => { if (item.isTemporary) unregisterFleeingElement(item); });
}

/* Register everything marked with data-flee in the HTML. */
$$('[data-flee]').forEach((element) => {
  registerFleeingElement(element, element.dataset.flee, Number(element.dataset.fleeMin) || 1, Number(element.dataset.tired) || 6);
});

/* How far can this button move before it leaves the screen? */
function getMoveLimits(item, rect) {
  const homeLeft = rect.left - item.offsetX;
  const homeTop = rect.top - item.offsetY;
  return {
    minX: 8 - homeLeft,
    maxX: innerWidth - rect.width - 8 - homeLeft,
    minY: 70 - homeTop,
    maxY: innerHeight - rect.height - 130 - homeTop,   // keep clear of the HUD
  };
}

let lastFleeFrame = performance.now();

function fleeFrame(now) {
  const dt = Math.min(0.033, (now - lastFleeFrame) / 1000 || 0.016);
  lastFleeFrame = now;

  if (!prefersReducedMotion) {
    for (let i = fleeingElements.length - 1; i >= 0; i--) {
      const item = fleeingElements[i];
      if (!item.element.isConnected) { fleeingElements.splice(i, 1); continue; }

      const isActive = state.level >= item.minLevel && !item.givenUp && !state.siteIsClosed;
      if (isActive) updateActiveFleeingElement(item, dt);
      else relaxFleeingElement(item, dt);
    }
  }
  requestAnimationFrame(fleeFrame);
}

function updateActiveFleeingElement(item, dt) {
  const rect = item.element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const awayX = centerX - mouse.x;           // vector pointing away from the mouse
  const awayY = centerY - mouse.y;
  const distance = Math.hypot(awayX, awayY) || 1;
  const limits = getMoveLimits(item, rect);

  if (item.mode === 'shy') updateShyButton(item, dt, distance, awayX, awayY, centerX, centerY, limits);
  else if (item.mode === 'teleport') updateTeleportButton(item, distance, centerX, centerY, limits);
  else if (item.mode === 'orbit') updateOrbitButton(item, dt, distance);
}

/* "shy": pushed away by the mouse, pulled back home by a spring. */
function updateShyButton(item, dt, distance, awayX, awayY, centerX, centerY, limits) {
  if (distance < FLEE_RADIUS) {
    if (!item.mouseIsNear) {
      item.mouseIsNear = true;
      item.approaches++;
      sounds.boing();
      if (item.approaches > item.tiredAfter) { giveUp(item); return; }
    }
    const push = ((FLEE_RADIUS - distance) / FLEE_RADIUS) * 4200;
    item.speedX += (awayX / distance) * push * dt;
    item.speedY += (awayY / distance) * push * dt;
  } else {
    item.mouseIsNear = false;
    item.speedX += -item.offsetX * 10 * dt;   // spring back toward home
    item.speedY += -item.offsetY * 10 * dt;
  }

  item.speedX *= 1 - 7 * dt;                  // friction
  item.speedY *= 1 - 7 * dt;
  item.offsetX += item.speedX * dt;
  item.offsetY += item.speedY * dt;

  // Stay on screen. If the mouse corners the button against an edge, it teleports away.
  let hitEdge = false;
  if (item.offsetX < limits.minX) { item.offsetX = limits.minX; item.speedX = 0; hitEdge = true; }
  if (item.offsetX > limits.maxX) { item.offsetX = limits.maxX; item.speedX = 0; hitEdge = true; }
  if (item.offsetY < limits.minY) { item.offsetY = limits.minY; item.speedY = 0; hitEdge = true; }
  if (item.offsetY > limits.maxY) { item.offsetY = limits.maxY; item.speedY = 0; hitEdge = true; }
  if (hitEdge && distance < 70) {
    item.offsetX = randomBetween(limits.minX, limits.maxX);
    item.offsetY = randomBetween(limits.minY, limits.maxY);
    burst(centerX, centerY, 5);
  }
  applyOffset(item);
}

/* "teleport": poof, gone, somewhere else. */
function updateTeleportButton(item, distance, centerX, centerY, limits) {
  if (distance < TELEPORT_RADIUS && !item.mouseIsNear) {
    item.mouseIsNear = true;
    item.approaches++;
    if (item.approaches > item.tiredAfter) { giveUp(item); return; }

    burst(centerX, centerY, 8);
    sounds.boing();
    item.element.style.transition = 'translate .12s';
    item.offsetX = randomBetween(limits.minX, limits.maxX);
    item.offsetY = randomBetween(limits.minY, limits.maxY);
    applyOffset(item);
  } else if (distance >= TELEPORT_RADIUS + 40) {
    item.mouseIsNear = false;
  }
}

/* "orbit": flies in a loop. It slows down when the mouse is right on top so you can click it. */
function updateOrbitButton(item, dt, distance) {
  const speed = distance < 70 ? 0.15 : 1.1 + state.level * 0.06;
  item.orbitAngle += dt * speed;
  item.offsetX = Math.cos(item.orbitAngle) * 75;
  item.offsetY = Math.sin(item.orbitAngle * 1.3) * 42;
  applyOffset(item);
}

/* Not active (level too low, or given up): glide back to the normal spot. */
function relaxFleeingElement(item, dt) {
  if (!item.offsetX && !item.offsetY) return;
  item.offsetX *= 1 - 8 * dt;
  item.offsetY *= 1 - 8 * dt;
  if (Math.abs(item.offsetX) < 0.3 && Math.abs(item.offsetY) < 0.3) item.offsetX = item.offsetY = 0;
  applyOffset(item);
}

function applyOffset(item) {
  item.element.style.translate = `${item.offsetX.toFixed(1)}px ${item.offsetY.toFixed(1)}px`;
}

function giveUp(item) {
  item.givenUp = true;
  item.speedX = item.speedY = 0;
  item.offsetX = item.offsetY = 0;
  item.element.style.transition = 'translate .4s';
  item.element.style.translate = '0 0';
  unlockAchievement('caught');
  toast('😮‍💨 It got tired and stopped running.');
  sounds.honk();
  if (item.isTemporary) runLater(() => unregisterFleeingElement(item), 500);
}

/* Called by "Calm Down": everything goes back to normal. */
function resetFleeingElements() {
  fleeingElements.slice().forEach((item) => {
    if (item.isTemporary) { unregisterFleeingElement(item); return; }
    Object.assign(item, { givenUp: false, approaches: 0, mouseIsNear: false, offsetX: 0, offsetY: 0, speedX: 0, speedY: 0 });
    item.element.style.translate = '';
    item.element.style.transition = '';
  });
}

requestAnimationFrame(fleeFrame);
