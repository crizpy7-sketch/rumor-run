// The rumour itself, and everything the site shouts at you.
//
// A run is eight deliveries of one story. How cleanly you land your sheets on a
// level decides which of three versions the next crew passes on, so the ending
// text is earned rather than scripted.

export const RUMOR_SEED = "SOMEONE SAW FEDERICO DOWN AT THE MARINA.";

// Index 0 is the state of the rumour after level 1, index 7 after level 8.
export const RUMOR_STAGES = [
  {
    clear: "FEDERICO BOUGHT A BOAT.",
    muddled: "FEDERICO BOUGHT A GOAT.",
    garbled: "FEDERICO FOUGHT A GOAT.",
  },
  {
    clear: "FEDERICO BOUGHT A BOAT WITH THE OVERTIME.",
    muddled: "FEDERICO BOUGHT A GOAT WITH THE OVERTIME.",
    garbled: "FEDERICO FOUGHT A GOAT OVER SOME TIME.",
  },
  {
    clear: "HE NAMED THE BOAT AFTER THE FOREMAN.",
    muddled: "HE NAMED THE GOAT AFTER THE FOREMAN.",
    garbled: "THE FOREMAN IS A GOAT. LEGALLY.",
  },
  {
    clear: "THE FOREMAN CRIED WHEN HE SAW THE BOAT.",
    muddled: "THE FOREMAN CRIED. THE GOAT DID NOT.",
    garbled: "THE GOAT MADE THE FOREMAN CRY AT TEA BREAK.",
  },
  {
    clear: "THE BOAT IS COMING TO THE SITE PARTY.",
    muddled: "THE GOAT IS COMING TO THE SITE PARTY.",
    garbled: "THE GOAT IS ORGANISING THE SITE PARTY.",
  },
  {
    clear: "THE BOAT IS PARKED IN BAY SEVEN. SOMEHOW.",
    muddled: "THE GOAT IS LIVING IN BAY SEVEN. SOMEHOW.",
    garbled: "BAY SEVEN BELONGS TO THE GOAT NOW.",
  },
  {
    clear: "SCAFFOLD SAYS THE BOAT NEEDS A CREW OF NINE.",
    muddled: "SCAFFOLD SAYS THE GOAT HAS HIRED A CREW.",
    garbled: "THE GOAT IS HIRING. ASK FOR THE GOAT.",
  },
  {
    clear: "FEDERICO IS SAILING AWAY AND WE ARE ALL INVITED.",
    muddled: "FEDERICO AND THE GOAT ARE MOVING IN TOGETHER.",
    garbled: "FEDERICO IS THE GOAT. THAT IS THE WHOLE STORY.",
  },
];

/**
 * Fidelity tier for one level's deliveries.
 * Bullseyes keep the story straight; whispers from the far shoulder wreck it.
 */
export function fidelityTier({ bullseye = 0, solid = 0, whisper = 0 }) {
  const total = bullseye + solid + whisper;
  if (!total) return 'garbled';
  const score = (bullseye * 1 + solid * 0.55) / total;
  if (score >= 0.62) return 'clear';
  if (score >= 0.3) return 'muddled';
  return 'garbled';
}

export function rumorAt(stageIndex, tier) {
  const stage = RUMOR_STAGES[Math.min(stageIndex, RUMOR_STAGES.length - 1)];
  return stage[tier] || stage.muddled;
}

// --- barks ---------------------------------------------------------------
// Short enough to read at 60 mph. Uppercase because the font is.

export const BARKS = {
  hit: [
    "HE DID WHAT?",
    "NO. NO!",
    "ON THE OVERTIME?",
    "TELL SANDRA.",
    "I KNEW IT.",
    "MY COUSIN SAID THAT TOO.",
    "PUT THAT IN THE GROUP CHAT.",
    "THAT EXPLAINS THE MOOD.",
    "SINCE WHEN?",
    "THAT IS NOT WHAT I HEARD.",
    "HOLD ON, HOLD ON.",
    "SAY IT AGAIN, SLOWLY.",
    "WELL I NEVER.",
    "THE MAN IS UNWELL.",
    "GOOD FOR HIM, HONESTLY.",
    "I AM TELLING THE LADS.",
    "WAIT TILL BAY SEVEN HEARS.",
    "THIS IS BETTER THAN TEA.",
    "STOP IT. STOP IT!",
    "SOMEONE WRITE THIS DOWN.",
    "AND ON A TUESDAY.",
    "IS THAT LEGAL?",
    "HE NEVER SAID A WORD.",
    "I AM NOT SURPRISED, ACTUALLY.",
    "OH THAT IS RICH.",
    "MY WHOLE DAY IS MADE.",
  ],
  bullseye: [
    "HEARD EVERY WORD!",
    "CRYSTAL CLEAR!",
    "STRAIGHT TO THE EAR!",
    "GOT IT, WORD FOR WORD!",
    "PERFECT DELIVERY!",
    "THAT IS THE GOOD STUFF!",
    "NAILED THE DETAIL!",
    "I CAN QUOTE THAT!",
  ],
  whisper: [
    "WHAT? SPEAK UP!",
    "SOMETHING ABOUT A BOAT?",
    "HALF OF THAT WAS WIND.",
    "A GOAT? DID HE SAY GOAT?",
    "I GOT THE GIST.",
    "SORT OF HEARD THAT.",
    "COME CLOSER NEXT TIME!",
  ],
  miss: [
    "OVER HERE!",
    "MISSED ME!",
    "OI! THAT WAS THE WALL.",
    "NICE THROW. TERRIBLE AIM.",
    "THE GRAVEL HEARD IT.",
    "STILL WAITING!",
    "TRY AGAIN, POSTIE.",
    "THAT WENT TO NOBODY.",
  ],
  crash: [
    "MIND THE CONES!",
    "THAT IS COMING OFF YOUR WAGES.",
    "SLOW DOWN, FEDERICO!",
    "HE HAS DONE IT AGAIN.",
    "SITE SAFETY, MATE!",
    "WHO SIGNED HIS TICKET?",
    "THE BUGGY DID NOT DESERVE THAT.",
    "PAPERWORK. SO MUCH PAPERWORK.",
    "STRAIGHT THROUGH IT.",
    "DID ANYONE SEE THAT? EVERYONE.",
    "MY BARROW!",
    "I WAS USING THAT!",
  ],
  nearMiss: [
    "CLOSE ONE!",
    "PAINT SWAP!",
    "OOF.",
    "THAT WAS A COAT OF PAINT.",
    "STEADY!",
    "MILLIMETRES!",
  ],
  pickup: [
    "FRESH STACK!",
    "MORE PAPER!",
    "LOADED UP.",
    "TAKE THE WHOLE BOX.",
  ],
  lowAmmo: [
    "LAST FEW SHEETS!",
    "RUNNING DRY!",
    "FIND A CRATE!",
  ],
  levelStart: [
    "SHIFT STARTS. GO.",
    "THEY ARE WAITING.",
    "SPREAD IT WIDE.",
    "MOUTH TO MOUTH TO MOUTH.",
    "THE STORY MOVES.",
    "KEEP IT ACCURATE. TRY.",
    "BOMBA IS AT THE FAR GATE.",
    "DO NOT LOSE THE DETAIL.",
  ],
  levelPass: [
    "WHOLE ROW KNOWS NOW.",
    "THAT IS THE SHIFT DONE.",
    "IT IS MOVING FASTER THAN YOU.",
    "GATE CLEARED.",
  ],
  levelFail: [
    "NOT ENOUGH EARS.",
    "THE STORY STALLED.",
    "GO AGAIN. LOUDER.",
  ],
};

export function pickBark(rng, key) {
  const list = BARKS[key];
  return list[Math.floor(rng.next() * list.length) % list.length];
}
