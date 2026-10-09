/* ==========================================================================
   clicky.js  -  Clicky, the assistant in the bottom-right corner.
   He talks, gets poked, and (at high levels) makes copies of himself.
   ========================================================================== */

let speechTimer = null;
const MAX_CLONES = 5;

function say(text, milliseconds = 3800) {
  const bubble = $('#bub');
  bubble.textContent = text;
  bubble.classList.add('on');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => bubble.classList.remove('on'), milliseconds);
}

function showClicky() {
  $('#clicky').classList.add('show');
}

/* A floating copy of Clicky somewhere random on the screen. */
function spawnClickyClone() {
  if ($$('.clone').length >= MAX_CLONES) return;

  const clone = document.createElement('button');
  clone.type = 'button';
  clone.className = 'clone';
  clone.textContent = pickRandom(['🫠', '🫠', '🥴', '🤪', '😵‍💫']);
  clone.style.left = randomBetween(10, innerWidth - 70) + 'px';
  clone.style.top = randomBetween(80, innerHeight - 190) + 'px';
  clone.style.animationDelay = randomBetween(-2, 0) + 's';
  document.body.appendChild(clone);

  clone.addEventListener('click', (event) => {
    event.stopPropagation();
    sounds.honk();
    toast(pickRandom(CLICKY_SASS));
  });
}

/* Poking the real Clicky. */
$('#clickyBtn').addEventListener('click', (event) => {
  event.stopPropagation();
  sounds.honk();
  say(pickRandom(CLICKY_SASS));
  if (state.level >= 7) spawnClickyClone();
});
