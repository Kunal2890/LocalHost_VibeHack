/* ==========================================================================
   registration.js  -  the 4-step semester registration (the user's real "job").
   Steps are completed by other files:
     photo  -> upload.js   (after the shattered photo is "reassembled")
     fee    -> portal.js   (after the payment goes through)
     prefs  -> widgets.js  (after "Save preferences" is clicked)
     result -> portal.js   (after the result is shown)
   When all 4 are done, a "Registration complete" popup appears.
   ========================================================================== */

const REGISTRATION_STEPS = {
  photo:  'ID photo submitted',
  fee:    'Fee paid (allegedly)',
  prefs:  'Preferences saved to /dev/null',
  result: 'Result viewed',
};

const registrationDone = {};   // e.g. { photo: true, fee: true }

function completeStep(id) {
  if (registrationDone[id] || !REGISTRATION_STEPS[id]) return;
  registrationDone[id] = true;

  $(`#regList [data-step="${id}"]`).classList.add('done');
  $(`[data-badge="${id}"]`).hidden = false;
  sounds.achievement();
  toast('✅ ' + REGISTRATION_STEPS[id]);
  updateRegistrationProgress();

  if (Object.keys(registrationDone).length === Object.keys(REGISTRATION_STEPS).length) {
    runLater(showRegistrationCompletePopup, 900);
  }
}

function updateRegistrationProgress() {
  const total = Object.keys(REGISTRATION_STEPS).length;
  const done = Object.keys(registrationDone).length;
  $('#regCount').textContent = `${done}/${total}`;
  $('#regBar').style.width = (done / total * 100) + '%';
}

function showRegistrationCompletePopup() {
  unlockAchievement('registered');
  addPoints(5);
  confetti(90);
  createPopup('🎓 Registration complete!',
    `<div class="big">🎉</div>
     <p>All 4 steps done. Your registration is now <b>under review by a committee of ducks</b>.</p>
     <p style="color:var(--muted);font-size:.9rem">Status: pending. Estimated time: 3 to 5 business ages.</p>`,
    [{ label: 'Wonderful' }], { center: true, noHydra: true });
}

/* Called by "Calm Down": the form is wiped, so the steps are too. */
function resetRegistration() {
  Object.keys(registrationDone).forEach((id) => delete registrationDone[id]);
  $$('#regList li').forEach((item) => item.classList.remove('done'));
  $$('[data-badge]').forEach((badge) => { badge.hidden = true; });
  updateRegistrationProgress();
}
