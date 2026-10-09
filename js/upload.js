/* ==========================================================================
   upload.js  -  the "Upload your ID card photo" step (registration step 1).

   Story of one upload:
     1. Photo is drawn into the preview box and a progress bar starts.
     2. At 37% the box trembles and cracks appear.
     3. The photo shatters into 96 shards (see canvas-fx.js).
     4. "Reassemble" flies the shards back, but into the WRONG cells.
   ========================================================================== */

const previewBox = $('#prev');
const previewCanvas = $('#prevCv');
const statusText = $('#upStatus');
const progressBar = $('#upBar');
const STALL_AT_PERCENT = 37;

const upload = {
  busy: false,          // false | true | 'puzzle'  (true while an upload/explosion is in progress)
  sourceCanvas: null,   // a copy of the photo, used to cut the shards
  cellOrder: null,      // cellOrder[i] = which cell the piece from cell i is moved to
  explosionX: 0,
  explosionY: 0,
};

const setStatus = (text) => { statusText.textContent = text; };
const setProgress = (percent) => { progressBar.style.width = percent + '%'; };

/* ---------- Drawing the photo ---------- */

/* Draw an image so it fills the preview canvas (like CSS "object-fit: cover"). */
function drawImageCover(canvas, image) {
  const box = previewBox.getBoundingClientRect();
  canvas.width = Math.round(box.width * pixelRatio);
  canvas.height = Math.round(box.height * pixelRatio);

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.max(canvas.width / imageWidth, canvas.height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
}

/* A cartoon face drawn with code, so the demo works without any photo file. */
function drawSamplePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const g = canvas.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#7fd8cb');
  sky.addColorStop(1, '#1f8a7e');
  g.fillStyle = sky;
  g.fillRect(0, 0, 640, 480);

  g.fillStyle = '#ffd23f';                                   // sun
  g.beginPath(); g.arc(540, 90, 52, 0, 7); g.fill();

  g.fillStyle = '#0e2a2e';                                   // shoulders
  g.beginPath(); g.ellipse(320, 520, 260, 200, 0, 0, 7); g.fill();

  g.fillStyle = '#ffd9b3';                                   // head
  g.beginPath(); g.arc(320, 230, 125, 0, 7); g.fill();

  g.fillStyle = '#0e2a2e';                                   // eyes
  g.beginPath(); g.arc(275, 210, 13, 0, 7); g.arc(365, 210, 13, 0, 7); g.fill();

  g.strokeStyle = '#0e2a2e';                                 // smile
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.beginPath(); g.arc(320, 255, 52, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();

  g.fillStyle = '#ff5a3c';                                   // cheeks
  g.beginPath(); g.ellipse(250, 252, 20, 12, 0, 0, 7); g.ellipse(390, 252, 20, 12, 0, 0, 7); g.fill();

  g.fillStyle = '#fff';                                      // caption
  g.font = '700 30px sans-serif';
  g.textAlign = 'center';
  g.fillText('QIT STUDENT 2026', 320, 455);
  return canvas;
}

/* ---------- Step 1: start the upload ---------- */

function resetPreview() {
  previewBox.classList.remove('has', 'gone', 'tremble');
  $('#prevPh').hidden = false;
  $('#reBtn').hidden = true;
  $('#sweepBtn').hidden = true;
  setProgress(0);
}

function startUpload(image) {
  if (upload.busy) { toast('One explosion at a time, please.'); return; }
  upload.busy = true;
  clearAllShards();
  resetPreview();

  previewBox.classList.add('has');
  $('#prevPh').hidden = true;
  drawImageCover(previewCanvas, image);

  // Keep a copy of the photo to cut into shards later.
  upload.sourceCanvas = document.createElement('canvas');
  upload.sourceCanvas.width = previewCanvas.width;
  upload.sourceCanvas.height = previewCanvas.height;
  upload.sourceCanvas.getContext('2d').drawImage(previewCanvas, 0, 0);

  runFakeProgressBar();
}

function runFakeProgressBar() {
  let percent = 0;
  setProgress(0);
  setStatus('Uploading… 0%');

  const interval = setInterval(() => {
    percent += randomBetween(2, 5);
    if (percent >= STALL_AT_PERCENT) {
      percent = STALL_AT_PERCENT;
      clearInterval(interval);
      stallAndCrack();
    }
    setProgress(percent);
    setStatus(`Uploading… ${Math.round(percent)}%`);
  }, 70);
  activeTimers.push(interval);
}

/* ---------- Step 2: the box trembles and cracks ---------- */

function stallAndCrack() {
  setStatus('Uploading… 37%… wait. Why is it making that noise?');
  previewBox.classList.add('tremble');
  playTone(120, 1, 'sawtooth', 0.05, 260);

  // Pick a random spot inside the box where the crack starts (and the explosion later).
  const box = previewBox.getBoundingClientRect();
  upload.explosionX = box.left + randomBetween(0.3, 0.7) * box.width;
  upload.explosionY = box.top + randomBetween(0.3, 0.7) * box.height;

  const context = previewCanvas.getContext('2d');
  context.save();
  context.scale(pixelRatio, pixelRatio);
  drawCrackPaths(context, makeCrackPaths(upload.explosionX - box.left, upload.explosionY - box.top, 1.6));
  context.restore();

  runLater(() => { if (upload.busy) shatterPhoto(); }, 1000);
}

/* ---------- Step 3: BOOM ---------- */

function shatterPhoto() {
  previewBox.classList.remove('tremble');
  previewBox.classList.add('gone');   // hide the real photo; the shards replace it

  createShards(upload.sourceCanvas, previewBox.getBoundingClientRect(), {
    originX: upload.explosionX, originY: upload.explosionY, group: 'upload',
  });

  sounds.crash();
  shakeScreen(700, 12);
  confetti(30);
  unlockAchievement('shatter');
  addPoints(3);

  setStatus(`Upload complete!* (*your image is now in ${SHARD_COLUMNS * SHARD_ROWS * 2} pieces. Try nudging them with your mouse.)`);
  setProgress(100);
  $('#reBtn').hidden = false;
  $('#sweepBtn').hidden = false;
  say('That went well.', 3000);
  showClicky();
}

/* ---------- Step 4: reassemble (wrongly) ---------- */

function reassemblePhoto() {
  const pieces = shards.filter((shard) => shard.group === 'upload');
  if (pieces.length === 0 || !upload.busy) return;

  upload.busy = 'puzzle';
  $('#reBtn').hidden = true;
  $('#sweepBtn').hidden = true;
  setStatus('Reassembling… with confidence.');
  previewBox.scrollIntoView({ block: 'center', behavior: 'auto' });

  const box = previewBox.getBoundingClientRect();
  const cellCount = SHARD_COLUMNS * SHARD_ROWS;
  const cellWidth = box.width / SHARD_COLUMNS;
  const cellHeight = box.height / SHARD_ROWS;

  upload.cellOrder = scrambleCells(cellCount);

  pieces.forEach((shard) => {
    const destinationCell = upload.cellOrder[shard.row * SHARD_COLUMNS + shard.col];
    const destinationCol = destinationCell % SHARD_COLUMNS;
    const destinationRow = Math.floor(destinationCell / SHARD_COLUMNS);

    shard.mode = 'tween';
    shard.progress = -randomBetween(0, 0.35);        // small random delay before it starts moving
    shard.duration = randomBetween(0.9, 1.5);
    shard.startX = shard.x;
    shard.startY = shard.y;
    shard.startAngle = shard.angle;
    shard.targetX = box.left + destinationCol * cellWidth + shard.pivotX;
    shard.targetY = box.top + destinationRow * cellHeight + shard.pivotY;
    shard.targetAngle = Math.round(shard.angle / (Math.PI * 2)) * Math.PI * 2;   // nearest full turn = upright
  });

  onAllShardsArrived = finishPuzzle;
}

/* Return [0,1,2,...] with about 70% of the cells swapped around. */
function scrambleCells(cellCount) {
  const order = Array.from({ length: cellCount }, (_, index) => index);
  const swaps = Math.floor(cellCount * 0.7);
  for (let i = 0; i < swaps; i++) {
    const a = randomInt(0, cellCount - 1);
    const b = randomInt(0, cellCount - 1);
    [order[a], order[b]] = [order[b], order[a]];
  }
  return order;
}

function finishPuzzle() {
  removeShards('upload');

  // Paint the scrambled photo into the preview box: every cell goes to its new place.
  const context = previewCanvas.getContext('2d');
  const cellWidth = upload.sourceCanvas.width / SHARD_COLUMNS;
  const cellHeight = upload.sourceCanvas.height / SHARD_ROWS;
  context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  upload.cellOrder.forEach((destinationCell, sourceCell) => {
    const sourceCol = sourceCell % SHARD_COLUMNS;
    const sourceRow = Math.floor(sourceCell / SHARD_COLUMNS);
    const destinationCol = destinationCell % SHARD_COLUMNS;
    const destinationRow = Math.floor(destinationCell / SHARD_COLUMNS);
    context.drawImage(upload.sourceCanvas,
      sourceCol * cellWidth, sourceRow * cellHeight, cellWidth, cellHeight,
      destinationCol * cellWidth, destinationRow * cellHeight, cellWidth, cellHeight);
  });

  previewBox.classList.remove('gone');
  sounds.levelUp();
  confetti(40);
  unlockAchievement('puzzle');
  completeStep('photo');   // registration step 1 is done
  setStatus(pickRandom(PUZZLE_VERDICTS));
  upload.busy = false;
  runLater(() => toast('Want another go? Upload again.'), 1500);
}

function sweepUpPhoto() {
  fadeOutShards('upload');
  setStatus('Swept up. The photo is gone forever. Upload a new one?');
  resetPreview();
  upload.busy = false;
  toast('🧹 Swept.');
}

/* ---------- Getting a file from the user ---------- */

function loadPhotoFile(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) { toast('That is not a photo. That is a vibe.'); return; }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => { startUpload(image); URL.revokeObjectURL(url); };
  image.onerror = () => toast('Could not read that image. Try another.');
  image.src = url;
}

$('#pickBtn').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', (event) => {
  loadPhotoFile(event.target.files && event.target.files[0]);
  event.target.value = '';
});
$('#sampleBtn').addEventListener('click', () => startUpload(drawSamplePhoto()));
$('#reBtn').addEventListener('click', reassemblePhoto);
$('#sweepBtn').addEventListener('click', sweepUpPhoto);

/* Drag and drop a photo onto the box (we stop the browser from opening the file instead). */
const dropZone = $('#drop');
['dragenter', 'dragover'].forEach((eventName) => {
  window.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (dropZone.contains(event.target)) dropZone.classList.add('drop-hot');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  window.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('drop-hot');
    const file = eventName === 'drop' && event.dataTransfer && event.dataTransfer.files[0];
    if (file) { $('#upload').scrollIntoView({ block: 'center' }); loadPhotoFile(file); }
  });
});

/* Pasting a screenshot works too. */
document.addEventListener('paste', (event) => {
  const items = (event.clipboardData && event.clipboardData.items) || [];
  for (const item of items) {
    if (item.type.startsWith('image')) { loadPhotoFile(item.getAsFile()); return; }
  }
});

/* A random popup that nags you to upload a photo. */
function showUploadNag() {
  if ($('.pop[data-nag]')) return;
  const popup = createPopup('Your ID is incomplete',
    '<p>We noticed you have no photo on file. Everyone else has one. (Everyone else is a duck.)</p>', [
      { label: 'Take me there', onClick: (popup) => {
          closePopup(popup);
          $('#upload').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      } },
      { label: 'Never', ghost: true, runsAway: true, giveUpLabel: '…fine, later.' },
    ]);
  popup.setAttribute('data-nag', '1');
}

/* Called by "Calm Down": put the upload box back to its starting state. */
function resetUpload() {
  upload.busy = false;
  resetPreview();
  setStatus('No photo yet. Your ID card is feeling lonely.');
}
