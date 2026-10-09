/* ==========================================================================
   widgets.js  -  the page sections with lying controls:
   Preferences, the AI chat, the newsletter form, Terms and "How this works".
   ========================================================================== */

/* ======================= PREFERENCES ======================= */

const calmSlider = $('#calm');

// The slider moves backwards: whatever you set, we set the opposite.
calmSlider.addEventListener('input', () => {
  const value = 100 - Number(calmSlider.value);
  calmSlider.value = value;
  const note = value >= 100 ? ' (impossible)' : value <= 0 ? ' (perfect)' : '';
  $('#calmOut').textContent = value + '%' + note;
  sounds.pop();

  if (value >= 100) {
    toast('Calmness 100% is not supported.');
    runLater(() => { calmSlider.value = 50; $('#calmOut').textContent = '50%'; }, 700);
  }
});

// "Enable chaos" cannot be unchecked.
$('#chaosOn').addEventListener('change', (event) => {
  const checkbox = event.target;
  if (checkbox.checked) return;
  toast('Attendance is mandatory. See clause 7.');
  addPoints(1);
  runLater(() => { checkbox.checked = true; }, 350);
});

// "Dark mode" just inverts the colours.
$('#darkTgl').addEventListener('change', (event) => {
  $('#stage').classList.toggle('dm', event.target.checked);
  toast(event.target.checked ? 'Dark mode on. (Colours inverted, not darkened.)' : 'Light mode restored. Probably.');
});

// Picking a language translates the headings into nonsense.
$('#lang').addEventListener('change', (event) => {
  if (event.target.value === 'en') toast('English (UK) is not available in your region.');
  else translatePage(event.target.value, 8000);
});

$('#saveBtn').addEventListener('click', () => {
  toast('Preferences saved to /dev/null. 💾');
  sounds.honk();
  completeStep('prefs');   // registration step 3 is done
});

function resetPreferences() {
  $('#darkTgl').checked = false;
  $('#stage').classList.remove('dm');
  calmSlider.value = 50;
  $('#calmOut').textContent = '50%';
  $('#lang').value = 'en';
}

/* ======================= AI CHAT ======================= */

const chatInput = $('#chatIn');
const chatLog = $('#chatLog');

// From level 4 your typed words are sometimes swapped for random ones.
chatInput.addEventListener('input', () => {
  const endsWithSpace = /\s$/.test(chatInput.value);
  if (state.level >= 4 && endsWithSpace && Math.random() < 0.45) {
    const words = chatInput.value.trimEnd().split(/\s+/);
    words[words.length - 1] = pickRandom(JUNK_WORDS);
    chatInput.value = words.join(' ') + ' ';
  }
});

function addChatMessage(text, sender) {   // sender: 'me' or 'bot'
  const message = document.createElement('div');
  message.className = 'msg ' + sender;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
  return message;
}

$('#chatForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) { toast('Type something. Anything. Even “duck”.'); return; }

  addChatMessage(question, 'me');
  chatInput.value = '';
  addPoints(1);

  const typingBubble = addChatMessage('…', 'bot');
  const lastWord = question.split(/\s+/).pop().replace(/[?!.,]/g, '') || 'that';

  runLater(() => {
    let reply = pickRandom(CHAT_REPLIES).replace('{word}', lastWord);
    if (state.level >= 6 && Math.random() < 0.4) reply = reply.split('').reverse().join('');   // backwards
    if (state.level >= 8 && Math.random() < 0.4) reply = reply.toUpperCase();                   // shouting
    typingBubble.textContent = reply;
    chatLog.scrollTop = chatLog.scrollHeight;
    sounds.pop();

    if (state.level >= 7) {
      runLater(() => addChatMessage(pickRandom(CHAT_FOLLOW_UPS), 'bot'), 700);   // a second message nobody asked for
    }
  }, randomBetween(600, 1200));
});

function resetChat() {
  while (chatLog.children.length > 1) chatLog.removeChild(chatLog.lastChild);   // keep the greeting
}

/* ======================= NEWSLETTER ======================= */

$('#newsForm').addEventListener('submit', (event) => {
  event.preventDefault();
  toast('Subscribed to Daily Duck Facts! 🦆');
  sounds.honk();
  addPoints(2);
});

// From level 5 the email box types backwards.
$('#email').addEventListener('input', (event) => {
  event.target.style.direction = state.level >= 5 ? 'rtl' : '';
});
$('#email').addEventListener('focus', (event) => {
  if (state.level >= 1) event.target.placeholder = 'type “password123” here';
});

/* ======================= TERMS & "HOW THIS WORKS" ======================= */

function showTermsPopup() {
  unlockAchievement('terms');
  const clauses = TERMS_CLAUSES.map((text, index) => `<p><b>${index + 1}.</b> ${text}</p>`).join('');
  createPopup('Rules & Regulations', `<div class="scroll">${clauses}</div>`, [
    { label: 'I Agree', onClick: (popup) => { toast('Agreed. You cannot undo this.'); closePopup(popup); } },
    { label: 'I Do Not Agree', ghost: true, runsAway: true, giveUpLabel: '…fine, agree.' },
  ], { className: 'terms', center: true });
}

/* A cheat sheet for the judges. Opens from the footer link or the "?" key. */
function showHowItWorksPopup() {
  createPopup('How this works', `<div style="display:grid;gap:8px;font-size:.9rem">
    <p><b>Idea:</b> a normal college student portal. You come to finish a 4-step registration and every click adds chaos. 10 levels, 10 mutations.</p>
    <p><b>Tricks:</b> shatter upload (triangle shards + bounce physics on canvas), buttons that flee, teleport or orbit, screen cracks, fake logo-close, popups that multiply, lying settings, AI that is mostly ducks.</p>
    <p><b>Presenter keys:</b> <code>]</code> / <code>[</code> change level · <code>Shift+R</code> reset · <code>Esc</code> clear popups · <code>?</code> this card.</p>
    <p><b>Steps:</b> ID photo (explodes), fee payment (button teleports), hostel preferences (controls lie), result (grades mutate).</p><p><b>Stack:</b> plain HTML, CSS and JavaScript. No libraries.</p></div>`,
    [{ label: 'Got it' }], { noHydra: true, center: true });
}
