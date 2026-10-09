/* ==========================================================================
   canvas-fx.js  -  the two full-screen canvases:
     #cracks  -> white crack lines drawn where you click
     #debris  -> triangle shards with simple physics (gravity, bounce, mouse push)
   Shards are used by the photo upload and by the level-10 screen break.
   ========================================================================== */

const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
const debrisCanvas = $('#debris');
const debrisContext = debrisCanvas.getContext('2d');
const cracksCanvas = $('#cracks');
const cracksContext = cracksCanvas.getContext('2d');

/* Make both canvases exactly as big as the window (and sharp on retina screens). */
function resizeCanvases() {
  [debrisCanvas, cracksCanvas].forEach((canvas) => {
    canvas.width = Math.round(innerWidth * pixelRatio);
    canvas.height = Math.round(innerHeight * pixelRatio);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  });
  debrisContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  cracksContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

/* ======================= CRACKS ======================= */

/* Make crack lines: 5-8 random walks from (x, y), some of them branching.
   Returns a list of paths; each path is a list of [x, y] points. */
function makeCrackPaths(x, y, sizeMultiplier = 1) {
  const paths = [];
  const crackCount = randomInt(5, 8);

  for (let i = 0; i < crackCount; i++) {
    let angle = randomBetween(0, Math.PI * 2);
    let px = x;
    let py = y;
    const totalLength = randomBetween(70, 230) * sizeMultiplier;
    const segments = randomInt(5, 9);
    const path = [[px, py]];

    for (let s = 0; s < segments; s++) {
      angle += randomBetween(-0.55, 0.55);                      // wobble a little
      const stepLength = (totalLength / segments) * randomBetween(0.6, 1.3);
      px += Math.cos(angle) * stepLength;
      py += Math.sin(angle) * stepLength;
      path.push([px, py]);

      if (Math.random() < 0.2) paths.push(makeCrackBranch(px, py, angle, stepLength));
    }
    paths.push(path);
  }
  return paths;
}

function makeCrackBranch(startX, startY, parentAngle, stepLength) {
  let angle = parentAngle + randomBetween(-1.2, 1.2);
  let px = startX;
  let py = startY;
  const branch = [[px, py]];
  for (let i = 0; i < 3; i++) {
    px += Math.cos(angle) * stepLength * 0.7;
    py += Math.sin(angle) * stepLength * 0.7;
    angle += randomBetween(-0.4, 0.4);
    branch.push([px, py]);
  }
  return branch;
}

/* Draw crack paths twice: a dark thick line, then a thin white line on top. */
function drawCrackPaths(context, paths) {
  const strokes = [['rgba(0,0,0,.35)', 3.5], ['rgba(255,255,255,.92)', 1.3]];
  strokes.forEach(([colour, width]) => {
    context.strokeStyle = colour;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    paths.forEach((path) => {
      context.beginPath();
      context.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) context.lineTo(path[i][0], path[i][1]);
      context.stroke();
    });
  });
}

let crackGroupCount = 0;
function addCrackAt(x, y) {
  if (prefersReducedMotion) return;
  crackGroupCount++;
  if (crackGroupCount > 16) {            // too many cracks: wipe the glass and start fresh
    cracksContext.clearRect(0, 0, innerWidth, innerHeight);
    crackGroupCount = 1;
  }
  drawCrackPaths(cracksContext, makeCrackPaths(x, y));
  playTone(1400, 0.08, 'square', 0.03, 300);
}

function crackFlurry() {
  toast('💥 The screen is cracking. Please do not look.');
  for (let i = 0; i < 3; i++) {
    runLater(() => addCrackAt(randomBetween(40, innerWidth - 40), randomBetween(80, innerHeight - 120)), i * 250);
  }
  shakeScreen(500, 6);
}

function clearCracks() {
  cracksContext.clearRect(0, 0, innerWidth, innerHeight);
  crackGroupCount = 0;
}

/* ======================= SHARDS ======================= */

const GRAVITY = 1700;            // pixels per second squared
const BOUNCE_LOSS = 0.42;        // a shard keeps 42% of its speed after hitting the floor
const MOUSE_PUSH_RADIUS = 110;   // shards flee from a mouse closer than this

let shards = [];
let shardLoopRunning = false;
let lastFrameTime = 0;
let onAllShardsArrived = null;   // called once when every "tween" shard reached its target

/* Cut `sourceCanvas` (which covers `rect` on screen) into triangles and launch them.
   Each grid cell becomes 2 triangles: top-left (type 0) and bottom-right (type 1).
   options: { cols, rows, originX, originY, power, group, fallsForever } */
function createShards(sourceCanvas, rect, options = {}) {
  const cols = options.cols || SHARD_COLUMNS;
  const rows = options.rows || SHARD_ROWS;
  const cellWidth = rect.width / cols;          // size on screen
  const cellHeight = rect.height / rows;
  const sourceCellWidth = sourceCanvas.width / cols;   // size inside the source image
  const sourceCellHeight = sourceCanvas.height / rows;
  const explosionX = options.originX !== undefined ? options.originX : rect.left + rect.width / 2;
  const explosionY = options.originY !== undefined ? options.originY : rect.top + rect.height / 2;
  const power = options.power || 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (let triangleType = 0; triangleType < 2; triangleType++) {
        const picture = cutTriangle(sourceCanvas, col, row, sourceCellWidth, sourceCellHeight, triangleType);

        // The pivot (centre of gravity) of each triangle, so it spins around its middle.
        const pivotX = triangleType === 0 ? cellWidth / 3 : (cellWidth * 2) / 3;
        const pivotY = triangleType === 0 ? cellHeight / 3 : (cellHeight * 2) / 3;
        const x = rect.left + col * cellWidth + pivotX;
        const y = rect.top + row * cellHeight + pivotY;

        // Fly away from the explosion point, plus a random upward kick.
        const awayX = x - explosionX;
        const awayY = y - explosionY;
        const distance = Math.hypot(awayX, awayY) || 1;
        const speed = randomBetween(350, 1100) * power;

        shards.push({
          picture, width: cellWidth, height: cellHeight, pivotX, pivotY,
          x, y,
          vx: (awayX / distance) * speed + randomBetween(-120, 120),
          vy: (awayY / distance) * speed - randomBetween(200, 800) * power,
          angle: 0,
          spin: randomBetween(-9, 9),
          radius: Math.min(cellWidth, cellHeight) * 0.42,
          mode: 'physics',                 // 'physics' | 'tween' (flying home) | 'fade'
          alpha: 1,
          col, row,
          group: options.group || 'upload',
          fallsForever: !!options.fallsForever,   // screen-break shards fall off the bottom
        });
      }
    }
  }
  startShardLoop();
}

/* Make a small canvas that contains just one triangle of the source image. */
function cutTriangle(sourceCanvas, col, row, cellW, cellH, triangleType) {
  const piece = document.createElement('canvas');
  piece.width = Math.ceil(cellW);
  piece.height = Math.ceil(cellH);
  const context = piece.getContext('2d');

  context.beginPath();
  if (triangleType === 0) {
    context.moveTo(0, 0); context.lineTo(cellW, 0); context.lineTo(0, cellH);
  } else {
    context.moveTo(cellW, 0); context.lineTo(cellW, cellH); context.lineTo(0, cellH);
  }
  context.closePath();

  context.save();
  context.clip();                      // only draw inside the triangle
  context.drawImage(sourceCanvas, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
  context.restore();

  context.strokeStyle = 'rgba(255,255,255,.75)';   // thin white edge so it looks like glass
  context.lineWidth = 1.6 * pixelRatio;
  context.stroke();
  return piece;
}

function startShardLoop() {
  if (shardLoopRunning) return;
  shardLoopRunning = true;
  lastFrameTime = performance.now();
  requestAnimationFrame(shardFrame);
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* One animation frame: move every shard, then draw them all. */
function shardFrame(now) {
  if (shards.length === 0) {
    shardLoopRunning = false;
    debrisContext.clearRect(0, 0, innerWidth, innerHeight);
    return;
  }

  const dt = Math.min(0.033, (now - lastFrameTime) / 1000 || 0.016);   // seconds since last frame
  lastFrameTime = now;
  debrisContext.clearRect(0, 0, innerWidth, innerHeight);

  let tweening = 0;
  let arrived = 0;

  for (let i = shards.length - 1; i >= 0; i--) {
    const shard = shards[i];

    if (shard.mode === 'physics') {
      const keep = moveShardWithPhysics(shard, dt);
      if (!keep) { shards.splice(i, 1); continue; }
    } else if (shard.mode === 'tween') {
      tweening++;
      if (moveShardTowardTarget(shard, dt)) arrived++;
    } else if (shard.mode === 'fade') {
      shard.alpha -= dt * 1.6;
      shard.y += 60 * dt;
      if (shard.alpha <= 0) { shards.splice(i, 1); continue; }
    }
    drawShard(shard);
  }

  if (tweening > 0 && arrived === tweening && onAllShardsArrived) {
    const callback = onAllShardsArrived;
    onAllShardsArrived = null;
    callback();
  }
  requestAnimationFrame(shardFrame);
}

/* Gravity, floor bounce, wall bounce and "run away from the mouse". Returns false when the shard should be removed. */
function moveShardWithPhysics(shard, dt) {
  shard.vy += GRAVITY * dt;
  shard.x += shard.vx * dt;
  shard.y += shard.vy * dt;
  shard.angle += shard.spin * dt;

  if (shard.fallsForever) return shard.y <= innerHeight + 260;   // gone once it leaves the screen

  const floor = innerHeight - shard.radius;
  if (shard.y > floor) {
    shard.y = floor;
    if (Math.abs(shard.vy) > 140) { shard.vy *= -BOUNCE_LOSS; shard.vx *= 0.85; }   // bounce
    else { shard.vy = 0; shard.vx *= 0.9; }                                           // come to rest
    shard.spin *= 0.75;
  }
  if (shard.x < shard.radius) { shard.x = shard.radius; shard.vx *= -0.5; }
  if (shard.x > innerWidth - shard.radius) { shard.x = innerWidth - shard.radius; shard.vx *= -0.5; }

  // Push shards away from the mouse.
  const dx = shard.x - mouse.x;
  const dy = shard.y - mouse.y;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared < MOUSE_PUSH_RADIUS * MOUSE_PUSH_RADIUS && distanceSquared > 1) {
    const distance = Math.sqrt(distanceSquared);
    const closeness = 1 - distance / MOUSE_PUSH_RADIUS;       // 1 = touching, 0 = far
    const push = closeness * 3000;
    shard.vx += (dx / distance) * push * dt;
    shard.vy += ((dy / distance) * push - 500 * closeness) * dt;
    shard.spin += (dx / distance) * push * dt * 0.02;
  }
  return true;
}

/* Smoothly fly a shard to its target position. Returns true when it has arrived. */
function moveShardTowardTarget(shard, dt) {
  shard.progress += dt / shard.duration;
  const t = Math.min(1, Math.max(0, shard.progress));   // negative progress = waiting to start
  const eased = easeInOut(t);
  shard.x = shard.startX + (shard.targetX - shard.startX) * eased;
  shard.y = shard.startY + (shard.targetY - shard.startY) * eased;
  shard.angle = shard.startAngle + (shard.targetAngle - shard.startAngle) * eased;
  return t >= 1;
}

function drawShard(shard) {
  debrisContext.save();
  debrisContext.globalAlpha = Math.max(0, shard.alpha);
  debrisContext.translate(shard.x, shard.y);
  debrisContext.rotate(shard.angle);
  debrisContext.drawImage(shard.picture, -shard.pivotX, -shard.pivotY, shard.width, shard.height);
  debrisContext.restore();
}

function fadeOutShards(group) {
  shards.forEach((shard) => { if (!group || shard.group === group) shard.mode = 'fade'; });
}

function removeShards(group) {
  shards = shards.filter((shard) => shard.group !== group);
}

function clearAllShards() {
  shards = [];
  onAllShardsArrived = null;
  debrisContext.clearRect(0, 0, innerWidth, innerHeight);
}

/* ======================= LEVEL 10: THE SCREEN BREAKS ======================= */

function breakTheScreen() {
  // Paint a bright "CHAOS" picture covering the whole window...
  const picture = document.createElement('canvas');
  picture.width = Math.round(innerWidth * pixelRatio);
  picture.height = Math.round(innerHeight * pixelRatio);
  const context = picture.getContext('2d');

  const gradient = context.createLinearGradient(0, 0, picture.width, picture.height);
  gradient.addColorStop(0, '#1f8a7e');
  gradient.addColorStop(0.5, '#ffd23f');
  gradient.addColorStop(1, '#ff5a3c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, picture.width, picture.height);

  context.fillStyle = 'rgba(255,255,255,.92)';
  context.textAlign = 'center';
  context.font = `800 ${Math.min(picture.width / 5, 150 * pixelRatio)}px sans-serif`;
  context.fillText('CHAOS', picture.width / 2, picture.height / 2);
  context.font = `700 ${30 * pixelRatio}px sans-serif`;
  context.fillText('level 10 reached', picture.width / 2, picture.height / 2 + 60 * pixelRatio);

  // ...first crack the glass, then shatter it and let the pieces fall away.
  clearCracks();
  addCrackAt(mouse.x, mouse.y);
  addCrackAt(mouse.x + 80, mouse.y - 60);
  sounds.crash();
  shakeScreen(900, 14);

  runLater(() => {
    createShards(picture, { left: 0, top: 0, width: innerWidth, height: innerHeight }, {
      cols: 10, rows: 7, originX: mouse.x, originY: mouse.y, power: 0.35, group: 'screen', fallsForever: true,
    });
    cracksContext.clearRect(0, 0, innerWidth, innerHeight);
    confetti(140);
    sounds.crash();
  }, 450);
}
