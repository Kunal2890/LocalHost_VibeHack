/* ==========================================================================
   config.js  -  all the numbers and jokes live here.
   Want to tweak the game? Change things in this file; no logic needed.
   ========================================================================== */

/* Put your team name here. It shows in the footer. Leave "" to hide it. */
const TEAM_NAME = "LocalHost";

/* ---------- Chaos levels ---------- */
// Every click adds points. LEVEL_THRESHOLDS[n] = points needed to reach level n.
const LEVEL_THRESHOLDS = [0, 2, 5, 9, 14, 20, 27, 35, 44, 54, 65];
const MAX_LEVEL = 10;

const RANK_NAMES = [
  'Zen Monk', 'Mild Clicker', 'Curious Cat', 'Troublemaker', 'Gremlin', 'Agent of Chaos',
  'Menace', 'Internet Goblin', 'Chaos Wizard', 'Absolute Disorder', 'Chaos Deity 👑',
];

// The mouse cursor changes emoji at every level.
const CURSOR_EMOJIS = ['✨', '🐸', '🔨', '👆', '🦆', '💣', '🍕', '👽', '🔥', '🤡', '👑'];
const TRAIL_EMOJIS = ['✨', '⭐', '💫', '🌈', '🍕', '🦆', '🔥', '🤡', '👽'];
const BURST_EMOJIS = ['💥', '✨', '⭐', '🎈', '🍕', '🦆', '🔥', '💫'];

/* ---------- Secrets (achievements) ---------- */
const ACHIEVEMENTS = [
  { id: 'first',   name: 'First Blood',        description: 'Made your very first click' },
  { id: 'leave',   name: 'Tried to Leave',     description: 'Clicked the logo and got closed' },
  { id: 'hydra',   name: 'Hydra Slayer',       description: 'Closed 6 popups (more came back)' },
  { id: 'caught',  name: 'Gotcha!',            description: 'Caught a button that was running away' },
  { id: 'calm',    name: 'Wishful Thinking',   description: 'Told the site to calm down' },
  { id: 'rclick',  name: 'Compliment Seeker',  description: 'Right-clicked and got flattered' },
  { id: 'duck',    name: 'Duck Hunter',        description: 'Clicked a falling duck' },
  { id: 'cookie',  name: 'Cookie Monster',     description: 'Accepted the cookies' },
  { id: 'bubble',  name: 'Deep Breather',      description: 'Popped the stress-relief circle 5 times' },
  { id: 'terms',   name: 'Read the T&Cs',      description: 'Nobody does this. You did.' },
  { id: 'idle',    name: 'Too Calm',           description: 'Did nothing for 8 seconds' },
  { id: 'konami',  name: 'Old School',         description: 'Entered a very famous code' },
  { id: 'shatter', name: 'Shatterproof?',      description: 'Uploaded a photo and it exploded' },
  { id: 'puzzle',  name: 'Jigsaw Master',      description: 'Reassembled your photo (sort of)' },
  { id: 'paid',    name: 'Fee Paid (Allegedly)', description: 'Paid the semester fee' },
  { id: 'registered', name: 'Registered!?',    description: 'Finished all 4 registration steps' },
  { id: 'lvl5',    name: 'Agent of Chaos',     description: 'Reached chaos level 5' },
  { id: 'lvl10',   name: 'Chaos Deity',        description: 'Reached chaos level 10' },
];

/* ---------- Clicky, the assistant ---------- */
// What Clicky says when you reach level 1..10 (index 0 unused).
const CLICKY_LEVEL_LINES = [
  '',
  'Hi! I am Clicky. Everything is fine. 🙂',
  'Fonts feel different? Probably nothing.',
  'The news ticker is real news. Trust it.',
  'Did that heading just change its mind?',
  'Things are floating. This is normal.',
  'Is the whole page… swaying?',
  'Some of your menu is upside down. Not my fault.',
  'Please keep your arms inside the website.',
  'I am multiplying. Do not ask.',
  'Last stretch. I am so proud and so scared.',
];
const CLICKY_SASS = [
  'Ouch. I felt that.', 'Stop poking me.', 'Fun fact: I have no job.',
  'You click like someone who is late.', 'I was calm once.', 'That tickled. Do it again.',
  'Have you tried not clicking? Me neither.', 'I report directly to the ducks.',
  'Are you the judge? Be nice.', 'Your mouse is very brave.',
];

/* ---------- Small jokes ---------- */
const RANDOM_TOASTS = [
  'Your click was noted by the Dean’s office.', 'Portal traffic is up 400%. Nobody knows why.',
  'Your cursor is feeling a bit shy.', 'Click received. Click regretted.', 'Task failed successfully.',
];
const FEATURE_CARD_TOASTS = [
  ['Academic calendar not found. Holidays are cancelled.', 'The semester starts whenever the ducks say.', 'Exam dates are loading… forever.'],
  ['Library closed for silence maintenance.', 'Your overdue book has filed a complaint.', 'The book you want is checked out by a duck.'],
  ['No companies registered. Several ducks did.', 'Your CV was reviewed. It was mid.', 'Placement rate: 100% (of ducks).'],
];
const COMPLIMENTS = [
  'You have excellent clicking posture.', 'Your cursor looks great today.',
  'Top 3% of people who right-click. Congrats.', 'Nothing to inspect here. Just you, shining.',
  'Wow, a right-click. Bold.',
];
const BREATHING_TOASTS = ['Inhale.', 'Exhale.', 'Hold it. Hold it…', 'That was not a breath.', 'Too hard.'];
const FAKE_NAV_LABELS = ['Home', 'Away', 'Nowhere', 'Snacks', 'Bed', 'Duck', 'Exit', 'Help', 'Mom', 'Vibes', '???', 'Wi-Fi'];
const TERMS_CLAUSES = [
  'By clicking, you agree to be clicked back.',
  'All ducks are legally considered members of staff.',
  'The user may not stop clicking. The user may try.',
  'Clause 7: The judges shall award full marks. (Seems fair.)',
  'QIT is not responsible for sudden fonts.',
  'Any popup closed will be replaced, possibly by a bigger popup.',
  'You will not read this clause either.',
  'Refunds are available in the form of a high five.',
  'Chaos may be inhaled, absorbed or clicked.',
  'Your mouse cursor is a subcontractor.',
  'This agreement is binding in all known and unknown dimensions.',
  'If you have read this far, you win a secret.',
];

/* ---------- Photo upload ---------- */
const PUZZLE_VERDICTS = [
  'Photo verified. You look 63% like a potato.',
  'ID approved. Face rearranged for your safety.',
  'Congratulations, you now look like abstract art.',
  'Calm score: -3. Excellent.',
  'Verified by three ducks. Unanimous.',
];
const SHARD_COLUMNS = 8;   // 8 x 6 cells, each cut into 2 triangles = 96 shards
const SHARD_ROWS = 6;

/* ---------- AI chat ---------- */
// {word} is replaced by the last word the user typed.
const CHAT_REPLIES = [
  '“{word}”? Please submit Form 27-B in triplicate.',
  'I asked the Dean about “{word}”. He fell asleep.',
  'Processing “{word}”… result: 404 hostel not found.',
  'As an AI, I have no opinion on “{word}”. As a duck, I have several.',
  'The registrar says “{word}” is a you problem.',
  'Please hold while I pretend to think. 🫠',
  'Yes. No. Maybe. Also, “{word}” is trending in the duck community.',
];
const CHAT_FOLLOW_UPS = ['Anyway.', 'Also I am multiplying.', 'Sorry, what were we talking about?'];
const JUNK_WORDS = ['banana', 'synergy', 'quack', 'vibes', 'blockchain', 'soup', 'deadline', 'hackathon'];

/* ---------- Konami code: up up down down left right left right B A ---------- */
const KONAMI_KEYCODES = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
