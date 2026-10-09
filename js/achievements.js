/* ==========================================================================
   achievements.js  -  the 16 hidden "secrets". Saved in localStorage.
   ========================================================================== */

let unlockedAchievements = {};
try { unlockedAchievements = JSON.parse(readStorage('cc_ach') || '{}') || {}; } catch (error) { unlockedAchievements = {}; }

function unlockAchievement(id) {
  if (unlockedAchievements[id]) return; // already have it

  const achievement = ACHIEVEMENTS.find((item) => item.id === id);
  if (!achievement) return;

  unlockedAchievements[id] = 1;
  writeStorage('cc_ach', JSON.stringify(unlockedAchievements));
  sounds.achievement();
  toast('🏆 Secret unlocked: ' + achievement.name, true);
  updateAchievementCounter();
}

function updateAchievementCounter() {
  $('#achN').textContent = `${Object.keys(unlockedAchievements).length}/${ACHIEVEMENTS.length}`;
}

/* The popup that lists every secret (locked ones are hidden). */
function showAchievementsPopup() {
  const rows = ACHIEVEMENTS.map((item) => {
    const unlocked = unlockedAchievements[item.id];
    return `<div style="opacity:${unlocked ? 1 : 0.5}">
      <b>${unlocked ? '🏆 ' + item.name : '🔒 ???'}</b><br>
      <span style="font-size:.85rem;color:var(--muted)">${unlocked ? item.description : 'Keep clicking. Keep exploring.'}</span>
    </div>`;
  }).join('');

  createPopup('Secrets', `<div class="scroll" style="max-height:48vh;overflow:auto;display:grid;gap:8px">${rows}</div>`,
    [{ label: 'Close' }], { noHydra: true, center: true });
}
