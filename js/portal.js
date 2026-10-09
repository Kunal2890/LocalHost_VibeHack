/* ==========================================================================
   portal.js  -  the two student-portal forms: fee payment and result lookup.
   (Preferences live in widgets.js, the photo in upload.js.)
   ========================================================================== */

/* ======================= STEP 2: FEE PAYMENT ======================= */

$('#payForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const rollNumber = $('#roll').value.trim();
  if (!rollNumber) {
    toast('Enter your roll number first. Any roll number. Even a duck’s.');
    $('#roll').focus();
    return;
  }
  startPayment();
});

/* The payment "processes", gets stuck at 99%, then succeeds. */
function startPayment() {
  const popup = createPopup('Processing payment…',
    '<div class="bar"><i></i></div><p class="msg" style="text-align:center">Contacting your bank…</p>', [
      { label: 'Cancel', ghost: true, onClick: () => toast('Cannot cancel. The money is already gone.') },
    ], { center: true, noHydra: true });

  const fill = $('.bar > i', popup);
  const message = $('.msg', popup);
  fill.style.transition = 'width 2.2s';
  fill.style.width = '99%';

  runLater(() => { if (message) message.textContent = 'Stuck at 99%. As is tradition.'; }, 2500);
  runLater(() => { if (message) message.textContent = 'Asking the bank politely…'; }, 3800);
  runLater(() => finishPayment(popup), 5200);
}

function finishPayment(popup) {
  const receiptNumber = `QIT-${randomInt(1000, 9999)}-DUCK`;
  unlockAchievement('paid');
  addPoints(3);
  confetti(40);
  sounds.levelUp();
  completeStep('fee');

  if (!popup.parentNode) {            // the user closed the window; we took the money anyway
    toast('Payment successful. (You closed the window. We still took it.)');
    return;
  }
  setPopupBody(popup,
    `<div class="big">🧾</div><p style="text-align:center">Payment successful.<br><b>Receipt: ${receiptNumber}</b></p>`, [
      { label: 'Download receipt', onClick: () => toast('Receipt downloaded to /dev/null. 📄') },
      { label: 'Close', ghost: true },
    ]);
}

/* ======================= STEP 4: RESULT LOOKUP ======================= */

$('#resultForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const rollNumber = $('#resultRoll').value.trim();
  if (!rollNumber) { toast('Enter a roll number. Any roll number.'); return; }

  $('#resultCard').hidden = false;
  applyPageCopy();                     // grades change with the chaos level (data-c4 / data-c8)
  sounds.pop();
  toast('Result loaded. Brace yourself.');
  if (state.level >= 3) shakeScreen(400, 6);
  completeStep('result');
});

/* From level 6 the grades flicker to random emojis for a moment. */
function flickerGrades() {
  if ($('#resultCard').hidden) return;
  const cells = $$('#resultCard .grade');
  const cell = pickRandom(cells);
  cell.textContent = pickRandom(['A+', 'F', '🦆', '???', '0', '10', '🔥', '404']);
  runLater(applyPageCopy, 700);
}

/* Called by "Calm Down". */
function resetPortal() {
  $('#resultCard').hidden = true;
  ['roll', 'resultRoll', 'email', 'chatIn'].forEach((id) => { $('#' + id).value = ''; });
}
