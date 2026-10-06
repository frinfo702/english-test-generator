// Kinkuma hamster (a pale cream "baby ham"), 26×21 cells, nibbling a
// sunflower seed. One character per cell:
//   o outline  d back fur  f fur  l muzzle  c belly  e eye  w eye shine
//   g ear rim  p ear inside  n nose  m mouth  h paw  s seed  t seed stripe
// Ears, paws+seed and eyelids are separate layers so each can move alone.

export const HAMSTER_W = 26;
export const HAMSTER_H = 21;

export const HAMSTER_PALETTE: Record<string, string> = {
  o: "#8c7763",
  d: "#e2cfb0",
  f: "#eee0c8",
  l: "#f8f1e6",
  c: "#fcf8f1",
  e: "#141014",
  w: "#ffffff",
  g: "#a8988f",
  p: "#d9b3b3",
  n: "#ea96a5",
  m: "#c4707f",
  h: "#f4c0c0",
  s: "#3a3340",
  t: "#d9d3c4",
};

// prettier-ignore
export const HAMSTER_BODY = [
  "",
  ".........oooooooo",
  ".......oddddddddddo",
  ".....oddddddddddddddo",
  "....odddffffffffffdddo",
  "...offffffffffffffffffo",
  "..offffweffffffffweffffo",
  "..offffeeffllllffeeffffo",
  ".offfffffllnnnnllfffffffo",
  ".offffffllllnnllllffffffo",
  "offffffllllmllmllllffffffo",
  "offfffffllllllllllfffffffo",
  "offfffffccccccccccfffffffo",
  "offffffccccccccccccffffffo",
  "offfffccccccccccccccfffffo",
  "offfffccccccccccccccfffffo",
  "offfffccccccccccccccfffffo",
  ".offffccccccccccccccffffo",
  "..offffccccccccccccffffo",
  "...ofhhhcccccccccchhhfo",
  ".....oooooooooooooooo",
];

// Drawn under the head so it tucks the ears in.
// prettier-ignore
export const HAMSTER_EARS = [
  "...oooo............oooo",
  "..oggggo..........oggggo",
  "..ogppgo..........ogppgo",
  "..ogppgo..........ogppgo",
];

// Right ear flicked outward.
// prettier-ignore
export const HAMSTER_EARS_TWITCH = [
  "...oooo.............oooo",
  "..oggggo...........oggggo",
  "..ogppgo..........ogppgo",
  "..ogppgo..........ogppgo",
];

// Paws + seed under the chin, and lifted to the mouth.
// prettier-ignore
export const HAMSTER_PAWS_DOWN = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  ".............ss",
  ".........hh.stshh",
  ".........hhsts.hh",
  "...........ss",
];

// prettier-ignore
export const HAMSTER_PAWS_UP = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  ".............ss",
  ".........hh.stshh",
  ".........hhsts.hh",
  "...........ss",
];

// Eyes shut.
// prettier-ignore
export const HAMSTER_BLINK = [
  "",
  "",
  "",
  "",
  "",
  "",
  ".......ff.........ff",
  ".......ee.........ee",
];
